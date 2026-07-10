import { Component } from '@angular/core';
import { RouterLink } from '@angular/router';
import { Navbar } from '../../layout/navbar/navbar';
import { Footer } from '../../layout/footer/footer';
import { WishlistItem, WishlistService } from '../../core/wishlist';
import { CartService } from '../../core/cart';
import { ProductService } from '../../core/product';

@Component({
  selector: 'app-wishlist',
  imports: [RouterLink, Navbar, Footer],
  templateUrl: './wishlist.html',
  styleUrl: './wishlist.scss',
})
export class Wishlist {
  constructor(
    readonly wishlist: WishlistService,
    private cart: CartService,
    private products: ProductService
  ) {}

  moveToCart(item: WishlistItem): void {
    const product = this.products.getById(item.productId);
    if (!product) return;
    const pack = product.packSizes.find((p) => p.size === item.packSize) ?? product.packSizes[0];
    this.cart.add(product, pack, 1).subscribe({
      next: () => this.wishlist.remove(item.productId),
      error: () => {},
    });
  }
}
