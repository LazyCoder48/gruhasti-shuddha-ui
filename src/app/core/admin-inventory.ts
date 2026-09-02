import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';
import { environment } from '../../environments/environment';

export interface InventoryItem {
  productId: string;
  productName: string;
  size: string;
  price: number;
  currentStock: number;
  sku: string;
  lowStock: boolean;
}

@Injectable({ providedIn: 'root' })
export class AdminInventoryService {
  private readonly base = `${environment.apiBaseUrl}/admin/inventory`;

  constructor(private http: HttpClient) {}

  list(): Observable<InventoryItem[]> {
    return this.http.get<InventoryItem[]>(this.base);
  }

  adjustStock(productId: string, size: string, stock: number): Observable<InventoryItem> {
    return this.http.put<InventoryItem>(`${this.base}/${encodeURIComponent(productId)}`, { size, stock });
  }
}
