import { Component, computed, signal } from '@angular/core';
import { Router, RouterLink } from '@angular/router';
import { FormBuilder, FormGroup, ReactiveFormsModule, Validators } from '@angular/forms';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';
import { debounceTime, distinctUntilChanged, filter, map, switchMap } from 'rxjs';
import { Navbar } from '../../layout/navbar/navbar';
import { Footer } from '../../layout/footer/footer';
import { CartService } from '../../core/cart';
import { OrderService, PaymentMethod, DeliveryFeeQuote } from '../../core/order';
import { CouponService, CouponPreview } from '../../core/coupon';

@Component({
  selector: 'app-checkout',
  imports: [ReactiveFormsModule, RouterLink, Navbar, Footer],
  templateUrl: './checkout.html',
  styleUrl: './checkout.scss',
})
export class Checkout {
  placing = signal(false);
  errorMessage = signal('');

  couponChecking = signal(false);
  couponError = signal('');
  couponPreview = signal<CouponPreview | null>(null);

  deliveryQuote = signal<DeliveryFeeQuote | null>(null);

  readonly discount = computed(() => {
    const preview = this.couponPreview();
    return preview?.valid ? preview.discountAmount : 0;
  });

  readonly deliveryFee = computed(() => this.deliveryQuote()?.fee ?? 0);

  readonly total = computed(() =>
    Math.max(0, this.cart.subtotal() - this.discount() + this.deliveryFee())
  );

  form: FormGroup;

  constructor(
    private fb: FormBuilder,
    private router: Router,
    private orderService: OrderService,
    private couponService: CouponService,
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

    const prefillCoupon = this.cart.appliedCouponCode();
    if (prefillCoupon) {
      this.form.get('couponCode')!.setValue(prefillCoupon);
      this.validateCoupon(prefillCoupon);
    }

    this.form
      .get('couponCode')!
      .valueChanges.pipe(
        map((value) => (value ?? '').trim()),
        debounceTime(400),
        distinctUntilChanged(),
        takeUntilDestroyed()
      )
      .subscribe((code) => {
        if (!code) {
          this.couponPreview.set(null);
          this.couponError.set('');
          return;
        }
        this.validateCoupon(code);
      });

    this.form
      .get('pincode')!
      .valueChanges.pipe(
        debounceTime(400),
        distinctUntilChanged(),
        filter((value) => /^[0-9]{6}$/.test(value ?? '')),
        switchMap((pincode) => this.orderService.quoteDeliveryFee(pincode, this.cart.subtotal())),
        takeUntilDestroyed()
      )
      .subscribe({
        next: (quote) => this.deliveryQuote.set(quote),
        error: () => this.deliveryQuote.set(null),
      });
  }

  private validateCoupon(code: string): void {
    this.couponChecking.set(true);
    this.couponService.validate(code).subscribe({
      next: (preview) => {
        this.couponChecking.set(false);
        this.couponPreview.set(preview);
        this.couponError.set(preview.valid ? '' : preview.message);
      },
      error: () => {
        this.couponChecking.set(false);
        this.couponPreview.set(null);
        this.couponError.set('Could not validate coupon.');
      },
    });
  }

  placeOrder(): void {
    if (this.form.invalid || this.cart.items().length === 0) {
      this.form.markAllAsTouched();
      return;
    }
    this.placing.set(true);
    this.errorMessage.set('');
    this.couponError.set('');

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
          this.cart.appliedCouponCode.set(null);
          this.router.navigate(['/orders']);
        },
        error: (err) => {
          const message = err.error?.message ?? 'Could not place order. Please try again.';
          if ((couponCode ?? '').trim()) {
            this.couponError.set(message);
          } else {
            this.errorMessage.set(message);
          }
          this.placing.set(false);
        },
      });
  }
}
