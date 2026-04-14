import { HttpInterceptorFn } from '@angular/common/http';
import { inject } from '@angular/core';
import { environment } from '../../environments/environment';
import { AuthService } from '../services/auth.service';

export const authInterceptor: HttpInterceptorFn = (req, next) => {
  const authService = inject(AuthService);
  const token = authService.getAccessToken();

  if (!token || !shouldAttachToken(req.url)) {
    return next(req);
  }

  return next(
    req.clone({
      setHeaders: {
        Authorization: `Bearer ${token}`
      }
    })
  );
};

function shouldAttachToken(url: string): boolean {
  if (url.startsWith('/api')) {
    return true;
  }

  if (environment.apiBaseUrl && url.startsWith(`${environment.apiBaseUrl}/api`)) {
    return true;
  }

  if (url.startsWith('http://localhost:4200/api')) {
    return true;
  }

  return url.startsWith('http://localhost:8080/api');
}
