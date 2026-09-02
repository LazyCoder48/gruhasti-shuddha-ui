import { Component, computed, signal } from '@angular/core';
import { ActivatedRoute, RouterLink } from '@angular/router';
import { FormBuilder, FormGroup, ReactiveFormsModule, Validators } from '@angular/forms';
import { Navbar } from '../../layout/navbar/navbar';
import { Footer } from '../../layout/footer/footer';
import { PackOption, ProductService } from '../../core/product';
import { CartService } from '../../core/cart';
import { WishlistService } from '../../core/wishlist';
import { ReviewService } from '../../core/review';
import { AuthService } from '../../core/auth';

@Component({
  selector: 'app-product-detail',
  imports: [RouterLink, ReactiveFormsModule, Navbar, Footer],
  templateUrl: './product-detail.html',
  styleUrl: './product-detail.scss',
})
export class ProductDetail {
  private productId = signal<string | null>(null);
  private selectedPack = signal<PackOption | undefined>(undefined);
  quantity = signal(1);
  added = signal(false);

  reviewForm: FormGroup;
  reviewSubmitting = signal(false);
  reviewMessage = signal('');
  reviewError = signal('');

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
    readonly auth: AuthService,
    private reviewService: ReviewService,
    private fb: FormBuilder,
    route: ActivatedRoute
  ) {
    this.reviewForm = this.fb.group({
      rating: [0, [Validators.required, Validators.min(1), Validators.max(5)]],
      comment: ['', [Validators.required, Validators.maxLength(1000)]],
    });

    route.paramMap.subscribe((params) => {
      this.productId.set(params.get('id'));
      this.selectedPack.set(undefined);
      this.quantity.set(1);
      this.added.set(false);
      this.reviewForm.reset({ rating: 0, comment: '' });
      this.reviewSubmitting.set(false);
      this.reviewMessage.set('');
      this.reviewError.set('');
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
    return !!p && p.lowStock;
  }

  toggleWishlist(): void {
    const p = this.product();
    if (p) this.wishlist.toggle(p.id);
  }

  setReviewRating(value: number): void {
    this.reviewForm.patchValue({ rating: value });
  }

  submitReview(): void {
    if (this.reviewForm.invalid) {
      this.reviewForm.markAllAsTouched();
      return;
    }
    const p = this.product();
    if (!p) return;

    this.reviewSubmitting.set(true);
    this.reviewMessage.set('');
    this.reviewError.set('');

    const { rating, comment } = this.reviewForm.value;
    this.reviewService.submit(p.id, { rating, comment }).subscribe({
      next: (res) => {
        this.reviewSubmitting.set(false);
        this.reviewMessage.set(`Thanks — your review is ${res.status.toLowerCase()}.`);
        this.reviewForm.reset({ rating: 0, comment: '' });
      },
      error: (err) => {
        this.reviewSubmitting.set(false);
        this.reviewError.set(err.error?.message ?? 'Could not submit your review. Please try again.');
      },
    });
  }
}
