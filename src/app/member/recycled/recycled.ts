import { Component, computed, inject } from '@angular/core';
import { AuthService } from '../../services/auth.service';
import { DataService } from '../../services/data.service';
import { TranslatePipe } from '../../services/translate.pipe';

@Component({
  selector: 'app-recycled',
  imports: [TranslatePipe],
  template: `
    <h2 class="mb">{{ 'recycled.title' | t }}</h2>

    <div class="card">
      <div class="card-title">♻️ {{ 'recycled.recycled' | t }}</div>
      @if (recycled().length === 0) {
        <div class="empty"><span class="emoji">♻️</span>{{ 'recycled.emptyRecycled' | t }}</div>
      } @else {
        <table class="table">
          <thead><tr><th>{{ 'common.group' | t }}</th><th>{{ 'common.groupPhoto' | t }}</th><th>{{ 'common.status' | t }}</th></tr></thead>
          <tbody>
            @for (it of recycled(); track it.id) {
              <tr>
                <td>
                  {{ it.cbz }}
                  @if (it.cardName || it.cardNo) {
                    <span class="text-muted">／{{ it.cardName }}{{ it.cardNo ? ' #' + it.cardNo : '' }}</span>
                  }
                </td>
                <td><div class="thumb" [style.background]="it.groupPhoto">{{ it.cbz.slice(0, 5) }}</div></td>
                <td><span class="badge badge-info">{{ 'recycled.recycled' | t }}</span></td>
              </tr>
            }
          </tbody>
        </table>
      }
    </div>

    <div class="card mt-2">
      <div class="card-title">💰 {{ 'recycled.exchanged' | t }}</div>
      @if (exchanged().length === 0) {
        <div class="empty"><span class="emoji">💰</span>{{ 'recycled.emptyExchanged' | t }}</div>
      } @else {
        <table class="table">
          <thead><tr><th>{{ 'common.group' | t }}</th><th>{{ 'common.groupPhoto' | t }}</th><th>{{ 'common.status' | t }}</th></tr></thead>
          <tbody>
            @for (it of exchanged(); track it.id) {
              <tr>
                <td>
                  {{ it.cbz }}
                  @if (it.cardName || it.cardNo) {
                    <span class="text-muted">／{{ it.cardName }}{{ it.cardNo ? ' #' + it.cardNo : '' }}</span>
                  }
                </td>
                <td><div class="thumb" [style.background]="it.groupPhoto">{{ it.cbz.slice(0, 5) }}</div></td>
                <td><span class="badge badge-success">{{ 'recycled.exchanged' | t }}（{{ it.exchangeValue }} {{ 'common.yuan' | t }}）</span></td>
              </tr>
            }
          </tbody>
        </table>
      }
    </div>
  `,
  styles: [`.mb { margin-bottom: 18px; }`],
})
export class Recycled {
  private data = inject(DataService);
  private auth = inject(AuthService);
  private memberId = this.auth.currentUser()!.id;

  recycled = computed(() =>
    this.data.items().filter((i) => i.memberId === this.memberId && i.status === 'recycled')
  );
  exchanged = computed(() =>
    this.data.items().filter((i) => i.memberId === this.memberId && i.status === 'exchanged')
  );
}
