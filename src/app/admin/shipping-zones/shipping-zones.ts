import { Component, OnInit, signal } from '@angular/core';
import { FormBuilder, FormGroup, ReactiveFormsModule, Validators } from '@angular/forms';
import {
  AdminShippingZone,
  AdminShippingZoneRequest,
  AdminShippingZoneService,
} from '../../core/admin-shipping-zone';
import { AdminNav } from '../admin-nav/admin-nav';

@Component({
  selector: 'app-shipping-zones',
  imports: [ReactiveFormsModule, AdminNav],
  templateUrl: './shipping-zones.html',
  styleUrl: './shipping-zones.scss',
})
export class ShippingZones implements OnInit {
  zones = signal<AdminShippingZone[]>([]);
  loading = signal(true);
  errorMessage = signal('');
  saving = signal(false);

  formOpen = signal(false);
  editingId = signal<string | null>(null);

  form: FormGroup;

  constructor(private fb: FormBuilder, private adminShippingZoneService: AdminShippingZoneService) {
    this.form = this.fb.group({
      name: ['', Validators.required],
      pincodes: ['', Validators.required],
      deliveryFee: [0, [Validators.required, Validators.min(0)]],
      freeDeliveryThreshold: [''],
      active: [true],
    });
  }

  ngOnInit(): void {
    this.loadZones();
  }

  pincodeCount(zone: AdminShippingZone): number {
    return zone.pincodes.length;
  }

  openCreateForm(): void {
    this.editingId.set(null);
    this.form.reset({ name: '', pincodes: '', deliveryFee: 0, freeDeliveryThreshold: '', active: true });
    this.formOpen.set(true);
  }

  openEditForm(zone: AdminShippingZone): void {
    this.editingId.set(zone.id);
    this.form.reset({
      name: zone.name,
      pincodes: zone.pincodes.join('\n'),
      deliveryFee: zone.deliveryFee,
      freeDeliveryThreshold: zone.freeDeliveryThreshold ?? '',
      active: zone.active,
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
    const thresholdRaw = raw.freeDeliveryThreshold;
    const req: AdminShippingZoneRequest = {
      name: raw.name,
      pincodes: (raw.pincodes as string)
        .split(/[\n,]/)
        .map((s) => s.trim())
        .filter(Boolean),
      deliveryFee: raw.deliveryFee,
      freeDeliveryThreshold:
        thresholdRaw === '' || thresholdRaw === null || thresholdRaw === undefined
          ? null
          : Number(thresholdRaw),
      active: raw.active,
    };

    const editingId = this.editingId();
    const request$ = editingId
      ? this.adminShippingZoneService.update(editingId, req)
      : this.adminShippingZoneService.create(req);

    request$.subscribe({
      next: () => {
        this.saving.set(false);
        this.formOpen.set(false);
        this.loadZones();
      },
      error: (err) => {
        this.saving.set(false);
        this.errorMessage.set(err.error?.message ?? 'Could not save shipping zone.');
      },
    });
  }

  deleteZone(zone: AdminShippingZone): void {
    if (!confirm(`Delete "${zone.name}"? This cannot be undone.`)) {
      return;
    }
    this.adminShippingZoneService.delete(zone.id).subscribe({
      next: () => this.loadZones(),
      error: (err) => this.errorMessage.set(err.error?.message ?? 'Could not delete shipping zone.'),
    });
  }

  private loadZones(): void {
    this.loading.set(true);
    this.adminShippingZoneService.list().subscribe({
      next: (zones) => {
        this.zones.set(zones);
        this.loading.set(false);
      },
      error: () => this.loading.set(false),
    });
  }
}
