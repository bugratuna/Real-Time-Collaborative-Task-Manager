import { HttpInterceptorFn } from '@angular/common/http';
import { ErrorHandler, inject } from '@angular/core';
import { catchError, throwError } from 'rxjs';

export const httpErrorInterceptor: HttpInterceptorFn = (req, next) => {
  const errorHandler = inject(ErrorHandler);

  return next(req).pipe(
    catchError((error) => {
      errorHandler.handleError(error);
      return throwError(() => error);
    })
  );
};
