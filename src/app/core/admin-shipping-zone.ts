import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';
import { environment } from '../../environments/environment';

export interface AdminShippingZone {
  id: string;
  name: string;
  pincodes: string[];
  deliveryFee: number;
  freeDeliveryThreshold: number | null;
  active: boolean;
  createdAt: string;
  createdBy: string;
  updatedAt: string;
  updatedBy: string;
}

export interface AdminShippingZoneRequest {
  name: string;
  pincodes: string[];
  deliveryFee: number;
  freeDeliveryThreshold: number | null;
  active: boolean;
}

@Injectable({ providedIn: 'root' })
export class AdminShippingZoneService {
  private readonly base = `${environment.apiBaseUrl}/admin/shipping-zones`;

  constructor(private http: HttpClient) {}

  list(): Observable<AdminShippingZone[]> {
    return this.http.get<AdminShippingZone[]>(this.base);
  }

  create(req: AdminShippingZoneRequest): Observable<AdminShippingZone> {
    return this.http.post<AdminShippingZone>(this.base, req);
  }

  update(id: string, req: AdminShippingZoneRequest): Observable<AdminShippingZone> {
    return this.http.put<AdminShippingZone>(`${this.base}/${encodeURIComponent(id)}`, req);
  }

  delete(id: string): Observable<void> {
    return this.http.delete<void>(`${this.base}/${encodeURIComponent(id)}`);
  }
}
