import { CanActivateFn } from '@angular/router';
import { inject } from '@angular/core';
import { AuthService } from './auth';
import { environment } from '../../environments/environment';

function redirectToSso(): void {
  const returnUrl = encodeURIComponent(window.location.href);
  window.location.href = `${environment.ssoLoginUrl}?returnUrl=${returnUrl}`;
}

export const authGuard: CanActivateFn = () => {
  const auth = inject(AuthService);
  if (auth.isLoggedIn()) return true;
  redirectToSso();
  return false;
};

export const adminGuard: CanActivateFn = () => {
  const auth = inject(AuthService);
  if (auth.isAdmin()) return true;
  redirectToSso();
  return false;
};
