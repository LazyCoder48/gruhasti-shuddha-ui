import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';
import { environment } from '../../environments/environment';

export interface DeliveryAddress {
  label: string;
  line1: string;
  line2?: string;
  city: string;
  state: string;
  pincode: string;
}

export type PaymentMethod = 'CARD' | 'UPI' | 'NETBANKING' | 'COD';

export interface PlaceOrderRequest {
  paymentMethod: PaymentMethod;
  deliveryAddress: DeliveryAddress;
  couponCode?: string | null;
}

export interface OrderItem {
  productId: string;
  name: string;
  packagingSize: string;
  price: number;
  quantity: number;
  total: number;
}

export interface Order {
  id: string;
  userId: string;
  items: OrderItem[];
  subtotal: number;
  discountOffered: number;
  couponCode: string | null;
  deliveryFee: number;
  finalAmount: number;
  paymentMethod: PaymentMethod;
  paymentStatus: string;
  deliveryAddress: DeliveryAddress;
  status: string;
  statusHistory: { status: string; at: string; note: string }[];
  createdAt: string;
}

@Injectable({ providedIn: 'root' })
export class OrderService {
  constructor(private http: HttpClient) {}

  placeOrder(req: PlaceOrderRequest): Observable<Order> {
    return this.http.post<Order>(`${environment.apiBaseUrl}/orders`, req);
  }

  listMine(): Observable<Order[]> {
    return this.http.get<Order[]>(`${environment.apiBaseUrl}/orders`);
  }

  getMine(id: string): Observable<Order> {
    return this.http.get<Order>(`${environment.apiBaseUrl}/orders/${encodeURIComponent(id)}`);
  }
}
