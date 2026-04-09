import { Component, OnInit, OnDestroy } from '@angular/core';
import { ActivatedRoute, Router } from '@angular/router';
import { DatePipe } from '@angular/common';
import { Subscription, interval } from 'rxjs';
import { switchMap } from 'rxjs/operators';
import { OrderService } from '../../../core/services/order.service';
import { SignalrService, StatusNotification } from '../../../core/services/signalr.service';
import { Order, OrderStatus } from '../../../core/models/models';

@Component({
  selector: 'app-order-status',
  standalone: true,
  template: `
    <div class="status-page">
      <div class="status-nav">
        <span class="material-icons-round nav-logo">local_cafe</span>
        <span class="nav-title">Order Status</span>
      </div>

      @if (loading) {
        <div class="loading-overlay" style="min-height: 80vh">
          <div class="spinner"></div>
        </div>
      } @else if (order) {
        <div class="status-content slide-up">
          <!-- Status Card -->
          <div class="status-card" [class]="'status-' + order.status">
            <div class="status-icon-wrap">
              <span class="material-icons-round status-icon">{{ iconFor(order.status) }}</span>
            </div>
            <div class="status-badge badge badge-{{ badgeFor(order.status) }}">{{ order.status }}</div>
            <h2>{{ titleFor(order.status) }}</h2>
            <p class="status-desc">{{ descFor(order.status) }}</p>
          </div>

          <!-- Progress Steps -->
          <div class="progress-steps">
            @for (step of steps; track step.label) {
              <div class="step" [class.done]="isStepDone(step.status)" [class.active]="order.status === step.status">
                <div class="step-dot">
                  @if (isStepDone(step.status)) {
                    <span class="material-icons-round" style="font-size:16px">check</span>
                  }
                </div>
                <div class="step-label">{{ step.label }}</div>
              </div>
              @if (!$last) { <div class="step-line" [class.done]="isStepDone(step.status)"></div> }
            }
          </div>

          <!-- Order Details -->
          <div class="order-card card">
            <div class="card-body">
              <div class="order-meta">
                <div class="meta-item">
                  <span class="material-icons-round">table_restaurant</span>
                  <div><div class="meta-label">Table</div><div class="meta-value">{{ order.tableNumber }}</div></div>
                </div>
                <div class="meta-item">
                  <span class="material-icons-round">schedule</span>
                  <div><div class="meta-label">Est. Time</div><div class="meta-value">~{{ order.estimatedTimeMin }} min</div></div>
                </div>
                <div class="meta-item">
                  <span class="material-icons-round">receipt</span>
                  <div><div class="meta-label">Total</div><div class="meta-value">₹{{ order.totalAmount }}</div></div>
                </div>
              </div>

              <hr class="divider">

              <div class="order-items">
                <h4>Items Ordered</h4>
                @for (item of order.items; track item.id) {
                  <div class="order-line">
                    <span class="order-line-name">{{ item.displayName }}</span>
                    <span class="order-line-qty">×{{ item.quantity }}</span>
                    <span class="order-line-price">₹{{ item.totalPrice }}</span>
                  </div>
                }
              </div>
            </div>
          </div>

          <!-- New Order Button -->
          @if (order.status === 'Delivered' || order.status === 'Cancelled') {
            <button class="btn btn-primary btn-lg" style="width:100%;margin-top:16px" (click)="newOrder()">
              <span class="material-icons-round">add_shopping_cart</span>
              Place New Order
            </button>
          }
        </div>
      }
    </div>
  `,
  styles: [`
    .status-page { min-height: 100vh; background: var(--gray-50); }
    .status-nav {
      display: flex; align-items: center; gap: 12px; padding: 14px 20px;
      background: white; box-shadow: var(--shadow-sm);
    }
    .nav-logo { color: var(--primary); font-size: 26px; }
    .nav-title { font-weight: 700; font-size: 17px; }

    .status-content { padding: 20px; max-width: 480px; margin: 0 auto; }

    .status-card {
      text-align: center; padding: 40px 24px; background: white;
      border-radius: var(--radius-xl); box-shadow: var(--shadow); margin-bottom: 24px;
      border-top: 4px solid var(--primary);
    }
    .status-card.Pending   { border-top-color: #F59E0B; }
    .status-card.Preparing { border-top-color: var(--primary); }
    .status-card.Ready     { border-top-color: var(--success); }
    .status-card.Delivered { border-top-color: var(--success); }
    .status-card.Cancelled { border-top-color: var(--danger); }

    .status-icon-wrap {
      width: 80px; height: 80px; border-radius: 50%; margin: 0 auto 16px;
      display: flex; align-items: center; justify-content: center;
      background: var(--primary-pale); animation: pulse 2s infinite;
    }
    .status-icon { font-size: 40px; color: var(--primary); }
    .status-card.Ready .status-icon-wrap, .status-card.Delivered .status-icon-wrap
      { background: var(--success-pale); animation: none; }
    .status-card.Ready .status-icon, .status-card.Delivered .status-icon { color: var(--success); }
    .status-card.Cancelled .status-icon-wrap { background: var(--danger-pale); animation: none; }
    .status-card.Cancelled .status-icon { color: var(--danger); }

    .status-badge { margin: 0 auto 12px; width: fit-content; }
    .status-card h2 { font-size: 22px; margin-bottom: 8px; }
    .status-desc { color: var(--gray-400); font-size: 14px; }

    /* Progress */
    .progress-steps {
      display: flex; align-items: center; justify-content: center;
      padding: 20px; background: white; border-radius: var(--radius-lg);
      box-shadow: var(--shadow-sm); margin-bottom: 20px;
    }
    .step { display: flex; flex-direction: column; align-items: center; gap: 6px; flex: 0 0 auto; }
    .step-dot {
      width: 28px; height: 28px; border-radius: 50%; background: var(--gray-200);
      display: flex; align-items: center; justify-content: center; transition: all 0.3s;
    }
    .step.done .step-dot { background: var(--success); color: white; }
    .step.active .step-dot { background: var(--primary); color: white; box-shadow: 0 0 0 4px rgba(37,99,235,0.2); animation: pulse 1.5s infinite; }
    .step-label { font-size: 11px; font-weight: 600; color: var(--gray-400); text-align: center; max-width: 60px; }
    .step.done .step-label, .step.active .step-label { color: var(--gray-700); }
    .step-line { flex: 1; height: 2px; background: var(--gray-200); min-width: 24px; transition: background 0.3s; }
    .step-line.done { background: var(--success); }

    /* Order Card */
    .order-meta { display: flex; justify-content: space-around; gap: 16px; margin-bottom: 16px; }
    .meta-item { display: flex; align-items: center; gap: 10px; }
    .meta-item .material-icons-round { font-size: 22px; color: var(--primary); }
    .meta-label { font-size: 11px; color: var(--gray-400); font-weight: 600; text-transform: uppercase; }
    .meta-value { font-size: 16px; font-weight: 700; }
    .divider { border: none; border-top: 1px solid var(--gray-100); margin: 16px 0; }
    .order-items h4 { font-size: 14px; color: var(--gray-500); margin-bottom: 12px; }
    .order-line { display: flex; align-items: center; gap: 8px; padding: 6px 0;
      border-bottom: 1px solid var(--gray-50); }
    .order-line-name { flex: 1; font-size: 14px; font-weight: 500; }
    .order-line-qty { font-size: 13px; color: var(--gray-400); }
    .order-line-price { font-weight: 700; color: var(--primary); }
  `]
})
export class OrderStatusComponent implements OnInit, OnDestroy {
  order: Order | null = null;
  loading = true;
  slug = '';
  private signalrSub!: Subscription;

  steps = [
    { label: 'Placed', status: 'Pending' as OrderStatus },
    { label: 'Preparing', status: 'Preparing' as OrderStatus },
    { label: 'Ready', status: 'Ready' as OrderStatus },
    { label: 'Delivered', status: 'Delivered' as OrderStatus },
  ];

  constructor(
    private route: ActivatedRoute,
    private router: Router,
    private orderService: OrderService,
    private signalr: SignalrService
  ) {}

  ngOnInit() {
    this.slug = this.route.parent?.snapshot.paramMap.get('tenantSlug') || '';
    const orderId = this.route.snapshot.paramMap.get('orderId') || '';

    this.orderService.getOrder(orderId).subscribe({
      next: o => { this.order = o; this.loading = false; },
      error: () => this.loading = false
    });

    // Connect SignalR for live updates
    this.signalr.connectAsCustomer(orderId);
    this.signalrSub = this.signalr.statusChanged$.subscribe((change: StatusNotification) => {
      if (this.order && change.orderId === this.order.id) {
        this.order = { ...this.order, status: change.newStatus as OrderStatus };
      }
    });
  }

  ngOnDestroy() {
    this.signalrSub?.unsubscribe();
    this.signalr.disconnect();
  }

  iconFor(status: OrderStatus): string {
    const map: Record<string, string> = {
      Pending: 'hourglass_empty', Preparing: 'soup_kitchen',
      Ready: 'check_circle', Delivered: 'done_all', Cancelled: 'cancel'
    };
    return map[status] ?? 'info';
  }

  titleFor(status: OrderStatus): string {
    const map: Record<string, string> = {
      Pending: 'Order Received!', Preparing: 'Being Prepared 👨‍🍳',
      Ready: 'Ready to Collect! 🎉', Delivered: 'Enjoy Your Meal! 😋', Cancelled: 'Order Cancelled'
    };
    return map[status] ?? status;
  }

  descFor(status: OrderStatus): string {
    const map: Record<string, string> = {
      Pending: 'Your order has been placed and is waiting to be confirmed.',
      Preparing: 'Our chef is preparing your order.',
      Ready: 'Your order is ready! Please collect from the counter.',
      Delivered: 'Your order has been delivered. Enjoy!',
      Cancelled: 'This order was cancelled.'
    };
    return map[status] ?? '';
  }

  badgeFor(status: OrderStatus): string {
    const map: Record<string, string> = {
      Pending: 'accent', Preparing: 'primary', Ready: 'success', Delivered: 'success', Cancelled: 'danger'
    };
    return map[status] ?? 'gray';
  }

  isStepDone(status: OrderStatus): boolean {
    const order = ['Pending', 'Preparing', 'Ready', 'Delivered'];
    const currentIdx = order.indexOf(this.order?.status ?? '');
    const stepIdx = order.indexOf(status);
    return stepIdx <= currentIdx;
  }

  newOrder() {
    this.router.navigate([`/${this.slug}/menu`], { queryParams: { table: this.order?.tableNumber } });
  }
}
