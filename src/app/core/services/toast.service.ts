import { Injectable } from '@angular/core';
import { BehaviorSubject } from 'rxjs';

export interface Toast {
  id: string;
  type: 'success' | 'error' | 'warning' | 'info';
  title: string;
  message?: string;
  duration?: number;
}

@Injectable({ providedIn: 'root' })
export class ToastService {
  private toasts$ = new BehaviorSubject<Toast[]>([]);
  toasts = this.toasts$.asObservable();

  show(type: Toast['type'], title: string, message?: string, duration = 4000) {
    const id = Math.random().toString(36).slice(2);
    const toast: Toast = { id, type, title, message, duration };
    this.toasts$.next([...this.toasts$.value, toast]);
    if (duration > 0) setTimeout(() => this.remove(id), duration);
    return id;
  }

  success(title: string, message?: string) { return this.show('success', title, message); }
  error(title: string, message?: string)   { return this.show('error',   title, message); }
  warning(title: string, message?: string) { return this.show('warning', title, message); }
  info(title: string, message?: string)    { return this.show('info',    title, message); }

  remove(id: string) {
    this.toasts$.next(this.toasts$.value.filter(t => t.id !== id));
  }
}
