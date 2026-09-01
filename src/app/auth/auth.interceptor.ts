import { HttpErrorResponse, HttpInterceptorFn } from '@angular/common/http';
import { inject } from '@angular/core';
import { catchError, from, switchMap, throwError } from 'rxjs';
import { environment } from '../../environments/environment';
import { AuthService } from './auth.service';

/**
 * Paths that must never carry a bearer token or be retried.
 *
 * They are how a session is established or ended, so a 401 from one of them is
 * the answer, not a condition to recover from — retrying `/auth/refresh` after
 * it rejects would turn an expired session into a request loop.
 */
const UNAUTHENTICATED_PATHS = ['/auth/login', '/auth/refresh', '/auth/logout'];

/**
 * Attaches the access token to API calls, and transparently refreshes once when
 * the API says the token has expired.
 *
 * Only requests aimed at the API are touched; a third-party URL never sees the
 * token.
 */
export const authInterceptor: HttpInterceptorFn = (request, next) => {
  if (!request.url.startsWith(environment.API)) {
    return next(request);
  }

  const path = request.url.slice(environment.API.length);
  if (UNAUTHENTICATED_PATHS.some((prefix) => path.startsWith(prefix))) {
    return next(request);
  }

  const auth = inject(AuthService);
  const withToken = (token: string | null) =>
    token
      ? request.clone({ setHeaders: { Authorization: `Bearer ${token}` } })
      : request;

  return next(withToken(auth.accessToken)).pipe(
    catchError((error: unknown) => {
      const isExpired = error instanceof HttpErrorResponse && error.status === 401;
      if (!isExpired || !auth.accessToken) {
        return throwError(() => error);
      }

      // One attempt, and only one: refresh() clears the session when it fails, so
      // the replayed request either succeeds or surfaces the original 401.
      return from(auth.refresh()).pipe(
        switchMap((refreshed) =>
          refreshed
            ? next(withToken(auth.accessToken))
            : throwError(() => error),
        ),
      );
    }),
  );
};
