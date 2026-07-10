import { Injectable, signal, computed } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable, tap } from 'rxjs';
import { AuthService } from './auth';
import { environment } from '../../environments/environment';

export interface WishlistItem {
  productId: string;
  name: string;
  packSize: string;
  category: string;
  image: string;
  price: number;
  stockCount: number;
  addedAt: string;
}

@Injectable({ providedIn: 'root' })
export class WishlistService {
  private _items = signal<WishlistItem[]>([]);
  readonly items = this._items.asReadonly();

  readonly count = computed(() => this._items().length);

  constructor(private http: HttpClient, private auth: AuthService) {
    if (this.auth.isLoggedIn()) {
      this.refresh();
    }
  }

  isWishlisted(productId: string): boolean {
    return this._items().some((i) => i.productId === productId);
  }

  add(productId: string): Observable<WishlistItem[]> {
    return this.http
      .post<WishlistItem[]>(`${environment.apiBaseUrl}/wishlist/items`, { productId })
      .pipe(tap((items) => this._items.set(items)));
  }

  remove(productId: string): void {
    this.http
      .delete<WishlistItem[]>(`${environment.apiBaseUrl}/wishlist/items/${encodeURIComponent(productId)}`)
      .subscribe({ next: (items) => this._items.set(items), error: () => {} });
  }

  toggle(productId: string): void {
    if (this.isWishlisted(productId)) {
      this.remove(productId);
    } else {
      this.add(productId).subscribe({ error: () => {} });
    }
  }

  refresh(): void {
    this.http
      .get<WishlistItem[]>(`${environment.apiBaseUrl}/wishlist`)
      .subscribe({ next: (items) => this._items.set(items), error: () => {} });
  }
}
