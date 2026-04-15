import { HttpClient } from '@angular/common/http';
import { Injectable, inject } from '@angular/core';
import { BehaviorSubject, Observable, map, tap } from 'rxjs';
import { environment } from '../../environments/environment';

export interface UserProfile {
  id: number;
  fullName: string;
  email: string;
  mobileNumber: string | null;
  role: string;
  authProvider: string;
  pictureUrl?: string | null;
}

export interface AuthResponse {
  token: string;
  tokenType: string;
  expiresInSeconds: number;
  user: UserProfile;
}

export interface LoginPayload {
  email: string;
  password: string;
}

export interface RegisterPayload {
  fullName: string;
  email: string;
  password: string;
  mobileNumber: string;
}

export interface AuthSession {
  token: string;
  tokenType: string;
  expiresAt: string | null;
  user: UserProfile;
}

@Injectable({ providedIn: 'root' })
export class AuthService {
  private readonly http = inject(HttpClient);
  private readonly storageKey = 'qm_auth';
  private readonly sessionSubject = new BehaviorSubject<AuthSession | null>(this.restoreStoredSession());

  readonly session$ = this.sessionSubject.asObservable();
  readonly isAuthenticated$ = this.session$.pipe(map((session) => !!session?.token));
  readonly user$ = this.session$.pipe(map((session) => session?.user ?? null));

  login(payload: LoginPayload): Observable<AuthResponse> {
    return this.http.post<AuthResponse>(this.buildApiUrl('/api/v1/auth/login'), payload).pipe(
      tap((response) => this.persistSession(this.toSession(response)))
    );
  }

  register(payload: RegisterPayload): Observable<AuthResponse> {
    return this.http.post<AuthResponse>(this.buildApiUrl('/api/v1/auth/register'), payload).pipe(
      tap((response) => this.persistSession(this.toSession(response)))
    );
  }

  getGoogleAuthUrl(): string {
    return environment.googleAuthUrl;
  }

  completeOAuthLogin(token: string, email: string, name?: string | null): AuthSession {
    const fullName = String(name ?? '').trim() || email.split('@')[0] || 'User';
    const session: AuthSession = {
      token,
      tokenType: 'Bearer',
      expiresAt: this.resolveExpiresAt(token, null),
      user: {
        id: 0,
        fullName,
        email,
        mobileNumber: null,
        role: 'USER',
        authProvider: 'GOOGLE'
      }
    };

    this.persistSession(session);
    return session;
  }

  persistSession(session: AuthSession): void {
    localStorage.setItem(this.storageKey, JSON.stringify(session));
    this.sessionSubject.next(session);
  }

  readSession(): AuthSession | null {
    return this.sessionSubject.value;
  }

  getAccessToken(): string | null {
    return this.sessionSubject.value?.token ?? null;
  }

  isAuthenticated(): boolean {
    return !!this.sessionSubject.value?.token;
  }

  clearSession(): void {
    localStorage.removeItem(this.storageKey);
    this.sessionSubject.next(null);
  }

  private restoreStoredSession(): AuthSession | null {
    const rawValue = localStorage.getItem(this.storageKey);
    if (!rawValue) {
      return null;
    }

    try {
      const session = JSON.parse(rawValue) as Partial<AuthSession>;
      if (!session.token || !session.user) {
        localStorage.removeItem(this.storageKey);
        return null;
      }

      const normalizedSession: AuthSession = {
        token: session.token,
        tokenType: session.tokenType || 'Bearer',
        expiresAt: this.resolveExpiresAt(session.token, session.expiresAt ?? null),
        user: session.user as UserProfile
      };

      if (this.isExpired(normalizedSession)) {
        localStorage.removeItem(this.storageKey);
        return null;
      }

      return normalizedSession;
    } catch {
      localStorage.removeItem(this.storageKey);
      return null;
    }
  }

  private buildApiUrl(path: string): string {
    if (!environment.apiBaseUrl) {
      return path;
    }

    return new URL(path, this.ensureTrailingSlash(environment.apiBaseUrl)).toString();
  }

  private ensureTrailingSlash(url: string): string {
    return url.endsWith('/') ? url : `${url}/`;
  }

  private toSession(authResponse: AuthResponse): AuthSession {
    return {
      token: authResponse.token,
      tokenType: authResponse.tokenType || 'Bearer',
      expiresAt: this.resolveExpiresAt(authResponse.token, this.expiresAtFromSeconds(authResponse.expiresInSeconds)),
      user: authResponse.user
    };
  }

  private resolveExpiresAt(token: string, fallbackExpiresAt: string | null): string | null {
    const tokenExpiry = this.decodeJwtExpiry(token);
    return tokenExpiry ?? fallbackExpiresAt;
  }

  private expiresAtFromSeconds(expiresInSeconds: number | null | undefined): string | null {
    if (!expiresInSeconds || expiresInSeconds <= 0) {
      return null;
    }

    return new Date(Date.now() + expiresInSeconds * 1000).toISOString();
  }

  private isExpired(session: AuthSession): boolean {
    if (!session.expiresAt) {
      return false;
    }

    return new Date(session.expiresAt).getTime() <= Date.now();
  }

  private decodeJwtExpiry(token: string): string | null {
    const parts = token.split('.');
    if (parts.length < 2) {
      return null;
    }

    try {
      const normalizedPayload = parts[1].replace(/-/g, '+').replace(/_/g, '/');
      const paddedPayload = normalizedPayload.padEnd(Math.ceil(normalizedPayload.length / 4) * 4, '=');
      const payload = JSON.parse(atob(paddedPayload)) as { exp?: unknown };

      if (typeof payload.exp !== 'number') {
        return null;
      }

      return new Date(payload.exp * 1000).toISOString();
    } catch {
      return null;
    }
  }
}
