import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';
import { environment } from '../../environments/environment';

export type OrderStatus =
  | 'PLACED'
  | 'PACKED'
  | 'SHIPPED'
  | 'OUT_FOR_DELIVERY'
  | 'DELIVERED'
  | 'CANCELLED'
  | 'RETURN_REQUESTED'
  | 'RETURNED'
  | 'REFUNDED';

// Mirrors OrderService.ALLOWED_TRANSITIONS on the backend — the backend is the
// source of truth and will reject anything not listed here too.
export const ORDER_STATUS_TRANSITIONS: Record<OrderStatus, OrderStatus[]> = {
  PLACED: ['PACKED', 'CANCELLED'],
  PACKED: ['SHIPPED', 'CANCELLED'],
  SHIPPED: ['OUT_FOR_DELIVERY', 'CANCELLED'],
  OUT_FOR_DELIVERY: ['DELIVERED'],
  DELIVERED: ['RETURN_REQUESTED'],
  RETURN_REQUESTED: ['RETURNED'],
  RETURNED: ['REFUNDED'],
  CANCELLED: [],
  REFUNDED: [],
};

export interface AdminOrderItem {
  productId: string;
  name: string;
  packagingSize: string;
  price: number;
  quantity: number;
  total: number;
}

export interface AdminOrder {
  id: string;
  userId: string;
  items: AdminOrderItem[];
  subtotal: number;
  discountOffered: number;
  couponCode: string | null;
  deliveryFee: number;
  finalAmount: number;
  paymentMethod: string;
  paymentStatus: string;
  deliveryAddress: { label: string; line1: string; line2?: string; city: string; state: string; pincode: string };
  status: OrderStatus;
  statusHistory: { status: OrderStatus; at: string; note: string }[];
  createdAt: string;
}

@Injectable({ providedIn: 'root' })
export class AdminOrderService {
  private readonly base = `${environment.apiBaseUrl}/admin/orders`;

  constructor(private http: HttpClient) {}

  list(): Observable<AdminOrder[]> {
    return this.http.get<AdminOrder[]>(this.base);
  }

  updateStatus(id: string, status: OrderStatus, note?: string): Observable<AdminOrder> {
    return this.http.put<AdminOrder>(`${this.base}/${encodeURIComponent(id)}/status`, { status, note });
  }
}
