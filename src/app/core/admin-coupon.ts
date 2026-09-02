import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';
import { environment } from '../../environments/environment';

export type DiscountType = 'PERCENTAGE' | 'FLAT';

export interface AdminCoupon {
  id: string;
  code: string;
  description: string;
  discountType: DiscountType;
  discountValue: number;
  minOrderValue: number;
  maxDiscountAmount: number | null;
  active: boolean;
  expiresAt: string | null;
  usageLimit: number | null;
  usageCount: number;
  createdAt: string;
  createdBy: string;
  updatedAt: string;
  updatedBy: string;
}

export interface AdminCouponRequest {
  code: string;
  description: string;
  discountType: DiscountType;
  discountValue: number;
  minOrderValue: number;
  maxDiscountAmount: number | null;
  active: boolean;
  expiresAt: string | null;
  usageLimit: number | null;
}

@Injectable({ providedIn: 'root' })
export class AdminCouponService {
  private readonly base = `${environment.apiBaseUrl}/admin/coupons`;

  constructor(private http: HttpClient) {}

  list(): Observable<AdminCoupon[]> {
    return this.http.get<AdminCoupon[]>(this.base);
  }

  getById(id: string): Observable<AdminCoupon> {
    return this.http.get<AdminCoupon>(`${this.base}/${encodeURIComponent(id)}`);
  }

  create(req: AdminCouponRequest): Observable<AdminCoupon> {
    return this.http.post<AdminCoupon>(this.base, req);
  }

  update(id: string, req: AdminCouponRequest): Observable<AdminCoupon> {
    return this.http.put<AdminCoupon>(`${this.base}/${encodeURIComponent(id)}`, req);
  }

  delete(id: string): Observable<void> {
    return this.http.delete<void>(`${this.base}/${encodeURIComponent(id)}`);
  }
}
