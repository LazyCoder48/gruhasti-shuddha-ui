import { Component, OnInit, signal, WritableSignal } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { RouterLink, RouterLinkActive } from '@angular/router';
import {
  AdminEmailTemplate,
  AdminEmailTemplateService,
  EmailTemplateType,
  headerImageUrl,
  UpdateEmailTemplateRequest,
} from '../../core/admin-email-template';

interface EmailTemplateDraft {
  subject: string;
  heading: string;
  bodyText: string;
  buttonLabel: string;
  buttonUrl: string;
}

function emptyDraft(): EmailTemplateDraft {
  return { subject: '', heading: '', bodyText: '', buttonLabel: '', buttonUrl: '' };
}

@Component({
  selector: 'app-email-templates',
  imports: [FormsModule, RouterLink, RouterLinkActive],
  templateUrl: './email-templates.html',
  styleUrl: './email-templates.scss',
})
export class EmailTemplates implements OnInit {
  loading = signal(true);
  errorMessage = signal('');

  orderPlaced = signal<EmailTemplateDraft>(emptyDraft());
  orderStatusUpdate = signal<EmailTemplateDraft>(emptyDraft());

  savingOrderPlaced = signal(false);
  savingOrderStatusUpdate = signal(false);
  savedOrderPlaced = signal(false);
  savedOrderStatusUpdate = signal(false);

  orderPlacedHeaderImagePresent = signal(false);
  orderStatusUpdateHeaderImagePresent = signal(false);
  orderPlacedHeaderImageSrc = signal(headerImageUrl('ORDER_PLACED'));
  orderStatusUpdateHeaderImageSrc = signal(headerImageUrl('ORDER_STATUS_UPDATE'));
  uploadingOrderPlacedHeaderImage = signal(false);
  uploadingOrderStatusUpdateHeaderImage = signal(false);

  constructor(private adminEmailTemplateService: AdminEmailTemplateService) {}

  ngOnInit(): void {
    this.loadTemplates();
  }

  updateOrderPlacedField(field: keyof EmailTemplateDraft, value: string): void {
    this.orderPlaced.update((d) => ({ ...d, [field]: value }));
  }

  updateOrderStatusUpdateField(field: keyof EmailTemplateDraft, value: string): void {
    this.orderStatusUpdate.update((d) => ({ ...d, [field]: value }));
  }

  saveOrderPlaced(): void {
    this.save('ORDER_PLACED', this.orderPlaced(), this.savingOrderPlaced, this.savedOrderPlaced);
  }

  saveOrderStatusUpdate(): void {
    this.save('ORDER_STATUS_UPDATE', this.orderStatusUpdate(), this.savingOrderStatusUpdate, this.savedOrderStatusUpdate);
  }

  onHeaderImageSelected(type: EmailTemplateType, event: Event): void {
    const file = (event.target as HTMLInputElement).files?.[0];
    if (!file) {
      return;
    }
    const { presence, uploading, src } = this.headerImageSignals(type);
    uploading.set(true);
    this.errorMessage.set('');
    this.adminEmailTemplateService.uploadHeaderImage(type, file).subscribe({
      next: () => {
        uploading.set(false);
        presence.set(true);
        src.set(`${headerImageUrl(type)}?t=${Date.now()}`);
      },
      error: (err) => {
        uploading.set(false);
        this.errorMessage.set(err.error?.message ?? 'Could not upload the header image.');
      },
    });
    (event.target as HTMLInputElement).value = '';
  }

  removeHeaderImage(type: EmailTemplateType): void {
    const { presence, uploading } = this.headerImageSignals(type);
    uploading.set(true);
    this.errorMessage.set('');
    this.adminEmailTemplateService.removeHeaderImage(type).subscribe({
      next: () => {
        uploading.set(false);
        presence.set(false);
      },
      error: (err) => {
        uploading.set(false);
        this.errorMessage.set(err.error?.message ?? 'Could not remove the header image.');
      },
    });
  }

  private headerImageSignals(type: EmailTemplateType): {
    presence: WritableSignal<boolean>;
    uploading: WritableSignal<boolean>;
    src: WritableSignal<string>;
  } {
    return type === 'ORDER_PLACED'
      ? {
          presence: this.orderPlacedHeaderImagePresent,
          uploading: this.uploadingOrderPlacedHeaderImage,
          src: this.orderPlacedHeaderImageSrc,
        }
      : {
          presence: this.orderStatusUpdateHeaderImagePresent,
          uploading: this.uploadingOrderStatusUpdateHeaderImage,
          src: this.orderStatusUpdateHeaderImageSrc,
        };
  }

  private save(
    type: EmailTemplateType,
    draft: EmailTemplateDraft,
    saving: WritableSignal<boolean>,
    saved: WritableSignal<boolean>,
  ): void {
    const req: UpdateEmailTemplateRequest = { ...draft };
    saving.set(true);
    saved.set(false);
    this.errorMessage.set('');
    this.adminEmailTemplateService.update(type, req).subscribe({
      next: () => {
        saving.set(false);
        saved.set(true);
        setTimeout(() => saved.set(false), 2500);
      },
      error: (err) => {
        saving.set(false);
        this.errorMessage.set(err.error?.message ?? 'Could not save this email template.');
      },
    });
  }

  private loadTemplates(): void {
    this.loading.set(true);
    this.adminEmailTemplateService.list().subscribe({
      next: (templates) => {
        const placed = templates.find((t) => t.type === 'ORDER_PLACED');
        const statusUpdate = templates.find((t) => t.type === 'ORDER_STATUS_UPDATE');
        if (placed) {
          this.orderPlaced.set(toDraft(placed));
          this.orderPlacedHeaderImagePresent.set(placed.headerImagePresent);
        }
        if (statusUpdate) {
          this.orderStatusUpdate.set(toDraft(statusUpdate));
          this.orderStatusUpdateHeaderImagePresent.set(statusUpdate.headerImagePresent);
        }
        this.loading.set(false);
      },
      error: (err) => {
        this.errorMessage.set(err.error?.message ?? 'Could not load email templates.');
        this.loading.set(false);
      },
    });
  }
}

function toDraft(t: AdminEmailTemplate): EmailTemplateDraft {
  return {
    subject: t.subject,
    heading: t.heading,
    bodyText: t.bodyText,
    buttonLabel: t.buttonLabel,
    buttonUrl: t.buttonUrl,
  };
}
