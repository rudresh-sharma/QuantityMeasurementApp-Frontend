import { HttpClient } from '@angular/common/http';
import { Injectable, inject } from '@angular/core';
import { Observable } from 'rxjs';
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

@Injectable({ providedIn: 'root' })
export class AuthService {
  private readonly http = inject(HttpClient);
  private readonly storageKey = 'qm_auth';

  login(payload: LoginPayload): Observable<AuthResponse> {
    return this.http.post<AuthResponse>(`${environment.apiBaseUrl}/api/v1/auth/login`, payload);
  }

  register(payload: RegisterPayload): Observable<AuthResponse> {
    return this.http.post<AuthResponse>(`${environment.apiBaseUrl}/api/v1/auth/register`, payload);
  }

  getGoogleAuthUrl(): string {
    return `${environment.apiBaseUrl}${environment.googleAuthPath}`;
  }

  persistSession(authResponse: AuthResponse): void {
    localStorage.setItem(this.storageKey, JSON.stringify(authResponse));
  }

  readSession(): AuthResponse | null {
    const rawValue = localStorage.getItem(this.storageKey);
    if (!rawValue) {
      return null;
    }

    try {
      return JSON.parse(rawValue) as AuthResponse;
    } catch {
      localStorage.removeItem(this.storageKey);
      return null;
    }
  }

  clearSession(): void {
    localStorage.removeItem(this.storageKey);
  }
}
