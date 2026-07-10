import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';
import { environment } from '../../environments/environment';

export interface AdminPackagingSize {
  size: string;
  price: number;
  discountPercent: number;
  discountedPrice: number;
  currentStock: number;
  sku: string;
}

export interface AdminProductSpec {
  label: string;
  value: string;
}

export type AdminProductStatus = 'ACTIVE' | 'INACTIVE' | 'OUT_OF_STOCK';

export interface AdminProduct {
  id: string;
  name: string;
  flourCategory: string;
  tagline: string;
  description: string;
  longDescription: string;
  images: string[];
  packagingSizes: AdminPackagingSize[];
  specs: AdminProductSpec[];
  status: AdminProductStatus;
  rating: number;
  reviewCount: number;
}

export interface AdminProductRequest {
  name: string;
  flourCategory: string;
  tagline: string;
  description: string;
  longDescription: string;
  images: string[];
  packagingSizes: AdminPackagingSize[];
  specs: AdminProductSpec[];
  status: AdminProductStatus;
}

@Injectable({ providedIn: 'root' })
export class AdminProductService {
  private readonly base = `${environment.apiBaseUrl}/admin/products`;

  constructor(private http: HttpClient) {}

  list(): Observable<AdminProduct[]> {
    return this.http.get<AdminProduct[]>(this.base);
  }

  getById(id: string): Observable<AdminProduct> {
    return this.http.get<AdminProduct>(`${this.base}/${encodeURIComponent(id)}`);
  }

  create(req: AdminProductRequest): Observable<AdminProduct> {
    return this.http.post<AdminProduct>(this.base, req);
  }

  update(id: string, req: AdminProductRequest): Observable<AdminProduct> {
    return this.http.put<AdminProduct>(`${this.base}/${encodeURIComponent(id)}`, req);
  }

  delete(id: string): Observable<void> {
    return this.http.delete<void>(`${this.base}/${encodeURIComponent(id)}`);
  }
}
