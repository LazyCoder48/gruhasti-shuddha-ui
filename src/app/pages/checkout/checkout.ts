import { Component, signal } from '@angular/core';
import { Router, RouterLink } from '@angular/router';
import { FormBuilder, FormGroup, ReactiveFormsModule, Validators } from '@angular/forms';
import { Navbar } from '../../layout/navbar/navbar';
import { Footer } from '../../layout/footer/footer';
import { CartService } from '../../core/cart';
import { OrderService, PaymentMethod } from '../../core/order';

@Component({
  selector: 'app-checkout',
  imports: [ReactiveFormsModule, RouterLink, Navbar, Footer],
  templateUrl: './checkout.html',
  styleUrl: './checkout.scss',
})
export class Checkout {
  placing = signal(false);
  errorMessage = signal('');

  form: FormGroup;

  constructor(
    private fb: FormBuilder,
    private router: Router,
    private orderService: OrderService,
    readonly cart: CartService
  ) {
    this.form = this.fb.group({
      label: ['Home', Validators.required],
      line1: ['', Validators.required],
      line2: [''],
      city: ['', Validators.required],
      state: ['', Validators.required],
      pincode: ['', [Validators.required, Validators.pattern(/^[0-9]{6}$/)]],
      paymentMethod: ['UPI' as PaymentMethod, Validators.required],
      couponCode: [''],
    });
  }

  placeOrder(): void {
    if (this.form.invalid || this.cart.items().length === 0) {
      this.form.markAllAsTouched();
      return;
    }
    this.placing.set(true);
    this.errorMessage.set('');

    const { label, line1, line2, city, state, pincode, paymentMethod, couponCode } = this.form.value;
    this.orderService
      .placeOrder({
        paymentMethod,
        deliveryAddress: { label, line1, line2, city, state, pincode },
        couponCode: couponCode || null,
      })
      .subscribe({
        next: () => {
          this.cart.clearLocal();
          this.router.navigate(['/orders']);
        },
        error: (err) => {
          this.errorMessage.set(err.error?.message ?? 'Could not place order. Please try again.');
          this.placing.set(false);
        },
      });
  }
}
