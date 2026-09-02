import { Injectable, signal } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { environment } from '../../environments/environment';

export interface PackOption {
  size: string;
  price: number;
  weightValue: number | null;
  weightUnit: 'G' | 'KG' | null;
}

export interface ProductSpec {
  label: string;
  value: string;
}

export interface ProductReview {
  id: string;
  initials: string;
  name: string;
  rating: number;
  comment: string;
  submittedAt: string;
}

export interface ShuddhaProduct {
  id: string;
  name: string;
  category: string;
  tagline: string;
  description: string;
  longDescription: string;
  image: string;
  packSizes: PackOption[];
  stockCount: number;
  rating: number;
  reviewCount: number;
  specs: ProductSpec[];
  reviews: ProductReview[];
  featured: boolean;
  lowStock: boolean;
}

@Injectable({ providedIn: 'root' })
export class ProductService {
  private _products = signal<ShuddhaProduct[]>([]);
  readonly products = this._products.asReadonly();

  constructor(private http: HttpClient) {
    this.http.get<ShuddhaProduct[]>(`${environment.apiBaseUrl}/products`).subscribe((list) => this._products.set(list));
  }

  getById(id: string): ShuddhaProduct | undefined {
    return this._products().find((p) => p.id === id);
  }

  related(id: string, count = 4): ShuddhaProduct[] {
    return this._products()
      .filter((p) => p.id !== id)
      .slice(0, count);
  }
}
