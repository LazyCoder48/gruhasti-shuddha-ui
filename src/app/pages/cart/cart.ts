import { Component, computed, signal } from '@angular/core';
import { RouterLink } from '@angular/router';
import { Navbar } from '../../layout/navbar/navbar';
import { Footer } from '../../layout/footer/footer';
import { CartService } from '../../core/cart';
import { CouponService } from '../../core/coupon';

@Component({
  selector: 'app-cart',
  imports: [RouterLink, Navbar, Footer],
  templateUrl: './cart.html',
  styleUrl: './cart.scss',
})
export class Cart {
  couponInput = signal('');
  appliedCoupon = signal<string | null>(null);
  discount = signal(0);
  couponError = signal('');
  couponChecking = signal(false);

  readonly total = computed(() => Math.max(0, this.cart.subtotal() - this.discount()));

  constructor(readonly cart: CartService, private couponService: CouponService) {}

  applyCoupon(): void {
    const code = this.couponInput().trim();
    if (!code) {
      return;
    }
    this.couponError.set('');
    this.couponChecking.set(true);
    this.couponService.validate(code).subscribe({
      next: (preview) => {
        this.couponChecking.set(false);
        if (preview.valid) {
          this.appliedCoupon.set(preview.code);
          this.discount.set(preview.discountAmount);
          this.couponError.set('');
          this.cart.appliedCouponCode.set(preview.code);
        } else {
          this.appliedCoupon.set(null);
          this.discount.set(0);
          this.couponError.set(preview.message);
        }
      },
      error: () => {
        this.couponChecking.set(false);
        this.couponError.set('Could not validate coupon. Please try again.');
      },
    });
  }

  removeCoupon(): void {
    this.appliedCoupon.set(null);
    this.discount.set(0);
    this.couponInput.set('');
    this.couponError.set('');
    this.cart.appliedCouponCode.set(null);
  }
}
