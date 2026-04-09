import { Component } from '@angular/core';
import { AsyncPipe, NgClass } from '@angular/common';
import { ToastService, Toast } from '../../core/services/toast.service';

@Component({
  selector: 'app-toast-container',
  standalone: true,
  imports: [AsyncPipe, NgClass],
  template: `
    <div class="toast-container">
      @for (toast of toastService.toasts | async; track toast.id) {
        <div class="toast" [ngClass]="toast.type" (click)="toastService.remove(toast.id)">
          <span class="material-icons-round toast-icon">
            {{ iconFor(toast.type) }}
          </span>
          <div class="toast-content">
            <div class="toast-title">{{ toast.title }}</div>
            @if (toast.message) {
              <div class="toast-message">{{ toast.message }}</div>
            }
          </div>
          <button class="btn btn-ghost btn-icon toast-close">
            <span class="material-icons-round" style="font-size:16px">close</span>
          </button>
        </div>
      }
    </div>
  `,
  styles: [`
    .toast-container {
      position: fixed; top: 20px; right: 20px; z-index: 9999;
      display: flex; flex-direction: column; gap: 10px; pointer-events: none;
    }
    .toast {
      background: var(--white); border-radius: var(--radius-lg); padding: 14px 16px;
      box-shadow: var(--shadow-lg); min-width: 300px; max-width: 400px;
      display: flex; align-items: flex-start; gap: 12px;
      border-left: 4px solid var(--primary); pointer-events: all;
      animation: slideInRight 0.35s var(--ease-bounce); cursor: pointer;
      transition: all 0.2s ease;
    }
    .toast:hover { transform: translateX(-4px); }
    .toast.success { border-left-color: var(--success); }
    .toast.error   { border-left-color: var(--danger); }
    .toast.warning { border-left-color: var(--accent); }
    .toast-icon { font-size: 22px; margin-top: 1px; flex-shrink: 0; }
    .toast.success .toast-icon { color: var(--success); }
    .toast.error   .toast-icon { color: var(--danger); }
    .toast.warning .toast-icon { color: var(--accent); }
    .toast.info    .toast-icon { color: var(--primary); }
    .toast-content { flex: 1; }
    .toast-title   { font-weight: 700; font-size: 14px; color: var(--gray-800); }
    .toast-message { font-size: 13px; color: var(--gray-500); margin-top: 2px; }
    .toast-close   { color: var(--gray-400); flex-shrink: 0; }
    @keyframes slideInRight {
      from { transform: translateX(120%); opacity: 0; }
      to   { transform: translateX(0);    opacity: 1; }
    }
  `]
})
export class ToastContainerComponent {
  constructor(public toastService: ToastService) {}
  iconFor(type: Toast['type']): string {
    const map: Record<string, string> = {
      success: 'check_circle', error: 'error', warning: 'warning', info: 'info'
    };
    return map[type] ?? 'info';
  }
}
