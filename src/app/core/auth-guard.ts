import { CanActivateFn, Router } from '@angular/router';
import { inject } from '@angular/core';
import { AuthService } from './auth';

export const authGuard: CanActivateFn = () => {
  const auth = inject(AuthService);
  if (auth.isLoggedIn()) return true;
  auth.redirectToLogin();
  return false;
};

export const adminGuard: CanActivateFn = () => {
  const auth = inject(AuthService);
  if (auth.isAdmin()) return true;
  if (auth.isLoggedIn()) {
    // Logged in but lacking the admin role — redirecting to SSO login here would bounce
    // straight back: sso-ui auto-redirects any already-authenticated user via returnUrl with
    // no role check, so this would ping-pong between the two apps forever.
    inject(Router).navigate(['/']);
    return false;
  }
  auth.redirectToLogin();
  return false;
};
