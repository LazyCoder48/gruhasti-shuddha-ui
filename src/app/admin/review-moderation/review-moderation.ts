import { Component, OnInit, signal } from '@angular/core';
import { DatePipe } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { AdminReview, AdminReviewService, ReviewStatus } from '../../core/admin-review';
import { AdminNav } from '../admin-nav/admin-nav';

@Component({
  selector: 'app-review-moderation',
  imports: [DatePipe, FormsModule, AdminNav],
  templateUrl: './review-moderation.html',
  styleUrl: './review-moderation.scss',
})
export class ReviewModeration implements OnInit {
  reviews = signal<AdminReview[]>([]);
  loading = signal(true);
  errorMessage = signal('');
  updatingId = signal<string | null>(null);
  statusFilter = signal<ReviewStatus | 'ALL'>('PENDING');

  readonly statuses: ReviewStatus[] = ['PENDING', 'APPROVED', 'REJECTED'];

  constructor(private adminReviewService: AdminReviewService) {}

  ngOnInit(): void {
    this.loadReviews();
  }

  get filteredReviews(): AdminReview[] {
    const filter = this.statusFilter();
    return filter === 'ALL' ? this.reviews() : this.reviews().filter((r) => r.status === filter);
  }

  approve(review: AdminReview): void {
    this.setStatus(review, 'APPROVED');
  }

  reject(review: AdminReview): void {
    this.setStatus(review, 'REJECTED');
  }

  deleteReview(review: AdminReview): void {
    if (!confirm(`Delete this review by "${review.name}"? This cannot be undone.`)) {
      return;
    }
    this.updatingId.set(review.id);
    this.errorMessage.set('');
    this.adminReviewService.delete(review.productId, review.id).subscribe({
      next: () => {
        this.reviews.set(this.reviews().filter((r) => r.id !== review.id));
        this.updatingId.set(null);
      },
      error: (err) => {
        this.errorMessage.set(err.error?.message ?? 'Could not delete review.');
        this.updatingId.set(null);
      },
    });
  }

  private setStatus(review: AdminReview, status: ReviewStatus): void {
    this.updatingId.set(review.id);
    this.errorMessage.set('');
    this.adminReviewService.updateStatus(review.productId, review.id, status).subscribe({
      next: (updated) => {
        this.reviews.set(this.reviews().map((r) => (r.id === updated.id ? updated : r)));
        this.updatingId.set(null);
      },
      error: (err) => {
        this.errorMessage.set(err.error?.message ?? 'Could not update review status.');
        this.updatingId.set(null);
      },
    });
  }

  private loadReviews(): void {
    this.loading.set(true);
    this.adminReviewService.list().subscribe({
      next: (reviews) => {
        this.reviews.set(reviews);
        this.loading.set(false);
      },
      error: () => this.loading.set(false),
    });
  }
}
