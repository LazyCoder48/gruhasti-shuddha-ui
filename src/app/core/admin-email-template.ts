import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';
import { environment } from '../../environments/environment';

export type EmailTemplateType = 'ORDER_PLACED' | 'ORDER_STATUS_UPDATE' | 'PRODUCT_ADDED';

export interface AdminEmailTemplate {
  id: string;
  type: EmailTemplateType;
  subject: string;
  heading: string;
  bodyText: string;
  buttonLabel: string;
  buttonUrl: string;
  enabled: boolean;
  headerImagePresent: boolean;
}

export interface UpdateEmailTemplateRequest {
  subject: string;
  heading: string;
  bodyText: string;
  buttonLabel: string;
  buttonUrl: string;
}

@Injectable({ providedIn: 'root' })
export class AdminEmailTemplateService {
  private readonly base = `${environment.apiBaseUrl}/admin/email-templates`;

  constructor(private http: HttpClient) {}

  list(): Observable<AdminEmailTemplate[]> {
    return this.http.get<AdminEmailTemplate[]>(this.base);
  }

  update(type: EmailTemplateType, req: UpdateEmailTemplateRequest): Observable<AdminEmailTemplate> {
    return this.http.put<AdminEmailTemplate>(`${this.base}/${encodeURIComponent(type)}`, req);
  }

  uploadHeaderImage(type: EmailTemplateType, file: File): Observable<AdminEmailTemplate> {
    const formData = new FormData();
    formData.append('file', file);
    return this.http.post<AdminEmailTemplate>(`${this.base}/${encodeURIComponent(type)}/header-image`, formData);
  }

  removeHeaderImage(type: EmailTemplateType): Observable<AdminEmailTemplate> {
    return this.http.delete<AdminEmailTemplate>(`${this.base}/${encodeURIComponent(type)}/header-image`);
  }
}

/** Public (unauthenticated) URL for a template's header image — matches the backend's public,
 *  non-/admin path so it also resolves correctly when embedded in the actual sent email. */
export function headerImageUrl(type: EmailTemplateType): string {
  return `${environment.apiBaseUrl}/email-templates/${encodeURIComponent(type)}/header-image`;
}
