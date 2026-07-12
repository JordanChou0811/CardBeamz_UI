import { Component, computed, inject, signal } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { DataService } from '../../services/data.service';
import { Member } from '../../models/models';
import { TranslatePipe } from '../../services/translate.pipe';

@Component({
  selector: 'app-members-admin',
  imports: [FormsModule, TranslatePipe],
  template: `
    <h2 class="mb">{{ 'amembers.title' | t }}</h2>

    <div class="card">
      <div class="card-title">{{ 'amembers.list' | t }}</div>
      <table class="table">
        <thead>
          <tr>
            <th>{{ 'amembers.no' | t }}</th>
            <th>{{ 'common.name' | t }}</th>
            <th>{{ 'amembers.accountPhone' | t }}</th>
            <th>{{ 'amembers.credit' | t }}</th>
            <th style="width:120px">{{ 'amembers.action' | t }}</th>
          </tr>
        </thead>
        <tbody>
          @for (m of members(); track m.id) {
            <tr>
              <td><b>{{ m.id }}</b></td>
              <td>{{ m.name }}</td>
              <td>{{ m.account }}</td>
              <td><b class="credit">{{ m.credit }} {{ 'common.yuan' | t }}</b></td>
              <td>
                <button class="btn btn-outline btn-sm" (click)="openEdit(m)">{{ 'amembers.editCredit' | t }}</button>
              </td>
            </tr>
          }
        </tbody>
      </table>
    </div>

    @if (editing()) {
      <div class="modal-backdrop">
        <div class="modal">
          <h3>{{ 'amembers.editCredit' | t }}</h3>
          <div class="modal-body">
            {{ 'amembers.member' | t }}：{{ editing()?.name }}（{{ editing()?.id }}）
            <div class="field mt-1" style="text-align:left">
              <label>{{ 'amembers.creditAmount' | t }}</label>
              <input type="number" [(ngModel)]="amount" />
            </div>
          </div>
          <div class="modal-actions">
            <button class="btn btn-outline" (click)="editing.set(null)">{{ 'common.cancel' | t }}</button>
            <button class="btn btn-primary" (click)="saveCredit()">{{ 'common.save' | t }}</button>
          </div>
        </div>
      </div>
    }
  `,
  styles: [
    `
      .mb {
        margin-bottom: 18px;
      }
      .credit {
        color: var(--c-primary);
      }
    `,
  ],
})
export class MembersAdmin {
  private data = inject(DataService);

  members = computed(() => this.data.members().filter((m) => m.role === 'member'));

  editing = signal<Member | null>(null);
  amount = 0;

  constructor() {
    void this.data.refreshMembers();
  }

  openEdit(m: Member) {
    this.amount = m.credit;
    this.editing.set(m);
  }

  async saveCredit() {
    const m = this.editing();
    if (m) {
      await this.data.updateMemberCredit(m.id, Number(this.amount) || 0);
    }
    this.editing.set(null);
  }
}
