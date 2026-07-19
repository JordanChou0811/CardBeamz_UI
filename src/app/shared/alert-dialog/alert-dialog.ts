import { Component, inject } from '@angular/core';
import { AlertService } from '../../services/alert.service';
import { TranslatePipe } from '../../services/translate.pipe';

@Component({
  selector: 'app-alert-dialog',
  imports: [TranslatePipe],
  template: `
    @if (alert.pending(); as p) {
      <div class="modal-backdrop" (click)="alert.dismiss()">
        <div
          class="modal alert-modal"
          (click)="$event.stopPropagation()"
          role="alertdialog"
          aria-modal="true"
        >
          <h3>{{ p.title | t }}</h3>
          <div class="modal-body">{{ p.message | t }}</div>
          @if (p.detail) {
            <div class="detail">{{ p.detail }}</div>
          }
          <div class="modal-actions">
            <button type="button" class="btn btn-primary" (click)="alert.dismiss()">
              {{ 'common.ok' | t }}
            </button>
          </div>
        </div>
      </div>
    }
  `,
  styles: [
    `
      .alert-modal {
        max-width: 420px;
        text-align: left;
      }
      .alert-modal h3 {
        text-align: left;
      }
      .alert-modal .modal-body {
        line-height: 1.55;
        color: var(--c-text);
      }
      .alert-modal .detail {
        margin-top: 8px;
        font-size: 13px;
        color: var(--c-muted);
        word-break: break-word;
      }
      .alert-modal .modal-actions {
        justify-content: flex-end;
      }
    `,
  ],
})
export class AlertDialog {
  protected alert = inject(AlertService);
}
