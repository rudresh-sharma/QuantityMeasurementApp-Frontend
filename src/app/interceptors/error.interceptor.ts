import { HttpErrorResponse, HttpInterceptorFn } from '@angular/common/http';
import { catchError, throwError } from 'rxjs';

export const errorInterceptor: HttpInterceptorFn = (req, next) =>
  next(req).pipe(
    catchError((error: HttpErrorResponse) => {
      const errorBody = error.error;
      const backendMessage =
        typeof errorBody === 'string'
          ? errorBody
          : errorBody?.message || errorBody?.errorMessage || errorBody?.error || extractValidationMessage(errorBody);

      const message = backendMessage || fallbackMessage(error.status);
      return throwError(() => new Error(message));
    })
  );

function fallbackMessage(status: number): string {
  if (status === 401) {
    return 'Your session has expired or you are not logged in. Please log in and try again.';
  }

  if (status === 403) {
    return 'You are not authorized to perform this action. Please log in again and try again.';
  }

  if (status === 409) {
    return 'Email already exists. Please login with your existing account.';
  }

  return 'Something went wrong while processing the request.';
}

function extractValidationMessage(errorBody: unknown): string | undefined {
  if (!errorBody || typeof errorBody !== 'object') {
    return undefined;
  }

  const body = errorBody as { errors?: unknown };

  if (Array.isArray(body.errors)) {
    return body.errors
      .map((item) => {
        if (typeof item === 'string') {
          return item;
        }

        if (item && typeof item === 'object' && 'message' in item) {
          const message = (item as { message?: unknown }).message;
          return typeof message === 'string' ? message : '';
        }

        return '';
      })
      .filter(Boolean)
      .join('; ');
  }

  return undefined;
}
