import { Component, computed, signal } from '@angular/core';
import { RouterLink } from '@angular/router';
import { Navbar } from '../../layout/navbar/navbar';
import { Footer } from '../../layout/footer/footer';
import { CartService } from '../../core/cart';

const COUPON_CODE = 'FRESH10';
const COUPON_DISCOUNT = 30;

@Component({
  selector: 'app-cart',
  imports: [RouterLink, Navbar, Footer],
  templateUrl: './cart.html',
  styleUrl: './cart.scss',
})
export class Cart {
  couponInput = signal('');
  appliedCoupon = signal<string | null>(null);

  readonly discount = computed(() => (this.appliedCoupon() ? COUPON_DISCOUNT : 0));
  readonly total = computed(() => Math.max(0, this.cart.subtotal() - this.discount()));

  constructor(readonly cart: CartService) {}

  applyCoupon(): void {
    if (this.couponInput().trim().toUpperCase() === COUPON_CODE) {
      this.appliedCoupon.set(COUPON_CODE);
    }
  }

  removeCoupon(): void {
    this.appliedCoupon.set(null);
    this.couponInput.set('');
  }
}
