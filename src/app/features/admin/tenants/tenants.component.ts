import { Component, OnInit } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { HttpClient } from '@angular/common/http';
import { ToastService } from '../../../core/services/toast.service';
import { environment } from '../../../../environments/environment';

interface TenantItem { id: string; name: string; slug: string; isActive: boolean; createdAt: string; }

@Component({
  selector: 'app-tenants',
  standalone: true,
  imports: [FormsModule],
  template: `
    <div class="page">
      <div class="page-header">
        <div>
          <h1 class="page-title">Tenant Management</h1>
          <p class="page-sub">Super Admin — manage all cafes and their admins</p>
        </div>
        <button class="hdr-btn primary" (click)="showCreateForm = true" id="add-tenant">
          <span class="material-icons-round">add_business</span> Add Cafe
        </button>
      </div>

      @if (loading) {
        <div class="loading-center"><div class="spinner" style="border-top-color:var(--primary-light)"></div></div>
      } @else {
        <div class="tenants-list">
          @for (t of tenants; track t.id) {
            <div class="tenant-row" [class.inactive]="!t.isActive">
              <div class="tenant-avatar">{{ t.name.charAt(0).toUpperCase() }}</div>
              <div class="tenant-info">
                <div class="tenant-name">{{ t.name }}</div>
                <div class="tenant-slug">slug: <code>{{ t.slug }}</code></div>
              </div>
              <div class="tenant-status">
                <span class="badge" [class]="t.isActive ? 'badge-success' : 'badge-danger'">
                  {{ t.isActive ? 'Active' : 'Inactive' }}
                </span>
              </div>
              <div class="tenant-actions">
                <button class="t-btn" (click)="openAdminForm(t)" title="Add Admin" [id]="'admin-' + t.id">
                  <span class="material-icons-round">person_add</span>
                </button>
                <button class="t-btn toggle-btn" (click)="toggleTenant(t)" [title]="t.isActive ? 'Deactivate' : 'Activate'" [id]="'toggle-' + t.id">
                  <span class="material-icons-round">{{ t.isActive ? 'toggle_on' : 'toggle_off' }}</span>
                </button>
              </div>
            </div>
          }
        </div>
      }
    </div>

    <!-- Create Tenant Modal -->
    @if (showCreateForm) {
      <div class="modal-backdrop" (click)="showCreateForm = false">
        <div class="modal" (click)="$event.stopPropagation()">
          <div class="modal-header">
            <h3>Add New Cafe</h3>
            <button class="btn-icon-close" (click)="showCreateForm = false"><span class="material-icons-round">close</span></button>
          </div>
          <div class="modal-body">
            <div class="form-group">
              <label class="form-label">Cafe Name *</label>
              <input class="dark-input" [(ngModel)]="newTenant.name" placeholder="Blue Moon Cafe" id="tenant-name">
            </div>
            <div class="form-group">
              <label class="form-label">Slug (URL-friendly) *</label>
              <input class="dark-input" [(ngModel)]="newTenant.slug" placeholder="blue-moon-cafe" id="tenant-slug">
              <small style="color:var(--dark-muted);font-size:11px">Only lowercase letters, numbers, hyphens</small>
            </div>
          </div>
          <div class="modal-footer">
            <button class="hdr-btn outline" (click)="showCreateForm = false">Cancel</button>
            <button class="hdr-btn primary" (click)="createTenant()" [disabled]="creating" id="confirm-create">
              @if (creating) { <span class="mini-spinner"></span> } Create Cafe
            </button>
          </div>
        </div>
      </div>
    }

    <!-- Create Admin Modal -->
    @if (showAdminForm && selectedTenant) {
      <div class="modal-backdrop" (click)="showAdminForm = false">
        <div class="modal" (click)="$event.stopPropagation()">
          <div class="modal-header">
            <h3>Add Admin — {{ selectedTenant.name }}</h3>
            <button class="btn-icon-close" (click)="showAdminForm = false"><span class="material-icons-round">close</span></button>
          </div>
          <div class="modal-body">
            <div class="form-group">
              <label class="form-label">Admin Name</label>
              <input class="dark-input" [(ngModel)]="newAdmin.name" placeholder="John Doe" id="admin-name">
            </div>
            <div class="form-group">
              <label class="form-label">Email *</label>
              <input class="dark-input" type="email" [(ngModel)]="newAdmin.email" placeholder="admin@cafe.com" id="admin-email">
            </div>
            <div class="form-group">
              <label class="form-label">Password *</label>
              <input class="dark-input" type="password" [(ngModel)]="newAdmin.password" placeholder="••••••••" id="admin-pass">
            </div>
          </div>
          <div class="modal-footer">
            <button class="hdr-btn outline" (click)="showAdminForm = false">Cancel</button>
            <button class="hdr-btn primary" (click)="createAdmin()" [disabled]="creating" id="confirm-admin">
              @if (creating) { <span class="mini-spinner"></span> } Create Admin
            </button>
          </div>
        </div>
      </div>
    }
  `,
  styles: [`
    .page { padding: 28px; }
    .page-header { display: flex; align-items: center; justify-content: space-between; margin-bottom: 24px; flex-wrap: wrap; gap: 12px; }
    .page-title { font-size: 26px; color: var(--dark-text); }
    .page-sub { color: var(--dark-muted); font-size: 14px; margin-top: 2px; }
    .hdr-btn { display: inline-flex; align-items: center; gap: 6px; padding: 10px 16px; border-radius: var(--radius); font-size: 13px; font-weight: 600; cursor: pointer; border: none; transition: all var(--transition); }
    .hdr-btn.primary { background: linear-gradient(135deg, var(--primary), var(--primary-dark)); color: white; }
    .hdr-btn.primary:hover { transform: translateY(-1px); }
    .hdr-btn.outline { background: transparent; color: var(--dark-muted); border: 1px solid var(--dark-border); }
    .hdr-btn.outline:hover { background: rgba(255,255,255,0.06); color: var(--dark-text); }
    .hdr-btn:disabled { opacity: 0.5; cursor: not-allowed; transform: none !important; }
    .loading-center { display: flex; justify-content: center; padding: 80px; }
    .tenants-list { display: flex; flex-direction: column; gap: 12px; }
    .tenant-row { display: flex; align-items: center; gap: 16px; background: var(--dark-surface); border: 1px solid var(--dark-border); border-radius: var(--radius-lg); padding: 16px 20px; transition: all var(--transition-md); }
    .tenant-row:hover { border-color: rgba(59,130,246,0.3); }
    .tenant-row.inactive { opacity: 0.55; }
    .tenant-avatar { width: 44px; height: 44px; border-radius: var(--radius); background: linear-gradient(135deg, var(--primary), var(--primary-dark)); display: flex; align-items: center; justify-content: center; font-size: 20px; font-weight: 700; color: white; flex-shrink: 0; }
    .tenant-info { flex: 1; }
    .tenant-name { font-size: 16px; font-weight: 700; color: var(--dark-text); }
    .tenant-slug { font-size: 12px; color: var(--dark-muted); margin-top: 2px; }
    .tenant-slug code { font-family: monospace; color: var(--accent); }
    .tenant-actions { display: flex; gap: 6px; }
    .t-btn { width: 36px; height: 36px; border-radius: var(--radius); background: rgba(255,255,255,0.04); border: 1px solid var(--dark-border); cursor: pointer; display: flex; align-items: center; justify-content: center; color: var(--dark-muted); transition: all var(--transition); }
    .t-btn:hover { background: rgba(37,99,235,0.15); color: var(--primary-light); border-color: var(--primary); }
    .t-btn.toggle-btn:hover { background: rgba(16,185,129,0.15); color: var(--success); border-color: var(--success); }
    .t-btn .material-icons-round { font-size: 18px; }
    .modal-backdrop { position: fixed; inset: 0; background: rgba(0,0,0,0.7); display: flex; align-items: center; justify-content: center; z-index: 500; backdrop-filter: blur(6px); }
    .modal { background: var(--dark-surface); border: 1px solid var(--dark-border); border-radius: var(--radius-xl); width: 480px; max-width: 96vw; box-shadow: var(--shadow-lg); animation: slideUp 0.3s var(--ease-bounce); }
    .modal-header { display: flex; align-items: center; justify-content: space-between; padding: 20px 24px; border-bottom: 1px solid var(--dark-border); }
    .modal-header h3 { font-size: 18px; color: var(--dark-text); }
    .btn-icon-close { background: none; border: none; cursor: pointer; color: var(--dark-muted); padding: 4px; }
    .modal-body { padding: 24px; display: flex; flex-direction: column; gap: 4px; }
    .form-group { display: flex; flex-direction: column; gap: 6px; margin-bottom: 12px; }
    .form-label { font-size: 12px; font-weight: 700; color: var(--dark-muted); text-transform: uppercase; letter-spacing: 0.04em; }
    .dark-input { background: rgba(0,0,0,0.25); border: 1.5px solid var(--dark-border); color: var(--dark-text); border-radius: var(--radius); padding: 10px 12px; font-size: 14px; width: 100%; }
    .dark-input:focus { border-color: var(--primary); outline: none; }
    .modal-footer { display: flex; justify-content: flex-end; gap: 8px; padding: 16px 24px; border-top: 1px solid var(--dark-border); }
    .mini-spinner { width: 16px; height: 16px; border: 2px solid rgba(255,255,255,0.3); border-top-color: white; border-radius: 50%; animation: spin 0.7s linear infinite; display: inline-block; }
    @keyframes spin { to { transform: rotate(360deg); } }
  `]
})
export class TenantsComponent implements OnInit {
  tenants: TenantItem[] = [];
  loading = true;
  creating = false;
  showCreateForm = false;
  showAdminForm = false;
  selectedTenant: TenantItem | null = null;
  newTenant = { name: '', slug: '' };
  newAdmin = { name: '', email: '', password: '' };

  constructor(private http: HttpClient, private toast: ToastService) {}

  ngOnInit() { this.loadTenants(); }

  loadTenants() {
    this.http.get<TenantItem[]>(`${environment.apiUrl}/tenants`).subscribe({
      next: t => { this.tenants = t; this.loading = false; },
      error: () => this.loading = false
    });
  }

  createTenant() {
    if (!this.newTenant.name || !this.newTenant.slug) { this.toast.warning('Required', 'Name and slug are required.'); return; }
    this.creating = true;
    this.http.post<TenantItem>(`${environment.apiUrl}/tenants`, this.newTenant).subscribe({
      next: t => { this.tenants = [t, ...this.tenants]; this.creating = false; this.showCreateForm = false; this.newTenant = { name: '', slug: '' }; this.toast.success('Cafe created!'); },
      error: err => { this.creating = false; this.toast.error('Failed', err?.error?.message); }
    });
  }

  openAdminForm(t: TenantItem) { this.selectedTenant = t; this.newAdmin = { name: '', email: '', password: '' }; this.showAdminForm = true; }

  createAdmin() {
    if (!this.newAdmin.email || !this.newAdmin.password || !this.selectedTenant) { this.toast.warning('Required', 'Email and password are required.'); return; }
    this.creating = true;
    this.http.post(`${environment.apiUrl}/tenants/${this.selectedTenant.id}/admin`, this.newAdmin).subscribe({
      next: () => { this.creating = false; this.showAdminForm = false; this.toast.success('Admin created!', `${this.newAdmin.email} can now login.`); },
      error: err => { this.creating = false; this.toast.error('Failed', err?.error?.message); }
    });
  }

  toggleTenant(t: TenantItem) {
    this.http.patch<{ isActive: boolean }>(`${environment.apiUrl}/tenants/${t.id}/toggle`, {}).subscribe({
      next: res => { t.isActive = res.isActive; this.toast.success(`${t.name} ${res.isActive ? 'activated' : 'deactivated'}`); },
      error: () => this.toast.error('Toggle failed')
    });
  }
}
