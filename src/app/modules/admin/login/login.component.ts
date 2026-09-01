import { Component, inject, signal } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { ActivatedRoute, Router } from '@angular/router';
import { MatButton } from '@angular/material/button';
import { MatFormField, MatLabel } from '@angular/material/form-field';
import { MatInput } from '@angular/material/input';
import { AuthService } from '../../../auth/auth.service';

/**
 * Sign-in for the authoring surface.
 *
 * The API forwards Hades' own login route, so this is an ordinary email/password
 * post — but a login can answer with an MFA challenge instead of tokens, and
 * that second step is handled here rather than treated as a failure.
 */
@Component({
  selector: 'app-admin-login',
  standalone: true,
  imports: [FormsModule, MatButton, MatFormField, MatLabel, MatInput],
  templateUrl: './login.component.html',
  styleUrl: './login.component.scss',
})
export class LoginComponent {
  private auth = inject(AuthService);
  private router = inject(Router);
  private route = inject(ActivatedRoute);

  email = signal('');
  password = signal('');
  totpCode = signal('');

  /** Set when Hades asks for a second factor; the token that completes the login. */
  mfaToken = signal<string | null>(null);
  busy = signal(false);
  error = signal<string | null>(null);

  async submit(): Promise<void> {
    this.busy.set(true);
    this.error.set(null);

    try {
      const pending = this.mfaToken();
      const response = pending
        ? await this.auth.verifyTotp(pending, this.totpCode())
        : await this.auth.login(this.email(), this.password());

      if (response.mfa_required && response.mfa_token) {
        this.mfaToken.set(response.mfa_token);
        return;
      }
      if (!response.access_token) {
        this.error.set('Sign-in did not return a session. Try again.');
        return;
      }

      // Authenticating is not the same as being allowed to author: any account in
      // the realm can sign in, and only some hold articles:write.
      if (!this.auth.can('articles:write')) {
        this.error.set('This account does not have permission to edit articles.');
        await this.auth.logout();
        return;
      }

      const returnTo = this.route.snapshot.queryParamMap.get('returnTo');
      await this.router.navigateByUrl(returnTo ?? '/admin/articles');
    } catch (error: unknown) {
      this.error.set(describe(error));
    } finally {
      this.busy.set(false);
    }
  }
}

function describe(error: unknown): string {
  const status = (error as { status?: number })?.status;
  if (status === 401) return 'Incorrect email or password.';
  if (status === 429) return 'Too many attempts. Wait a moment and try again.';
  if (status === 0 || status === 503) return 'Could not reach the API.';

  const body = (error as { error?: { error?: string; message?: string } })?.error;
  return body?.error ?? body?.message ?? 'Sign-in failed.';
}
