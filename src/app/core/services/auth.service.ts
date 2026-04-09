import { Injectable, signal } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Router } from '@angular/router';
import { BehaviorSubject, tap } from 'rxjs';
import { AuthResponse } from '../models/models';
import { environment } from '../../../environments/environment';

@Injectable({ providedIn: 'root' })
export class AuthService {
  private readonly TOKEN_KEY = 'access_token';
  private readonly REFRESH_KEY = 'refresh_token';
  private readonly USER_KEY = 'cafe_user';

  isLoggedIn$ = new BehaviorSubject<boolean>(this.hasToken());
  currentUser$ = new BehaviorSubject<AuthResponse | null>(this.getStoredUser());

  constructor(private http: HttpClient, private router: Router) {}

  login(email: string, password: string) {
    return this.http.post<AuthResponse>(`${environment.apiUrl}/auth/login`, { email, password }).pipe(
      tap(res => this.handleAuth(res))
    );
  }

  refresh() {
    const rt = localStorage.getItem(this.REFRESH_KEY);
    return this.http.post<AuthResponse>(`${environment.apiUrl}/auth/refresh`, { refreshToken: rt }).pipe(
      tap(res => this.handleAuth(res))
    );
  }

  logout() {
    localStorage.removeItem(this.TOKEN_KEY);
    localStorage.removeItem(this.REFRESH_KEY);
    localStorage.removeItem(this.USER_KEY);
    this.isLoggedIn$.next(false);
    this.currentUser$.next(null);
    this.router.navigate(['/admin/login']);
  }

  getToken(): string | null { return localStorage.getItem(this.TOKEN_KEY); }
  getRole(): string | null  { return this.currentUser$.value?.role ?? null; }
  getTenantId(): string | null { return this.currentUser$.value?.tenantId ?? null; }
  isSuperAdmin(): boolean   { return this.getRole() === 'SuperAdmin'; }

  private handleAuth(res: AuthResponse) {
    localStorage.setItem(this.TOKEN_KEY, res.accessToken);
    localStorage.setItem(this.REFRESH_KEY, res.refreshToken);
    localStorage.setItem(this.USER_KEY, JSON.stringify(res));
    this.isLoggedIn$.next(true);
    this.currentUser$.next(res);
  }

  private hasToken(): boolean { return !!localStorage.getItem(this.TOKEN_KEY); }

  private getStoredUser(): AuthResponse | null {
    try { return JSON.parse(localStorage.getItem(this.USER_KEY) ?? 'null'); }
    catch { return null; }
  }
}
