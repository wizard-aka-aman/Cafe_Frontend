export interface Tenant {
  id: string;
  name: string;
  slug: string;
  logoUrl?: string;
  isActive: boolean;
  createdAt: string;
  settings?: TenantSettings;
}

export interface TenantSettings {
  tenantId: string;
  canUserOrderWithoutLocation: boolean;
  orderRadiusKm: number;
  paymentEnabled: boolean;
  canUserChangeTableNumber: boolean;
  tableCount: number;
  theme: { primary: string; secondary: string; accent: string; };
  cafeLatitude: number;
  cafeLongitude: number;
}

export interface MenuItem {
  id: string;
  tenantId: string;
  displayName: string;
  propertyName: string;
  rate: number;
  preparationTime: number;
  category: string;
  imageUrl?: string;
  isAvailable: boolean;
  sortOrder: number;
}

export interface CartItem {
  menuItem: MenuItem;
  quantity: number;
}

export interface Order {
  id: string;
  tenantId: string;
  tenantName: string;
  tableNumber: number;
  status: OrderStatus;
  totalAmount: number;
  estimatedTimeMin: number;
  notes?: string;
  createdAt: string;
  items: OrderItem[];
}

export interface OrderItem {
  id: string;
  menuItemId: string;
  displayName: string;
  quantity: number;
  unitPrice: number;
  totalPrice: number;
  preparationTime: number;
}

export type OrderStatus = 'Pending' | 'Preparing' | 'Ready' | 'Delivered' | 'Cancelled';

export interface PlaceOrderRequest {
  tableNumber: number;
  customerLat?: number;
  customerLng?: number;
  notes?: string;
  items: { menuItemId: string; quantity: number; }[];
}

export interface AuthResponse {
  accessToken: string;
  refreshToken: string;
  expiresAt: string;
  role: string;
  tenantId?: string;
  name: string;
  email: string;
}

export interface AnalyticsData {
  dailySales: number;
  monthlySales: number;
  dailyOrderCount: number;
  monthlyOrderCount: number;
  topItems: { displayName: string; quantitySold: number; revenue: number; }[];
  salesChart: { date: string; sales: number; orderCount: number; }[];
}
