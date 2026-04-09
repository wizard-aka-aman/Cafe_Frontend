import { Component, OnInit, OnDestroy } from '@angular/core';
import { ActivatedRoute, Router } from '@angular/router';
import { AsyncPipe, NgClass, CurrencyPipe, NgStyle } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { Subscription } from 'rxjs';
import { MenuService } from '../../../core/services/menu.service';
import { CartService } from '../../../core/services/cart.service';
import { OrderService } from '../../../core/services/order.service';
import { ToastService } from '../../../core/services/toast.service';
import { TenantService } from '../../../core/services/tenant.service';
import { MenuItem, CartItem, TenantSettings } from '../../../core/models/models';

@Component({
  selector: 'app-menu',
  standalone: true,
  imports: [ NgClass,  FormsModule],
  template: `
    <!-- Navbar -->
    <nav class="menu-nav">
      <div class="nav-left">
        <span class="material-icons-round nav-logo">local_cafe</span>
        <div>
          <div class="nav-title">CafeApp</div>
          <div class="nav-table">Table {{ tableNumber }}</div>
        </div>
      </div>
      <div class="nav-right">
        <div class="cart-fab" (click)="cartOpen = !cartOpen" id="cart-toggle">
          <span class="material-icons-round">shopping_cart</span>
          @if ((cartService.totalItems) > 0) {
            <span class="cart-count">{{ cartService.totalItems }}</span>
          }
        </div>
      </div>
    </nav>

    <!-- Search -->
    <div class="search-bar-wrap">
      <div class="search-bar">
        <span class="material-icons-round">search</span>
        <input [(ngModel)]="searchQuery" placeholder="Search dishes, beverages..."
          class="search-input" id="menu-search">
      </div>
    </div>

    <!-- Category Pills -->
    <div class="categories-wrap">
      <div class="categories">
        <button class="cat-pill" [ngClass]="{ active: selectedCategory === '' }"
          (click)="selectedCategory = ''" id="cat-all">All</button>
        @for (cat of categories; track cat) {
          <button class="cat-pill" [ngClass]="{ active: selectedCategory === cat }"
            (click)="selectedCategory = cat" [id]="'cat-' + cat.toLowerCase()">
            {{ cat }}
          </button>
        }
      </div>
    </div>

    <!-- Menu Grid -->
    <div class="menu-content">
      @if (loading) {
        <div class="loading-overlay">
          <div class="spinner"></div>
        </div>
      } @else {
        @for (cat of displayCategories; track cat) {
          <div class="menu-section fade-in">
            <h2 class="section-title">{{ cat }}</h2>
            <div class="menu-grid">
              @for (item of getItemsByCategory(cat); track item.id) {
                <div class="menu-card" [ngClass]="{ 'out-of-stock': !item.isAvailable }">
                  <div class="menu-card-img">
                    @if (item.imageUrl) {
                      <img [src]="item.imageUrl" [alt]="item.displayName">
                    } @else {
                      <div class="menu-card-placeholder">
                        <span class="material-icons-round">restaurant</span>
                      </div>
                    }
                    @if (!item.isAvailable) {
                      <div class="oos-overlay">Unavailable</div>
                    }
                  </div>
                  <div class="menu-card-body">
                    <div class="menu-card-info">
                      <h3 class="item-name">{{ item.displayName }}</h3>
                      <div class="item-meta">
                        <span class="material-icons-round">schedule</span>
                        {{ item.preparationTime }} min
                      </div>
                    </div>
                    <div class="menu-card-footer">
                      <div class="item-price">₹{{ item.rate }}</div>
                      @if (item.isAvailable) {
                        @if (getQty(item.id) === 0) {
                          <button class="btn btn-primary btn-sm add-btn"
                            (click)="addItem(item)" [id]="'add-' + item.id">
                            <span class="material-icons-round">add</span> Add
                          </button>
                        } @else {
                          <div class="qty-ctrl">
                            <button class="qty-btn" (click)="removeItem(item.id)" [id]="'minus-' + item.id">
                              <span class="material-icons-round">remove</span>
                            </button>
                            <span class="qty-num">{{ getQty(item.id) }}</span>
                            <button class="qty-btn qty-plus" (click)="addItem(item)" [id]="'plus-' + item.id">
                              <span class="material-icons-round">add</span>
                            </button>
                          </div>
                        }
                      }
                    </div>
                  </div>
                </div>
              }
            </div>
          </div>
        }
      }
    </div>

    <!-- Cart Sidebar/Drawer -->
    @if (cartOpen) {
      <div class="cart-overlay" (click)="cartOpen = false"></div>
    }
    <div class="cart-drawer" [ngClass]="{ open: cartOpen }">
      <div class="cart-header">
        <h3><span class="material-icons-round">shopping_cart</span> Your Order</h3>
        <button class="btn btn-ghost btn-icon" (click)="cartOpen = false">
          <span class="material-icons-round">close</span>
        </button>
      </div>

      @if (cartItems.length === 0) {
        <div class="cart-empty">
          <span class="material-icons-round">shopping_cart</span>
          <p>Your cart is empty</p>
          <small>Add delicious items from the menu!</small>
        </div>
      } @else {
        <div class="cart-items">
          @for (ci of cartItems; track ci.menuItem.id) {
            <div class="cart-item">
              <div class="cart-item-name">{{ ci.menuItem.displayName }}</div>
              <div class="cart-item-row">
                <div class="qty-ctrl sm">
                  <button class="qty-btn" (click)="cartService.remove(ci.menuItem.id)">
                    <span class="material-icons-round">remove</span>
                  </button>
                  <span class="qty-num">{{ ci.quantity }}</span>
                  <button class="qty-btn qty-plus" (click)="cartService.add(ci.menuItem)">
                    <span class="material-icons-round">add</span>
                  </button>
                </div>
                <div class="cart-item-price">₹{{ ci.menuItem.rate * ci.quantity }}</div>
              </div>
            </div>
          }
        </div>

        <div class="cart-summary">
          <div class="summary-row">
            <span>Subtotal</span>
            <span>₹{{ cartService.totalAmount }}</span>
          </div>
          <div class="summary-row muted">
            <span><span class="material-icons-round" style="font-size:14px">schedule</span> Est. time</span>
            <span>~{{ cartService.estimatedTime }} min</span>
          </div>

          @if (notes !== undefined) {
            <textarea [(ngModel)]="notes" class="notes-input"
              placeholder="Special instructions (optional)..." rows="2"></textarea>
          }

          <button class="btn btn-accent btn-lg place-order-btn"
            [disabled]="placing" (click)="placeOrder()" id="place-order-btn">
            @if (placing) {
              <span class="spinner" style="width:20px;height:20px;border-width:2px;border-top-color:white"></span>
            } @else {
              <span class="material-icons-round">check_circle</span>
            }
            {{ placing ? 'Placing...' : 'Place Order · ₹' + cartService.totalAmount }}
          </button>
        </div>
      }
    </div>

    <!-- Location Blocked Modal -->
    @if (locationBlocked) {
      <div class="modal-overlay">
        <div class="modal-card slide-up">
          <div class="modal-icon error">
            <span class="material-icons-round">location_off</span>
          </div>
          <h3>Outside Delivery Zone</h3>
          <p>You are {{ distanceKm.toFixed(1) }}km away. You must be within
            {{ settings?.orderRadiusKm }}km of the cafe to order.</p>
          <button class="btn btn-primary w-full" (click)="locationBlocked = false">Got it</button>
        </div>
      </div>
    }
  `,
  styles: [`
    /* Nav */
    .menu-nav {
      display: flex; align-items: center; justify-content: space-between;
      padding: 14px 20px; background: white; box-shadow: var(--shadow-sm);
      position: sticky; top: 0; z-index: 100;
    }
    .nav-left { display: flex; align-items: center; gap: 12px; }
    .nav-logo { font-size: 28px; color: var(--primary); }
    .nav-title { font-weight: 700; font-size: 16px; font-family: var(--font-display); color: var(--gray-800); }
    .nav-table { font-size: 12px; color: var(--gray-400); font-weight: 500; }
    .cart-fab {
      position: relative; width: 44px; height: 44px; border-radius: var(--radius);
      background: var(--primary); color: white; display: flex; align-items: center;
      justify-content: center; cursor: pointer; box-shadow: var(--shadow-primary);
      transition: all var(--transition);
    }
    .cart-fab:hover { transform: scale(1.08); }
    .cart-count {
      position: absolute; top: -6px; right: -6px; background: var(--accent);
      color: white; font-size: 11px; font-weight: 700; padding: 2px 6px;
      border-radius: var(--radius-full); min-width: 18px; text-align: center;
    }

    /* Search */
    .search-bar-wrap { padding: 16px 20px 8px; background: white; }
    .search-bar {
      display: flex; align-items: center; gap: 10px;
      background: var(--gray-50); border: 1.5px solid var(--gray-200);
      border-radius: var(--radius-full); padding: 10px 16px;
    }
    .search-bar .material-icons-round { color: var(--gray-400); font-size: 20px; }
    .search-input { flex: 1; background: none; border: none; font-size: 14px; color: var(--gray-800); }
    .search-input::placeholder { color: var(--gray-400); }

    /* Categories */
    .categories-wrap { background: white; padding: 4px 20px 16px; border-bottom: 1px solid var(--gray-100); }
    .categories { display: flex; gap: 8px; overflow-x: auto; padding-bottom: 4px; scrollbar-width: none; }
    .categories::-webkit-scrollbar { display: none; }
    .cat-pill {
      flex-shrink: 0; padding: 7px 16px; border-radius: var(--radius-full);
      font-size: 13px; font-weight: 600; background: var(--gray-100); color: var(--gray-600);
      border: none; cursor: pointer; transition: all var(--transition);
    }
    .cat-pill.active { background: var(--primary); color: white; box-shadow: var(--shadow-primary); }
    .cat-pill:hover:not(.active) { background: var(--gray-200); }

    /* Menu Content */
    .menu-content { padding: 20px; background: var(--gray-50); min-height: 60vh; }
    .menu-section { margin-bottom: 32px; }
    .section-title {
      font-size: 20px; color: var(--gray-800); margin-bottom: 16px;
      padding-bottom: 10px; border-bottom: 2px solid var(--gray-100);
    }
    .menu-grid {
      display: grid; grid-template-columns: repeat(auto-fill, minmax(280px, 1fr)); gap: 16px;
    }
    .menu-card {
      background: white; border-radius: var(--radius-lg); overflow: hidden;
      box-shadow: var(--shadow-sm); border: 1px solid var(--gray-100);
      transition: all var(--transition-md);
    }
    .menu-card:hover { transform: translateY(-4px); box-shadow: var(--shadow-md); }
    .menu-card.out-of-stock { opacity: 0.6; }

    .menu-card-img { position: relative; height: 160px; background: var(--gray-100); }
    .menu-card-img img { width: 100%; height: 100%; object-fit: cover; }
    .menu-card-placeholder {
      height: 100%; display: flex; align-items: center; justify-content: center;
      background: linear-gradient(135deg, var(--gray-100), var(--gray-200));
    }
    .menu-card-placeholder .material-icons-round { font-size: 48px; color: var(--gray-300); }
    .oos-overlay {
      position: absolute; inset: 0; background: rgba(0,0,0,0.55);
      display: flex; align-items: center; justify-content: center;
      color: white; font-weight: 700; font-size: 14px; text-transform: uppercase;
      letter-spacing: 0.1em;
    }

    .menu-card-body { padding: 14px 16px; }
    .menu-card-info { margin-bottom: 12px; }
    .item-name { font-size: 15px; font-weight: 700; color: var(--gray-800); margin-bottom: 4px; }
    .item-meta { display: flex; align-items: center; gap: 4px; font-size: 12px; color: var(--gray-400); }
    .item-meta .material-icons-round { font-size: 14px; }
    .menu-card-footer { display: flex; align-items: center; justify-content: space-between; }
    .item-price { font-size: 18px; font-weight: 800; color: var(--primary); font-family: var(--font-display); }

    .add-btn { gap: 4px; }
    .qty-ctrl {
      display: flex; align-items: center; gap: 0;
      background: var(--primary); border-radius: var(--radius-full); overflow: hidden;
    }
    .qty-ctrl.sm { transform: scale(0.9); }
    .qty-btn {
      width: 32px; height: 32px; background: var(--primary); color: white;
      border: none; cursor: pointer; display: flex; align-items: center; justify-content: center;
      transition: background var(--transition);
    }
    .qty-btn:hover { background: var(--primary-dark); }
    .qty-plus { background: var(--primary-dark); }
    .qty-btn .material-icons-round { font-size: 18px; }
    .qty-num {
      min-width: 32px; text-align: center; font-weight: 700; font-size: 14px;
      color: white; background: var(--primary);
    }

    /* Cart Drawer */
    .cart-overlay {
      position: fixed; inset: 0; background: rgba(0,0,0,0.5); z-index: 200;
      backdrop-filter: blur(4px); animation: fadeIn 0.2s ease;
    }
    .cart-drawer {
      position: fixed; top: 0; right: 0; height: 100vh; width: 380px; max-width: 95vw;
      background: white; z-index: 201; display: flex; flex-direction: column;
      transform: translateX(100%); transition: transform 0.35s var(--ease);
      box-shadow: var(--shadow-lg);
    }
    .cart-drawer.open { transform: translateX(0); }
    .cart-header {
      display: flex; align-items: center; justify-content: space-between;
      padding: 20px; border-bottom: 1px solid var(--gray-100);
    }
    .cart-header h3 { display: flex; align-items: center; gap: 8px; font-size: 18px; }
    .cart-header .material-icons-round { color: var(--primary); }
    .cart-empty {
      flex: 1; display: flex; flex-direction: column; align-items: center;
      justify-content: center; gap: 10px; color: var(--gray-400); text-align: center;
    }
    .cart-empty .material-icons-round { font-size: 64px; color: var(--gray-200); }
    .cart-empty p { font-size: 16px; font-weight: 600; color: var(--gray-500); }

    .cart-items { flex: 1; overflow-y: auto; padding: 16px 20px; display: flex; flex-direction: column; gap: 12px; }
    .cart-item { padding-bottom: 12px; border-bottom: 1px solid var(--gray-100); }
    .cart-item-name { font-weight: 600; font-size: 14px; color: var(--gray-800); margin-bottom: 8px; }
    .cart-item-row { display: flex; align-items: center; justify-content: space-between; }
    .cart-item-price { font-weight: 700; color: var(--primary); }

    .cart-summary { padding: 16px 20px; border-top: 1px solid var(--gray-100); }
    .summary-row {
      display: flex; justify-content: space-between; align-items: center;
      font-size: 14px; font-weight: 600; margin-bottom: 10px;
    }
    .summary-row.muted { color: var(--gray-400); font-weight: 500; }
    .summary-row.muted span { display: flex; align-items: center; gap: 4px; }
    .notes-input {
      width: 100%; padding: 10px 12px; border: 1.5px solid var(--gray-200);
      border-radius: var(--radius); font-size: 13px; color: var(--gray-700);
      resize: none; margin-bottom: 14px;
    }
    .place-order-btn { width: 100%; }

    /* Modal */
    .modal-overlay {
      position: fixed; inset: 0; background: rgba(0,0,0,0.6);
      display: flex; align-items: center; justify-content: center; z-index: 300;
      backdrop-filter: blur(4px);
    }
    .modal-card {
      background: white; border-radius: var(--radius-xl); padding: 36px 28px;
      max-width: 380px; width: 90%; text-align: center; box-shadow: var(--shadow-lg);
    }
    .modal-icon {
      width: 72px; height: 72px; border-radius: 50%; margin: 0 auto 20px;
      display: flex; align-items: center; justify-content: center;
    }
    .modal-icon.error { background: var(--danger-pale); }
    .modal-icon.error .material-icons-round { font-size: 36px; color: var(--danger); }
    .modal-card h3 { font-size: 22px; margin-bottom: 10px; }
    .modal-card p { color: var(--gray-500); margin-bottom: 24px; line-height: 1.6; }

    @media (max-width: 640px) {
      .menu-grid { grid-template-columns: 1fr; }
    }
  `]
})
export class MenuComponent implements OnInit, OnDestroy {
  menuItems: MenuItem[] = [];
  cartItems: CartItem[] = [];
  cartOpen = false;
  loading = true;
  placing = false;
  locationBlocked = false;
  distanceKm = 0;
  searchQuery = '';
  selectedCategory = '';
  notes = '';
  tableNumber = 1;
  slug = '';
  settings: TenantSettings | null = null;
  private sub!: Subscription;

  constructor(
    private route: ActivatedRoute,
    private router: Router,
    public cartService: CartService,
    private menuService: MenuService,
    private orderService: OrderService,
    private toast: ToastService,
    private tenantService: TenantService
  ) {}

  ngOnInit() {
    this.slug = this.route.parent?.snapshot.paramMap.get('tenantSlug') || sessionStorage.getItem('tenantSlug') || '';
    this.tableNumber = parseInt(this.route.snapshot.queryParamMap.get('table') || sessionStorage.getItem('tableNumber') || '1', 10);
    this.settings = this.tenantService.getSettings();

    this.menuService.getPublicMenu(this.slug).subscribe({
      next: items => { this.menuItems = items; this.loading = false; },
      error: () => { this.loading = false; this.toast.error('Failed to load menu'); }
    });

    this.sub = this.cartService.items.subscribe(items => this.cartItems = items);
  }

  ngOnDestroy() { this.sub?.unsubscribe(); }

  get categories(): string[] {
    return [...new Set(this.menuItems.map(i => i.category))];
  }

  get filteredItems(): MenuItem[] {
    let items = this.menuItems;
    if (this.searchQuery) {
      const q = this.searchQuery.toLowerCase();
      items = items.filter(i => i.displayName.toLowerCase().includes(q) || i.category.toLowerCase().includes(q));
    }
    if (this.selectedCategory) {
      items = items.filter(i => i.category === this.selectedCategory);
    }
    return items;
  }

  get displayCategories(): string[] {
    const cats = this.selectedCategory ? [this.selectedCategory] : this.categories;
    return cats.filter(c => this.getItemsByCategory(c).length > 0);
  }

  getItemsByCategory(category: string): MenuItem[] {
    return this.filteredItems.filter(i => i.category === category);
  }

  getQty(id: string): number { return this.cartService.getQuantity(id); }
  addItem(item: MenuItem) { this.cartService.add(item); }
  removeItem(id: string) { this.cartService.remove(id); }

  placeOrder() {
    if (this.cartItems.length === 0) return;
    this.placing = true;

    const doPlace = (lat?: number, lng?: number) => {
      const settings = this.settings;
      if (settings && !settings.canUserOrderWithoutLocation && lat !== undefined) {
        const dist = this.haversine(lat, lng!, settings.cafeLatitude, settings.cafeLongitude);
        if (dist > settings.orderRadiusKm) {
          this.distanceKm = dist;
          this.locationBlocked = true;
          this.placing = false;
          return;
        }
      }

      this.orderService.placeOrder(this.slug, {
        tableNumber: this.tableNumber,
        customerLat: lat,
        customerLng: lng,
        notes: this.notes || undefined,
        items: this.cartItems.map(ci => ({ menuItemId: ci.menuItem.id, quantity: ci.quantity }))
      }).subscribe({
        next: order => {
          this.placing = false;
          this.cartService.clear();
          this.cartOpen = false;
          this.toast.success('Order Placed! 🎉', `Est. ${order.estimatedTimeMin} minutes`);
          this.router.navigate([`/${this.slug}/order-status/${order.id}`]);
        },
        error: err => {
          this.placing = false;
          this.toast.error('Order failed', err?.error?.message || 'Something went wrong');
        }
      });
    };

    if (this.settings && !this.settings.canUserOrderWithoutLocation) {
      navigator.geolocation.getCurrentPosition(
        pos => doPlace(pos.coords.latitude, pos.coords.longitude),
        () => { this.placing = false; this.toast.error('Location required', 'Please allow location access'); }
      );
    } else {
      doPlace();
    }
  }

  private haversine(lat1: number, lng1: number, lat2: number, lng2: number): number {
    const R = 6371;
    const dLat = (lat2 - lat1) * Math.PI / 180;
    const dLng = (lng2 - lng1) * Math.PI / 180;
    const a = Math.sin(dLat/2)**2 + Math.cos(lat1*Math.PI/180) * Math.cos(lat2*Math.PI/180) * Math.sin(dLng/2)**2;
    return R * 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1-a));
  }
}
