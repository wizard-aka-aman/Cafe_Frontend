import { Component, OnInit } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { NgClass } from '@angular/common';
import { MenuService } from '../../../core/services/menu.service';
import { ToastService } from '../../../core/services/toast.service';
import { MenuItem } from '../../../core/models/models';

@Component({
  selector: 'app-menu-manager',
  standalone: true,
  imports: [FormsModule, NgClass],
  template: `
    <div class="page">
      <div class="page-header">
        <div>
          <h1 class="page-title">Menu Manager</h1>
          <p class="page-sub">Manage your cafe's menu items</p>
        </div>
        <div class="header-actions">
          <button class="hdr-btn outline" (click)="showJsonEditor = !showJsonEditor" id="toggle-json">
            <span class="material-icons-round">data_object</span>
            {{ showJsonEditor ? 'Visual Editor' : 'JSON Editor' }}
          </button>
          <button class="hdr-btn primary" (click)="openAddForm()" id="add-menu-item">
            <span class="material-icons-round">add</span> Add Item
          </button>
        </div>
      </div>

      <!-- Category Filter Tabs -->
      <div class="tab-bar">
        <button class="tab" [ngClass]="{ active: filterCat === '' }" (click)="filterCat = ''">All ({{ items.length }})</button>
        @for (cat of categories; track cat) {
          <button class="tab" [ngClass]="{ active: filterCat === cat }" (click)="filterCat = cat">
            {{ cat }} ({{ itemsByCategory(cat).length }})
          </button>
        }
      </div>

      <!-- JSON Editor Mode -->
      @if (showJsonEditor) {
        <div class="json-panel">
          <div class="json-header">
            <span class="material-icons-round">data_object</span>
            <span>Bulk JSON Import — Paste your menu JSON array below</span>
          </div>
          <textarea class="json-textarea" [(ngModel)]="jsonText" rows="16"
            placeholder='[{"displayName":"Pasta","propertyName":"pasta","rate":210,"preparationTime":20,"category":"Pasta","isAvailable":true,"sortOrder":1}]'
            id="json-editor"></textarea>
          <div class="json-actions">
            <button class="hdr-btn outline" (click)="formatJson()" id="format-json">
              <span class="material-icons-round">auto_fix_high</span> Format
            </button>
            <button class="hdr-btn primary" (click)="importJson()" [disabled]="importing" id="import-json">
              @if (importing) { <span class="mini-spinner"></span> }
              @else { <span class="material-icons-round">upload</span> }
              {{ importing ? 'Importing...' : 'Import & Replace Menu' }}
            </button>
          </div>
        </div>
      }

      <!-- Items Grid -->
      @if (!showJsonEditor) {
        @if (loading) {
          <div class="loading-center"><div class="spinner" style="border-top-color:var(--primary-light)"></div></div>
        } @else if (filteredItems.length === 0) {
          <div class="empty-state">
            <span class="material-icons-round">restaurant_menu</span>
            <h3>No items found</h3>
            <p>Add your first menu item to get started.</p>
          </div>
        } @else {
          <div class="items-grid">
            @for (item of filteredItems; track item.id) {
              <div class="item-card" [ngClass]="{ unavailable: !item.isAvailable }">
                <div class="item-card-img">
                  @if (item.imageUrl) {
                    <img [src]="item.imageUrl" [alt]="item.displayName">
                  } @else {
                    <div class="img-placeholder"><span class="material-icons-round">restaurant</span></div>
                  }
                  <div class="item-category-chip">{{ item.category }}</div>
                </div>
                <div class="item-card-body">
                  <div class="item-title">{{ item.displayName }}</div>
                  <div class="item-meta-row">
                    <span class="item-rate">₹{{ item.rate }}</span>
                    <span class="item-prep"><span class="material-icons-round">schedule</span>{{ item.preparationTime }}m</span>
                  </div>
                </div>
                <div class="item-card-actions">
                  <button class="action-btn toggle" (click)="toggleAvail(item)" [title]="item.isAvailable ? 'Mark Unavailable' : 'Mark Available'"
                    [id]="'toggle-' + item.id">
                    <span class="material-icons-round">{{ item.isAvailable ? 'visibility' : 'visibility_off' }}</span>
                  </button>
                  <button class="action-btn edit" (click)="openEditForm(item)" [id]="'edit-' + item.id">
                    <span class="material-icons-round">edit</span>
                  </button>
                  <button class="action-btn delete" (click)="deleteItem(item)" [id]="'delete-' + item.id">
                    <span class="material-icons-round">delete</span>
                  </button>
                </div>
              </div>
            }
          </div>
        }
      }
    </div>

    <!-- Add/Edit Modal -->
    @if (showForm) {
      <div class="modal-backdrop" (click)="closeForm()">
        <div class="modal" (click)="$event.stopPropagation()">
          <div class="modal-header">
            <h3>{{ editingId ? 'Edit Item' : 'Add Menu Item' }}</h3>
            <button class="btn-icon-close" (click)="closeForm()">
              <span class="material-icons-round">close</span>
            </button>
          </div>
          <div class="modal-body">
            <div class="form-row">
              <div class="form-group">
                <label class="form-label">Display Name *</label>
                <input class="input dark-input" [(ngModel)]="form.displayName" placeholder="e.g. Margherita Pizza" id="form-name">
              </div>
              <div class="form-group">
                <label class="form-label">Property Name *</label>
                <input class="input dark-input" [(ngModel)]="form.propertyName" placeholder="e.g. margherita_pizza" id="form-prop">
              </div>
            </div>
            <div class="form-row">
              <div class="form-group">
                <label class="form-label">Price (₹) *</label>
                <input class="input dark-input" type="number" [(ngModel)]="form.rate" placeholder="299" id="form-rate">
              </div>
              <div class="form-group">
                <label class="form-label">Prep Time (min) *</label>
                <input class="input dark-input" type="number" [(ngModel)]="form.preparationTime" placeholder="20" id="form-prep">
              </div>
            </div>
            <div class="form-row">
              <div class="form-group">
                <label class="form-label">Category *</label>
                <input class="input dark-input" [(ngModel)]="form.category" placeholder="e.g. Pizza, Beverages" id="form-cat">
              </div>
              <div class="form-group">
                <label class="form-label">Sort Order</label>
                <input class="input dark-input" type="number" [(ngModel)]="form.sortOrder" placeholder="1" id="form-sort">
              </div>
            </div>
            <div class="form-group">
              <label class="form-label">Image URL (optional)</label>
              <input class="input dark-input" [(ngModel)]="form.imageUrl" placeholder="https://..." id="form-image">
            </div>
            <div class="form-group toggle-group">
              <label class="form-label">Available</label>
              <div class="toggle-switch" [ngClass]="{ on: form.isAvailable }" (click)="form.isAvailable = !form.isAvailable" id="form-avail">
                <div class="toggle-thumb"></div>
              </div>
            </div>
          </div>
          <div class="modal-footer">
            <button class="hdr-btn outline" (click)="closeForm()">Cancel</button>
            <button class="hdr-btn primary" (click)="saveItem()" [disabled]="saving" id="form-save">
              @if (saving) { <span class="mini-spinner"></span> }
              {{ saving ? 'Saving...' : (editingId ? 'Update Item' : 'Add Item') }}
            </button>
          </div>
        </div>
      </div>
    }
  `,
  styles: [`
    .page { padding: 28px; }
    .page-header { display: flex; align-items: center; justify-content: space-between; margin-bottom: 20px; flex-wrap: wrap; gap: 12px; }
    .page-title { font-size: 26px; color: var(--dark-text); }
    .page-sub { color: var(--dark-muted); font-size: 14px; margin-top: 2px; }
    .header-actions { display: flex; gap: 8px; }

    .hdr-btn {
      display: inline-flex; align-items: center; gap: 6px; padding: 9px 16px;
      border-radius: var(--radius); font-size: 13px; font-weight: 600; cursor: pointer;
      border: none; transition: all var(--transition);
    }
    .hdr-btn.primary {
      background: linear-gradient(135deg, var(--primary), var(--primary-dark));
      color: white; box-shadow: var(--shadow-primary);
    }
    .hdr-btn.primary:hover { transform: translateY(-1px); }
    .hdr-btn.outline { background: transparent; color: var(--dark-muted); border: 1px solid var(--dark-border); }
    .hdr-btn.outline:hover { background: rgba(255,255,255,0.06); color: var(--dark-text); }
    .hdr-btn:disabled { opacity: 0.5; cursor: not-allowed; transform: none !important; }

    /* Tabs */
    .tab-bar { display: flex; gap: 4px; margin-bottom: 24px; overflow-x: auto; scrollbar-width: none; }
    .tab-bar::-webkit-scrollbar { display: none; }
    .tab {
      flex-shrink: 0; padding: 7px 14px; border-radius: var(--radius);
      font-size: 13px; font-weight: 600; background: transparent;
      color: var(--dark-muted); border: 1px solid var(--dark-border); cursor: pointer;
      transition: all var(--transition);
    }
    .tab.active { background: rgba(37,99,235,0.15); color: var(--primary-light); border-color: var(--primary); }
    .tab:hover:not(.active) { background: rgba(255,255,255,0.04); color: var(--dark-text); }

    /* JSON Panel */
    .json-panel {
      background: var(--dark-surface); border: 1px solid var(--dark-border);
      border-radius: var(--radius-lg); overflow: hidden; margin-bottom: 24px;
    }
    .json-header {
      display: flex; align-items: center; gap: 8px; padding: 14px 18px;
      border-bottom: 1px solid var(--dark-border); color: var(--dark-muted); font-size: 13px;
    }
    .json-header .material-icons-round { color: var(--accent); font-size: 18px; }
    .json-textarea {
      width: 100%; background: rgba(0,0,0,0.25); border: none; color: #7EC8E3;
      font-family: 'Courier New', monospace; font-size: 13px; padding: 16px 20px;
      resize: vertical; outline: none; line-height: 1.7;
    }
    .json-actions {
      display: flex; gap: 8px; justify-content: flex-end;
      padding: 12px 16px; border-top: 1px solid var(--dark-border);
    }

    /* Grid */
    .loading-center { display: flex; justify-content: center; padding: 60px; }
    .empty-state { display: flex; flex-direction: column; align-items: center; gap: 10px; padding: 60px; color: var(--dark-muted); text-align: center; }
    .empty-state .material-icons-round { font-size: 56px; color: rgba(255,255,255,0.06); }
    .empty-state h3 { color: var(--dark-text); }
    .items-grid { display: grid; grid-template-columns: repeat(auto-fill, minmax(240px, 1fr)); gap: 16px; }

    .item-card {
      background: var(--dark-surface); border: 1px solid var(--dark-border);
      border-radius: var(--radius-lg); overflow: hidden; transition: all var(--transition-md);
    }
    .item-card:hover { border-color: rgba(59,130,246,0.3); transform: translateY(-2px); }
    .item-card.unavailable { opacity: 0.55; }
    .item-card-img { height: 140px; position: relative; background: var(--dark-card); overflow: hidden; }
    .item-card-img img { width: 100%; height: 100%; object-fit: cover; }
    .img-placeholder { height: 100%; display: flex; align-items: center; justify-content: center; }
    .img-placeholder .material-icons-round { font-size: 40px; color: rgba(255,255,255,0.1); }
    .item-category-chip {
      position: absolute; top: 10px; left: 10px; background: rgba(0,0,0,0.7);
      color: var(--accent); font-size: 11px; font-weight: 700; padding: 3px 10px;
      border-radius: var(--radius-full); text-transform: uppercase; letter-spacing: 0.05em;
    }
    .item-card-body { padding: 14px 16px; }
    .item-title { font-size: 15px; font-weight: 700; color: var(--dark-text); margin-bottom: 8px; }
    .item-meta-row { display: flex; align-items: center; justify-content: space-between; }
    .item-rate { font-size: 18px; font-weight: 800; color: var(--primary-light); font-family: var(--font-display); }
    .item-prep { display: flex; align-items: center; gap: 4px; font-size: 12px; color: var(--dark-muted); }
    .item-prep .material-icons-round { font-size: 14px; }
    .item-card-actions { display: flex; border-top: 1px solid var(--dark-border); }
    .action-btn {
      flex: 1; padding: 10px; background: none; border: none; cursor: pointer;
      color: var(--dark-muted); transition: all var(--transition); display: flex;
      align-items: center; justify-content: center;
    }
    .action-btn + .action-btn { border-left: 1px solid var(--dark-border); }
    .action-btn .material-icons-round { font-size: 18px; }
    .action-btn.toggle:hover { background: rgba(16,185,129,0.1); color: var(--success); }
    .action-btn.edit:hover   { background: rgba(37,99,235,0.1);  color: var(--primary-light); }
    .action-btn.delete:hover { background: rgba(239,68,68,0.1);  color: var(--danger); }

    /* Modal */
    .modal-backdrop {
      position: fixed; inset: 0; background: rgba(0,0,0,0.7);
      display: flex; align-items: center; justify-content: center; z-index: 500;
      backdrop-filter: blur(6px); animation: fadeIn 0.2s ease;
    }
    .modal {
      background: var(--dark-surface); border: 1px solid var(--dark-border);
      border-radius: var(--radius-xl); width: 560px; max-width: 96vw; max-height: 92vh;
      overflow-y: auto; box-shadow: var(--shadow-lg); animation: slideUp 0.3s var(--ease-bounce);
    }
    .modal-header {
      display: flex; align-items: center; justify-content: space-between;
      padding: 20px 24px; border-bottom: 1px solid var(--dark-border);
    }
    .modal-header h3 { font-size: 18px; color: var(--dark-text); }
    .btn-icon-close { background: none; border: none; cursor: pointer; color: var(--dark-muted); padding: 4px; }
    .modal-body { padding: 24px; display: flex; flex-direction: column; gap: 4px; }
    .form-row { display: grid; grid-template-columns: 1fr 1fr; gap: 16px; }
    .form-group { display: flex; flex-direction: column; gap: 6px; margin-bottom: 12px; }
    .form-label { font-size: 12px; font-weight: 700; color: var(--dark-muted); text-transform: uppercase; letter-spacing: 0.04em; }
    .dark-input {
      background: rgba(0,0,0,0.25); border: 1.5px solid var(--dark-border);
      color: var(--dark-text); border-radius: var(--radius); padding: 10px 12px; font-size: 14px;
      transition: all var(--transition);
    }
    .dark-input:focus { border-color: var(--primary); box-shadow: 0 0 0 3px rgba(37,99,235,0.1); }
    .dark-input::placeholder { color: rgba(255,255,255,0.18); }

    .toggle-group { flex-direction: row; align-items: center; justify-content: space-between; }
    .toggle-switch {
      width: 44px; height: 24px; background: var(--dark-border); border-radius: 12px;
      cursor: pointer; position: relative; transition: background 0.25s;
    }
    .toggle-switch.on { background: var(--success); }
    .toggle-thumb {
      position: absolute; top: 2px; left: 2px; width: 20px; height: 20px;
      background: white; border-radius: 50%; transition: transform 0.25s var(--ease-bounce);
      box-shadow: 0 1px 4px rgba(0,0,0,0.3);
    }
    .toggle-switch.on .toggle-thumb { transform: translateX(20px); }

    .modal-footer {
      display: flex; justify-content: flex-end; gap: 8px;
      padding: 16px 24px; border-top: 1px solid var(--dark-border);
    }
    .mini-spinner {
      width: 16px; height: 16px; border: 2px solid rgba(255,255,255,0.3);
      border-top-color: white; border-radius: 50%; animation: spin 0.7s linear infinite; display: inline-block;
    }
    @keyframes spin { to { transform: rotate(360deg); } }

    @media (max-width: 640px) { .form-row { grid-template-columns: 1fr; } }
  `]
})
export class MenuManagerComponent implements OnInit {
  items: MenuItem[] = [];
  filterCat = '';
  showForm = false;
  showJsonEditor = false;
  loading = true;
  saving = false;
  importing = false;
  editingId: string | null = null;
  jsonText = '';

  form: Partial<MenuItem> = this.emptyForm();

  constructor(private menuService: MenuService, private toast: ToastService) {}

  ngOnInit() { this.loadItems(); }

  loadItems() {
    this.loading = true;
    this.menuService.getAdminMenu().subscribe({
      next: items => { this.items = items; this.loading = false; },
      error: () => { this.loading = false; this.toast.error('Failed to load menu'); }
    });
  }

  get categories(): string[] {
    return [...new Set(this.items.map(i => i.category))];
  }

  get filteredItems(): MenuItem[] {
    return this.filterCat ? this.items.filter(i => i.category === this.filterCat) : this.items;
  }

  itemsByCategory(cat: string): MenuItem[] {
    return this.items.filter(i => i.category === cat);
  }

  openAddForm() {
    this.editingId = null;
    this.form = this.emptyForm();
    this.showForm = true;
  }

  openEditForm(item: MenuItem) {
    this.editingId = item.id;
    this.form = { ...item };
    this.showForm = true;
  }

  closeForm() { this.showForm = false; this.editingId = null; }

  saveItem() {
    if (!this.form.displayName || !this.form.category || !this.form.propertyName || this.form.rate === undefined) {
      this.toast.warning('Missing fields', 'Name, property name, category and price are required.');
      return;
    }
    this.saving = true;

    const onSuccess = () => {
      this.toast.success(this.editingId ? 'Item updated' : 'Item added');
      this.saving = false;
      this.closeForm();
      this.loadItems();
    };
    const onError = (err: any) => {
      this.saving = false;
      this.toast.error('Save failed', err?.error?.message || 'Check your input.');
    };

    if (this.editingId) {
      this.menuService.updateMenuItem(this.editingId, this.form).subscribe({ next: onSuccess, error: onError });
    } else {
      this.menuService.addMenuItem(this.form).subscribe({ next: onSuccess, error: onError });
    }
  }

  toggleAvail(item: MenuItem) {
    this.menuService.toggleAvailability(item.id).subscribe({
      next: res => {
        item.isAvailable = res.isAvailable;
        this.toast.success(`${item.displayName} ${res.isAvailable ? 'available' : 'unavailable'}`);
      },
      error: () => this.toast.error('Toggle failed')
    });
  }

  deleteItem(item: MenuItem) {
    if (!confirm(`Delete "${item.displayName}"?`)) return;
    this.menuService.deleteMenuItem(item.id).subscribe({
      next: () => { this.toast.success('Item deleted'); this.loadItems(); },
      error: () => this.toast.error('Delete failed')
    });
  }

  formatJson() {
    try {
      this.jsonText = JSON.stringify(JSON.parse(this.jsonText), null, 2);
    } catch { this.toast.error('Invalid JSON', 'Please check your JSON syntax.'); }
  }

  importJson() {
    try {
      const data = JSON.parse(this.jsonText);
      if (!Array.isArray(data)) { this.toast.error('Must be a JSON array'); return; }
      this.importing = true;
      this.menuService.bulkImport(data).subscribe({
        next: res => {
          this.importing = false;
          this.toast.success(`${res.imported} items imported!`);
          this.showJsonEditor = false;
          this.loadItems();
        },
        error: () => { this.importing = false; this.toast.error('Import failed'); }
      });
    } catch { this.toast.error('Invalid JSON', 'Please check your JSON syntax.'); }
  }

  private emptyForm(): Partial<MenuItem> {
    return { displayName: '', propertyName: '', rate: 0, preparationTime: 15, category: '', imageUrl: '', isAvailable: true, sortOrder: 1 };
  }
}
