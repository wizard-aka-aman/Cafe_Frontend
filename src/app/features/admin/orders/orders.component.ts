import { Component, OnInit, OnDestroy } from '@angular/core';
import { DatePipe, NgClass } from '@angular/common';
import { Subscription } from 'rxjs';
import { OrderService } from '../../../core/services/order.service';
import { SignalrService, OrderNotification, StatusNotification } from '../../../core/services/signalr.service';
import { ToastService } from '../../../core/services/toast.service';
import { Order, OrderStatus } from '../../../core/models/models';

@Component({
  selector: 'app-orders',
  standalone: true,
  imports: [DatePipe, NgClass],
  template: `
    <div class="orders-page">
      <div class="page-header">
        <div>
          <h1 class="page-title">Live Orders</h1>
          <p class="page-sub">Real-time order management</p>
        </div>
        <div class="header-actions">
          <button class="btn btn-ghost filter-btn" [ngClass]="{ active: activeOnly }"
            (click)="activeOnly = !activeOnly; loadOrders()" id="filter-active">
            <span class="material-icons-round">filter_list</span>
            {{ activeOnly ? 'Active Only' : 'All Orders' }}
          </button>
          <button class="btn btn-outline-light" (click)="loadOrders()" id="refresh-orders">
            <span class="material-icons-round">refresh</span> Refresh
          </button>
        </div>
      </div>

      @if (loading) {
        <div class="loading-overlay" style="min-height:300px">
          <div class="spinner" style="border-top-color:var(--primary-light)"></div>
        </div>
      } @else {
        <!-- Orders Stats -->
        <div class="order-stats">
          @for (s of statusStats; track s.label) {
            <div class="ostat">
              <div class="ostat-count">{{ s.count }}</div>
              <div class="ostat-label">{{ s.label }}</div>
            </div>
          }
        </div>

        <!-- Orders Table -->
        @if (orders.length === 0) {
          <div class="empty-state">
            <span class="material-icons-round">receipt_long</span>
            <h3>No orders yet</h3>
            <p>Orders will appear here when customers place them.</p>
          </div>
        } @else {
          <div class="orders-grid">
            @for (order of orders; track order.id) {
              <div class="order-card" [ngClass]="'status-bg-' + order.status"
                [class.new-flash]="newOrderIds.has(order.id)">
                <div class="order-card-header">
                  <div class="order-table-badge">
                    <span class="material-icons-round">table_restaurant</span>
                    Table {{ order.tableNumber }}
                  </div>
                  <span class="badge" [ngClass]="'status-' + order.status">{{ order.status }}</span>
                </div>

                <div class="order-items-list">
                  @for (item of order.items; track item.id) {
                    <div class="order-item-row">
                      <span class="oi-name">{{ item.displayName }}</span>
                      <span class="oi-qty">×{{ item.quantity }}</span>
                      <span class="oi-price">₹{{ item.totalPrice }}</span>
                    </div>
                  }
                </div>

                @if (order.notes) {
                  <div class="order-notes">
                    <span class="material-icons-round">sticky_note_2</span>
                    {{ order.notes }}
                  </div>
                }

                <div class="order-card-footer">
                  <div class="order-meta">
                    <span class="order-total">₹{{ order.totalAmount }}</span>
                    <span class="order-time">{{ order.createdAt | date:'hh:mm a' }}</span>
                  </div>

                  <!-- Status Change Buttons -->
                  <div class="status-actions">
                    @if (order.status === 'Pending') {
                      <button class="btn status-btn preparing" (click)="updateStatus(order, 'Preparing')" [id]="'preparing-' + order.id">
                        <span class="material-icons-round">soup_kitchen</span> Start
                      </button>
                      <button class="btn status-btn cancel" (click)="updateStatus(order, 'Cancelled')" [id]="'cancel-' + order.id">
                        <span class="material-icons-round">close</span>
                      </button>
                    }
                    @if (order.status === 'Preparing') {
                      <button class="btn status-btn ready" (click)="updateStatus(order, 'Ready')" [id]="'ready-' + order.id">
                        <span class="material-icons-round">check_circle</span> Ready
                      </button>
                    }
                    @if (order.status === 'Ready') {
                      <button class="btn status-btn delivered" (click)="updateStatus(order, 'Delivered')" [id]="'delivered-' + order.id">
                        <span class="material-icons-round">done_all</span> Delivered
                      </button>
                    }
                  </div>
                </div>
              </div>
            }
          </div>
        }
      }
    </div>
  `,
  styles: [`
    .orders-page { padding: 28px; }
    .page-header { display: flex; align-items: center; justify-content: space-between; margin-bottom: 24px; flex-wrap: wrap; gap: 12px; }
    .page-title { font-size: 26px; color: var(--dark-text); }
    .page-sub { color: var(--dark-muted); font-size: 14px; margin-top: 2px; }
    .header-actions { display: flex; gap: 8px; }
    .btn-ghost, .btn-outline-light {
      color: var(--dark-muted); background: transparent;
      border: 1px solid var(--dark-border); border-radius: var(--radius);
      padding: 8px 16px; font-size: 13px; font-weight: 600; display: flex; align-items: center; gap: 6px;
      cursor: pointer; transition: all var(--transition);
    }
    .btn-ghost:hover, .btn-outline-light:hover {
      background: rgba(255,255,255,0.06); color: var(--dark-text);
    }
    .btn-ghost.active { background: rgba(37,99,235,0.15); color: var(--primary-light); border-color: var(--primary); }

    .order-stats {
      display: flex; gap: 12px; margin-bottom: 24px; flex-wrap: wrap;
    }
    .ostat {
      background: var(--dark-surface); border: 1px solid var(--dark-border);
      border-radius: var(--radius-lg); padding: 14px 20px; text-align: center; min-width: 90px;
    }
    .ostat-count { font-size: 24px; font-weight: 800; color: var(--dark-text); font-family: var(--font-display); }
    .ostat-label { font-size: 11px; color: var(--dark-muted); text-transform: uppercase; font-weight: 600; margin-top: 2px; }

    .empty-state {
      display: flex; flex-direction: column; align-items: center; justify-content: center;
      min-height: 300px; gap: 12px; color: var(--dark-muted); text-align: center;
    }
    .empty-state .material-icons-round { font-size: 64px; color: rgba(255,255,255,0.08); }
    .empty-state h3 { color: var(--dark-text); }

    .orders-grid {
      display: grid; grid-template-columns: repeat(auto-fill, minmax(300px, 1fr)); gap: 16px;
    }

    .order-card {
      background: var(--dark-surface); border: 1px solid var(--dark-border);
      border-radius: var(--radius-lg); padding: 0; overflow: hidden;
      transition: all var(--transition-md);
    }
    .order-card:hover { border-color: rgba(59,130,246,0.3); }
    .order-card.new-flash { animation: newOrderFlash 1s ease 3; }
    @keyframes newOrderFlash {
      0%,100% { border-color: var(--dark-border); }
      50% { border-color: var(--accent); box-shadow: 0 0 20px rgba(245,158,11,0.3); }
    }

    .status-bg-Pending   .order-card-header { border-bottom: 2px solid #F59E0B; }
    .status-bg-Preparing .order-card-header { border-bottom: 2px solid var(--primary); }
    .status-bg-Ready     .order-card-header { border-bottom: 2px solid var(--success); }
    .status-bg-Delivered .order-card-header { opacity: 0.7; }
    .status-bg-Cancelled .order-card-header { border-bottom: 2px solid var(--danger); opacity: 0.6; }

    .order-card-header {
      display: flex; align-items: center; justify-content: space-between;
      padding: 14px 16px;
    }
    .order-table-badge {
      display: flex; align-items: center; gap: 6px;
      font-weight: 700; font-size: 15px; color: var(--dark-text);
    }
    .order-table-badge .material-icons-round { color: var(--accent); font-size: 18px; }

    .order-items-list { padding: 12px 16px; border-bottom: 1px solid var(--dark-border); }
    .order-item-row { display: flex; align-items: center; gap: 8px; padding: 4px 0; }
    .oi-name { flex: 1; font-size: 13px; color: var(--dark-text); }
    .oi-qty { font-size: 12px; color: var(--dark-muted); }
    .oi-price { font-size: 13px; font-weight: 700; color: var(--primary-light); }

    .order-notes {
      display: flex; align-items: flex-start; gap: 6px; padding: 8px 16px;
      background: rgba(245,158,11,0.05); font-size: 12px; color: var(--dark-muted);
    }
    .order-notes .material-icons-round { font-size: 14px; color: var(--accent); }

    .order-card-footer { padding: 12px 16px; display: flex; align-items: center; justify-content: space-between; }
    .order-meta { display: flex; flex-direction: column; gap: 2px; }
    .order-total { font-size: 18px; font-weight: 800; color: var(--dark-text); font-family: var(--font-display); }
    .order-time { font-size: 12px; color: var(--dark-muted); }

    .status-actions { display: flex; gap: 6px; }
    .status-btn {
      display: flex; align-items: center; gap: 4px; padding: 6px 12px;
      border-radius: var(--radius); font-size: 12px; font-weight: 700; cursor: pointer;
      border: none; transition: all var(--transition);
    }
    .status-btn .material-icons-round { font-size: 15px; }
    .status-btn.preparing { background: rgba(37,99,235,0.2); color: var(--primary-light); }
    .status-btn.preparing:hover { background: rgba(37,99,235,0.4); }
    .status-btn.ready { background: rgba(16,185,129,0.2); color: var(--success); }
    .status-btn.ready:hover { background: rgba(16,185,129,0.4); }
    .status-btn.delivered { background: rgba(16,185,129,0.15); color: var(--success); }
    .status-btn.delivered:hover { background: rgba(16,185,129,0.35); }
    .status-btn.cancel { background: rgba(239,68,68,0.15); color: var(--danger); }
    .status-btn.cancel:hover { background: rgba(239,68,68,0.3); }

    @media (max-width: 640px) { .orders-grid { grid-template-columns: 1fr; } }
  `]
})
export class OrdersComponent implements OnInit, OnDestroy {
  orders: Order[] = [];
  loading = true;
  activeOnly = true;
  newOrderIds = new Set<string>();
  private subs: Subscription[] = [];

  get statusStats() {
    const all = this.orders;
    return [
      { label: 'Pending',   count: all.filter(o => o.status === 'Pending').length },
      { label: 'Preparing', count: all.filter(o => o.status === 'Preparing').length },
      { label: 'Ready',     count: all.filter(o => o.status === 'Ready').length },
      { label: 'Delivered', count: all.filter(o => o.status === 'Delivered').length },
    ];
  }

  constructor(
    private orderService: OrderService,
    private signalr: SignalrService,
    private toast: ToastService
  ) {}

  ngOnInit() {
    this.loadOrders();

    // 🔔 Real-time: add new orders at top when customer orders
    this.subs.push(this.signalr.newOrder$.subscribe((notif: OrderNotification) => {
      this.orderService.getOrder(notif.orderId).subscribe(order => {
        this.orders = [order, ...this.orders.filter(o => o.id !== order.id)];
        this.newOrderIds.add(order.id);
        setTimeout(() => this.newOrderIds.delete(order.id), 4000);
      });
    }));

    // Real-time: update status inline
    this.subs.push(this.signalr.statusChanged$.subscribe((s: StatusNotification) => {
      const idx = this.orders.findIndex(o => o.id === s.orderId);
      if (idx !== -1) {
        this.orders[idx] = { ...this.orders[idx], status: s.newStatus as OrderStatus };
        this.orders = [...this.orders];
      }
    }));
  }

  ngOnDestroy() { this.subs.forEach(s => s.unsubscribe()); }

  loadOrders() {
    this.loading = true;
    this.orderService.getOrders(this.activeOnly).subscribe({
      next: orders => { this.orders = orders; this.loading = false; },
      error: () => { this.loading = false; }
    });
  }

  updateStatus(order: Order, status: string) {
    this.orderService.updateStatus(order.id, status).subscribe({
      next: () => {
        this.toast.success(`Order updated`, `Table ${order.tableNumber} → ${status}`);
      },
      error: () => this.toast.error('Update failed')
    });
  }
}
