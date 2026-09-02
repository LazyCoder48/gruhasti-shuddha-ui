import { Component, computed } from '@angular/core';
import { RouterLink } from '@angular/router';
import { Navbar } from '../../layout/navbar/navbar';
import { Footer } from '../../layout/footer/footer';
import { ProductService } from '../../core/product';
import { CartService } from '../../core/cart';
import { CategoryService } from '../../core/category';

const FEATURED_COUNT = 4;

const CATEGORY_IMAGE_MAP: Record<string, string> = {
  'Whole wheat': 'https://placehold.co/200x140/F3E4BE/8A6B1E?text=Whole+wheat',
  'Multigrain': 'https://placehold.co/200x140/EFDCAE/6E5423?text=Multigrain',
  'Besan & gram': 'https://placehold.co/200x140/F6ECD6/6E5C3C?text=Besan',
  'Rava & sooji': 'https://placehold.co/200x140/EEDFB8/7A5B22?text=Rava',
  'Rice flour': 'https://placehold.co/200x140/F6ECD6/6E5C3C?text=Rice+flour',
};

const FALLBACK_CATEGORY_IMAGE = 'https://placehold.co/200x140/F3E4BE/8A6B1E?text=Flour';

@Component({
  selector: 'app-home',
  imports: [RouterLink, Navbar, Footer],
  templateUrl: './home.html',
  styleUrl: './home.scss',
})
export class Home {
  readonly valueProps = [
    { icon: 'pi-clock', title: 'Stone-milled daily', subtitle: 'Ground the morning you order' },
    { icon: 'pi-truck', title: 'Same-day delivery', subtitle: 'To your door in the society' },
    { icon: 'pi-shield', title: 'Residents-only prices', subtitle: 'Verified Provident Kenworth' },
  ];

  readonly featured = computed(() => {
    const all = this.products.products();
    const featured = all.filter((p) => p.featured);
    if (featured.length >= FEATURED_COUNT) return featured.slice(0, FEATURED_COUNT);
    const fillers = all.filter((p) => !p.featured).slice(0, FEATURED_COUNT - featured.length);
    return [...featured, ...fillers];
  });

  constructor(
    readonly products: ProductService,
    readonly cart: CartService,
    readonly categoryService: CategoryService
  ) {}

  categoryImage(name: string): string {
    return CATEGORY_IMAGE_MAP[name] ?? FALLBACK_CATEGORY_IMAGE;
  }

  addToCart(id: string): void {
    const product = this.products.getById(id);
    if (product) this.cart.add(product, product.packSizes[0]).subscribe({ error: () => {} });
  }

  isLowStock(id: string): boolean {
    const product = this.products.getById(id);
    return !!product && product.lowStock;
  }
}
