import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';
import { environment } from '../../environments/environment';

// Mirrors CouponValidateResponse from shuddha-api. Intentionally excludes
// deliveryFee/total — that's a separate scope boundary owned elsewhere.
export interface CouponPreview {
  valid: boolean;
  message: string;
  code: string;
  subtotal: number;
  discountAmount: number;
}

@Injectable({ providedIn: 'root' })
export class CouponService {
  private readonly base = `${environment.apiBaseUrl}/coupons`;

  constructor(private http: HttpClient) {}

  validate(code: string): Observable<CouponPreview> {
    return this.http.post<CouponPreview>(`${this.base}/validate`, { code });
  }
}
