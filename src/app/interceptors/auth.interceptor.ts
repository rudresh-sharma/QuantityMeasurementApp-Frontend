import { HttpInterceptorFn } from '@angular/common/http';

export const authInterceptor: HttpInterceptorFn = (req, next) => {
  const rawSession = localStorage.getItem('qm_auth');

  if (!rawSession) {
    return next(req);
  }

  try {
    const session = JSON.parse(rawSession) as { token?: string; tokenType?: string };

    if (!session.token) {
      return next(req);
    }

    return next(
      req.clone({
        setHeaders: {
          Authorization: `${session.tokenType || 'Bearer'} ${session.token}`
        }
      })
    );
  } catch {
    return next(req);
  }
};
