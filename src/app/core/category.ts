import { Injectable, signal } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { environment } from '../../environments/environment';

export interface Category {
  id: string;
  name: string;
  slug: string;
  displayOrder: number;
}

@Injectable({ providedIn: 'root' })
export class CategoryService {
  private _categories = signal<Category[]>([]);
  readonly categories = this._categories.asReadonly();

  constructor(private http: HttpClient) {
    this.http.get<Category[]>(`${environment.apiBaseUrl}/categories`).subscribe((list) => this._categories.set(list));
  }
}
