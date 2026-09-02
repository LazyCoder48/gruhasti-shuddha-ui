import { Component, OnInit, computed, signal } from '@angular/core';
import { DatePipe } from '@angular/common';
import { FormsModule } from '@angular/forms';
import {
  AdminOrder,
  AdminOrderService,
  ORDER_STATUS_TRANSITIONS,
  OrderStatus,
  PAYMENT_STATUS_TRANSITIONS,
  PaymentStatus,
} from '../../core/admin-order';
import { downloadCsv, toCsv } from '../../core/csv-export';
import { AdminNav } from '../admin-nav/admin-nav';

@Component({
  selector: 'app-order-management',
  imports: [DatePipe, FormsModule, AdminNav],
  templateUrl: './order-management.html',
  styleUrl: './order-management.scss',
})
export class OrderManagement implements OnInit {
  orders = signal<AdminOrder[]>([]);
  loading = signal(true);
  errorMessage = signal('');
  updatingId = signal<string | null>(null);
  expandedId = signal<string | null>(null);
  statusFilter = signal<OrderStatus | 'ALL'>('ALL');

  // Payment status override
  updatingPaymentId = signal<string | null>(null);
  private paymentNoteDrafts = new Map<string, string>();

  // Bulk actions
  selectedIds = signal<Set<string>>(new Set());
  bulkUpdating = signal(false);

  readonly statuses: OrderStatus[] = [
    'PLACED', 'PACKED', 'SHIPPED', 'OUT_FOR_DELIVERY', 'DELIVERED',
    'CANCELLED', 'RETURN_REQUESTED', 'RETURNED', 'REFUNDED',
  ];

  selectedOrders = computed(() => {
    const ids = this.selectedIds();
    return this.orders().filter((o) => ids.has(o.id));
  });

  selectedStatuses = computed(() => new Set(this.selectedOrders().map((o) => o.status)));

  canBulkUpdate = computed(() => this.selectedOrders().length > 0 && this.selectedStatuses().size === 1);

  bulkNextStatuses = computed<OrderStatus[]>(() => {
    if (!this.canBulkUpdate()) return [];
    const [commonStatus] = [...this.selectedStatuses()];
    return ORDER_STATUS_TRANSITIONS[commonStatus] ?? [];
  });

  constructor(private adminOrderService: AdminOrderService) {}

  ngOnInit(): void {
    this.loadOrders();
  }

  get filteredOrders(): AdminOrder[] {
    const filter = this.statusFilter();
    return filter === 'ALL' ? this.orders() : this.orders().filter((o) => o.status === filter);
  }

  get allVisibleSelected(): boolean {
    const visible = this.filteredOrders;
    return visible.length > 0 && visible.every((o) => this.selectedIds().has(o.id));
  }

  nextStatuses(order: AdminOrder): OrderStatus[] {
    return ORDER_STATUS_TRANSITIONS[order.status] ?? [];
  }

  toggleExpanded(order: AdminOrder): void {
    this.expandedId.set(this.expandedId() === order.id ? null : order.id);
  }

  updateStatus(order: AdminOrder, status: OrderStatus): void {
    this.updatingId.set(order.id);
    this.errorMessage.set('');
    this.adminOrderService.updateStatus(order.id, status).subscribe({
      next: (updated) => {
        this.orders.set(this.orders().map((o) => (o.id === updated.id ? updated : o)));
        this.updatingId.set(null);
      },
      error: (err) => {
        this.errorMessage.set(err.error?.message ?? 'Could not update order status.');
        this.updatingId.set(null);
      },
    });
  }

  // --- Payment status override ---

  paymentNextStatuses(order: AdminOrder): PaymentStatus[] {
    return PAYMENT_STATUS_TRANSITIONS[order.paymentStatus] ?? [];
  }

  paymentNoteDraft(order: AdminOrder): string {
    return this.paymentNoteDrafts.get(order.id) ?? '';
  }

  setPaymentNoteDraft(order: AdminOrder, value: string): void {
    this.paymentNoteDrafts.set(order.id, value);
  }

  updatePaymentStatus(order: AdminOrder, status: PaymentStatus): void {
    const note = this.paymentNoteDraft(order).trim();
    if (!note) return;
    this.updatingPaymentId.set(order.id);
    this.errorMessage.set('');
    this.adminOrderService.updatePaymentStatus(order.id, status, note).subscribe({
      next: (updated) => {
        this.orders.set(this.orders().map((o) => (o.id === updated.id ? updated : o)));
        this.paymentNoteDrafts.delete(order.id);
        this.updatingPaymentId.set(null);
      },
      error: (err) => {
        this.errorMessage.set(err.error?.message ?? 'Could not update payment status.');
        this.updatingPaymentId.set(null);
      },
    });
  }

  // --- Bulk actions ---

  isSelected(order: AdminOrder): boolean {
    return this.selectedIds().has(order.id);
  }

  toggleSelected(order: AdminOrder): void {
    const next = new Set(this.selectedIds());
    if (next.has(order.id)) {
      next.delete(order.id);
    } else {
      next.add(order.id);
    }
    this.selectedIds.set(next);
  }

  toggleSelectAllVisible(): void {
    const visible = this.filteredOrders;
    const next = new Set(this.selectedIds());
    if (this.allVisibleSelected) {
      visible.forEach((o) => next.delete(o.id));
    } else {
      visible.forEach((o) => next.add(o.id));
    }
    this.selectedIds.set(next);
  }

  clearSelection(): void {
    this.selectedIds.set(new Set());
  }

  applyBulkStatus(status: OrderStatus): void {
    const orderIds = [...this.selectedIds()];
    if (orderIds.length === 0) return;
    this.bulkUpdating.set(true);
    this.errorMessage.set('');
    this.adminOrderService.bulkUpdateStatus(orderIds, status).subscribe({
      next: (result) => {
        const updatedById = new Map(result.updated.map((o) => [o.id, o]));
        this.orders.set(this.orders().map((o) => updatedById.get(o.id) ?? o));
        if (result.failed.length > 0) {
          this.errorMessage.set(
            `Some orders could not be updated: ${result.failed.map((f) => `${f.orderId} (${f.reason})`).join('; ')}`
          );
        }
        this.clearSelection();
        this.bulkUpdating.set(false);
      },
      error: (err) => {
        this.errorMessage.set(err.error?.message ?? 'Could not bulk update orders.');
        this.bulkUpdating.set(false);
      },
    });
  }

  // --- CSV export ---

  exportCsv(): void {
    const columns = [
      { key: 'idShort', label: 'Order ID (short)' },
      { key: 'idFull', label: 'Order ID (full)' },
      { key: 'createdAt', label: 'Created' },
      { key: 'status', label: 'Status' },
      { key: 'paymentMethod', label: 'Payment Method' },
      { key: 'paymentStatus', label: 'Payment Status' },
      { key: 'customerEmail', label: 'Customer Email' },
      { key: 'items', label: 'Items' },
      { key: 'subtotal', label: 'Subtotal' },
      { key: 'discount', label: 'Discount' },
      { key: 'couponCode', label: 'Coupon Code' },
      { key: 'deliveryFee', label: 'Delivery Fee' },
      { key: 'finalAmount', label: 'Final Amount' },
      { key: 'addressLabel', label: 'Address Label' },
      { key: 'addressLine1', label: 'Address Line 1' },
      { key: 'addressLine2', label: 'Address Line 2' },
      { key: 'addressCity', label: 'City' },
      { key: 'addressState', label: 'State' },
      { key: 'addressPincode', label: 'Pincode' },
    ];

    const rows = this.filteredOrders.map((o) => ({
      idShort: o.id.slice(-8).toUpperCase(),
      idFull: o.id,
      createdAt: o.createdAt,
      status: o.status,
      paymentMethod: o.paymentMethod,
      paymentStatus: o.paymentStatus,
      customerEmail: o.customerEmail,
      items: o.items.map((i) => `${i.name} (${i.packagingSize}) x${i.quantity}`).join('; '),
      subtotal: o.subtotal,
      discount: o.discountOffered,
      couponCode: o.couponCode ?? '',
      deliveryFee: o.deliveryFee,
      finalAmount: o.finalAmount,
      addressLabel: o.deliveryAddress.label,
      addressLine1: o.deliveryAddress.line1,
      addressLine2: o.deliveryAddress.line2 ?? '',
      addressCity: o.deliveryAddress.city,
      addressState: o.deliveryAddress.state,
      addressPincode: o.deliveryAddress.pincode,
    }));

    const csv = toCsv(rows, columns);
    const filter = this.statusFilter();
    downloadCsv(`orders-export-${filter === 'ALL' ? 'ALL' : filter}.csv`, csv);
  }

  private loadOrders(): void {
    this.loading.set(true);
    this.adminOrderService.list().subscribe({
      next: (orders) => {
        this.orders.set(orders);
        this.loading.set(false);
      },
      error: () => this.loading.set(false),
    });
  }
}
