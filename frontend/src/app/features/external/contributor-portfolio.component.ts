import { Component, inject, OnInit, signal } from '@angular/core';
import { ActivatedRoute, RouterLink } from '@angular/router';
import { ApiService } from '../../core/http/api.service';

@Component({
  selector: 'app-contributor-portfolio',
  standalone: true,
  imports: [RouterLink],
  template: `
    <div class="ext-page">
      <div class="ext-header">
        <div class="brand">
          <div class="brand-mark">i</div>
          <span class="brand-name">Blue<span class="accent">[i]</span> Property</span>
        </div>
        <div class="header-text">
          <h1>Your assigned locations</h1>
          <p class="subtitle">Please complete the values collection form for each location below.</p>
        </div>
      </div>

      <div class="progress-summary">
        <div class="prog-item">
          <div class="prog-count">{{ assignments().length }}</div>
          <div class="prog-label">Total</div>
        </div>
        <div class="prog-item">
          <div class="prog-count green">{{ completed().length }}</div>
          <div class="prog-label">Completed</div>
        </div>
        <div class="prog-item">
          <div class="prog-count orange">{{ pending().length }}</div>
          <div class="prog-label">Remaining</div>
        </div>
      </div>

      @if (loading()) {
        <div class="loading-state"><i class="pi pi-spin pi-spinner"></i> Loading your assignments…</div>
      } @else if (assignments().length === 0) {
        <div class="empty-state">No assignments found for this link.</div>
      } @else {
        <div class="locations-list">
          @for (a of assignments(); track a.id) {
            <a class="location-card" [routerLink]="['/ext', token, 'locations', a.id]"
              [class.done]="a.status === 'submitted' || a.status === 'approved'">
              <div class="location-status-dot" [class]="statusClass(a.status)"></div>
              <div class="location-info">
                <div class="location-address">{{ a.property_address || 'Location ' + (assignments().indexOf(a) + 1) }}</div>
                <div class="location-meta">
                  {{ a.property_city || '' }}{{ a.property_city && a.property_state ? ', ' : '' }}{{ a.property_state || '' }}
                </div>
              </div>
              <div class="location-right">
                <span class="status-label" [class]="'status-' + a.status">{{ statusLabel(a.status) }}</span>
                <i class="pi pi-chevron-right arrow"></i>
              </div>
            </a>
          }
        </div>

        @if (allComplete()) {
          <div class="all-done-banner">
            <i class="pi pi-check-circle"></i>
            All locations completed. Thank you for submitting your property values!
          </div>
        }
      }
    </div>
  `,
  styles: [`
    .ext-page { min-height: 100vh; background: var(--bg); padding: 24px; max-width: 640px; margin: 0 auto; }
    .ext-header { margin-bottom: 24px; }
    .brand { display: flex; align-items: center; gap: 8px; margin-bottom: 20px; }
    .brand-mark { width: 22px; height: 22px; border-radius: 5px; background: linear-gradient(135deg, #0E1116 0%, #2E4BFF 100%); color: #fff; font-weight: 700; font-size: 11px; display: flex; align-items: center; justify-content: center; }
    .brand-name { font-size: 13px; font-weight: 600; color: var(--ink-1); }
    .accent { color: var(--accent); }
    h1 { margin: 0 0 4px; font-size: 22px; }
    .subtitle { color: var(--ink-4); font-size: 13px; margin: 0; }

    .progress-summary { display: flex; gap: 20px; padding: 16px 20px; background: var(--surface); border: 1px solid var(--border); border-radius: var(--r-lg); margin-bottom: 20px; }
    .prog-item { }
    .prog-count { font-size: 24px; font-weight: 700; color: var(--ink-1); }
    .prog-count.green { color: var(--positive); }
    .prog-count.orange { color: #f59e0b; }
    .prog-label { font-size: 11px; text-transform: uppercase; letter-spacing: .04em; color: var(--ink-4); font-weight: 500; margin-top: 2px; }

    .loading-state, .empty-state { padding: 40px; text-align: center; color: var(--ink-4); font-size: 14px; }

    .locations-list { display: flex; flex-direction: column; gap: 8px; margin-bottom: 20px; }
    .location-card { display: flex; align-items: center; gap: 14px; padding: 16px 18px; background: var(--surface); border: 1px solid var(--border); border-radius: var(--r-lg); text-decoration: none; color: inherit; transition: box-shadow .15s, border-color .15s; }
    .location-card:hover { border-color: var(--border-strong); box-shadow: var(--shadow-md); }
    .location-card.done { opacity: .8; }

    .location-status-dot { width: 10px; height: 10px; border-radius: 50%; flex-shrink: 0; }
    .dot-pending { background: #d1d5db; }
    .dot-in_progress { background: #3b82f6; }
    .dot-submitted, .dot-approved { background: var(--positive); }
    .dot-rejected { background: var(--danger); }

    .location-info { flex: 1; }
    .location-address { font-size: 14px; font-weight: 500; color: var(--ink-1); }
    .location-meta { font-size: 12px; color: var(--ink-4); margin-top: 2px; }

    .location-right { display: flex; align-items: center; gap: 10px; }
    .status-label { font-size: 11px; font-weight: 500; padding: 2px 8px; border-radius: 999px; text-transform: capitalize; }
    .status-pending { background: #f3f4f6; color: var(--ink-3); }
    .status-in_progress { background: #eff6ff; color: #2563eb; }
    .status-submitted { background: #f3e8ff; color: #7c3aed; }
    .status-approved { background: var(--positive-soft); color: var(--positive); }
    .status-rejected { background: var(--danger-soft); color: var(--danger); }
    .arrow { color: var(--ink-4); font-size: 12px; }

    .all-done-banner { display: flex; align-items: center; gap: 10px; padding: 16px 20px; background: var(--positive-soft); color: var(--positive); border-radius: var(--r-lg); font-size: 14px; font-weight: 500; }
    .all-done-banner i { font-size: 18px; }
  `],
})
export class ContributorPortfolioComponent implements OnInit {
  private route = inject(ActivatedRoute);
  private api = inject(ApiService);

  token = '';
  assignments = signal<any[]>([]);
  loading = signal(true);

  completed = () => this.assignments().filter(a => a.status === 'submitted' || a.status === 'approved');
  pending = () => this.assignments().filter(a => a.status !== 'submitted' && a.status !== 'approved');
  allComplete = () => this.assignments().length > 0 && this.pending().length === 0;

  ngOnInit(): void {
    this.token = this.route.snapshot.paramMap.get('token')!;
    this.api.getExternalAssignments().subscribe({
      next: a => { this.assignments.set(a); this.loading.set(false); },
      error: () => this.loading.set(false),
    });
  }

  statusLabel(status: string): string {
    const labels: Record<string, string> = {
      pending: 'Not started',
      in_progress: 'In progress',
      submitted: 'Submitted',
      approved: 'Approved',
      rejected: 'Rejected',
    };
    return labels[status] || status;
  }

  statusClass(status: string): string {
    return 'dot-' + status;
  }
}
