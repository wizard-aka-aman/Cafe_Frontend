import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { environment } from '../../../environments/environment';
import { Order, PlaceOrderRequest, AnalyticsData } from '../models/models';

@Injectable({ providedIn: 'root' })
export class OrderService {
  constructor(private http: HttpClient) {}

  placeOrder(slug: string, req: PlaceOrderRequest) {
    return this.http.post<Order>(`${environment.apiUrl}/${slug}/orders`, req);
  }

  /** Public – for customer order-status page (no auth required) */
  getPublicOrder(slug: string, id: string) {
    return this.http.get<Order>(`${environment.apiUrl}/${slug}/orders/${id}`);
  }

  getOrders(activeOnly = false) {
    return this.http.get<Order[]>(`${environment.apiUrl}/orders?activeOnly=${activeOnly}`);
  }

  /** Admin endpoint – requires auth */
  getOrder(id: string) {
    return this.http.get<Order>(`${environment.apiUrl}/orders/${id}`);
  }

  updateStatus(orderId: string, status: string) {
    return this.http.put<void>(`${environment.apiUrl}/orders/${orderId}/status`, { status });
  }

  getAnalytics() {
    return this.http.get<AnalyticsData>(`${environment.apiUrl}/analytics/summary`);
  }
}
