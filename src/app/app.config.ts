import { ApplicationConfig, inject, provideAppInitializer, provideBrowserGlobalErrorListeners } from '@angular/core';
import { provideRouter } from '@angular/router';
import { provideHttpClient, withInterceptors } from '@angular/common/http';
import { provideAnimationsAsync } from '@angular/platform-browser/animations/async';
import { providePrimeNG } from 'primeng/config';
import Aura from '@primeuix/themes/aura';
import { jwtInterceptor } from './core/jwt-interceptor';
import { AuthService } from './core/auth';

import { routes } from './app.routes';

export const appConfig: ApplicationConfig = {
  providers: [
    provideBrowserGlobalErrorListeners(),
    provideRouter(routes),
    provideHttpClient(withInterceptors([jwtInterceptor])),
    provideAnimationsAsync(),
    providePrimeNG({ theme: { preset: Aura } }),
    // Must resolve before the router evaluates guards on the initial URL, so an SSO handoff
    // token (`?ssoToken=`) is consumed and stored before any authGuard/adminGuard check runs.
    provideAppInitializer(() => inject(AuthService).consumeSsoTokenFromUrl())
  ]
};
