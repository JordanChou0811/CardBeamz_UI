import { Component, inject } from '@angular/core';
import { AuthService } from '../../services/auth.service';
import { TranslatePipe } from '../../services/translate.pipe';

@Component({
  selector: 'app-credit',
  imports: [TranslatePipe],
  template: `
    <h2 class="mb">{{ 'credit.title' | t }}</h2>

    <div class="card credit-card">
      <div class="label">{{ 'credit.balance' | t }}</div>
      <div class="amount">{{ auth.currentUser()?.credit ?? 0 }} <small>{{ 'common.yuan' | t }}</small></div>
    </div>

    <div class="card mt-2">
      <div class="card-title">📌 {{ 'credit.note' | t }}</div>
      <p class="text-muted" style="line-height:1.8">{{ 'credit.noteText' | t }}</p>
    </div>
  `,
  styles: [
    `
      .mb {
        margin-bottom: 18px;
      }
      .credit-card {
        background: linear-gradient(135deg, var(--c-primary), var(--c-accent));
        color: #fff;
      }
      .label {
        opacity: 0.9;
      }
      .amount {
        font-size: 46px;
        font-weight: 800;
        margin-top: 6px;
      }
      .amount small {
        font-size: 20px;
        font-weight: 600;
      }
    `,
  ],
})
export class Credit {
  protected auth = inject(AuthService);
}
