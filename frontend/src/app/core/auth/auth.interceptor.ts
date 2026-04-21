import { HttpInterceptorFn, HttpErrorResponse } from '@angular/common/http';
import { inject } from '@angular/core';
import { catchError, switchMap, throwError } from 'rxjs';
import { AuthService } from './auth.service';
import { Router } from '@angular/router';

export const authInterceptor: HttpInterceptorFn = (req, next) => {
  const auth = inject(AuthService);
  const router = inject(Router);

  const token = auth.accessToken;
  const authReq = token
    ? req.clone({ setHeaders: { Authorization: `Bearer ${token}` } })
    : req;

  return next(authReq).pipe(
    catchError((err: HttpErrorResponse) => {
      if (err.status === 401 && !req.url.includes('/auth/')) {
        return auth.refreshTokens().pipe(
          switchMap(res => {
            const retryReq = req.clone({ setHeaders: { Authorization: `Bearer ${res.access_token}` } });
            return next(retryReq);
          }),
          catchError(() => {
            auth.logout();
            return throwError(() => err);
          }),
        );
      }
      return throwError(() => err);
    }),
  );
};
