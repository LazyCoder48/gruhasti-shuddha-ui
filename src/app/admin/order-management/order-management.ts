import { Component, OnInit, signal } from '@angular/core';
import { DatePipe } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { RouterLink, RouterLinkActive } from '@angular/router';
import { AdminOrder, AdminOrderService, ORDER_STATUS_TRANSITIONS, OrderStatus } from '../../core/admin-order';

@Component({
  selector: 'app-order-management',
  imports: [RouterLink, RouterLinkActive, DatePipe, FormsModule],
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

  readonly statuses: OrderStatus[] = [
    'PLACED', 'PACKED', 'SHIPPED', 'OUT_FOR_DELIVERY', 'DELIVERED',
    'CANCELLED', 'RETURN_REQUESTED', 'RETURNED', 'REFUNDED',
  ];

  constructor(private adminOrderService: AdminOrderService) {}

  ngOnInit(): void {
    this.loadOrders();
  }

  get filteredOrders(): AdminOrder[] {
    const filter = this.statusFilter();
    return filter === 'ALL' ? this.orders() : this.orders().filter((o) => o.status === filter);
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
