import { Component, OnInit, signal } from '@angular/core';
import { RouterLink, RouterLinkActive } from '@angular/router';
import { AdminInventoryService, InventoryItem } from '../../core/admin-inventory';

const LOW_STOCK_THRESHOLD = 5;
const MEDIUM_STOCK_THRESHOLD = 15;

@Component({
  selector: 'app-inventory',
  imports: [RouterLink, RouterLinkActive],
  templateUrl: './inventory.html',
  styleUrl: './inventory.scss',
})
export class Inventory implements OnInit {
  items = signal<InventoryItem[]>([]);
  loading = signal(true);
  errorMessage = signal('');
  savingKey = signal<string | null>(null);
  drafts = new Map<string, number>();

  constructor(private adminInventoryService: AdminInventoryService) {}

  ngOnInit(): void {
    this.loadItems();
  }

  key(item: InventoryItem): string {
    return `${item.productId}__${item.size}`;
  }

  stockLevel(stock: number): 'low' | 'medium' | 'ok' {
    if (stock <= LOW_STOCK_THRESHOLD) return 'low';
    if (stock <= MEDIUM_STOCK_THRESHOLD) return 'medium';
    return 'ok';
  }

  draftValue(item: InventoryItem): number {
    const k = this.key(item);
    return this.drafts.has(k) ? this.drafts.get(k)! : item.currentStock;
  }

  setDraft(item: InventoryItem, value: string): void {
    this.drafts.set(this.key(item), Math.max(0, Number(value) || 0));
  }

  applyAdjustment(item: InventoryItem): void {
    const newStock = this.draftValue(item);
    const k = this.key(item);
    this.savingKey.set(k);
    this.errorMessage.set('');
    this.adminInventoryService.adjustStock(item.productId, item.size, newStock).subscribe({
      next: (updated) => {
        this.items.set(
          this.items()
            .map((i) => (this.key(i) === k ? updated : i))
            .sort((a, b) => a.currentStock - b.currentStock)
        );
        this.drafts.delete(k);
        this.savingKey.set(null);
      },
      error: (err) => {
        this.errorMessage.set(err.error?.message ?? 'Could not adjust stock.');
        this.savingKey.set(null);
      },
    });
  }

  private loadItems(): void {
    this.loading.set(true);
    this.adminInventoryService.list().subscribe({
      next: (items) => {
        this.items.set(items);
        this.loading.set(false);
      },
      error: () => this.loading.set(false),
    });
  }
}
