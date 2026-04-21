import { Component, inject, OnInit, signal } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { ApiService } from '../../core/http/api.service';
import { AuthService } from '../../core/auth/auth.service';
import { Delegation } from '../../core/models/models';

@Component({
  selector: 'app-delegations-panel',
  standalone: true,
  imports: [FormsModule],
  template: `
    <div class="panel">
      <div class="panel-header">
        <h2>Delegations</h2>
        <p class="panel-desc">Configure out-of-office delegations and view your active delegations.</p>
      </div>

      <!-- OOO Section -->
      <div class="section-card card">
        <div class="section-head">
          <div>
            <div class="section-title">Out-of-office delegation</div>
            <div class="section-sub">Route all your assignments to a colleague while you're away.</div>
          </div>
          <button class="btn btn-ghost btn-sm" (click)="showOooForm = !showOooForm">
            <i class="pi pi-plus"></i> Set OOO
          </button>
        </div>

        @if (showOooForm) {
          <div class="ooo-form">
            <div class="form-row">
              <div class="field">
                <label>Delegate to (user ID)</label>
                <input type="text" [(ngModel)]="oooUserId" class="form-input" placeholder="User ID" />
              </div>
              <div class="field">
                <label>From</label>
                <input type="date" [(ngModel)]="oooStart" class="form-input" />
              </div>
              <div class="field">
                <label>To</label>
                <input type="date" [(ngModel)]="oooEnd" class="form-input" />
              </div>
            </div>
            <div class="form-actions">
              <button class="btn btn-ghost btn-sm" (click)="showOooForm = false">Cancel</button>
              <button class="btn btn-accent btn-sm" (click)="setOoo()" [disabled]="!oooUserId || !oooStart || !oooEnd">
                Activate OOO
              </button>
            </div>
          </div>
        }
      </div>

      <!-- Active delegations -->
      <div class="section-title-row">
        <h3>My active delegations</h3>
      </div>

      @if (loading()) {
        <div class="loading-sm">Loading…</div>
      } @else if (delegations().length === 0) {
        <div class="empty-sm">No active delegations.</div>
      } @else {
        <div class="delegations-list">
          @for (d of delegations(); track d.id) {
            <div class="delegation-row card">
              <div class="delegation-info">
                <div class="delegation-type">
                  <span class="level-badge">L{{ d.level }}</span>
                  {{ d.delegation_type === 'ooo_blanket' ? 'OOO Blanket' : 'Specific assignment' }}
                </div>
                <div class="delegation-to">To: <strong>{{ d.delegate_name }}</strong></div>
                @if (d.ooo_start) {
                  <div class="delegation-dates">{{ formatDate(d.ooo_start) }} – {{ formatDate(d.ooo_end!) }}</div>
                }
              </div>
              <div class="delegation-status">
                <span class="badge" [class]="d.is_active ? 'badge-active' : 'badge-inactive'">
                  {{ d.is_active ? 'Active' : 'Revoked' }}
                </span>
                @if (d.is_active) {
                  <button class="btn-text-danger" (click)="revoke(d.id)">Revoke</button>
                }
              </div>
            </div>
          }
        </div>
      }
    </div>
  `,
  styles: [`
    .panel { max-width: 640px; }
    .panel-header { margin-bottom: 24px; }
    .panel-header h2 { margin: 0 0 6px; }
    .panel-desc { font-size: 13px; color: var(--ink-4); margin: 0; }

    .section-card { padding: 18px; margin-bottom: 24px; }
    .section-head { display: flex; justify-content: space-between; align-items: flex-start; }
    .section-title { font-size: 14px; font-weight: 500; color: var(--ink-1); }
    .section-sub { font-size: 12px; color: var(--ink-4); margin-top: 2px; }

    .ooo-form { margin-top: 16px; padding-top: 16px; border-top: 1px solid var(--border); }
    .form-row { display: grid; grid-template-columns: 1fr 1fr 1fr; gap: 12px; margin-bottom: 12px; }
    .field { display: flex; flex-direction: column; gap: 4px; }
    .field label { font-size: 11px; font-weight: 500; color: var(--ink-4); }
    .form-input { height: 36px; padding: 0 10px; border: 1px solid var(--border-strong); border-radius: var(--r-md); font-size: 13px; font-family: inherit; color: var(--ink-2); background: var(--surface); }
    .form-input:focus { outline: none; border-color: var(--accent); }
    .form-actions { display: flex; gap: 8px; justify-content: flex-end; }

    .section-title-row { margin-bottom: 12px; }
    .section-title-row h3 { margin: 0; font-size: 14px; font-weight: 600; color: var(--ink-1); }

    .loading-sm, .empty-sm { font-size: 13px; color: var(--ink-4); padding: 16px 0; }

    .delegations-list { display: flex; flex-direction: column; gap: 8px; }
    .delegation-row { display: flex; justify-content: space-between; align-items: center; padding: 14px; }
    .delegation-info { }
    .delegation-type { display: flex; align-items: center; gap: 8px; font-size: 13px; font-weight: 500; color: var(--ink-1); margin-bottom: 3px; }
    .level-badge { font-size: 10px; font-weight: 600; color: var(--accent); background: var(--accent-soft); padding: 1px 6px; border-radius: 999px; }
    .delegation-to { font-size: 12px; color: var(--ink-3); }
    .delegation-dates { font-size: 11px; color: var(--ink-4); margin-top: 2px; }
    .delegation-status { display: flex; align-items: center; gap: 10px; }

    .badge { padding: 2px 8px; border-radius: 999px; font-size: 11px; font-weight: 500; }
    .badge-active { background: var(--accent-soft); color: var(--accent-ink); }
    .badge-inactive { background: var(--surface-3); color: var(--ink-4); }
    .btn-text-danger { background: none; border: none; cursor: pointer; font-size: 12px; color: var(--danger); padding: 0; }
    .btn-text-danger:hover { text-decoration: underline; }

    .btn { display: inline-flex; align-items: center; gap: 6px; height: 36px; padding: 0 14px; border-radius: var(--r-md); font-family: inherit; font-size: 13px; font-weight: 500; cursor: pointer; border: 1px solid transparent; text-decoration: none; transition: background .12s; }
    .btn-ghost { background: transparent; color: var(--ink-2); border-color: var(--border-strong); }
    .btn-ghost:hover { background: var(--surface-2); }
    .btn-accent { background: var(--accent); color: #fff; border: none; }
    .btn-accent:hover { background: var(--accent-hover); }
    .btn:disabled { opacity: .5; cursor: not-allowed; }
    .btn-sm { height: 30px; padding: 0 10px; font-size: 12px; }
  `],
})
export class DelegationsPanelComponent implements OnInit {
  private api = inject(ApiService);
  private auth = inject(AuthService);

  delegations = signal<Delegation[]>([]);
  loading = signal(true);
  showOooForm = false;
  oooUserId = '';
  oooStart = '';
  oooEnd = '';

  ngOnInit(): void {
    this.api.getMyDelegations().subscribe({
      next: d => { this.delegations.set(d); this.loading.set(false); },
      error: () => this.loading.set(false),
    });
  }

  setOoo(): void {
    const userId = this.auth.currentUser()?.id;
    if (!userId) return;
    this.api.setOooDelegation(userId, {
      delegate_to_id: this.oooUserId,
      ooo_start: this.oooStart,
      ooo_end: this.oooEnd,
    }).subscribe({
      next: d => {
        this.delegations.update(list => [d, ...list]);
        this.showOooForm = false;
        this.oooUserId = '';
        this.oooStart = '';
        this.oooEnd = '';
      },
    });
  }

  revoke(id: string): void {
    this.api.revokeDelegation(id).subscribe({
      next: () => {
        this.delegations.update(list =>
          list.map(d => d.id === id ? { ...d, is_active: false } : d)
        );
      },
    });
  }

  formatDate(d: string): string {
    return new Date(d).toLocaleDateString('en', { month: 'short', day: 'numeric', year: 'numeric' });
  }
}
