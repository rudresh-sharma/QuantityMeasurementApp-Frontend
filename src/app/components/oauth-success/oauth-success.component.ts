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

  statusMessage = 'Completing sign-in...';

  ngOnInit(): void {
    const token = this.route.snapshot.queryParamMap.get('token');
    const email = this.route.snapshot.queryParamMap.get('email');
    const name = this.route.snapshot.queryParamMap.get('name');

    if (!token || !email) {
      this.authService.clearSession();
      this.statusMessage = 'Sign-in failed. Redirecting...';
      void this.router.navigate(['/'], { replaceUrl: true });
      return;
    }

    this.authService.completeOAuthLogin(token, email, name);
    this.statusMessage = 'Signed in successfully. Redirecting...';
    void this.router.navigate(['/'], { replaceUrl: true });
  }
}
