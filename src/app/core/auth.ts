import { Injectable, signal, computed } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Router } from '@angular/router';
import { firstValueFrom } from 'rxjs';
import { tap } from 'rxjs/operators';
import { Observable } from 'rxjs';
import { environment } from '../../environments/environment';

export interface AuthUser {
  id: string;
  email: string;
  firstName: string;
  lastName: string;
  roles: string[];
}

interface SsoMeResponse {
  token: string;
  id: string;
  email: string;
  firstName: string;
  lastName: string;
  roles: string[];
}

@Injectable({ providedIn: 'root' })
export class AuthService {
  private readonly TOKEN_KEY = 'gruhasti_token';
  private readonly USER_KEY = 'gruhasti_user';

  private _user = signal<AuthUser | null>(this.loadUser());
  readonly user = this._user.asReadonly();
  readonly isLoggedIn = computed(() => this._user() !== null);
  // SUPER_ADMIN is a strict superset of ADMIN access — checked here explicitly rather than
  // relying on every super-admin account also literally carrying the ADMIN role.
  readonly isAdmin = computed(() => {
    const roles = this._user()?.roles;
    return roles?.includes('ADMIN') || roles?.includes('SUPER_ADMIN') || false;
  });

  constructor(private router: Router, private http: HttpClient) {}

  getToken(): string | null {
    return localStorage.getItem(this.TOKEN_KEY);
  }

  logout(): void {
    localStorage.removeItem(this.TOKEN_KEY);
    localStorage.removeItem(this.USER_KEY);
    this._user.set(null);
    // Redirect to SSO login
    window.location.href = environment.ssoLoginUrl;
  }

  /** Sends an anonymous visitor to sso-ui, tagged so it hands them back here after login. */
  redirectToLogin(): void {
    const returnUrl = encodeURIComponent(window.location.href);
    window.location.href = `${environment.ssoLoginUrl}?returnUrl=${returnUrl}`;
  }

  /**
   * Called once at bootstrap (see `provideAppInitializer` in app.config.ts) to pick up a JWT
   * handed off from sso-ui via `?ssoToken=` — a different app is almost always a different
   * origin, so the token can't just be read out of sso-ui's own localStorage. Resolves either
   * way; a missing/invalid token is not an error here, the normal auth guards handle that.
   */
  consumeSsoTokenFromUrl(): Promise<void> {
    const token = new URLSearchParams(window.location.search).get('ssoToken');
    if (!token) {
      return Promise.resolve();
    }
    return firstValueFrom(this.hydrateFromSsoToken(token))
      .catch(() => localStorage.removeItem(this.TOKEN_KEY))
      .then(() => this.stripSsoTokenFromUrl());
  }

  private hydrateFromSsoToken(token: string): Observable<SsoMeResponse> {
    localStorage.setItem(this.TOKEN_KEY, token);
    return this.http.get<SsoMeResponse>(`${environment.ssoApiBaseUrl}/auth/me`).pipe(
      tap((res) => {
        const user: AuthUser = {
          id: res.id, email: res.email, firstName: res.firstName, lastName: res.lastName, roles: res.roles,
        };
        localStorage.setItem(this.USER_KEY, JSON.stringify(user));
        this._user.set(user);
      })
    );
  }

  private stripSsoTokenFromUrl(): void {
    const url = new URL(window.location.href);
    url.searchParams.delete('ssoToken');
    window.history.replaceState({}, '', url.toString());
  }

  private loadUser(): AuthUser | null {
    try {
      const raw = localStorage.getItem(this.USER_KEY);
      return raw ? JSON.parse(raw) : null;
    } catch {
      return null;
    }
  }
}
