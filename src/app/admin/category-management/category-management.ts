import { Component, OnInit, signal } from '@angular/core';
import { AdminCategory, AdminCategoryRequest, AdminCategoryService } from '../../core/admin-category';
import { AdminNav } from '../admin-nav/admin-nav';

interface CategoryDraft {
  name: string;
  displayOrder: number;
}

interface NewCategoryDraft {
  name: string;
  displayOrder: number;
  active: boolean;
}

function emptyNewDraft(): NewCategoryDraft {
  return { name: '', displayOrder: 0, active: true };
}

@Component({
  selector: 'app-category-management',
  imports: [AdminNav],
  templateUrl: './category-management.html',
  styleUrl: './category-management.scss',
})
export class CategoryManagement implements OnInit {
  categories = signal<AdminCategory[]>([]);
  loading = signal(true);
  errorMessage = signal('');
  savingId = signal<string | null>(null);
  deletingId = signal<string | null>(null);
  creating = signal(false);
  newDraft = signal<NewCategoryDraft>(emptyNewDraft());

  drafts = new Map<string, CategoryDraft>();

  constructor(private adminCategoryService: AdminCategoryService) {}

  ngOnInit(): void {
    this.loadCategories();
  }

  draftName(category: AdminCategory): string {
    return this.drafts.get(category.id)?.name ?? category.name;
  }

  draftDisplayOrder(category: AdminCategory): number {
    return this.drafts.get(category.id)?.displayOrder ?? category.displayOrder;
  }

  setDraftName(category: AdminCategory, value: string): void {
    const current = this.drafts.get(category.id) ?? { name: category.name, displayOrder: category.displayOrder };
    this.drafts.set(category.id, { ...current, name: value });
  }

  setDraftDisplayOrder(category: AdminCategory, value: string): void {
    const current = this.drafts.get(category.id) ?? { name: category.name, displayOrder: category.displayOrder };
    this.drafts.set(category.id, { ...current, displayOrder: Math.max(0, Number(value) || 0) });
  }

  hasDraftChanges(category: AdminCategory): boolean {
    const draft = this.drafts.get(category.id);
    if (!draft) {
      return false;
    }
    return draft.name !== category.name || draft.displayOrder !== category.displayOrder;
  }

  saveRow(category: AdminCategory): void {
    const draft = this.drafts.get(category.id);
    if (!draft) {
      return;
    }
    const name = draft.name.trim();
    if (!name) {
      this.errorMessage.set('Category name cannot be empty.');
      return;
    }
    const req: AdminCategoryRequest = { name, displayOrder: draft.displayOrder, active: category.active };
    this.savingId.set(category.id);
    this.errorMessage.set('');
    this.adminCategoryService.update(category.id, req).subscribe({
      next: (updated) => {
        this.categories.set(this.categories().map((c) => (c.id === updated.id ? updated : c)));
        this.drafts.delete(category.id);
        this.savingId.set(null);
      },
      error: (err) => {
        this.errorMessage.set(err.error?.message ?? 'Could not save this category.');
        this.savingId.set(null);
      },
    });
  }

  toggleActive(category: AdminCategory): void {
    const req: AdminCategoryRequest = { name: category.name, displayOrder: category.displayOrder, active: !category.active };
    this.savingId.set(category.id);
    this.errorMessage.set('');
    this.adminCategoryService.update(category.id, req).subscribe({
      next: (updated) => {
        this.categories.set(this.categories().map((c) => (c.id === updated.id ? updated : c)));
        this.savingId.set(null);
      },
      error: (err) => {
        this.errorMessage.set(err.error?.message ?? 'Could not update this category.');
        this.savingId.set(null);
      },
    });
  }

  deleteCategory(category: AdminCategory): void {
    if (!confirm(`Delete "${category.name}"? This cannot be undone.`)) {
      return;
    }
    this.deletingId.set(category.id);
    this.errorMessage.set('');
    this.adminCategoryService.delete(category.id).subscribe({
      next: () => {
        this.categories.set(this.categories().filter((c) => c.id !== category.id));
        this.drafts.delete(category.id);
        this.deletingId.set(null);
      },
      error: (err) => {
        this.deletingId.set(null);
        if (err.status === 409) {
          this.errorMessage.set(err.error?.message ?? 'This category is still in use by one or more products and cannot be deleted.');
        } else {
          this.errorMessage.set(err.error?.message ?? 'Could not delete this category.');
        }
      },
    });
  }

  updateNewDraftName(value: string): void {
    this.newDraft.update((d) => ({ ...d, name: value }));
  }

  updateNewDraftDisplayOrder(value: string): void {
    this.newDraft.update((d) => ({ ...d, displayOrder: Math.max(0, Number(value) || 0) }));
  }

  updateNewDraftActive(value: boolean): void {
    this.newDraft.update((d) => ({ ...d, active: value }));
  }

  addCategory(): void {
    const draft = this.newDraft();
    const name = draft.name.trim();
    if (!name) {
      this.errorMessage.set('Category name cannot be empty.');
      return;
    }
    const req: AdminCategoryRequest = { name, displayOrder: draft.displayOrder, active: draft.active };
    this.creating.set(true);
    this.errorMessage.set('');
    this.adminCategoryService.create(req).subscribe({
      next: (created) => {
        this.categories.set([...this.categories(), created].sort((a, b) => a.displayOrder - b.displayOrder));
        this.newDraft.set(emptyNewDraft());
        this.creating.set(false);
      },
      error: (err) => {
        this.errorMessage.set(err.error?.message ?? 'Could not create category.');
        this.creating.set(false);
      },
    });
  }

  private loadCategories(): void {
    this.loading.set(true);
    this.adminCategoryService.list().subscribe({
      next: (categories) => {
        this.categories.set(categories);
        this.loading.set(false);
      },
      error: (err) => {
        this.errorMessage.set(err.error?.message ?? 'Could not load categories.');
        this.loading.set(false);
      },
    });
  }
}
