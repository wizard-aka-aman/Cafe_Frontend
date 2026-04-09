import { Component, OnInit } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { HttpClient } from '@angular/common/http';
import { ToastService } from '../../../core/services/toast.service';
import { environment } from '../../../../environments/environment';

interface TenantItem { id: string; name: string; slug: string; isActive: boolean; createdAt: string; }
interface AdminItem { id: string; name: string; email: string; isActive: boolean; createdAt: string; }

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
            <div class="tenant-card" [class.inactive]="!t.isActive">
              <div class="tenant-card-main">
                <div class="tenant-avatar">{{ t.name.charAt(0).toUpperCase() }}</div>
                <div class="tenant-info">
                  <div class="tenant-name">{{ t.name }}</div>
                  <div class="tenant-slug">slug: <code>{{ t.slug }}</code></div>
                </div>
                <div class="tenant-meta">
                  <span class="badge" [class]="t.isActive ? 'badge-success' : 'badge-danger'">
                    {{ t.isActive ? 'Active' : 'Inactive' }}
                  </span>
                </div>
                <div class="tenant-actions">
                  <button class="t-btn admin-btn" (click)="openAdminsPanel(t)" [id]="'admins-' + t.id"
                    title="Manage Admins">
                    <span class="material-icons-round">manage_accounts</span>
                    <span class="admin-label">Admins</span>
                    @if (adminCounts[t.id] !== undefined) {
                      <span class="admin-count-badge">{{ adminCounts[t.id] }}</span>
                    }
                  </button>
                  <button class="t-btn toggle-btn" (click)="toggleTenant(t)" [title]="t.isActive ? 'Deactivate' : 'Activate'" [id]="'toggle-' + t.id">
                    <span class="material-icons-round">{{ t.isActive ? 'toggle_on' : 'toggle_off' }}</span>
                  </button>
                </div>
              </div>
            </div>
          }
          @if (tenants.length === 0) {
            <div class="empty-state">
              <span class="material-icons-round">store</span>
              <p>No cafes yet. Create your first one!</p>
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
            <div class="modal-title-row">
              <span class="material-icons-round modal-icon">add_business</span>
              <h3>Add New Cafe</h3>
            </div>
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

    <!-- Admins Drawer -->
    @if (showAdminsPanel && selectedTenant) {
      <div class="drawer-overlay" (click)="closeAdminsPanel()"></div>
      <div class="admins-drawer open">
        <!-- Drawer Header -->
        <div class="drawer-header">
          <div class="drawer-title">
            <div class="drawer-avatar">{{ selectedTenant.name.charAt(0).toUpperCase() }}</div>
            <div>
              <div class="drawer-name">{{ selectedTenant.name }}</div>
              <div class="drawer-sub">Admin Management</div>
            </div>
          </div>
          <button class="btn-icon-close" (click)="closeAdminsPanel()">
            <span class="material-icons-round">close</span>
          </button>
        </div>

        <!-- Admins List -->
        <div class="drawer-section-title">
          <span class="material-icons-round">people</span>
          Current Admins
          <span class="admin-total-badge">{{ tenantAdmins.length }}</span>
        </div>

        @if (adminsLoading) {
          <div class="admins-loading"><div class="spinner" style="border-top-color:var(--primary-light)"></div></div>
        } @else if (tenantAdmins.length === 0) {
          <div class="admins-empty">
            <span class="material-icons-round">person_off</span>
            <p>No admins assigned yet</p>
          </div>
        } @else {
          <div class="admins-list">
            @for (admin of tenantAdmins; track admin.id) {
              <div class="admin-row" [class.admin-inactive]="!admin.isActive" [id]="'admin-row-' + admin.id">
                <div class="admin-avatar-sm">{{ admin.name ? admin.name.charAt(0).toUpperCase() : admin.email.charAt(0).toUpperCase() }}</div>
                <div class="admin-info">
                  <div class="admin-name-text">{{ admin.name || '(No name)' }}</div>
                  <div class="admin-email">{{ admin.email }}</div>
                </div>
                <div class="admin-status">
                  <span class="badge" [class]="admin.isActive ? 'badge-success-sm' : 'badge-danger-sm'">
                    {{ admin.isActive ? 'Active' : 'Inactive' }}
                  </span>
                </div>
                <div class="admin-row-actions">
                  <button class="admin-action-btn toggle" (click)="toggleAdmin(admin)"
                    [title]="admin.isActive ? 'Deactivate' : 'Activate'" [id]="'toggle-admin-' + admin.id">
                    <span class="material-icons-round">{{ admin.isActive ? 'person_off' : 'person' }}</span>
                  </button>
                  <button class="admin-action-btn danger" (click)="confirmDeleteAdmin(admin)"
                    title="Delete Admin" [id]="'delete-admin-' + admin.id">
                    <span class="material-icons-round">delete</span>
                  </button>
                </div>
              </div>
            }
          </div>
        }

        <!-- Add Admin Form -->
        <div class="add-admin-section">
          <button class="add-admin-toggle" (click)="showAddAdminForm = !showAddAdminForm" id="toggle-add-admin-form">
            <span class="material-icons-round">{{ showAddAdminForm ? 'remove_circle_outline' : 'person_add' }}</span>
            {{ showAddAdminForm ? 'Cancel' : 'Add New Admin' }}
          </button>

          @if (showAddAdminForm) {
            <div class="add-admin-form">
              <div class="form-group">
                <label class="form-label">Full Name</label>
                <input class="dark-input" [(ngModel)]="newAdmin.name" placeholder="John Doe" id="new-admin-name">
              </div>
              <div class="form-group">
                <label class="form-label">Email *</label>
                <input class="dark-input" type="email" [(ngModel)]="newAdmin.email" placeholder="admin@cafe.com" id="new-admin-email">
              </div>
              <div class="form-group">
                <label class="form-label">Password *</label>
                <input class="dark-input" type="password" [(ngModel)]="newAdmin.password" placeholder="••••••••" id="new-admin-pass">
              </div>
              <button class="hdr-btn primary" style="width:100%" (click)="createAdmin()" [disabled]="creating" id="confirm-add-admin">
                @if (creating) { <span class="mini-spinner"></span> } Create Admin
              </button>
            </div>
          }
        </div>
      </div>
    }

    <!-- Delete Confirm Modal -->
    @if (adminToDelete) {
      <div class="modal-backdrop" (click)="adminToDelete = null">
        <div class="modal confirm-modal" (click)="$event.stopPropagation()">
          <div class="modal-header">
            <div class="modal-title-row">
              <span class="material-icons-round modal-icon danger-icon">warning</span>
              <h3>Remove Admin</h3>
            </div>
          </div>
          <div class="modal-body">
            <p class="confirm-text">
              Are you sure you want to remove <strong>{{ adminToDelete.name || adminToDelete.email }}</strong>?<br>
              <span style="color:var(--dark-muted);font-size:13px">This will permanently delete their account and revoke access.</span>
            </p>
          </div>
          <div class="modal-footer">
            <button class="hdr-btn outline" (click)="adminToDelete = null">Cancel</button>
            <button class="hdr-btn danger" (click)="deleteAdmin()" [disabled]="deleting" id="confirm-delete-admin">
              @if (deleting) { <span class="mini-spinner"></span> } Remove Admin
            </button>
          </div>
        </div>
      </div>
    }
  `,
  styles: [`
    .page { padding: 28px; }
    .page-header { display: flex; align-items: center; justify-content: space-between; margin-bottom: 28px; flex-wrap: wrap; gap: 12px; }
    .page-title { font-size: 26px; color: var(--dark-text); font-weight: 800; }
    .page-sub { color: var(--dark-muted); font-size: 14px; margin-top: 2px; }

    /* Header Buttons */
    .hdr-btn { display: inline-flex; align-items: center; gap: 6px; padding: 10px 18px; border-radius: var(--radius); font-size: 13px; font-weight: 600; cursor: pointer; border: none; transition: all var(--transition); }
    .hdr-btn.primary { background: linear-gradient(135deg, var(--primary), var(--primary-dark)); color: white; }
    .hdr-btn.primary:hover { transform: translateY(-1px); box-shadow: 0 4px 16px rgba(37,99,235,0.35); }
    .hdr-btn.outline { background: transparent; color: var(--dark-muted); border: 1.5px solid var(--dark-border); }
    .hdr-btn.outline:hover { background: rgba(255,255,255,0.06); color: var(--dark-text); }
    .hdr-btn.danger { background: linear-gradient(135deg, #ef4444, #dc2626); color: white; }
    .hdr-btn.danger:hover { transform: translateY(-1px); }
    .hdr-btn:disabled { opacity: 0.5; cursor: not-allowed; transform: none !important; }

    /* Tenant List */
    .loading-center { display: flex; justify-content: center; padding: 80px; }
    .tenants-list { display: flex; flex-direction: column; gap: 12px; }
    .tenant-card {
      background: var(--dark-surface); border: 1px solid var(--dark-border);
      border-radius: var(--radius-lg); overflow: hidden; transition: all var(--transition-md);
    }
    .tenant-card:hover { border-color: rgba(59,130,246,0.35); box-shadow: 0 4px 20px rgba(0,0,0,0.2); }
    .tenant-card.inactive { opacity: 0.6; }
    .tenant-card-main { display: flex; align-items: center; gap: 16px; padding: 16px 20px; }

    .tenant-avatar {
      width: 46px; height: 46px; border-radius: var(--radius); flex-shrink: 0;
      background: linear-gradient(135deg, var(--primary), var(--primary-dark));
      display: flex; align-items: center; justify-content: center;
      font-size: 20px; font-weight: 700; color: white;
    }
    .tenant-info { flex: 1; min-width: 0; }
    .tenant-name { font-size: 16px; font-weight: 700; color: var(--dark-text); white-space: nowrap; overflow: hidden; text-overflow: ellipsis; }
    .tenant-slug { font-size: 12px; color: var(--dark-muted); margin-top: 2px; }
    .tenant-slug code { font-family: monospace; color: var(--accent); }
    .tenant-meta { display: flex; align-items: center; gap: 8px; }

    .tenant-actions { display: flex; gap: 8px; align-items: center; }
    .t-btn {
      height: 36px; border-radius: var(--radius); background: rgba(255,255,255,0.04);
      border: 1px solid var(--dark-border); cursor: pointer;
      display: flex; align-items: center; justify-content: center; gap: 6px;
      color: var(--dark-muted); transition: all var(--transition); padding: 0 10px; font-size: 12px; font-weight: 600;
    }
    .t-btn .material-icons-round { font-size: 18px; }
    .t-btn.admin-btn { padding: 0 12px; color: var(--primary-light); border-color: rgba(59,130,246,0.3); background: rgba(59,130,246,0.08); }
    .t-btn.admin-btn:hover { background: rgba(59,130,246,0.2); border-color: var(--primary); color: white; }
    .admin-label { font-size: 12px; font-weight: 600; }
    .admin-count-badge {
      background: var(--primary); color: white; border-radius: var(--radius-full);
      font-size: 11px; font-weight: 700; padding: 1px 7px; min-width: 20px; text-align: center;
    }
    .t-btn.toggle-btn:hover { background: rgba(16,185,129,0.15); color: var(--success); border-color: var(--success); }

    .empty-state { text-align: center; padding: 60px 20px; color: var(--dark-muted); }
    .empty-state .material-icons-round { font-size: 52px; opacity: 0.3; margin-bottom: 12px; display: block; }

    /* Modals */
    .modal-backdrop { position: fixed; inset: 0; background: rgba(0,0,0,0.7); display: flex; align-items: center; justify-content: center; z-index: 500; backdrop-filter: blur(6px); }
    .modal { background: var(--dark-surface); border: 1px solid var(--dark-border); border-radius: var(--radius-xl); width: 480px; max-width: 96vw; box-shadow: var(--shadow-lg); animation: slideUp 0.3s var(--ease-bounce); }
    .confirm-modal { width: 420px; }
    .modal-header { display: flex; align-items: center; justify-content: space-between; padding: 20px 24px; border-bottom: 1px solid var(--dark-border); }
    .modal-title-row { display: flex; align-items: center; gap: 12px; }
    .modal-icon { color: var(--primary-light); }
    .danger-icon { color: #f87171 !important; }
    .modal-header h3 { font-size: 18px; color: var(--dark-text); }
    .btn-icon-close { background: none; border: none; cursor: pointer; color: var(--dark-muted); padding: 4px; border-radius: var(--radius); transition: all var(--transition); }
    .btn-icon-close:hover { color: var(--dark-text); background: rgba(255,255,255,0.08); }
    .modal-body { padding: 24px; }
    .confirm-text { color: var(--dark-text); font-size: 15px; line-height: 1.6; }
    .form-group { display: flex; flex-direction: column; gap: 6px; margin-bottom: 14px; }
    .form-label { font-size: 11px; font-weight: 700; color: var(--dark-muted); text-transform: uppercase; letter-spacing: 0.05em; }
    .dark-input { background: rgba(0,0,0,0.3); border: 1.5px solid var(--dark-border); color: var(--dark-text); border-radius: var(--radius); padding: 10px 12px; font-size: 14px; width: 100%; box-sizing: border-box; }
    .dark-input:focus { border-color: var(--primary); outline: none; box-shadow: 0 0 0 3px rgba(59,130,246,0.15); }
    .modal-footer { display: flex; justify-content: flex-end; gap: 8px; padding: 16px 24px; border-top: 1px solid var(--dark-border); }

    /* Admins Drawer */
    .drawer-overlay { position: fixed; inset: 0; background: rgba(0,0,0,0.6); z-index: 300; backdrop-filter: blur(4px); animation: fadeIn 0.2s ease; }
    .admins-drawer {
      position: fixed; top: 0; right: 0; height: 100vh; width: 420px; max-width: 96vw;
      background: var(--dark-surface); border-left: 1px solid var(--dark-border);
      z-index: 301; display: flex; flex-direction: column; box-shadow: -8px 0 40px rgba(0,0,0,0.4);
      transform: translateX(100%); transition: transform 0.35s cubic-bezier(0.4,0,0.2,1);
      overflow-y: auto;
    }
    .admins-drawer.open { transform: translateX(0); }

    .drawer-header {
      display: flex; align-items: center; justify-content: space-between;
      padding: 20px 24px; border-bottom: 1px solid var(--dark-border);
      background: linear-gradient(135deg, rgba(37,99,235,0.1), rgba(124,58,237,0.1));
      position: sticky; top: 0; z-index: 1;
    }
    .drawer-title { display: flex; align-items: center; gap: 14px; }
    .drawer-avatar {
      width: 44px; height: 44px; border-radius: var(--radius); flex-shrink: 0;
      background: linear-gradient(135deg, var(--primary), var(--primary-dark));
      display: flex; align-items: center; justify-content: center;
      font-size: 20px; font-weight: 700; color: white;
    }
    .drawer-name { font-size: 16px; font-weight: 700; color: var(--dark-text); }
    .drawer-sub { font-size: 12px; color: var(--dark-muted); margin-top: 2px; }

    .drawer-section-title {
      display: flex; align-items: center; gap: 8px; padding: 16px 24px 8px;
      font-size: 12px; font-weight: 700; color: var(--dark-muted); text-transform: uppercase; letter-spacing: 0.05em;
    }
    .drawer-section-title .material-icons-round { font-size: 16px; color: var(--primary-light); }
    .admin-total-badge {
      background: rgba(37,99,235,0.2); color: var(--primary-light); border-radius: var(--radius-full);
      font-size: 11px; font-weight: 700; padding: 1px 8px;
    }

    .admins-loading { display: flex; justify-content: center; padding: 32px; }
    .admins-empty { display: flex; flex-direction: column; align-items: center; padding: 32px 24px; gap: 8px; color: var(--dark-muted); }
    .admins-empty .material-icons-round { font-size: 40px; opacity: 0.3; }

    .admins-list { padding: 8px 16px; display: flex; flex-direction: column; gap: 8px; }
    .admin-row {
      display: flex; align-items: center; gap: 12px; padding: 12px 14px;
      background: rgba(255,255,255,0.03); border: 1px solid var(--dark-border);
      border-radius: var(--radius-lg); transition: all var(--transition);
    }
    .admin-row:hover { background: rgba(255,255,255,0.06); border-color: rgba(59,130,246,0.2); }
    .admin-row.admin-inactive { opacity: 0.55; }

    .admin-avatar-sm {
      width: 36px; height: 36px; border-radius: 50%; flex-shrink: 0;
      background: linear-gradient(135deg, #7c3aed, #6d28d9);
      display: flex; align-items: center; justify-content: center;
      font-size: 14px; font-weight: 700; color: white;
    }
    .admin-info { flex: 1; min-width: 0; }
    .admin-name-text { font-size: 14px; font-weight: 600; color: var(--dark-text); white-space: nowrap; overflow: hidden; text-overflow: ellipsis; }
    .admin-email { font-size: 12px; color: var(--dark-muted); white-space: nowrap; overflow: hidden; text-overflow: ellipsis; }

    .badge-success-sm { background: rgba(16,185,129,0.15); color: #34d399; border: 1px solid rgba(16,185,129,0.3); font-size: 10px; padding: 2px 7px; border-radius: var(--radius-full); font-weight: 700; }
    .badge-danger-sm  { background: rgba(239,68,68,0.15); color: #f87171; border: 1px solid rgba(239,68,68,0.3); font-size: 10px; padding: 2px 7px; border-radius: var(--radius-full); font-weight: 700; }

    .admin-row-actions { display: flex; gap: 4px; flex-shrink: 0; }
    .admin-action-btn {
      width: 30px; height: 30px; border-radius: var(--radius); border: 1px solid var(--dark-border);
      background: rgba(255,255,255,0.04); cursor: pointer; display: flex; align-items: center;
      justify-content: center; color: var(--dark-muted); transition: all var(--transition);
    }
    .admin-action-btn .material-icons-round { font-size: 15px; }
    .admin-action-btn.toggle:hover { background: rgba(59,130,246,0.15); color: var(--primary-light); border-color: var(--primary); }
    .admin-action-btn.danger:hover { background: rgba(239,68,68,0.15); color: #f87171; border-color: #ef4444; }

    /* Add Admin Section */
    .add-admin-section { padding: 16px; border-top: 1px solid var(--dark-border); margin-top: auto; }
    .add-admin-toggle {
      width: 100%; padding: 10px; background: rgba(37,99,235,0.08); border: 1.5px dashed rgba(59,130,246,0.35);
      color: var(--primary-light); border-radius: var(--radius-lg); cursor: pointer;
      display: flex; align-items: center; justify-content: center; gap: 8px;
      font-size: 13px; font-weight: 600; transition: all var(--transition);
    }
    .add-admin-toggle:hover { background: rgba(37,99,235,0.15); border-color: var(--primary); }
    .add-admin-form {
      margin-top: 16px; padding: 20px; background: rgba(0,0,0,0.2);
      border-radius: var(--radius-lg); border: 1px solid var(--dark-border);
      animation: slideUp 0.2s ease;
    }

    .mini-spinner { width: 16px; height: 16px; border: 2px solid rgba(255,255,255,0.3); border-top-color: white; border-radius: 50%; animation: spin 0.7s linear infinite; display: inline-block; }
    @keyframes spin { to { transform: rotate(360deg); } }
    @keyframes slideUp { from { opacity: 0; transform: translateY(16px); } to { opacity: 1; transform: translateY(0); } }
    @keyframes fadeIn { from { opacity: 0; } to { opacity: 1; } }
  `]
})
export class TenantsComponent implements OnInit {
  tenants: TenantItem[] = [];
  tenantAdmins: AdminItem[] = [];
  adminCounts: Record<string, number> = {};
  loading = true;
  adminsLoading = false;
  creating = false;
  deleting = false;
  showCreateForm = false;
  showAdminsPanel = false;
  showAddAdminForm = false;
  selectedTenant: TenantItem | null = null;
  adminToDelete: AdminItem | null = null;
  newTenant = { name: '', slug: '' };
  newAdmin = { name: '', email: '', password: '' };

  private readonly api = environment.apiUrl;

  constructor(private http: HttpClient, private toast: ToastService) {}

  ngOnInit() { this.loadTenants(); }

  loadTenants() {
    this.http.get<TenantItem[]>(`${this.api}/tenants`).subscribe({
      next: t => {
        this.tenants = t;
        this.loading = false;
        // Load admin counts for each tenant
        t.forEach(tenant => this.loadAdminCount(tenant.id));
      },
      error: () => this.loading = false
    });
  }

  loadAdminCount(tenantId: string) {
    this.http.get<AdminItem[]>(`${this.api}/tenants/${tenantId}/admins`).subscribe({
      next: admins => { this.adminCounts[tenantId] = admins.length; }
    });
  }

  createTenant() {
    if (!this.newTenant.name || !this.newTenant.slug) { this.toast.warning('Required', 'Name and slug are required.'); return; }
    this.creating = true;
    this.http.post<TenantItem>(`${this.api}/tenants`, this.newTenant).subscribe({
      next: t => {
        this.tenants = [t, ...this.tenants];
        this.adminCounts[t.id] = 0;
        this.creating = false;
        this.showCreateForm = false;
        this.newTenant = { name: '', slug: '' };
        this.toast.success('Cafe created!', `${t.name} is ready.`);
      },
      error: err => { this.creating = false; this.toast.error('Failed', err?.error?.message); }
    });
  }

  openAdminsPanel(t: TenantItem) {
    this.selectedTenant = t;
    this.showAdminsPanel = true;
    this.showAddAdminForm = false;
    this.newAdmin = { name: '', email: '', password: '' };
    this.loadAdmins(t.id);
  }

  closeAdminsPanel() {
    this.showAdminsPanel = false;
    this.selectedTenant = null;
    this.tenantAdmins = [];
  }

  loadAdmins(tenantId: string) {
    this.adminsLoading = true;
    this.http.get<AdminItem[]>(`${this.api}/tenants/${tenantId}/admins`).subscribe({
      next: admins => {
        this.tenantAdmins = admins;
        this.adminCounts[tenantId] = admins.length;
        this.adminsLoading = false;
      },
      error: () => this.adminsLoading = false
    });
  }

  createAdmin() {
    if (!this.newAdmin.email || !this.newAdmin.password || !this.selectedTenant) {
      this.toast.warning('Required', 'Email and password are required.');
      return;
    }
    this.creating = true;
    this.http.post<AdminItem>(`${this.api}/tenants/${this.selectedTenant.id}/admin`, this.newAdmin).subscribe({
      next: admin => {
        this.tenantAdmins = [admin, ...this.tenantAdmins];
        this.adminCounts[this.selectedTenant!.id] = this.tenantAdmins.length;
        this.creating = false;
        this.showAddAdminForm = false;
        this.newAdmin = { name: '', email: '', password: '' };
        this.toast.success('Admin created!', `${admin.email} can now login.`);
      },
      error: err => { this.creating = false; this.toast.error('Failed', err?.error?.message); }
    });
  }

  toggleAdmin(admin: AdminItem) {
    if (!this.selectedTenant) return;
    this.http.patch<{ isActive: boolean }>(`${this.api}/tenants/${this.selectedTenant.id}/admins/${admin.id}/toggle`, {}).subscribe({
      next: res => {
        admin.isActive = res.isActive;
        this.toast.success(`Admin ${res.isActive ? 'activated' : 'deactivated'}`);
      },
      error: () => this.toast.error('Toggle failed')
    });
  }

  confirmDeleteAdmin(admin: AdminItem) {
    this.adminToDelete = admin;
  }

  deleteAdmin() {
    if (!this.adminToDelete || !this.selectedTenant) return;
    this.deleting = true;
    this.http.delete(`${this.api}/tenants/${this.selectedTenant.id}/admins/${this.adminToDelete.id}`).subscribe({
      next: () => {
        this.tenantAdmins = this.tenantAdmins.filter(a => a.id !== this.adminToDelete!.id);
        this.adminCounts[this.selectedTenant!.id] = this.tenantAdmins.length;
        this.toast.success('Admin removed', `${this.adminToDelete!.email} has been removed.`);
        this.adminToDelete = null;
        this.deleting = false;
      },
      error: () => { this.deleting = false; this.toast.error('Delete failed'); }
    });
  }

  toggleTenant(t: TenantItem) {
    this.http.patch<{ isActive: boolean }>(`${this.api}/tenants/${t.id}/toggle`, {}).subscribe({
      next: res => { t.isActive = res.isActive; this.toast.success(`${t.name} ${res.isActive ? 'activated' : 'deactivated'}`); },
      error: () => this.toast.error('Toggle failed')
    });
  }
}
