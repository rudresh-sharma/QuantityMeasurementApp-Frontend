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

type AuthResponseLike = unknown;

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
    return this.http.post<AuthResponseLike>(this.buildApiUrl('/api/v1/auth/login'), payload).pipe(
      map((response) =>
        this.requireAuthResponse(response, 'Login failed. The server did not return a valid session.', {
          email: payload.email
        })
      ),
      tap((response) => this.persistSession(this.toSession(response)))
    );
  }

  register(payload: RegisterPayload): Observable<AuthResponseLike> {
    return this.http.post<AuthResponseLike>(this.buildApiUrl('/api/v1/auth/register'), payload).pipe(
      tap((response) => {
        const session = this.tryCreateSession(response);
        if (session) {
          this.persistSession(session);
        }
      })
    );
  }

  getGoogleAuthUrl(): string {
    return environment.googleAuthUrl;
  }

  completeOAuthLogin(token: string, email?: string | null, name?: string | null): AuthSession {
    const normalizedEmail = String(email ?? '').trim();
    const fullName = String(name ?? '').trim() || normalizedEmail.split('@')[0] || 'User';
    const session: AuthSession = {
      token,
      tokenType: 'Bearer',
      expiresAt: this.resolveExpiresAt(token, null),
      user: {
        id: 0,
        fullName,
        email: normalizedEmail,
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

  private tryCreateSession(authResponse: AuthResponseLike): AuthSession | null {
    const normalized = this.normalizeAuthResponse(authResponse);
    return normalized ? this.toSession(normalized) : null;
  }

  private requireAuthResponse(
    authResponse: AuthResponseLike,
    fallbackMessage: string,
    fallbackUser?: Partial<UserProfile>
  ): AuthResponse {
    const normalized = this.normalizeAuthResponse(authResponse, fallbackUser);

    if (!normalized) {
      throw new Error(fallbackMessage);
    }

    return normalized;
  }

  private normalizeAuthResponse(
    authResponse: AuthResponseLike,
    fallbackUser?: Partial<UserProfile>
  ): AuthResponse | null {
    if (!authResponse || typeof authResponse !== 'object') {
      return null;
    }

    const root = authResponse as Record<string, unknown>;
    const data = this.asRecord(root['data']) ?? this.asRecord(root['result']) ?? root;
    const token = this.readString(data, ['token', 'accessToken', 'jwt', 'idToken']);

    if (!token) {
      return null;
    }

    const userSource =
      this.asRecord(data['user']) ??
      this.asRecord(data['userDto']) ??
      this.asRecord(data['profile']) ??
      this.asRecord(data['account']) ??
      data;

    return {
      token,
      tokenType: this.readString(data, ['tokenType', 'type']) || 'Bearer',
      expiresInSeconds: this.readNumber(data, ['expiresInSeconds', 'expiresIn', 'expires_in']) ?? 0,
      user: this.normalizeUserProfile(userSource, fallbackUser)
    };
  }

  private normalizeUserProfile(source: Record<string, unknown>, fallbackUser?: Partial<UserProfile>): UserProfile {
    const email = this.readString(source, ['email', 'emailId']) || fallbackUser?.email || '';
    const fullName =
      this.readString(source, ['fullName', 'name', 'username']) ||
      fallbackUser?.fullName ||
      email.split('@')[0] ||
      'User';

    return {
      id: this.readNumber(source, ['id', 'userId']) ?? fallbackUser?.id ?? 0,
      fullName,
      email,
      mobileNumber: this.readString(source, ['mobileNumber', 'phoneNumber', 'phone']) || fallbackUser?.mobileNumber || null,
      role: this.readString(source, ['role', 'userRole']) || fallbackUser?.role || 'USER',
      authProvider: this.readString(source, ['authProvider', 'provider']) || fallbackUser?.authProvider || 'LOCAL',
      pictureUrl: this.readString(source, ['pictureUrl', 'avatarUrl', 'imageUrl']) || fallbackUser?.pictureUrl || null
    };
  }

  private readString(source: Record<string, unknown>, keys: string[]): string | null {
    for (const key of keys) {
      const value = source[key];
      if (typeof value === 'string' && value.trim()) {
        return value.trim();
      }
    }

    return null;
  }

  private readNumber(source: Record<string, unknown>, keys: string[]): number | null {
    for (const key of keys) {
      const value = source[key];
      if (typeof value === 'number' && Number.isFinite(value)) {
        return value;
      }

      if (typeof value === 'string' && value.trim() && !Number.isNaN(Number(value))) {
        return Number(value);
      }
    }

    return null;
  }

  private asRecord(value: unknown): Record<string, unknown> | null {
    return value && typeof value === 'object' && !Array.isArray(value) ? (value as Record<string, unknown>) : null;
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
