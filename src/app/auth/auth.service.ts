import { computed, inject, Injectable, PLATFORM_ID, signal } from '@angular/core';
import { isPlatformBrowser } from '@angular/common';
import { HttpClient } from '@angular/common/http';
import { firstValueFrom } from 'rxjs';
import { environment } from '../../environments/environment';

/**
 * Authentication against the API's Hades gateway.
 *
 * The browser never reaches Hades directly — the API forwards Hades' own routes
 * under its own origin and stamps the client and realm ids server-side, so the
 * only base URL this needs is the API's.
 *
 * Two different things are tracked deliberately:
 *   session      Hades says who you are (the access token)
 *   permissions  the API says what you may do here (`GET /auth/me`)
 *
 * A valid token with no `articles:write` is a normal, expected state — anyone
 * with an account has one — so the guard checks permissions, not merely login.
 */

/** Hades issues OAuth-style snake_case; a login may also answer with an MFA challenge. */
interface TokenResponse {
  access_token?: string;
  refresh_token?: string;
  expires_in?: number;
  mfa_required?: boolean;
  mfa_token?: string;
}

export interface Identity {
  userId: string;
  roles: string[];
  permissions: string[];
  status: string;
  expiresAt: string;
}

/** Survives a reload so an edit session is not lost to a refresh. */
const ACCESS_KEY = 'corbin.access';
const REFRESH_KEY = 'corbin.refresh';
/** Stable per browser, so Hades can scope and list sessions by device. */
const DEVICE_KEY = 'corbin.device';

@Injectable({
  providedIn: 'root',
})
export class AuthService {
  private http = inject(HttpClient);
  private platformId = inject(PLATFORM_ID);
  private API = environment.API;

  private _accessToken = signal<string | null>(null);
  private _identity = signal<Identity | null>(null);
  /** Distinguishes "not signed in" from "have not looked yet", which the guard needs. */
  private _resolved = signal(false);

  readonly identity = this._identity.asReadonly();
  readonly resolved = this._resolved.asReadonly();
  readonly isAuthenticated = computed(() => this._identity() !== null);

  constructor() {
    // Nothing is read on the server: there is no storage there, and rendering
    // must not depend on a particular visitor's session.
    if (this.isBrowser) {
      this._accessToken.set(this.read(ACCESS_KEY));
    }
  }

  private get isBrowser(): boolean {
    return isPlatformBrowser(this.platformId);
  }

  get accessToken(): string | null {
    return this._accessToken();
  }

  /** True when the signed-in account holds `permission` on this site. */
  can(permission: string): boolean {
    const held = this._identity()?.permissions ?? [];
    return held.some((grant) => grantCovers(grant, permission));
  }

  async login(email: string, password: string): Promise<TokenResponse> {
    const response = await firstValueFrom(
      this.http.post<TokenResponse>(
        `${this.API}/auth/login`,
        { identity: email, password },
        { headers: { 'X-Device-ID': this.deviceId() } },
      ),
    );

    // A login that needs a second factor returns a challenge instead of tokens.
    // Surfaced to the caller rather than swallowed, so the UI can say so.
    if (response.access_token) {
      this.storeTokens(response);
      await this.loadIdentity();
    }
    return response;
  }

  /** Completes a login that came back with `mfa_required`. */
  async verifyTotp(mfaToken: string, code: string): Promise<TokenResponse> {
    const response = await firstValueFrom(
      this.http.post<TokenResponse>(
        `${this.API}/mfa/verify/totp`,
        { mfa_token: mfaToken, code },
        { headers: { 'X-Device-ID': this.deviceId() } },
      ),
    );

    if (response.access_token) {
      this.storeTokens(response);
      await this.loadIdentity();
    }
    return response;
  }

  /**
   * Exchanges the refresh token for a new access token.
   *
   * Never retried: Hades answering 401 here means the session is genuinely over,
   * and hammering it would only turn a re-login into a lockout.
   */
  async refresh(): Promise<boolean> {
    const refreshToken = this.read(REFRESH_KEY);
    if (!refreshToken) return false;

    try {
      const response = await firstValueFrom(
        this.http.post<TokenResponse>(
          `${this.API}/auth/refresh`,
          { refresh_token: refreshToken },
          { headers: { 'X-Device-ID': this.deviceId() } },
        ),
      );
      if (!response.access_token) return false;

      this.storeTokens(response);
      return true;
    } catch {
      this.clear();
      return false;
    }
  }

  /**
   * Loads the local view of the account: roles and resolved permissions.
   * Returns null and clears the session if the token is no longer good.
   */
  async loadIdentity(): Promise<Identity | null> {
    if (!this._accessToken()) {
      this._resolved.set(true);
      return null;
    }

    try {
      const identity = await firstValueFrom(
        this.http.get<Identity>(`${this.API}/auth/me`),
      );
      this._identity.set(identity);
      return identity;
    } catch {
      this.clear();
      return null;
    } finally {
      this._resolved.set(true);
    }
  }

  /**
   * Restores a session on first load, refreshing once if the stored access token
   * has already expired. Safe to call repeatedly; only the first does work.
   */
  async restore(): Promise<Identity | null> {
    if (this._resolved()) return this._identity();
    if (!this.isBrowser) {
      this._resolved.set(true);
      return null;
    }

    const identity = await this.loadIdentity();
    if (identity) return identity;

    if (await this.refresh()) {
      this._resolved.set(false);
      return this.loadIdentity();
    }
    return null;
  }

  async logout(): Promise<void> {
    const refreshToken = this.read(REFRESH_KEY);
    if (refreshToken) {
      try {
        await firstValueFrom(
          this.http.post(`${this.API}/auth/logout`, { refresh_token: refreshToken }),
        );
      } catch {
        // The local session goes either way; a failed logout call must not strand
        // the user in a signed-in-looking state.
      }
    }
    this.clear();
  }

  // --- Storage ----------------------------------------------------------------

  private storeTokens(response: TokenResponse): void {
    if (response.access_token) {
      this._accessToken.set(response.access_token);
      this.write(ACCESS_KEY, response.access_token);
    }
    if (response.refresh_token) {
      this.write(REFRESH_KEY, response.refresh_token);
    }
  }

  private clear(): void {
    this._accessToken.set(null);
    this._identity.set(null);
    this.write(ACCESS_KEY, null);
    this.write(REFRESH_KEY, null);
  }

  /** A caller-chosen id that only scopes the session; Hades caps it at 128 bytes. */
  private deviceId(): string {
    const existing = this.read(DEVICE_KEY);
    if (existing) return existing;

    const generated = crypto.randomUUID();
    this.write(DEVICE_KEY, generated);
    return generated;
  }

  private read(key: string): string | null {
    if (!this.isBrowser) return null;
    try {
      return localStorage.getItem(key);
    } catch {
      // Private mode or blocked site data: sign-in still works, it just does not
      // survive a reload.
      return null;
    }
  }

  private write(key: string, value: string | null): void {
    if (!this.isBrowser) return;
    try {
      if (value === null) localStorage.removeItem(key);
      else localStorage.setItem(key, value);
    } catch {
      /* see read() */
    }
  }
}

/** Mirrors the API's grant matching: `*`, `articles:*`, or a literal match. */
function grantCovers(grant: string, permission: string): boolean {
  if (grant === '*' || grant === permission) return true;
  return grant.endsWith(':*') && permission.startsWith(grant.slice(0, -1));
}
