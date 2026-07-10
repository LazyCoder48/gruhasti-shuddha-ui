import { Component, computed } from '@angular/core';
import { RouterLink } from '@angular/router';
import { Navbar } from '../../layout/navbar/navbar';
import { Footer } from '../../layout/footer/footer';
import { ProductService } from '../../core/product';
import { CartService } from '../../core/cart';

@Component({
  selector: 'app-home',
  imports: [RouterLink, Navbar, Footer],
  templateUrl: './home.html',
  styleUrl: './home.scss',
})
export class Home {
  readonly categoryTiles = [
    { label: 'Whole wheat', image: 'https://placehold.co/200x140/F3E4BE/8A6B1E?text=Whole+wheat' },
    { label: 'Multigrain', image: 'https://placehold.co/200x140/EFDCAE/6E5423?text=Multigrain' },
    { label: 'Besan & gram', image: 'https://placehold.co/200x140/F6ECD6/6E5C3C?text=Besan' },
    { label: 'Rava & sooji', image: 'https://placehold.co/200x140/EEDFB8/7A5B22?text=Rava' },
    { label: 'Rice flour', image: 'https://placehold.co/200x140/F6ECD6/6E5C3C?text=Rice+flour' },
  ];

  readonly valueProps = [
    { icon: 'pi-clock', title: 'Stone-milled daily', subtitle: 'Ground the morning you order' },
    { icon: 'pi-truck', title: 'Same-day delivery', subtitle: 'To your door in the society' },
    { icon: 'pi-shield', title: 'Residents-only prices', subtitle: 'Verified Provident Kenworth' },
  ];

  readonly featured = computed(() => this.products.products().slice(0, 4));

  constructor(readonly products: ProductService, readonly cart: CartService) {}

  addToCart(id: string): void {
    const product = this.products.getById(id);
    if (product) this.cart.add(product, product.packSizes[0]).subscribe({ error: () => {} });
  }

  isLowStock(id: string): boolean {
    const product = this.products.getById(id);
    return !!product && product.stockCount < 20;
  }
}
