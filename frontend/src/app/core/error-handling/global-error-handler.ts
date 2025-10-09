import { ErrorHandler, Injectable, Injector, isDevMode } from '@angular/core';
import { MatSnackBar } from '@angular/material/snack-bar';
import { HttpErrorResponse } from '@angular/common/http';

@Injectable()
export class GlobalErrorHandler implements ErrorHandler {
  constructor(private injector: Injector) {}

  handleError(error: unknown): void {
    const snackBar = this.injector.get(MatSnackBar);

    const message = this.resolveMessage(error);

    snackBar.open(message, 'Dismiss', {
      duration: 5000,
      horizontalPosition: 'end',
      verticalPosition: 'top'
    });

    if (isDevMode()) {
      console.error('Global error handler caught:', error);
    }
  }

  private resolveMessage(error: unknown): string {
    if (error instanceof HttpErrorResponse) {
      if (typeof error.error === 'string') {
        return error.error;
      }

      if (error.error && typeof error.error.message === 'string') {
        return error.error.message;
      }

      return `Request failed with status ${error.status}`;
    }

    if (error instanceof Error) {
      return error.message || 'An unexpected error occurred';
    }

    return 'An unexpected error occurred';
  }
}
