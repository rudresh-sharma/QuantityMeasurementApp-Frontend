import { CommonModule } from '@angular/common';
import { Component, OnInit, inject } from '@angular/core';
import { ActivatedRoute, Router } from '@angular/router';
import { AuthService } from '../../services/auth.service';

@Component({
  selector: 'app-oauth-success',
  standalone: true,
  imports: [CommonModule],
  templateUrl: './oauth-success.component.html',
  styleUrl: './oauth-success.component.scss'
})
export class OAuthSuccessComponent implements OnInit {
  private readonly route = inject(ActivatedRoute);
  private readonly router = inject(Router);
  private readonly authService = inject(AuthService);

  heading = 'Signing you in';
  statusMessage = 'Completing sign-in...';
  isError = false;
  actionLabel = 'Back to sign in';

  ngOnInit(): void {
    const error = this.route.snapshot.queryParamMap.get('error');
    const token = this.resolveToken();
    const email = this.resolveParam('email');
    const name = this.resolveParam('name');

    if (error) {
      this.authService.clearSession();
      this.isError = true;
      this.heading = 'Google sign-in failed';
      this.statusMessage = this.friendlyErrorMessage(error);
      return;
    }

    if (!token) {
      this.authService.clearSession();
      this.isError = true;
      this.heading = 'Google sign-in failed';
      this.statusMessage = 'We could not find a sign-in token in the callback URL. Please try Google sign-in again.';
      return;
    }

    this.authService.completeOAuthLogin(token, email, name);
    this.statusMessage = 'Signed in successfully. Redirecting...';
    this.redirectHome();
  }

  goToHome(): void {
    void this.router.navigate(['/'], { replaceUrl: true });
  }

  private redirectHome(delayMs = 800): void {
    window.setTimeout(() => {
      this.goToHome();
    }, delayMs);
  }

  private resolveToken(): string | null {
    return this.resolveParam('token', 'accessToken', 'idToken', 'jwt', 'authToken');
  }

  private resolveParam(...keys: string[]): string | null {
    for (const key of keys) {
      const queryValue = this.route.snapshot.queryParamMap.get(key);
      if (queryValue) {
        return queryValue;
      }

      const hashValue = this.readHashParam(key);
      if (hashValue) {
        return hashValue;
      }
    }

    return null;
  }

  private readHashParam(key: string): string | null {
    const hash = window.location.hash.startsWith('#') ? window.location.hash.slice(1) : window.location.hash;
    if (!hash) {
      return null;
    }

    const hashParams = new URLSearchParams(hash);
    return hashParams.get(key);
  }

  private friendlyErrorMessage(error: string): string {
    const normalizedError = error.replace(/[_+]/g, ' ').trim().toLowerCase();

    if (!normalizedError) {
      return 'We could not complete Google sign-in. Please try again.';
    }

    if (normalizedError.includes('access denied')) {
      return 'Google sign-in was canceled before it could finish.';
    }

    return `Google sign-in could not be completed: ${normalizedError}. Please try again.`;
  }
}
