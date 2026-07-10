import { Component, computed, signal } from '@angular/core';
import { ActivatedRoute, RouterLink } from '@angular/router';
import { Navbar } from '../../layout/navbar/navbar';
import { Footer } from '../../layout/footer/footer';
import { PackOption, ProductService } from '../../core/product';
import { CartService } from '../../core/cart';
import { WishlistService } from '../../core/wishlist';

@Component({
  selector: 'app-product-detail',
  imports: [RouterLink, Navbar, Footer],
  templateUrl: './product-detail.html',
  styleUrl: './product-detail.scss',
})
export class ProductDetail {
  private productId = signal<string | null>(null);
  private selectedPack = signal<PackOption | undefined>(undefined);
  quantity = signal(1);
  added = signal(false);

  readonly product = computed(() => {
    const id = this.productId();
    return id ? this.products.getById(id) : undefined;
  });

  readonly related = computed(() => {
    const id = this.productId();
    return id ? this.products.related(id) : [];
  });

  readonly effectivePack = computed(() => this.selectedPack() ?? this.product()?.packSizes[0]);

  readonly stars = computed(() => {
    const p = this.product();
    if (!p) return [];
    const full = Math.round(p.rating);
    return Array.from({ length: 5 }, (_, i) => i < full);
  });

  constructor(
    readonly products: ProductService,
    readonly cart: CartService,
    readonly wishlist: WishlistService,
    route: ActivatedRoute
  ) {
    route.paramMap.subscribe((params) => {
      this.productId.set(params.get('id'));
      this.selectedPack.set(undefined);
      this.quantity.set(1);
      this.added.set(false);
    });
  }

  selectPack(pack: PackOption): void {
    this.selectedPack.set(pack);
  }

  decrement(): void {
    this.quantity.update((q) => Math.max(1, q - 1));
  }

  increment(): void {
    this.quantity.update((q) => q + 1);
  }

  addToCart(): void {
    const p = this.product();
    const pack = this.effectivePack();
    if (!p || !pack) return;
    this.cart.add(p, pack, this.quantity()).subscribe({
      next: () => this.added.set(true),
      error: () => {},
    });
  }

  isLowStock(): boolean {
    const p = this.product();
    return !!p && p.stockCount < 20;
  }

  toggleWishlist(): void {
    const p = this.product();
    if (p) this.wishlist.toggle(p.id);
  }
}
