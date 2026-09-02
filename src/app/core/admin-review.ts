import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';
import { environment } from '../../environments/environment';

export type ReviewStatus = 'PENDING' | 'APPROVED' | 'REJECTED';

export interface AdminReview {
  id: string;
  productId: string;
  productName: string;
  initials: string;
  name: string;
  reviewerEmail: string;
  rating: number;
  comment: string;
  submittedAt: string | null;
  status: ReviewStatus;
}

@Injectable({ providedIn: 'root' })
export class AdminReviewService {
  private readonly base = `${environment.apiBaseUrl}/admin/reviews`;

  constructor(private http: HttpClient) {}

  list(status?: ReviewStatus): Observable<AdminReview[]> {
    if (!status) {
      return this.http.get<AdminReview[]>(this.base);
    }
    return this.http.get<AdminReview[]>(this.base, { params: { status } });
  }

  updateStatus(productId: string, reviewId: string, status: ReviewStatus): Observable<AdminReview> {
    return this.http.put<AdminReview>(
      `${this.base}/${encodeURIComponent(productId)}/${encodeURIComponent(reviewId)}/status`,
      { status },
    );
  }

  delete(productId: string, reviewId: string): Observable<void> {
    return this.http.delete<void>(
      `${this.base}/${encodeURIComponent(productId)}/${encodeURIComponent(reviewId)}`,
    );
  }
}
