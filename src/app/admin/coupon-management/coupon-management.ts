import { Component, OnInit, signal } from '@angular/core';
import { FormBuilder, FormGroup, ReactiveFormsModule, Validators } from '@angular/forms';
import {
  AdminCoupon,
  AdminCouponRequest,
  AdminCouponService,
  DiscountType,
} from '../../core/admin-coupon';
import { AdminNav } from '../admin-nav/admin-nav';

@Component({
  selector: 'app-coupon-management',
  imports: [ReactiveFormsModule, AdminNav],
  templateUrl: './coupon-management.html',
  styleUrl: './coupon-management.scss',
})
export class CouponManagement implements OnInit {
  coupons = signal<AdminCoupon[]>([]);
  loading = signal(true);
  errorMessage = signal('');
  saving = signal(false);

  formOpen = signal(false);
  editingId = signal<string | null>(null);

  readonly discountTypes: DiscountType[] = ['PERCENTAGE', 'FLAT'];

  form: FormGroup;

  constructor(private fb: FormBuilder, private adminCouponService: AdminCouponService) {
    this.form = this.fb.group({
      code: ['', Validators.required],
      description: [''],
      discountType: ['PERCENTAGE' as DiscountType, Validators.required],
      discountValue: [0, [Validators.required, Validators.min(0.01)]],
      minOrderValue: [0, [Validators.min(0)]],
      maxDiscountAmount: [''],
      active: [true],
      expiresAt: [''],
      usageLimit: [''],
    });
  }

  ngOnInit(): void {
    this.loadCoupons();
  }

  discountLabel(coupon: AdminCoupon): string {
    return coupon.discountType === 'PERCENTAGE'
      ? `${coupon.discountValue}%`
      : `₹${coupon.discountValue}`;
  }

  usageLabel(coupon: AdminCoupon): string {
    return coupon.usageLimit != null
      ? `${coupon.usageCount} / ${coupon.usageLimit}`
      : `${coupon.usageCount}`;
  }

  expiryLabel(coupon: AdminCoupon): string {
    return coupon.expiresAt ? new Date(coupon.expiresAt).toLocaleDateString() : 'Never';
  }

  openCreateForm(): void {
    this.editingId.set(null);
    this.form.reset({
      code: '',
      description: '',
      discountType: 'PERCENTAGE',
      discountValue: 0,
      minOrderValue: 0,
      maxDiscountAmount: '',
      active: true,
      expiresAt: '',
      usageLimit: '',
    });
    this.formOpen.set(true);
  }

  openEditForm(coupon: AdminCoupon): void {
    this.editingId.set(coupon.id);
    this.form.reset({
      code: coupon.code,
      description: coupon.description,
      discountType: coupon.discountType,
      discountValue: coupon.discountValue,
      minOrderValue: coupon.minOrderValue,
      maxDiscountAmount: coupon.maxDiscountAmount ?? '',
      active: coupon.active,
      expiresAt: coupon.expiresAt ? coupon.expiresAt.substring(0, 10) : '',
      usageLimit: coupon.usageLimit ?? '',
    });
    this.formOpen.set(true);
  }

  cancelForm(): void {
    this.formOpen.set(false);
    this.editingId.set(null);
  }

  save(): void {
    if (this.form.invalid) {
      this.form.markAllAsTouched();
      return;
    }

    this.saving.set(true);
    this.errorMessage.set('');

    const raw = this.form.value;
    const req: AdminCouponRequest = {
      code: raw.code,
      description: raw.description,
      discountType: raw.discountType,
      discountValue: Number(raw.discountValue),
      minOrderValue: raw.minOrderValue === '' || raw.minOrderValue === null ? 0 : Number(raw.minOrderValue),
      maxDiscountAmount:
        raw.maxDiscountAmount === '' || raw.maxDiscountAmount === null
          ? null
          : Number(raw.maxDiscountAmount),
      active: raw.active,
      expiresAt: raw.expiresAt ? new Date(raw.expiresAt).toISOString() : null,
      usageLimit:
        raw.usageLimit === '' || raw.usageLimit === null ? null : Number(raw.usageLimit),
    };

    const editingId = this.editingId();
    const request$ = editingId
      ? this.adminCouponService.update(editingId, req)
      : this.adminCouponService.create(req);

    request$.subscribe({
      next: () => {
        this.saving.set(false);
        this.formOpen.set(false);
        this.loadCoupons();
      },
      error: (err) => {
        this.saving.set(false);
        this.errorMessage.set(err.error?.error ?? 'Could not save coupon.');
      },
    });
  }

  deleteCoupon(coupon: AdminCoupon): void {
    if (!confirm(`Delete coupon "${coupon.code}"? This cannot be undone.`)) {
      return;
    }
    this.adminCouponService.delete(coupon.id).subscribe({
      next: () => this.loadCoupons(),
      error: (err) => this.errorMessage.set(err.error?.error ?? 'Could not delete coupon.'),
    });
  }

  private loadCoupons(): void {
    this.loading.set(true);
    this.adminCouponService.list().subscribe({
      next: (coupons) => {
        this.coupons.set(coupons);
        this.loading.set(false);
      },
      error: () => this.loading.set(false),
    });
  }
}
