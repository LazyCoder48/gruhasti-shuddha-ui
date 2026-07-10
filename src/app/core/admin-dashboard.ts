import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';
import { environment } from '../../environments/environment';

export interface RecentOrder {
  id: string;
  userId: string;
  finalAmount: number;
  status: string;
  createdAt: string;
}

export interface DashboardSummary {
  totalProducts: number;
  activeProducts: number;
  totalOrders: number;
  ordersByStatus: Record<string, number>;
  totalRevenue: number;
  lowStockCount: number;
  recentOrders: RecentOrder[];
}

@Injectable({ providedIn: 'root' })
export class AdminDashboardService {
  private readonly base = `${environment.apiBaseUrl}/admin/dashboard`;

  constructor(private http: HttpClient) {}

  summary(): Observable<DashboardSummary> {
    return this.http.get<DashboardSummary>(`${this.base}/summary`);
  }
}
