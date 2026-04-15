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

  const requestUrl = toAbsoluteUrl(url);

  if (requestUrl.origin === window.location.origin && requestUrl.pathname.startsWith('/api')) {
    return true;
  }

  if (!environment.apiBaseUrl) {
    return false;
  }

  const apiBaseUrl = toAbsoluteUrl(environment.apiBaseUrl);
  return requestUrl.origin === apiBaseUrl.origin && requestUrl.pathname.startsWith('/api');
}

function toAbsoluteUrl(url: string): URL {
  return new URL(url, window.location.origin);
}
