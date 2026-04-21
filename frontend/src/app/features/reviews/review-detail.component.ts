import { Component, inject, OnInit, signal } from '@angular/core';
import { ActivatedRoute, RouterLink, Router } from '@angular/router';
import { FormsModule } from '@angular/forms';
import { ApiService } from '../../core/http/api.service';

@Component({
  selector: 'app-review-detail',
  standalone: true,
  imports: [RouterLink, FormsModule],
  template: `
    <div class="page-pad">
      <div class="page-header">
        <div class="header-left">
          <a class="back-link" routerLink="/reviews"><i class="pi pi-chevron-left"></i> Reviews</a>
          <h1>Submission review</h1>
          @if (submission()) {
            <p class="subtitle">
              {{ submission().assignee_name || 'External contributor' }}
              &nbsp;·&nbsp;
              {{ submission().property_address || 'Unknown location' }}
            </p>
          }
        </div>
        @if (submission()?.material_change) {
          <div class="material-flag">
            <i class="pi pi-exclamation-triangle"></i>
            Material change detected — TIV delta {{ submission().tiv_delta_pct?.toFixed(1) }}%
          </div>
        }
      </div>

      @if (loading()) {
        <div class="loading-state"><i class="pi pi-spin pi-spinner"></i> Loading submission…</div>
      } @else if (!submission()) {
        <div class="empty-state">Submission not found.</div>
      } @else {
        <!-- TIV Summary -->
        <div class="tiv-strip">
          <div class="tiv-item">
            <div class="tiv-label">Building TIV</div>
            <div class="tiv-value">{{ formatTiv(submission().data?.building_tiv) }}</div>
          </div>
          <div class="tiv-item">
            <div class="tiv-label">Contents TIV</div>
            <div class="tiv-value">{{ formatTiv(submission().data?.contents_tiv) }}</div>
          </div>
          <div class="tiv-item">
            <div class="tiv-label">BI 12 months</div>
            <div class="tiv-value">{{ formatTiv(submission().data?.bi_12mo) }}</div>
          </div>
          <div class="tiv-item highlight">
            <div class="tiv-label">Total TIV</div>
            <div class="tiv-value">{{ formatTiv(submission().total_tiv) }}</div>
          </div>
          @if (submission().prior_tiv) {
            <div class="tiv-item" [class.danger]="(submission().tiv_delta_pct || 0) > 10">
              <div class="tiv-label">Prior TIV</div>
              <div class="tiv-value">{{ formatTiv(submission().prior_tiv) }}</div>
            </div>
            <div class="tiv-item" [class.danger]="(submission().tiv_delta_pct || 0) > 10"
              [class.positive]="(submission().tiv_delta_pct || 0) <= 10">
              <div class="tiv-label">Change</div>
              <div class="tiv-value delta">
                {{ (submission().tiv_delta_pct || 0) >= 0 ? '+' : '' }}{{ (submission().tiv_delta_pct || 0).toFixed(1) }}%
              </div>
            </div>
          }
        </div>

        <!-- Data comparison table -->
        <div class="section-title-row">
          <h2>Submission data</h2>
          @if (submission().prior_data) {
            <span class="comparison-note">Highlighted cells differ from prior year</span>
          }
        </div>

        <div class="card table-wrap">
          <table class="data-table">
            <thead>
              <tr>
                <th>Field</th>
                <th>Current submission</th>
                @if (submission().prior_data) {
                  <th>Prior year</th>
                }
              </tr>
            </thead>
            <tbody>
              @for (field of dataFields(); track field.key) {
                <tr [class.changed]="hasChanged(field.key)">
                  <td class="field-name">{{ field.label }}</td>
                  <td [class.changed-cell]="hasChanged(field.key)">{{ formatValue(submission().data?.[field.key]) }}</td>
                  @if (submission().prior_data) {
                    <td class="prior-cell">{{ formatValue(submission().prior_data?.[field.key]) }}</td>
                  }
                </tr>
              }
            </tbody>
          </table>
        </div>

        <!-- Attachments -->
        @if (submission().attachments?.length) {
          <div class="section-title-row" style="margin-top: 24px;">
            <h2>Attachments</h2>
          </div>
          <div class="attachments-list">
            @for (att of submission().attachments; track att.id) {
              <div class="attachment-item card">
                <i class="pi pi-file attachment-icon"></i>
                <div class="attachment-name">{{ att.filename }}</div>
                <div class="attachment-size">{{ formatSize(att.file_size) }}</div>
              </div>
            }
          </div>
        }

        <!-- Review action -->
        @if (submission().status === 'submitted') {
          <div class="review-action card">
            <h3>Decision</h3>
            <div class="decision-buttons">
              <button class="decision-btn approve" [class.selected]="decision() === 'approved'"
                (click)="decision.set('approved')">
                <i class="pi pi-check-circle"></i> Approve
              </button>
              <button class="decision-btn reject" [class.selected]="decision() === 'rejected'"
                (click)="decision.set('rejected')">
                <i class="pi pi-times-circle"></i> Reject
              </button>
            </div>
            @if (decision()) {
              <div class="decision-form">
                <div class="field">
                  <label>Reason code</label>
                  <select [(ngModel)]="reasonCode" class="form-input">
                    @if (decision() === 'approved') {
                      <option value="values_confirmed">Values confirmed</option>
                      <option value="minor_discrepancy_accepted">Minor discrepancy accepted</option>
                      <option value="manual_override">Manual override</option>
                    } @else {
                      <option value="insufficient_data">Insufficient data</option>
                      <option value="tiv_discrepancy">TIV discrepancy</option>
                      <option value="missing_attachments">Missing attachments</option>
                      <option value="data_quality">Data quality issues</option>
                    }
                  </select>
                </div>
                <div class="field">
                  <label>Notes (optional)</label>
                  <textarea [(ngModel)]="reviewNotes" class="form-textarea" rows="3" placeholder="Add context for the assignee…"></textarea>
                </div>
                <div class="action-row">
                  <button class="btn btn-ghost" (click)="decision.set('')">Cancel</button>
                  <button class="btn" [class.btn-approve]="decision() === 'approved'" [class.btn-reject]="decision() === 'rejected'"
                    (click)="submitReview()" [disabled]="submitting()">
                    {{ submitting() ? 'Saving…' : (decision() === 'approved' ? 'Approve submission' : 'Reject submission') }}
                  </button>
                </div>
              </div>
            }
          </div>
        } @else {
          <div class="reviewed-banner" [class]="'banner-' + submission().status">
            <i class="pi" [class]="submission().status === 'approved' ? 'pi-check-circle' : 'pi-times-circle'"></i>
            This submission was {{ submission().status }} on {{ formatDate(submission().reviewed_at) }}.
          </div>
        }
      }
    </div>
  `,
  styles: [`
    .page-header { display: flex; justify-content: space-between; align-items: flex-start; margin-bottom: 20px; }
    .back-link { display: inline-flex; align-items: center; gap: 4px; font-size: 13px; color: var(--ink-4); text-decoration: none; margin-bottom: 6px; }
    .back-link:hover { color: var(--ink-1); }
    .subtitle { color: var(--ink-4); font-size: 13px; margin-top: 4px; }
    .material-flag { display: flex; align-items: center; gap: 6px; padding: 10px 14px; background: #fff8e7; color: #b45309; border-radius: var(--r-md); font-size: 13px; font-weight: 500; }

    .loading-state { padding: 48px; text-align: center; color: var(--ink-4); }
    .empty-state { padding: 48px; text-align: center; color: var(--ink-4); }

    .tiv-strip { display: flex; gap: 0; background: var(--surface); border: 1px solid var(--border); border-radius: var(--r-lg); margin-bottom: 24px; overflow: hidden; }
    .tiv-item { flex: 1; padding: 14px 18px; border-right: 1px solid var(--border); }
    .tiv-item:last-child { border-right: none; }
    .tiv-item.highlight { background: var(--surface-2); }
    .tiv-item.danger .tiv-value { color: var(--danger); }
    .tiv-item.positive .tiv-value { color: var(--positive); }
    .tiv-label { font-size: 11px; text-transform: uppercase; letter-spacing: .04em; color: var(--ink-4); font-weight: 500; margin-bottom: 4px; }
    .tiv-value { font-size: 18px; font-weight: 600; color: var(--ink-1); }
    .tiv-value.delta { font-size: 20px; }

    .section-title-row { display: flex; align-items: baseline; gap: 12px; margin-bottom: 12px; }
    .section-title-row h2 { margin: 0; font-size: 15px; }
    .comparison-note { font-size: 12px; color: var(--ink-4); }

    .table-wrap { overflow: hidden; margin-bottom: 24px; }
    .data-table { width: 100%; border-collapse: collapse; }
    .data-table th { text-align: left; font-size: 11px; text-transform: uppercase; letter-spacing: .04em; color: var(--ink-4); font-weight: 600; padding: 10px 16px; border-bottom: 1px solid var(--border); }
    .data-table td { padding: 10px 16px; border-bottom: 1px solid var(--border); font-size: 13px; color: var(--ink-2); }
    .data-table tr:last-child td { border-bottom: none; }
    .data-table tr.changed td { background: #fffbeb; }
    .field-name { font-weight: 500; color: var(--ink-1); width: 200px; }
    .changed-cell { font-weight: 600; color: #b45309; }
    .prior-cell { color: var(--ink-4); }

    .attachments-list { display: flex; gap: 10px; flex-wrap: wrap; margin-bottom: 24px; }
    .attachment-item { display: flex; align-items: center; gap: 10px; padding: 12px 16px; }
    .attachment-icon { font-size: 18px; color: var(--ink-4); }
    .attachment-name { font-size: 13px; font-weight: 500; color: var(--ink-1); }
    .attachment-size { font-size: 12px; color: var(--ink-4); }

    .review-action { padding: 24px; margin-bottom: 24px; }
    .review-action h3 { margin: 0 0 16px; font-size: 15px; }
    .decision-buttons { display: flex; gap: 10px; margin-bottom: 20px; }
    .decision-btn { display: flex; align-items: center; gap: 8px; padding: 12px 20px; border-radius: var(--r-lg); border: 2px solid var(--border); background: var(--surface); font-size: 14px; font-weight: 500; cursor: pointer; transition: all .15s; }
    .decision-btn.approve:hover, .decision-btn.approve.selected { border-color: var(--positive); background: var(--positive-soft); color: var(--positive); }
    .decision-btn.reject:hover, .decision-btn.reject.selected { border-color: var(--danger); background: var(--danger-soft); color: var(--danger); }

    .decision-form { display: flex; flex-direction: column; gap: 14px; padding-top: 4px; border-top: 1px solid var(--border); }
    .field { display: flex; flex-direction: column; gap: 5px; }
    .field label { font-size: 12px; font-weight: 500; color: var(--ink-3); }
    .form-input { height: 38px; padding: 0 10px; border: 1px solid var(--border-strong); border-radius: var(--r-md); font-size: 13px; font-family: inherit; color: var(--ink-2); background: var(--surface); }
    .form-input:focus { outline: none; border-color: var(--accent); }
    .form-textarea { padding: 8px 10px; border: 1px solid var(--border-strong); border-radius: var(--r-md); font-size: 13px; font-family: inherit; color: var(--ink-2); background: var(--surface); resize: vertical; }
    .action-row { display: flex; gap: 8px; justify-content: flex-end; }

    .reviewed-banner { display: flex; align-items: center; gap: 8px; padding: 14px 18px; border-radius: var(--r-lg); font-size: 14px; font-weight: 500; margin-bottom: 24px; }
    .banner-approved { background: var(--positive-soft); color: var(--positive); }
    .banner-rejected { background: var(--danger-soft); color: var(--danger); }

    .btn { display: inline-flex; align-items: center; gap: 6px; height: 38px; padding: 0 16px; border-radius: var(--r-md); font-family: inherit; font-size: 13px; font-weight: 500; cursor: pointer; border: 1px solid transparent; text-decoration: none; transition: background .12s; }
    .btn-ghost { background: transparent; color: var(--ink-2); border-color: var(--border-strong); }
    .btn-ghost:hover { background: var(--surface-2); }
    .btn-approve { background: var(--positive); color: #fff; border: none; }
    .btn-approve:hover { opacity: .9; }
    .btn-reject { background: var(--danger); color: #fff; border: none; }
    .btn-reject:hover { opacity: .9; }
    .btn:disabled { opacity: .5; cursor: not-allowed; }
  `],
})
export class ReviewDetailComponent implements OnInit {
  private route = inject(ActivatedRoute);
  private router = inject(Router);
  private api = inject(ApiService);

  submissionId = '';
  submission = signal<any>(null);
  loading = signal(true);
  decision = signal('');
  reasonCode = 'values_confirmed';
  reviewNotes = '';
  submitting = signal(false);

  ngOnInit(): void {
    this.submissionId = this.route.snapshot.paramMap.get('submissionId')!;
    this.api.getSubmission(this.submissionId).subscribe({
      next: s => { this.submission.set(s); this.loading.set(false); },
      error: () => this.loading.set(false),
    });
  }

  dataFields() {
    return [
      { key: 'occupancy', label: 'Occupancy' },
      { key: 'construction', label: 'Construction' },
      { key: 'year_built', label: 'Year built' },
      { key: 'stories', label: 'Stories' },
      { key: 'total_area_sqft', label: 'Total area (sq ft)' },
      { key: 'building_tiv', label: 'Building TIV' },
      { key: 'contents_tiv', label: 'Contents TIV' },
      { key: 'bi_12mo', label: 'BI 12 months' },
      { key: 'sprinkler_type', label: 'Sprinkler type' },
      { key: 'roof_year', label: 'Roof year' },
      { key: 'roof_material', label: 'Roof material' },
    ];
  }

  hasChanged(key: string): boolean {
    const sub = this.submission();
    if (!sub?.prior_data) return false;
    return sub.data?.[key] !== sub.prior_data?.[key] && sub.prior_data?.[key] !== undefined;
  }

  submitReview(): void {
    this.submitting.set(true);
    this.api.submitReview(this.submissionId, {
      decision: this.decision() as 'approved' | 'rejected' | 'requested_info',
      reason_code: this.reasonCode,
      notes: this.reviewNotes,
    }).subscribe({
      next: () => this.router.navigate(['/reviews']),
      error: () => this.submitting.set(false),
    });
  }

  formatTiv(v: number | null | undefined): string {
    if (v == null) return '—';
    if (v >= 1_000_000) return '$' + (v / 1_000_000).toFixed(2) + 'M';
    if (v >= 1_000) return '$' + (v / 1_000).toFixed(0) + 'K';
    return '$' + v.toFixed(0);
  }

  formatValue(v: any): string {
    if (v == null) return '—';
    if (typeof v === 'number') return v.toLocaleString();
    return String(v);
  }

  formatDate(d: string): string {
    if (!d) return '—';
    return new Date(d).toLocaleDateString('en', { month: 'short', day: 'numeric', year: 'numeric' });
  }

  formatSize(bytes: number): string {
    if (!bytes) return '';
    if (bytes > 1024 * 1024) return (bytes / (1024 * 1024)).toFixed(1) + ' MB';
    return (bytes / 1024).toFixed(0) + ' KB';
  }
}
