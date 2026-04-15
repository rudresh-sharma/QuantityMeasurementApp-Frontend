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

  ngOnInit(): void {
    const error = this.route.snapshot.queryParamMap.get('error');
    const token = this.route.snapshot.queryParamMap.get('token');
    const email = this.route.snapshot.queryParamMap.get('email');
    const name = this.route.snapshot.queryParamMap.get('name');

    if (error) {
      this.authService.clearSession();
      this.isError = true;
      this.heading = 'Google sign-in failed';
      this.statusMessage = this.friendlyErrorMessage(error);
      this.redirectHome(3000);
      return;
    }

    if (!token || !email) {
      this.authService.clearSession();
      this.isError = true;
      this.heading = 'Google sign-in failed';
      this.statusMessage = 'We could not complete Google sign-in. Please try again.';
      this.redirectHome(3000);
      return;
    }

    this.authService.completeOAuthLogin(token, email, name);
    this.statusMessage = 'Signed in successfully. Redirecting...';
    this.redirectHome();
  }

  private redirectHome(delayMs = 800): void {
    window.setTimeout(() => {
      void this.router.navigate(['/'], { replaceUrl: true });
    }, delayMs);
  }

  private friendlyErrorMessage(error: string): string {
    const normalizedError = error.replace(/[_+]/g, ' ').trim().toLowerCase();

    if (!normalizedError) {
      return 'We could not complete Google sign-in. Please try again.';
    }

    if (normalizedError.includes('access denied')) {
      return 'Google sign-in was canceled before it could finish.';
    }

    return `Google sign-in could not be completed: ${normalizedError}. Redirecting...`;
  }
}
