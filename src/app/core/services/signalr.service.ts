import { Injectable, NgZone } from '@angular/core';
import * as signalR from '@microsoft/signalr';
import { BehaviorSubject, Subject } from 'rxjs';
import { Order, OrderStatus } from '../models/models';
import { environment } from '../../../environments/environment';

export interface OrderNotification {
  orderId: string;
  tableNumber: number;
  totalAmount: number;
  estimatedTime: number;
  itemCount: number;
  items: { displayName: string; quantity: number; unitPrice: number }[];
  notes?: string;
  placedAt: string;
  tenantName: string;
}

export interface StatusNotification {
  orderId: string;
  newStatus: string;
  updatedAt: string;
}

@Injectable({ providedIn: 'root' })
export class SignalrService {
  private connection: signalR.HubConnection | null = null;
  private connected = false;

  /** Admin receives this when a customer places an order */
  newOrder$ = new Subject<OrderNotification>();

  /** Everyone receives this when order status changes */
  statusChanged$ = new Subject<StatusNotification>();

  /** Connection state */
  isConnected$ = new BehaviorSubject<boolean>(false);

  constructor(private zone: NgZone) {}

  async connectAsAdmin(tenantId: string) {
    if (this.connected) return;
    await this.buildConnection();
    if (!this.connection) return;

    this.connection.on('NewOrderReceived', (data: OrderNotification) => {
      this.zone.run(() => this.newOrder$.next(data));
    });

    this.connection.on('OrderStatusChanged', (data: StatusNotification) => {
      this.zone.run(() => this.statusChanged$.next(data));
    });

    await this.start();
    await this.connection.invoke('JoinAdminGroup', tenantId);
  }

  async connectAsCustomer(orderId: string) {
    await this.buildConnection();
    if (!this.connection) return;

    this.connection.on('OrderStatusChanged', (data: StatusNotification) => {
      this.zone.run(() => this.statusChanged$.next(data));
    });

    await this.start();
    await this.connection.invoke('JoinOrderGroup', orderId);
  }

  async disconnect() {
    if (this.connection) {
      await this.connection.stop();
      this.connected = false;
      this.isConnected$.next(false);
    }
  }

  private async buildConnection() {
    const token = localStorage.getItem('access_token');
    this.connection = new signalR.HubConnectionBuilder()
      .withUrl(`${environment.hubUrl}/orders`, {
        accessTokenFactory: () => token ?? ''
      })
      .withAutomaticReconnect([0, 2000, 5000, 10000])
      .configureLogging(signalR.LogLevel.Warning)
      .build();

    this.connection.onreconnected(() => this.isConnected$.next(true));
    this.connection.onclose(() => {
      this.connected = false;
      this.isConnected$.next(false);
    });
  }

  private async start() {
    if (!this.connection || this.connected) return;
    try {
      await this.connection.start();
      this.connected = true;
      this.isConnected$.next(true);
    } catch (e) {
      console.error('SignalR connection failed:', e);
    }
  }
}
