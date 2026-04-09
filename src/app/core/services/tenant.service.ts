import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { BehaviorSubject, tap } from 'rxjs';
import { TenantSettings, MenuItem } from '../models/models';
import { environment } from '../../../environments/environment';

@Injectable({ providedIn: 'root' })
export class TenantService {
  private settings$ = new BehaviorSubject<TenantSettings | null>(null);
  settings = this.settings$.asObservable();

  constructor(private http: HttpClient) {}
  
  loadSettings(slug: string) {
    return this.http.get<TenantSettings>(`${environment.apiUrl}/${slug}/settings`).pipe(
      tap(s => {
        this.settings$.next(s);
        this.applyTheme(s);
      })
    );
  }

  loadAdminSettings() {
    return this.http.get<TenantSettings>(`${environment.apiUrl}/settings`).pipe(
      tap(s => {
        this.settings$.next(s);
        this.applyTheme(s);
      })
    );
  }

  getSettings(): TenantSettings | null { return this.settings$.value; }

  updateSettings(data: TenantSettings) {
    return this.http.put<TenantSettings>(`${environment.apiUrl}/settings`, data).pipe(
      tap(s => { this.settings$.next(s); this.applyTheme(s); })
    );
  }

  private applyTheme(s: TenantSettings) {
    // Maps color name → [primary, primary-dark, primary-light, shadow-rgb]
    const colorMap: Record<string, { hex: string; dark: string; light: string; rgb: string }> = {
      blue:   { hex: '#2563EB', dark: '#1D4ED8', light: '#3B82F6', rgb: '37,99,235' },
      indigo: { hex: '#4F46E5', dark: '#4338CA', light: '#6366F1', rgb: '79,70,229' },
      purple: { hex: '#7C3AED', dark: '#6D28D9', light: '#8B5CF6', rgb: '124,58,237' },
      pink:   { hex: '#EC4899', dark: '#DB2777', light: '#F472B6', rgb: '236,72,153' },
      red:    { hex: '#EF4444', dark: '#DC2626', light: '#F87171', rgb: '239,68,68' },
      orange: { hex: '#F97316', dark: '#EA580C', light: '#FB923C', rgb: '249,115,22' },
      amber:  { hex: '#F59E0B', dark: '#D97706', light: '#FCD34D', rgb: '245,158,11' },
      yellow: { hex: '#EAB308', dark: '#CA8A04', light: '#FDE047', rgb: '234,179,8' },
      green:  { hex: '#22C55E', dark: '#16A34A', light: '#4ADE80', rgb: '34,197,94' },
      teal:   { hex: '#14B8A6', dark: '#0D9488', light: '#2DD4BF', rgb: '20,184,166' },
      cyan:   { hex: '#06B6D4', dark: '#0891B2', light: '#22D3EE', rgb: '6,182,212' },
      white:  { hex: '#CBD5E1', dark: '#94A3B8', light: '#E2E8F0', rgb: '203,213,225' },
    };

    const accentMap: Record<string, string> = {
      blue: '#3B82F6', indigo: '#6366F1', purple: '#8B5CF6', pink: '#F472B6',
      red: '#F87171', orange: '#FB923C', amber: '#F59E0B', yellow: '#FDE047',
      green: '#4ADE80', teal: '#2DD4BF', cyan: '#22D3EE', white: '#E2E8F0',
    };

    const primary = colorMap[s.theme.primary] ?? colorMap['blue'];
    const accent = accentMap[s.theme.accent] ?? accentMap['amber'];

    const root = document.documentElement;
    root.style.setProperty('--primary',        primary.hex);
    root.style.setProperty('--primary-dark',   primary.dark);
    root.style.setProperty('--primary-light',  primary.light);
    root.style.setProperty('--shadow-primary', `0 8px 24px rgba(${primary.rgb},0.30)`);
    root.style.setProperty('--accent',         accent);
    root.style.setProperty('--accent-dark',    accentMap[s.theme.accent] ?? accentMap['amber']);

    // Legacy aliases (keep for backward compat)
    root.style.setProperty('--brand-primary', primary.hex);
    root.style.setProperty('--brand-accent',  accent);
  }
}
