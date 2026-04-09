import { Component, OnInit } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { NgClass } from '@angular/common';
import { TenantService } from '../../../core/services/tenant.service';
import { ToastService } from '../../../core/services/toast.service';
import { TenantSettings } from '../../../core/models/models';
import { AuthService } from '../../../core/services/auth.service';

@Component({
  selector: 'app-settings',
  standalone: true,
  imports: [FormsModule, NgClass],
  template: `
    <div class="page">
      <div class="page-header">
        <div>
          <h1 class="page-title">Settings</h1>
          <p class="page-sub">Configure your cafe preferences</p>
        </div>
        <button class="hdr-btn primary" (click)="save()" [disabled]="saving" id="save-settings">
          @if (saving) { <span class="mini-spinner"></span> }
          @else { <span class="material-icons-round">save</span> }
          {{ saving ? 'Saving...' : 'Save Settings' }}
        </button>
      </div>

      @if (loading) {
        <div class="loading-center"><div class="spinner" style="border-top-color:var(--primary-light)"></div></div>
      } @else if (settings) {
        <div class="settings-grid">

          <!-- Theme Card -->
          <div class="settings-card">
            <div class="card-icon accent"><span class="material-icons-round">palette</span></div>
            <h3 class="card-title">Theme Colors</h3>
            <div class="theme-preview" [style.background]="themeColorMap[settings.theme.primary] || '#2563EB'">
              <span style="color:white;font-weight:700">Preview</span>
            </div>
            <div class="setting-row">
              <label class="setting-label">Primary Color</label>
              <select class="dark-select" [(ngModel)]="settings.theme.primary" id="theme-primary">
                @for (c of colorOptions; track c.value) {
                  <option [value]="c.value">{{ c.label }}</option>
                }
              </select>
            </div>
            <div class="setting-row">
              <label class="setting-label">Secondary Color</label>
              <select class="dark-select" [(ngModel)]="settings.theme.secondary" id="theme-secondary">
                @for (c of colorOptions; track c.value) {
                  <option [value]="c.value">{{ c.label }}</option>
                }
              </select>
            </div>
            <div class="setting-row">
              <label class="setting-label">Accent Color</label>
              <select class="dark-select" [(ngModel)]="settings.theme.accent" id="theme-accent">
                @for (c of colorOptions; track c.value) {
                  <option [value]="c.value">{{ c.label }}</option>
                }
              </select>
            </div>
          </div>

          <!-- Ordering Rules Card -->
          <div class="settings-card">
            <div class="card-icon primary"><span class="material-icons-round">shopping_cart</span></div>
            <h3 class="card-title">Ordering Rules</h3>
            <div class="toggle-setting">
              <div class="toggle-info">
                <div class="toggle-title">Require Location</div>
                <div class="toggle-desc">Block orders from outside the cafe radius</div>
              </div>
              <div class="toggle-switch" [ngClass]="{ on: !settings.canUserOrderWithoutLocation }"
                (click)="settings.canUserOrderWithoutLocation = !settings.canUserOrderWithoutLocation"
                id="toggle-location">
                <div class="toggle-thumb"></div>
              </div>
            </div>
            <div class="setting-row">
              <label class="setting-label">Order Radius (km)</label>
              <input type="number" class="dark-input" [(ngModel)]="settings.orderRadiusKm"
                min="0.1" max="50" step="0.5" id="radius-input">
            </div>
            <div class="toggle-setting">
              <div class="toggle-info">
                <div class="toggle-title">Allow Table Change</div>
                <div class="toggle-desc">Let customers change table number</div>
              </div>
              <div class="toggle-switch" [ngClass]="{ on: settings.canUserChangeTableNumber }"
                (click)="settings.canUserChangeTableNumber = !settings.canUserChangeTableNumber"
                id="toggle-table-change">
                <div class="toggle-thumb"></div>
              </div>
            </div>
            <div class="toggle-setting">
              <div class="toggle-info">
                <div class="toggle-title">Payment Enabled</div>
                <div class="toggle-desc">Enable online payment gateway</div>
              </div>
              <div class="toggle-switch" [ngClass]="{ on: settings.paymentEnabled }"
                (click)="settings.paymentEnabled = !settings.paymentEnabled"
                id="toggle-payment">
                <div class="toggle-thumb"></div>
              </div>
            </div>
          </div>

          <!-- Cafe Setup Card -->
          <div class="settings-card">
            <div class="card-icon success"><span class="material-icons-round">store</span></div>
            <h3 class="card-title">Cafe Setup</h3>
            <div class="setting-row">
              <label class="setting-label">Number of Tables</label>
              <input type="number" class="dark-input" [(ngModel)]="settings.tableCount"
                min="1" max="200" id="table-count">
            </div>
            <div class="setting-row">
              <label class="setting-label">Cafe Latitude</label>
              <input type="number" class="dark-input" [(ngModel)]="settings.cafeLatitude"
                step="0.0000001" id="cafe-lat">
            </div>
            <div class="setting-row">
              <label class="setting-label">Cafe Longitude</label>
              <input type="number" class="dark-input" [(ngModel)]="settings.cafeLongitude"
                step="0.0000001" id="cafe-lng">
            </div>
            <div class="map-hint">
              <span class="material-icons-round">info</span>
              Open Google Maps, right-click your cafe → copy coordinates
            </div>
          </div>

          <!-- Live Preview Card -->
          <div class="settings-card preview-card">
            <div class="card-icon purple"><span class="material-icons-round">preview</span></div>
            <h3 class="card-title">Settings Summary</h3>
            <div class="summary-list">
              <div class="summary-item">
                <span class="material-icons-round">{{ settings.canUserOrderWithoutLocation ? 'location_off' : 'location_on' }}</span>
                <span>Location {{ settings.canUserOrderWithoutLocation ? 'not required' : 'required' }}</span>
              </div>
              <div class="summary-item">
                <span class="material-icons-round">radar</span>
                <span>{{ settings.orderRadiusKm }} km radius</span>
              </div>
              <div class="summary-item">
                <span class="material-icons-round">table_restaurant</span>
                <span>{{ settings.tableCount }} tables</span>
              </div>
              <div class="summary-item">
                <span class="material-icons-round">{{ settings.paymentEnabled ? 'payments' : 'money_off' }}</span>
                <span>Payment {{ settings.paymentEnabled ? 'enabled' : 'disabled' }}</span>
              </div>
            </div>
          </div>

        </div>
      }
    </div>
  `,
  styles: [`
    .page { padding: 28px; }
    .page-header { display: flex; align-items: center; justify-content: space-between; margin-bottom: 28px; flex-wrap: wrap; gap: 12px; }
    .page-title { font-size: 26px; color: var(--dark-text); }
    .page-sub { color: var(--dark-muted); font-size: 14px; margin-top: 2px; }
    .hdr-btn {
      display: inline-flex; align-items: center; gap: 6px; padding: 10px 18px;
      border-radius: var(--radius); font-size: 13px; font-weight: 600; cursor: pointer;
      border: none; transition: all var(--transition);
    }
    .hdr-btn.primary {
      background: linear-gradient(135deg, var(--primary), var(--primary-dark));
      color: white; box-shadow: var(--shadow-primary);
    }
    .hdr-btn.primary:hover { transform: translateY(-1px); }
    .hdr-btn:disabled { opacity: 0.5; cursor: not-allowed; transform: none !important; }

    .loading-center { display: flex; justify-content: center; padding: 80px; }

    .settings-grid { display: grid; grid-template-columns: repeat(auto-fill, minmax(320px, 1fr)); gap: 20px; }
    .settings-card {
      background: var(--dark-surface); border: 1px solid var(--dark-border);
      border-radius: var(--radius-xl); padding: 24px;
    }
    .card-icon {
      width: 44px; height: 44px; border-radius: var(--radius-lg); margin-bottom: 16px;
      display: flex; align-items: center; justify-content: center;
    }
    .card-icon.accent { background: rgba(245,158,11,0.15); color: var(--accent); }
    .card-icon.primary { background: rgba(37,99,235,0.15); color: var(--primary-light); }
    .card-icon.success { background: rgba(16,185,129,0.15); color: var(--success); }
    .card-icon.purple { background: rgba(124,58,237,0.15); color: #A78BFA; }
    .card-icon .material-icons-round { font-size: 22px; }
    .card-title { font-size: 16px; color: var(--dark-text); margin-bottom: 20px; font-weight: 700; }

    .theme-preview {
      height: 56px; border-radius: var(--radius); margin-bottom: 16px;
      display: flex; align-items: center; justify-content: center; font-size: 14px;
      transition: background 0.3s; box-shadow: var(--shadow-sm);
    }

    .setting-row { margin-bottom: 14px; }
    .setting-label { display: block; font-size: 12px; font-weight: 700; color: var(--dark-muted); text-transform: uppercase; letter-spacing: 0.04em; margin-bottom: 6px; }
    .dark-input, .dark-select {
      width: 100%; background: rgba(0,0,0,0.25); border: 1.5px solid var(--dark-border);
      color: var(--dark-text); border-radius: var(--radius); padding: 10px 12px; font-size: 14px;
      transition: all var(--transition); font-family: var(--font-body);
    }
    .dark-input:focus, .dark-select:focus { border-color: var(--primary); outline: none; box-shadow: 0 0 0 3px rgba(37,99,235,0.1); }
    .dark-select option { background: var(--dark-surface); color: var(--dark-text); }

    .toggle-setting {
      display: flex; align-items: center; justify-content: space-between;
      padding: 14px 0; border-bottom: 1px solid var(--dark-border); margin-bottom: 4px;
    }
    .toggle-setting:last-of-type { border-bottom: none; }
    .toggle-info { flex: 1; }
    .toggle-title { font-size: 14px; font-weight: 600; color: var(--dark-text); }
    .toggle-desc { font-size: 12px; color: var(--dark-muted); margin-top: 2px; }
    .toggle-switch {
      width: 44px; height: 24px; background: var(--dark-border); border-radius: 12px;
      cursor: pointer; position: relative; transition: background 0.25s; flex-shrink: 0;
    }
    .toggle-switch.on { background: var(--success); }
    .toggle-thumb {
      position: absolute; top: 2px; left: 2px; width: 20px; height: 20px;
      background: white; border-radius: 50%; transition: transform 0.25s var(--ease-bounce);
      box-shadow: 0 1px 4px rgba(0,0,0,0.3);
    }
    .toggle-switch.on .toggle-thumb { transform: translateX(20px); }

    .map-hint {
      display: flex; align-items: flex-start; gap: 6px; color: var(--dark-muted);
      font-size: 12px; margin-top: 8px; line-height: 1.5;
    }
    .map-hint .material-icons-round { font-size: 14px; color: var(--primary-light); margin-top: 1px; }

    .summary-list { display: flex; flex-direction: column; gap: 12px; }
    .summary-item {
      display: flex; align-items: center; gap: 10px;
      font-size: 14px; color: var(--dark-text);
    }
    .summary-item .material-icons-round { font-size: 18px; color: var(--primary-light); }

    .mini-spinner {
      width: 16px; height: 16px; border: 2px solid rgba(255,255,255,0.3);
      border-top-color: white; border-radius: 50%; animation: spin 0.7s linear infinite; display: inline-block;
    }
    @keyframes spin { to { transform: rotate(360deg) } }
    @media (max-width: 640px) { .settings-grid { grid-template-columns: 1fr; } }
  `]
})
export class SettingsComponent implements OnInit {
  settings: TenantSettings | null = null;
  loading = true;
  saving = false;
  slug = '';

  colorOptions = [
    { value: 'blue',   label: '🔵 Blue'   },
    { value: 'indigo', label: '💜 Indigo' },
    { value: 'purple', label: '🟣 Purple' },
    { value: 'pink',   label: '🩷 Pink'   },
    { value: 'red',    label: '🔴 Red'    },
    { value: 'orange', label: '🟠 Orange' },
    { value: 'amber',  label: '🟡 Amber'  },
    { value: 'green',  label: '🟢 Green'  },
    { value: 'teal',   label: '🩵 Teal'   },
    { value: 'white',  label: '⚪ White'  },
  ];

  themeColorMap: Record<string, string> = {
    blue: '#2563EB', indigo: '#4F46E5', purple: '#7C3AED', pink: '#EC4899',
    red: '#EF4444', orange: '#F97316', amber: '#F59E0B', green: '#22C55E',
    teal: '#14B8A6', white: '#CBD5E1'
  };

  constructor(
    private tenantService: TenantService,
    private toast: ToastService,
    private auth: AuthService
  ) {}

  ngOnInit() {
    const cached = this.tenantService.getSettings();
    if (cached) {
      this.settings = { ...cached, theme: { ...cached.theme } };
      this.loading = false;
      return;
    }

    // No cached settings — fetch from admin API using JWT token
    this.tenantService.loadAdminSettings().subscribe({
      next: s => {
        this.settings = { ...s, theme: { ...s.theme } };
        this.loading = false;
      },
      error: () => {
        this.loading = false;
        this.toast.error('Failed to load settings', 'Could not fetch cafe settings.');
      }
    });
  }

  save() {
    if (!this.settings) return;
    this.saving = true;
    this.tenantService.updateSettings(this.settings).subscribe({
      next: () => { this.saving = false; this.toast.success('Settings saved!'); },
      error: err => { this.saving = false; this.toast.error('Save failed', err?.error?.message); }
    });
  }
}
