import { Injectable, signal, inject } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Router } from '@angular/router';
import { tap, map } from 'rxjs/operators';
import { Observable } from 'rxjs';
import { User } from '../models/models';
import { environment } from '../../environments/environment';

interface TokenResponse {
  access_token: string;
  refresh_token: string;
  token_type: string;
}

@Injectable({ providedIn: 'root' })
export class AuthService {
  private http = inject(HttpClient);
  private router = inject(Router);

  currentUser = signal<User | null>(null);
  private readonly TOKEN_KEY = 'vc_access_token';
  private readonly REFRESH_KEY = 'vc_refresh_token';

  get accessToken(): string | null {
    return localStorage.getItem(this.TOKEN_KEY);
  }

  get isLoggedIn(): boolean {
    return !!this.accessToken;
  }

  login(email: string, password: string): Observable<User> {
    return this.http.post<TokenResponse>(`${environment.apiUrl}/auth/login`, { email, password }).pipe(
      tap(res => {
        localStorage.setItem(this.TOKEN_KEY, res.access_token);
        localStorage.setItem(this.REFRESH_KEY, res.refresh_token);
      }),
      map(() => this.loadCurrentUser()),
    ) as Observable<User>;
  }

  loadCurrentUser(): Observable<User> {
    return this.http.get<User>(`${environment.apiUrl}/users/me`).pipe(
      tap(user => this.currentUser.set(user)),
    );
  }

  logout(): void {
    localStorage.removeItem(this.TOKEN_KEY);
    localStorage.removeItem(this.REFRESH_KEY);
    this.currentUser.set(null);
    this.router.navigate(['/login']);
  }

  refreshTokens(): Observable<TokenResponse> {
    const refresh = localStorage.getItem(this.REFRESH_KEY);
    return this.http.post<TokenResponse>(`${environment.apiUrl}/auth/refresh`, { refresh_token: refresh }).pipe(
      tap(res => localStorage.setItem(this.TOKEN_KEY, res.access_token)),
    );
  }
}
