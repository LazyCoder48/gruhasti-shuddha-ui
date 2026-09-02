import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';
import { environment } from '../../environments/environment';

export interface AdminCategory {
  id: string;
  name: string;
  slug: string;
  displayOrder: number;
  active: boolean;
}

export interface AdminCategoryRequest {
  name: string;
  displayOrder: number;
  active: boolean;
}

@Injectable({ providedIn: 'root' })
export class AdminCategoryService {
  private readonly base = `${environment.apiBaseUrl}/admin/categories`;

  constructor(private http: HttpClient) {}

  list(): Observable<AdminCategory[]> {
    return this.http.get<AdminCategory[]>(this.base);
  }

  create(req: AdminCategoryRequest): Observable<AdminCategory> {
    return this.http.post<AdminCategory>(this.base, req);
  }

  update(id: string, req: AdminCategoryRequest): Observable<AdminCategory> {
    return this.http.put<AdminCategory>(`${this.base}/${encodeURIComponent(id)}`, req);
  }

  delete(id: string): Observable<void> {
    return this.http.delete<void>(`${this.base}/${encodeURIComponent(id)}`);
  }
}
