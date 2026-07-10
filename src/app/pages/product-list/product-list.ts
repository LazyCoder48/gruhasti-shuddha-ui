import { Component, computed, signal } from '@angular/core';
import { ActivatedRoute, RouterLink } from '@angular/router';
import { Navbar } from '../../layout/navbar/navbar';
import { Footer } from '../../layout/footer/footer';
import { ProductService, ShuddhaProduct } from '../../core/product';
import { CartService } from '../../core/cart';
import { WishlistService } from '../../core/wishlist';

const PAGE_SIZE = 6;

@Component({
  selector: 'app-product-list',
  imports: [RouterLink, Navbar, Footer],
  templateUrl: './product-list.html',
  styleUrl: './product-list.scss',
})
export class ProductList {
  readonly sortOptions = [
    { label: 'Popularity', value: 'popularity' },
    { label: 'Price: Low to High', value: 'price_asc' },
    { label: 'Price: High to Low', value: 'price_desc' },
  ];

  searchQuery = signal('');
  selectedCategories = signal<Set<string>>(new Set());
  selectedPackSizes = signal<Set<string>>(new Set());
  maxPrice = signal(600);
  inStockOnly = signal(false);
  sortKey = signal('popularity');
  page = signal(1);

  readonly allPackSizes = ['500 g', '1 kg', '5 kg', '10 kg'];

  readonly filtered = computed<ShuddhaProduct[]>(() => {
    const q = this.searchQuery().toLowerCase();
    const cats = this.selectedCategories();
    const packs = this.selectedPackSizes();
    const max = this.maxPrice();
    const stockOnly = this.inStockOnly();

    let list = this.products.products().filter((p) => {
      if (q && !p.name.toLowerCase().includes(q)) return false;
      if (cats.size > 0 && !cats.has(p.category)) return false;
      if (packs.size > 0 && !p.packSizes.some((ps) => packs.has(ps.size))) return false;
      if (p.packSizes[0].price > max) return false;
      if (stockOnly && p.stockCount < 20) return false;
      return true;
    });

    if (this.sortKey() === 'price_asc') {
      list = [...list].sort((a, b) => a.packSizes[0].price - b.packSizes[0].price);
    } else if (this.sortKey() === 'price_desc') {
      list = [...list].sort((a, b) => b.packSizes[0].price - a.packSizes[0].price);
    }
    return list;
  });

  readonly totalPages = computed(() => Math.max(1, Math.ceil(this.filtered().length / PAGE_SIZE)));

  readonly pageNumbers = computed(() => Array.from({ length: this.totalPages() }, (_, i) => i + 1));

  readonly paged = computed<ShuddhaProduct[]>(() => {
    const start = (this.page() - 1) * PAGE_SIZE;
    return this.filtered().slice(start, start + PAGE_SIZE);
  });

  readonly activeFilterChips = computed(() => {
    const chips: { label: string; clear: () => void }[] = [];
    for (const c of this.selectedCategories()) {
      chips.push({ label: c, clear: () => this.toggleCategory(c) });
    }
    for (const p of this.selectedPackSizes()) {
      chips.push({ label: p, clear: () => this.togglePackSize(p) });
    }
    if (this.inStockOnly()) {
      chips.push({ label: 'In stock', clear: () => this.inStockOnly.set(false) });
    }
    return chips;
  });

  constructor(
    readonly products: ProductService,
    readonly cart: CartService,
    readonly wishlist: WishlistService,
    route: ActivatedRoute
  ) {
    route.queryParamMap.subscribe((params) => {
      const category = params.get('category');
      const q = params.get('q');
      this.selectedCategories.set(category ? new Set([category]) : new Set());
      this.searchQuery.set(q ?? '');
      this.page.set(1);
    });
  }

  toggleCategory(cat: string): void {
    const set = new Set(this.selectedCategories());
    set.has(cat) ? set.delete(cat) : set.add(cat);
    this.selectedCategories.set(set);
    this.page.set(1);
  }

  togglePackSize(size: string): void {
    const set = new Set(this.selectedPackSizes());
    set.has(size) ? set.delete(size) : set.add(size);
    this.selectedPackSizes.set(set);
    this.page.set(1);
  }

  clearAll(): void {
    this.selectedCategories.set(new Set());
    this.selectedPackSizes.set(new Set());
    this.inStockOnly.set(false);
    this.maxPrice.set(600);
    this.page.set(1);
  }

  goToPage(p: number): void {
    if (p >= 1 && p <= this.totalPages()) this.page.set(p);
  }

  addToCart(id: string): void {
    const product = this.products.getById(id);
    if (product) this.cart.add(product, product.packSizes[0]).subscribe({ error: () => {} });
  }

  isLowStock(id: string): boolean {
    const product = this.products.getById(id);
    return !!product && product.stockCount < 20;
  }

  cartQty(id: string): number {
    const product = this.products.getById(id);
    if (!product) return 0;
    const itemId = `${product.id}__${product.packSizes[0].size}`;
    return this.cart.items().find((i) => i.id === itemId)?.qty ?? 0;
  }

  incrementQty(id: string): void {
    const product = this.products.getById(id);
    if (!product) return;
    const itemId = `${product.id}__${product.packSizes[0].size}`;
    const existing = this.cart.items().find((i) => i.id === itemId);
    if (existing) {
      this.cart.updateQty(itemId, existing.qty + 1);
    } else {
      this.addToCart(id);
    }
  }

  decrementQty(id: string): void {
    const product = this.products.getById(id);
    if (!product) return;
    const itemId = `${product.id}__${product.packSizes[0].size}`;
    const existing = this.cart.items().find((i) => i.id === itemId);
    if (existing) {
      this.cart.updateQty(itemId, existing.qty - 1);
    }
  }

  toggleWishlist(id: string): void {
    this.wishlist.toggle(id);
  }
}
