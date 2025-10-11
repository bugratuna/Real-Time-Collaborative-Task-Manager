import { HttpClient } from '@angular/common/http';
import { inject, Injectable, computed, signal } from '@angular/core';
import { Router } from '@angular/router';
import { tap } from 'rxjs';

import { environment } from '../../../environments/environment';
import { LoginRequest, LoginResponse, RegisterRequest, User } from '../types/auth.types';

@Injectable({ providedIn: 'root' })
export class AuthService {
  private readonly http = inject(HttpClient);
  private readonly router = inject(Router);

  private readonly currentUserSignal = signal<User | null>(this.restoreUser());

  readonly currentUser = computed(() => this.currentUserSignal());

  login(payload: LoginRequest) {
    return this.http
      .post<LoginResponse>(`${environment.apiUrl}/auth/login`, payload)
      .pipe(tap((response) => this.persistSession(response)));
  }

  register(payload: RegisterRequest) {
    return this.http
      .post<LoginResponse>(`${environment.apiUrl}/auth/register`, payload)
      .pipe(tap((response) => this.persistSession(response)));
  }

  logout(): void {
    localStorage.removeItem('access_token');
    localStorage.removeItem('current_user');
    this.currentUserSignal.set(null);
    this.router.navigate(['/']);
  }

  token(): string | null {
    return localStorage.getItem('access_token');
  }

  isAuthenticated(): boolean {
    return Boolean(this.token());
  }

  private persistSession(response: LoginResponse): void {
    localStorage.setItem('access_token', response.token);
    localStorage.setItem('current_user', JSON.stringify(response.user));
    this.currentUserSignal.set(response.user);
  }

  private restoreUser(): User | null {
    const rawUser = localStorage.getItem('current_user');

    if (!rawUser) {
      return null;
    }

    try {
      return JSON.parse(rawUser) as User;
    } catch (error) {
      console.warn('Failed to parse stored user', error);
      return null;
    }
  }
}
