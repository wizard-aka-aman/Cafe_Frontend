import { Component, OnInit, OnDestroy } from '@angular/core';
import { Router, RouterLink, RouterLinkActive, RouterOutlet } from '@angular/router';
import { AsyncPipe, NgClass } from '@angular/common';
import { Subscription } from 'rxjs';
import { AuthService } from '../../../core/services/auth.service';
import { SignalrService, OrderNotification } from '../../../core/services/signalr.service';
import { ToastService } from '../../../core/services/toast.service';
import { TenantService } from '../../../core/services/tenant.service';

@Component({
  selector: 'app-admin-shell',
  standalone: true,
  imports: [RouterOutlet, RouterLink, RouterLinkActive, AsyncPipe, NgClass],
  template: `
    <div class="admin-layout">
      <!-- Sidebar -->
      <aside class="sidebar" [ngClass]="{ collapsed: sidebarCollapsed }">
        <div class="sidebar-header">
          <div class="brand">
            <span class="material-icons-round brand-icon">local_cafe</span>
            @if (!sidebarCollapsed) { <span class="brand-name">CafeApp</span> }
          </div>
          <button class="btn btn-ghost btn-icon collapse-btn" (click)="sidebarCollapsed = !sidebarCollapsed">
            <span class="material-icons-round">{{ sidebarCollapsed ? 'menu_open' : 'menu' }}</span>
          </button>
        </div>

        @if (!sidebarCollapsed) {
          <div class="user-card">
            <div class="avatar">{{ initials }}</div>
            <div class="user-info">
              <div class="user-name">{{ (auth.currentUser$ | async)?.name }}</div>
              <div class="user-role">{{ (auth.currentUser$ | async)?.role }}</div>
            </div>
          </div>
        }

        <nav class="sidebar-nav">
          @for (item of navItems; track item.path) {
            @if (!item.superAdmin || auth.isSuperAdmin()) {
              <a [routerLink]="item.path" routerLinkActive="active"
                class="nav-item" [title]="item.label">
                <span class="material-icons-round">{{ item.icon }}</span>
                @if (!sidebarCollapsed) {
                  <span class="nav-label">{{ item.label }}</span>
                  @if (item.badge && newOrderCount > 0) {
                    <span class="nav-badge">{{ newOrderCount }}</span>
                  }
                }
              </a>
            }
          }
        </nav>

        <div class="sidebar-footer">
          <!-- SignalR status -->
          @if (!sidebarCollapsed) {
            <div class="connection-status" [ngClass]="{ connected: (signalr.isConnected$ | async) }">
              <div class="status-dot"></div>
              <span>{{ (signalr.isConnected$ | async) ? 'Live' : 'Offline' }}</span>
            </div>
          }
          <button class="nav-item logout-btn" (click)="logout()" title="Logout">
            <span class="material-icons-round">logout</span>
            @if (!sidebarCollapsed) { <span>Logout</span> }
          </button>
        </div>
      </aside>

      <!-- Main Content -->
      <main class="admin-main">
        <router-outlet />
      </main>
    </div>

    <!-- 🔔 New Order Popup Notification -->
    @if (newOrderAlert) {
      <div class="order-alert slide-up" (click)="newOrderAlert = null">
        <div class="alert-icon"><span class="material-icons-round">notifications_active</span></div>
        <div class="alert-body">
          <div class="alert-title">🍽️ New Order — Table {{ newOrderAlert.tableNumber }}</div>
          <div class="alert-sub">
            {{ newOrderAlert.itemCount }} item(s) · ₹{{ newOrderAlert.totalAmount }}
            · Est. {{ newOrderAlert.estimatedTime }} min
          </div>
          <div class="alert-items">
            @for (item of newOrderAlert.items.slice(0, 3); track item.displayName) {
              <span class="alert-chip">{{ item.displayName }} ×{{ item.quantity }}</span>
            }
          </div>
        </div>
        <button class="alert-close"><span class="material-icons-round">close</span></button>
      </div>
    }
  `,
  styles: [`
    .admin-layout { display: flex; min-height: 100vh; background: var(--dark-bg); }

    /* Sidebar */
    .sidebar {
      width: 240px; background: var(--dark-surface); display: flex; flex-direction: column;
      border-right: 1px solid var(--dark-border); flex-shrink: 0;
      transition: width 0.25s var(--ease); overflow: hidden;
    }
    .sidebar.collapsed { width: 60px; }

    .sidebar-header {
      display: flex; align-items: center; justify-content: space-between;
      padding: 18px 14px; border-bottom: 1px solid var(--dark-border);
    }
    .brand { display: flex; align-items: center; gap: 10px; overflow: hidden; }
    .brand-icon { font-size: 26px; color: var(--primary-light); flex-shrink: 0; }
    .brand-name {
      font-family: var(--font-display); font-weight: 800; font-size: 18px;
      color: var(--dark-text); white-space: nowrap;
    }
    .collapse-btn { color: var(--dark-muted) !important; }
    .collapse-btn:hover { color: var(--dark-text) !important; background: rgba(255,255,255,0.05) !important; }

    .user-card {
      display: flex; align-items: center; gap: 10px;
      padding: 14px; margin: 12px; background: rgba(255,255,255,0.04);
      border-radius: var(--radius); border: 1px solid var(--dark-border);
    }
    .avatar {
      width: 36px; height: 36px; border-radius: var(--radius);
      background: linear-gradient(135deg, var(--primary), var(--primary-dark));
      display: flex; align-items: center; justify-content: center;
      font-weight: 700; font-size: 13px; color: white; flex-shrink: 0;
    }
    .user-name { font-weight: 600; font-size: 13px; color: var(--dark-text); }
    .user-role { font-size: 11px; color: var(--dark-muted); }

    .sidebar-nav { flex: 1; padding: 8px 10px; display: flex; flex-direction: column; gap: 2px; }
    .nav-item {
      display: flex; align-items: center; gap: 10px; padding: 10px 12px;
      border-radius: var(--radius); color: var(--dark-muted); font-size: 14px; font-weight: 500;
      transition: all var(--transition); text-decoration: none; white-space: nowrap;
      cursor: pointer; background: none; border: none; width: 100%; text-align: left;
    }
    .nav-item:hover { background: rgba(255,255,255,0.06); color: var(--dark-text); }
    .nav-item.active { background: rgba(37,99,235,0.15); color: var(--primary-light); }
    .nav-item.active .material-icons-round { color: var(--primary-light); }
    .nav-item .material-icons-round { font-size: 20px; flex-shrink: 0; }
    .nav-label { flex: 1; }
    .nav-badge {
      background: var(--danger); color: white; font-size: 11px; font-weight: 700;
      padding: 2px 7px; border-radius: var(--radius-full);
    }

    .sidebar-footer { padding: 12px 10px; border-top: 1px solid var(--dark-border); }
    .connection-status {
      display: flex; align-items: center; gap: 8px; padding: 8px 12px;
      font-size: 12px; color: var(--dark-muted); margin-bottom: 4px;
    }
    .status-dot { width: 8px; height: 8px; border-radius: 50%; background: var(--danger); }
    .connection-status.connected .status-dot { background: var(--success); animation: pulse 2s infinite; }
    .connection-status.connected { color: var(--success); }
    .logout-btn { color: var(--dark-muted); }
    .logout-btn:hover { background: rgba(239,68,68,0.1) !important; color: var(--danger) !important; }

    /* Main */
    .admin-main { flex: 1; overflow-y: auto; background: var(--dark-bg); }

    /* 🔔 Order Alert */
    .order-alert {
      position: fixed; bottom: 24px; right: 24px; z-index: 9999;
      background: var(--dark-surface); border: 1px solid var(--dark-border);
      border-left: 4px solid var(--accent); border-radius: var(--radius-lg);
      padding: 16px 18px; display: flex; align-items: flex-start; gap: 14px;
      max-width: 380px; box-shadow: var(--shadow-lg); cursor: pointer;
      animation: slideInRight 0.4s var(--ease-bounce);
    }
    .alert-icon {
      width: 42px; height: 42px; border-radius: var(--radius); flex-shrink: 0;
      background: rgba(245,158,11,0.15); display: flex; align-items: center; justify-content: center;
      animation: pulse 1.5s infinite;
    }
    .alert-icon .material-icons-round { color: var(--accent); font-size: 22px; }
    .alert-body { flex: 1; }
    .alert-title { font-weight: 700; color: var(--dark-text); font-size: 15px; margin-bottom: 4px; }
    .alert-sub { font-size: 13px; color: var(--dark-muted); margin-bottom: 8px; }
    .alert-items { display: flex; flex-wrap: wrap; gap: 6px; }
    .alert-chip {
      background: rgba(255,255,255,0.06); border-radius: var(--radius-full);
      padding: 3px 10px; font-size: 12px; color: var(--dark-text);
    }
    .alert-close { background: none; border: none; color: var(--dark-muted); cursor: pointer; flex-shrink: 0; }
  `]
})
export class AdminShellComponent implements OnInit, OnDestroy {
  sidebarCollapsed = false;
  newOrderAlert: OrderNotification | null = null;
  newOrderCount = 0;
  private sub!: Subscription;

  navItems = [
    { path: '/admin/dashboard', icon: 'dashboard',      label: 'Dashboard',   badge: false },
    { path: '/admin/orders',    icon: 'receipt_long',   label: 'Orders',      badge: true  },
    { path: '/admin/menu',      icon: 'restaurant_menu',label: 'Menu',        badge: false },
    { path: '/admin/settings',  icon: 'settings',       label: 'Settings',    badge: false },
    { path: '/admin/qr-codes',  icon: 'qr_code_2',     label: 'QR Codes',    badge: false },
    { path: '/admin/tenants',   icon: 'store',          label: 'Tenants',     badge: false, superAdmin: true },
  ];

  constructor(
    public auth: AuthService,
    public signalr: SignalrService,
    private toast: ToastService,
    private router: Router,
    private tenantService: TenantService
  ) {}

  get initials(): string {
    const name = this.auth.currentUser$.value?.name || 'A';
    return name.split(' ').map(n => n[0]).join('').toUpperCase().slice(0, 2);
  }

  ngOnInit() {
    const tenantId = this.auth.getTenantId();
    if (tenantId) {
      this.signalr.connectAsAdmin(tenantId);

      // 🎨 Load settings to apply saved theme immediately
      if (!this.tenantService.getSettings()) {
        this.tenantService.loadAdminSettings().subscribe();
      }

      // 🔔 Listen for new orders from customers
      this.sub = this.signalr.newOrder$.subscribe(order => {
        this.newOrderCount++;
        this.newOrderAlert = order;

        // Auto-dismiss after 8 seconds
        setTimeout(() => {
          if (this.newOrderAlert?.orderId === order.orderId) {
            this.newOrderAlert = null;
          }
        }, 8000);

        // Also show toast
        this.toast.info(
          `🍽️ New Order — Table ${order.tableNumber}`,
          `${order.itemCount} items · ₹${order.totalAmount}`
        );
      });
    }
  }

  ngOnDestroy() {
    this.sub?.unsubscribe();
    this.signalr.disconnect();
  }

  logout() { this.auth.logout(); }
}
