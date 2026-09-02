import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';
import { environment } from '../../environments/environment';

export interface SubmittedReview {
  id: string;
  status: string;
}

@Injectable({ providedIn: 'root' })
export class ReviewService {
  constructor(private http: HttpClient) {}

  submit(productId: string, payload: { rating: number; comment: string }): Observable<SubmittedReview> {
    return this.http.post<SubmittedReview>(
      `${environment.apiBaseUrl}/products/${encodeURIComponent(productId)}/reviews`,
      payload,
    );
  }
}
