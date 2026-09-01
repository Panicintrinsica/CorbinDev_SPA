import { inject, PLATFORM_ID } from '@angular/core';
import { isPlatformBrowser } from '@angular/common';
import { CanActivateFn, Router } from '@angular/router';
import { AuthService } from './auth.service';

/**
 * Gates a route on a site permission rather than on merely being signed in.
 *
 * Any Hades account can authenticate; only an account the API has granted
 * `articles:write` may author. The two are separate questions and this asks the
 * second one.
 *
 * This is a usability boundary, not a security one — the API enforces the same
 * permission on every write, and a guard in a browser is only ever advisory.
 */
export function requirePermission(permission: string): CanActivateFn {
  return async (_route, state) => {
    const platformId = inject(PLATFORM_ID);
    const auth = inject(AuthService);
    const router = inject(Router);

    // The server has no session to check. Admin routes render client-side (see
    // app.routes.server.ts), so this only defers the decision to the browser.
    if (!isPlatformBrowser(platformId)) return false;

    await auth.restore();

    if (auth.can(permission)) return true;

    return router.createUrlTree(['/admin/login'], {
      queryParams: { returnTo: state.url },
    });
  };
}
