import { Component, inject } from '@angular/core';
import { ConfirmService } from '../../services/confirm.service';
import { TranslatePipe } from '../../services/translate.pipe';

@Component({
  selector: 'app-confirm-dialog',
  imports: [TranslatePipe],
  template: `
    @if (confirm.pending(); as p) {
      <div class="modal-backdrop" (click)="confirm.dismiss()">
        <div class="modal confirm-modal" (click)="$event.stopPropagation()" role="alertdialog" aria-modal="true">
          <h3>{{ p.title | t }}</h3>
          @if (p.message) {
            <div class="modal-body">{{ p.message }}</div>
          } @else {
            <div class="modal-body">{{ 'confirm.irreversible' | t }}</div>
          }
          <div class="modal-actions">
            <button type="button" class="btn btn-outline" (click)="confirm.dismiss()">
              {{ 'common.cancel' | t }}
            </button>
            <button
              type="button"
              class="btn"
              [class.btn-danger]="p.confirmTone !== 'primary'"
              [class.btn-primary]="p.confirmTone === 'primary'"
              (click)="confirm.accept()"
            >
              {{ p.confirmKey! | t }}
            </button>
          </div>
        </div>
      </div>
    }
  `,
  styles: [
    `
      .confirm-modal {
        max-width: 400px;
        text-align: left;
      }
      .confirm-modal h3 {
        text-align: left;
      }
      .confirm-modal .modal-actions {
        justify-content: flex-end;
      }
    `,
  ],
})
export class ConfirmDialog {
  protected confirm = inject(ConfirmService);
}
