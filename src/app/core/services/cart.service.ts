import { Injectable } from '@angular/core';
import { BehaviorSubject } from 'rxjs';
import { CartItem, MenuItem } from '../models/models';

@Injectable({ providedIn: 'root' })
export class CartService {
  private items$ = new BehaviorSubject<CartItem[]>([]);
  items = this.items$.asObservable();

  get snapshot(): CartItem[] { return this.items$.value; }

  get totalItems(): number {
    return this.items$.value.reduce((sum, i) => sum + i.quantity, 0);
  }

  get totalAmount(): number {
    return this.items$.value.reduce((sum, i) => sum + i.menuItem.rate * i.quantity, 0);
  }

  get estimatedTime(): number {
    if (this.items$.value.length === 0) return 0;
    return Math.max(...this.items$.value.map(i => i.menuItem.preparationTime));
  }

  add(item: MenuItem) {
    const current = this.items$.value;
    const existing = current.find(c => c.menuItem.id === item.id);
    if (existing) {
      this.items$.next(current.map(c => c.menuItem.id === item.id
        ? { ...c, quantity: c.quantity + 1 } : c));
    } else {
      this.items$.next([...current, { menuItem: item, quantity: 1 }]);
    }
  }

  remove(itemId: string) {
    const current = this.items$.value;
    const existing = current.find(c => c.menuItem.id === itemId);
    if (!existing) return;
    if (existing.quantity === 1) {
      this.items$.next(current.filter(c => c.menuItem.id !== itemId));
    } else {
      this.items$.next(current.map(c => c.menuItem.id === itemId
        ? { ...c, quantity: c.quantity - 1 } : c));
    }
  }

  setQuantity(itemId: string, quantity: number) {
    if (quantity <= 0) {
      this.items$.next(this.items$.value.filter(c => c.menuItem.id !== itemId));
    } else {
      this.items$.next(this.items$.value.map(c =>
        c.menuItem.id === itemId ? { ...c, quantity } : c));
    }
  }

  clear() { this.items$.next([]); }

  getQuantity(itemId: string): number {
    return this.items$.value.find(c => c.menuItem.id === itemId)?.quantity ?? 0;
  }
}
