import { Injectable, signal, computed } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { EMPTY, Observable, tap } from 'rxjs';
import { PackOption, ShuddhaProduct } from './product';
import { AuthService } from './auth';
import { environment } from '../../environments/environment';

export interface CartItem {
  id: string;
  productId: string;
  name: string;
  packSize: string;
  price: number;
  qty: number;
  image: string;
  category: string;
}

@Injectable({ providedIn: 'root' })
export class CartService {
  private _items = signal<CartItem[]>([]);
  readonly items = this._items.asReadonly();

  readonly count = computed(() => this._items().reduce((n, i) => n + i.qty, 0));
  readonly subtotal = computed(() => this._items().reduce((s, i) => s + i.price * i.qty, 0));

  constructor(private http: HttpClient, private auth: AuthService) {
    if (this.auth.isLoggedIn()) {
      this.refresh();
    }
  }

  add(product: ShuddhaProduct, pack: PackOption, qty = 1): Observable<CartItem[]> {
    if (!this.auth.isLoggedIn()) {
      this.redirectToLogin();
      return EMPTY;
    }
    return this.http
      .post<CartItem[]>(`${environment.apiBaseUrl}/cart/items`, { productId: product.id, packSize: pack.size, qty })
      .pipe(tap((items) => this._items.set(items)));
  }

  updateQty(id: string, qty: number): void {
    this.http
      .put<CartItem[]>(`${environment.apiBaseUrl}/cart/items/${encodeURIComponent(id)}`, { qty: Math.max(1, qty) })
      .subscribe({ next: (items) => this._items.set(items), error: () => {} });
  }

  remove(id: string): void {
    this.http
      .delete<CartItem[]>(`${environment.apiBaseUrl}/cart/items/${encodeURIComponent(id)}`)
      .subscribe({ next: (items) => this._items.set(items), error: () => {} });
  }

  refresh(): void {
    this.http.get<CartItem[]>(`${environment.apiBaseUrl}/cart`).subscribe({ next: (items) => this._items.set(items), error: () => {} });
  }

  clearLocal(): void {
    this._items.set([]);
  }

  private redirectToLogin(): void {
    window.location.href = environment.ssoLoginUrl;
  }
}
