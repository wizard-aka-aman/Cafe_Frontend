import { Routes } from '@angular/router';
import { authGuard, guestGuard, superAdminGuard } from './core/guards/auth.guard';

export const routes: Routes = [
  { path: '', redirectTo: '/admin/login', pathMatch: 'full' },

  // ── Auth ──
  {
    path: 'admin/login',
    canActivate: [guestGuard],
    loadComponent: () => import('./features/auth/login/login.component').then(m => m.LoginComponent)
  },

  // ── Admin Panel ── (must be BEFORE :tenantSlug wildcard)
  {
    path: 'admin',
    canActivate: [authGuard],
    loadComponent: () => import('./features/admin/admin-shell/admin-shell.component').then(m => m.AdminShellComponent),
    children: [
      { path: '', redirectTo: 'dashboard', pathMatch: 'full' },
      { path: 'dashboard', loadComponent: () => import('./features/admin/dashboard/dashboard.component').then(m => m.DashboardComponent) },
      { path: 'orders',    loadComponent: () => import('./features/admin/orders/orders.component').then(m => m.OrdersComponent) },
      { path: 'menu',      loadComponent: () => import('./features/admin/menu-manager/menu-manager.component').then(m => m.MenuManagerComponent) },
      { path: 'settings',  loadComponent: () => import('./features/admin/settings/settings.component').then(m => m.SettingsComponent) },
      { path: 'qr-codes',  loadComponent: () => import('./features/admin/qr-codes/qr-codes.component').then(m => m.QrCodesComponent) },
      {
        path: 'tenants',
        canActivate: [superAdminGuard],
        loadComponent: () => import('./features/admin/tenants/tenants.component').then(m => m.TenantsComponent)
      },
    ]
  },

  // ── Customer Flow ── (wildcard :tenantSlug must be LAST before **)
  {
    path: ':tenantSlug',
    loadComponent: () => import('./features/customer/customer-shell/customer-shell.component').then(m => m.CustomerShellComponent),
    children: [
      { path: '', loadComponent: () => import('./features/customer/landing/landing.component').then(m => m.LandingComponent) },
      { path: 'menu', loadComponent: () => import('./features/customer/menu/menu.component').then(m => m.MenuComponent) },
      { path: 'order-status/:orderId', loadComponent: () => import('./features/customer/order-status/order-status.component').then(m => m.OrderStatusComponent) },
    ]
  },

  { path: '**', redirectTo: '/admin/login' }
];

