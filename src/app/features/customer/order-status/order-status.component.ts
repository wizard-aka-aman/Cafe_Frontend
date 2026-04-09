import { Component, OnInit, OnDestroy } from '@angular/core';
import { ActivatedRoute, Router } from '@angular/router';
import { Subscription } from 'rxjs';
import { OrderService } from '../../../core/services/order.service';
import { SignalrService, StatusNotification } from '../../../core/services/signalr.service';
import { Order, OrderStatus } from '../../../core/models/models';

@Component({
  selector: 'app-order-status',
  standalone: true,
  template: `
    <div class="status-page">
      <div class="status-nav">
        <button class="back-btn" (click)="goToMenu()" id="back-to-menu">
          <span class="material-icons-round">arrow_back</span>
        </button>
        <span class="material-icons-round nav-logo">local_cafe</span>
        <span class="nav-title">Order Status</span>
        <button class="track-orders-btn" (click)="showMyOrders = !showMyOrders" id="track-orders-btn">
          <span class="material-icons-round">receipt_long</span>
          My Orders
          @if (myOrderIds.length > 0) {
            <span class="orders-badge">{{ myOrderIds.length }}</span>
          }
        </button>
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

          <!-- Action Buttons -->
          <div class="action-btns">
            <button class="btn btn-outline btn-lg" (click)="goToMenu()" id="order-more-btn">
              <span class="material-icons-round">add_shopping_cart</span>
              Order More Items
            </button>
            @if (order.status === 'Delivered' || order.status === 'Cancelled') {
              <button class="btn btn-primary btn-lg" (click)="newOrder()" id="new-order-btn">
                <span class="material-icons-round">refresh</span>
                Place New Order
              </button>
            }
          </div>
        </div>
      }

      <!-- My Orders Drawer -->
      @if (showMyOrders) {
        <div class="orders-overlay" (click)="showMyOrders = false"></div>
        <div class="orders-drawer open">
          <div class="drawer-header">
            <h3><span class="material-icons-round">receipt_long</span> My Orders</h3>
            <button class="btn btn-ghost btn-icon" (click)="showMyOrders = false">
              <span class="material-icons-round">close</span>
            </button>
          </div>
          @if (myOrderIds.length === 0) {
            <div class="drawer-empty">
              <span class="material-icons-round">receipt</span>
              <p>No orders yet</p>
            </div>
          } @else {
            <div class="drawer-list">
              @for (oid of myOrderIds; track oid) {
                <div class="drawer-order-item" [class.active-order]="oid === currentOrderId"
                  (click)="navigateToOrder(oid)" [id]="'my-order-' + oid.slice(0,8)">
                  <span class="material-icons-round order-icon">receipt</span>
                  <div class="order-info">
                    <div class="order-id">Order #{{ oid.slice(0,8).toUpperCase() }}</div>
                    <div class="order-hint">Tap to track</div>
                  </div>
                  @if (oid === currentOrderId) {
                    <span class="current-badge">Viewing</span>
                  }
                  <span class="material-icons-round chevron">chevron_right</span>
                </div>
              }
            </div>
          }
          <div class="drawer-footer">
            <button class="btn btn-primary btn-lg" style="width:100%" (click)="goToMenu(); showMyOrders = false">
              <span class="material-icons-round">add_shopping_cart</span>
              Order More Items
            </button>
          </div>
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
    .back-btn {
      background: none; border: none; cursor: pointer; display: flex; align-items: center;
      color: var(--gray-500); padding: 4px; border-radius: var(--radius); transition: all var(--transition);
    }
    .back-btn:hover { background: var(--gray-100); color: var(--primary); }
    .nav-logo { color: var(--primary); font-size: 26px; }
    .nav-title { font-weight: 700; font-size: 17px; flex: 1; }

    .track-orders-btn {
      display: flex; align-items: center; gap: 6px; padding: 8px 14px;
      background: var(--primary); color: white; border: none; border-radius: var(--radius-full);
      font-size: 13px; font-weight: 600; cursor: pointer; position: relative;
      transition: all var(--transition);
    }
    .track-orders-btn:hover { background: var(--primary-dark); }
    .track-orders-btn .material-icons-round { font-size: 18px; }
    .orders-badge {
      position: absolute; top: -6px; right: -6px; background: var(--accent);
      color: white; font-size: 11px; font-weight: 700; padding: 2px 5px;
      border-radius: var(--radius-full); min-width: 18px; text-align: center;
    }

    .status-content { padding: 20px; max-width: 480px; margin: 0 auto; }

    .status-card {
      text-align: center; padding: 40px 24px; background: white;
      border-radius: var(--radius-xl); box-shadow: var(--shadow); margin-bottom: 24px;
      border-top: 4px solid var(--primary);
    }
    .status-card.status-Pending   { border-top-color: #F59E0B; }
    .status-card.status-Preparing { border-top-color: var(--primary); }
    .status-card.status-Ready     { border-top-color: var(--success); }
    .status-card.status-Delivered { border-top-color: var(--success); }
    .status-card.status-Cancelled { border-top-color: var(--danger); }

    .status-icon-wrap {
      width: 80px; height: 80px; border-radius: 50%; margin: 0 auto 16px;
      display: flex; align-items: center; justify-content: center;
      background: var(--primary-pale); animation: pulse 2s infinite;
    }
    .status-icon { font-size: 40px; color: var(--primary); }
    .status-card.status-Ready .status-icon-wrap, .status-card.status-Delivered .status-icon-wrap
      { background: var(--success-pale); animation: none; }
    .status-card.status-Ready .status-icon, .status-card.status-Delivered .status-icon { color: var(--success); }
    .status-card.status-Cancelled .status-icon-wrap { background: var(--danger-pale); animation: none; }
    .status-card.status-Cancelled .status-icon { color: var(--danger); }

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

    /* Action Buttons */
    .action-btns { display: flex; flex-direction: column; gap: 12px; margin-top: 16px; }
    .btn-outline {
      width: 100%; background: white; border: 2px solid var(--primary); color: var(--primary);
      font-weight: 600;
    }
    .btn-outline:hover { background: var(--primary); color: white; }

    /* My Orders Drawer */
    .orders-overlay {
      position: fixed; inset: 0; background: rgba(0,0,0,0.5); z-index: 200;
      backdrop-filter: blur(4px); animation: fadeIn 0.2s ease;
    }
    .orders-drawer {
      position: fixed; top: 0; right: 0; height: 100vh; width: 360px; max-width: 95vw;
      background: white; z-index: 201; display: flex; flex-direction: column;
      transform: translateX(100%); transition: transform 0.35s var(--ease);
      box-shadow: var(--shadow-lg);
    }
    .orders-drawer.open { transform: translateX(0); }
    .drawer-header {
      display: flex; align-items: center; justify-content: space-between;
      padding: 20px; border-bottom: 1px solid var(--gray-100);
    }
    .drawer-header h3 { display: flex; align-items: center; gap: 8px; font-size: 18px; }
    .drawer-header .material-icons-round { color: var(--primary); }
    .drawer-empty {
      flex: 1; display: flex; flex-direction: column; align-items: center;
      justify-content: center; gap: 10px; color: var(--gray-400);
    }
    .drawer-empty .material-icons-round { font-size: 48px; color: var(--gray-200); }
    .drawer-list { flex: 1; overflow-y: auto; padding: 12px; display: flex; flex-direction: column; gap: 8px; }
    .drawer-order-item {
      display: flex; align-items: center; gap: 12px; padding: 14px 16px;
      background: var(--gray-50); border-radius: var(--radius-lg); cursor: pointer;
      border: 1.5px solid transparent; transition: all var(--transition);
    }
    .drawer-order-item:hover { border-color: var(--primary); background: var(--primary-pale); }
    .drawer-order-item.active-order { border-color: var(--primary); background: var(--primary-pale); }
    .order-icon { color: var(--primary); font-size: 22px; }
    .order-info { flex: 1; }
    .order-id { font-weight: 700; font-size: 14px; color: var(--gray-800); }
    .order-hint { font-size: 12px; color: var(--gray-400); }
    .current-badge {
      font-size: 11px; font-weight: 700; background: var(--primary); color: white;
      padding: 2px 8px; border-radius: var(--radius-full);
    }
    .chevron { color: var(--gray-400); font-size: 20px; }
    .drawer-footer { padding: 16px; border-top: 1px solid var(--gray-100); }
  `]
})
export class OrderStatusComponent implements OnInit, OnDestroy {
  order: Order | null = null;
  loading = true;
  slug = '';
  currentOrderId = '';
  showMyOrders = false;
  myOrderIds: string[] = [];
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
    this.slug = this.route.parent?.snapshot.paramMap.get('tenantSlug') || sessionStorage.getItem('tenantSlug') || '';
    this.currentOrderId = this.route.snapshot.paramMap.get('orderId') || '';
    this.loadMyOrders();
    this.loadOrder(this.currentOrderId);

    // Connect SignalR for live updates
    this.signalr.connectAsCustomer(this.currentOrderId);
    this.signalrSub = this.signalr.statusChanged$.subscribe((change: StatusNotification) => {
      if (this.order && change.orderId === this.order.id) {
        this.order = { ...this.order, status: change.newStatus as OrderStatus };
      }
    });
  }

  loadOrder(id: string) {
    this.loading = true;
    this.orderService.getPublicOrder(this.slug, id).subscribe({
      next: o => { this.order = o; this.loading = false; },
      error: () => this.loading = false
    });
  }

  loadMyOrders() {
    const stored = sessionStorage.getItem(`orders_${this.slug}`);
    this.myOrderIds = stored ? JSON.parse(stored) : [];
  }

  navigateToOrder(orderId: string) {
    this.showMyOrders = false;
    this.currentOrderId = orderId;
    this.router.navigate([`/${this.slug}/order-status/${orderId}`]);
    this.loadOrder(orderId);
  }

  ngOnDestroy() {
    this.signalrSub?.unsubscribe();
    this.signalr.disconnect();
  }

  goToMenu() {
    this.router.navigate([`/${this.slug}/menu`], { queryParams: { table: this.order?.tableNumber } });
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
