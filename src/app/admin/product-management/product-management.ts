import { Component, OnInit, signal } from '@angular/core';
import { RouterLink, RouterLinkActive } from '@angular/router';
import { FormArray, FormBuilder, FormGroup, ReactiveFormsModule, Validators } from '@angular/forms';
import {
  AdminProduct,
  AdminProductRequest,
  AdminProductService,
  AdminProductStatus,
} from '../../core/admin-product';

@Component({
  selector: 'app-product-management',
  imports: [ReactiveFormsModule, RouterLink, RouterLinkActive],
  templateUrl: './product-management.html',
  styleUrl: './product-management.scss',
})
export class ProductManagement implements OnInit {
  products = signal<AdminProduct[]>([]);
  loading = signal(true);
  errorMessage = signal('');
  saving = signal(false);

  formOpen = signal(false);
  editingId = signal<string | null>(null);

  readonly statuses: AdminProductStatus[] = ['ACTIVE', 'INACTIVE', 'OUT_OF_STOCK'];

  form: FormGroup;

  constructor(private fb: FormBuilder, private adminProductService: AdminProductService) {
    this.form = this.fb.group({
      name: ['', Validators.required],
      flourCategory: ['', Validators.required],
      tagline: [''],
      description: [''],
      longDescription: [''],
      images: [''],
      status: ['ACTIVE' as AdminProductStatus, Validators.required],
      packagingSizes: this.fb.array([this.newPackagingSizeGroup()]),
      specs: this.fb.array([]),
    });
  }

  ngOnInit(): void {
    this.loadProducts();
  }

  get packagingSizes(): FormArray {
    return this.form.get('packagingSizes') as FormArray;
  }

  get specs(): FormArray {
    return this.form.get('specs') as FormArray;
  }

  priceRange(product: AdminProduct): string {
    const prices = product.packagingSizes.map((p) => p.price);
    if (prices.length === 0) return '—';
    const min = Math.min(...prices);
    const max = Math.max(...prices);
    return min === max ? `₹${min}` : `₹${min} – ₹${max}`;
  }

  totalStock(product: AdminProduct): number {
    return product.packagingSizes.reduce((sum, p) => sum + p.currentStock, 0);
  }

  openCreateForm(): void {
    this.editingId.set(null);
    this.form.reset({ status: 'ACTIVE' });
    this.packagingSizes.clear();
    this.packagingSizes.push(this.newPackagingSizeGroup());
    this.specs.clear();
    this.formOpen.set(true);
  }

  openEditForm(product: AdminProduct): void {
    this.editingId.set(product.id);
    this.form.reset({
      name: product.name,
      flourCategory: product.flourCategory,
      tagline: product.tagline,
      description: product.description,
      longDescription: product.longDescription,
      images: product.images.join('\n'),
      status: product.status,
    });

    this.packagingSizes.clear();
    for (const ps of product.packagingSizes) {
      this.packagingSizes.push(this.newPackagingSizeGroup(ps));
    }
    if (product.packagingSizes.length === 0) {
      this.packagingSizes.push(this.newPackagingSizeGroup());
    }

    this.specs.clear();
    for (const spec of product.specs) {
      this.specs.push(this.newSpecGroup(spec));
    }

    this.formOpen.set(true);
  }

  cancelForm(): void {
    this.formOpen.set(false);
    this.editingId.set(null);
  }

  addPackagingSize(): void {
    this.packagingSizes.push(this.newPackagingSizeGroup());
  }

  removePackagingSize(index: number): void {
    if (this.packagingSizes.length > 1) {
      this.packagingSizes.removeAt(index);
    }
  }

  addSpec(): void {
    this.specs.push(this.newSpecGroup());
  }

  removeSpec(index: number): void {
    this.specs.removeAt(index);
  }

  save(): void {
    if (this.form.invalid) {
      this.form.markAllAsTouched();
      return;
    }

    this.saving.set(true);
    this.errorMessage.set('');

    const raw = this.form.value;
    const req: AdminProductRequest = {
      name: raw.name,
      flourCategory: raw.flourCategory,
      tagline: raw.tagline,
      description: raw.description,
      longDescription: raw.longDescription,
      images: (raw.images as string)
        .split('\n')
        .map((s) => s.trim())
        .filter(Boolean),
      packagingSizes: raw.packagingSizes,
      specs: raw.specs,
      status: raw.status,
    };

    const editingId = this.editingId();
    const request$ = editingId
      ? this.adminProductService.update(editingId, req)
      : this.adminProductService.create(req);

    request$.subscribe({
      next: () => {
        this.saving.set(false);
        this.formOpen.set(false);
        this.loadProducts();
      },
      error: (err) => {
        this.saving.set(false);
        this.errorMessage.set(err.error?.message ?? 'Could not save product.');
      },
    });
  }

  deleteProduct(product: AdminProduct): void {
    if (!confirm(`Delete "${product.name}"? This cannot be undone.`)) {
      return;
    }
    this.adminProductService.delete(product.id).subscribe({
      next: () => this.loadProducts(),
      error: (err) => this.errorMessage.set(err.error?.message ?? 'Could not delete product.'),
    });
  }

  private loadProducts(): void {
    this.loading.set(true);
    this.adminProductService.list().subscribe({
      next: (products) => {
        this.products.set(products);
        this.loading.set(false);
      },
      error: () => this.loading.set(false),
    });
  }

  private newPackagingSizeGroup(value?: Partial<AdminProduct['packagingSizes'][number]>): FormGroup {
    return this.fb.group({
      size: [value?.size ?? '', Validators.required],
      price: [value?.price ?? 0, [Validators.required, Validators.min(0)]],
      discountPercent: [value?.discountPercent ?? 0],
      currentStock: [value?.currentStock ?? 0, [Validators.required, Validators.min(0)]],
      sku: [value?.sku ?? ''],
    });
  }

  private newSpecGroup(value?: Partial<AdminProduct['specs'][number]>): FormGroup {
    return this.fb.group({
      label: [value?.label ?? '', Validators.required],
      value: [value?.value ?? '', Validators.required],
    });
  }
}
