import { Component, inject, OnInit, signal, computed } from '@angular/core';
import { RouterLink } from '@angular/router';
import { FormsModule } from '@angular/forms';
import { ApiService } from '../../core/http/api.service';
import { ReviewQueueItem } from '../../core/models/models';

@Component({
  selector: 'app-review-queue',
  standalone: true,
  imports: [RouterLink, FormsModule],
  template: `
    <div class="page-pad">
      <div class="page-header">
        <div>
          <h1>Reviews</h1>
          <p class="subtitle">{{ pending().length }} pending &nbsp;·&nbsp; {{ flagged().length }} with material changes</p>
        </div>
      </div>

      <div class="toolbar">
        <div class="tabs">
          <button class="tab" [class.active]="showFlaggedOnly()" (click)="showFlaggedOnly.set(true)">
            <i class="pi pi-exclamation-triangle flag-icon"></i> Material changes
            @if (flagged().length) {
              <span class="tab-badge">{{ flagged().length }}</span>
            }
          </button>
          <button class="tab" [class.active]="!showFlaggedOnly()" (click)="showFlaggedOnly.set(false)">
            All pending
            <span class="tab-badge">{{ pending().length }}</span>
          </button>
        </div>
        <div class="search-wrap">
          <i class="pi pi-search search-icon"></i>
          <input class="search-input" placeholder="Search…" [(ngModel)]="searchQuery" />
        </div>
      </div>

      @if (loading()) {
        <div class="loading-state"><i class="pi pi-spin pi-spinner"></i> Loading…</div>
      } @else if (displayed().length === 0) {
        <div class="empty-state">
          <i class="pi pi-check-circle empty-icon"></i>
          <div class="empty-title">All caught up</div>
          <div class="empty-sub">No submissions awaiting review.</div>
        </div>
      } @else {
        <div class="review-list">
          @for (item of displayed(); track item.submission_id) {
            <a class="review-card card" [routerLink]="['/reviews', item.submission_id]">
              <div class="card-left">
                <div class="assignee-row">
                  <div class="assignee-name">{{ item.assignee_name || 'Unknown' }}</div>
                  @if (item.material_change) {
                    <span class="flag-badge"><i class="pi pi-exclamation-triangle"></i> Material change</span>
                  }
                </div>
                <div class="location">{{ item.property_address || '—' }}</div>
                <div class="meta-row">
                  <span><i class="pi pi-flag"></i> {{ item.campaign_name }}</span>
                  <span><i class="pi pi-calendar"></i> Submitted {{ item.submitted_at ? formatDate(item.submitted_at) : '—' }}</span>
                </div>
              </div>
              <div class="card-right">
                @if (item.tiv_delta_pct !== undefined && item.tiv_delta_pct !== null) {
                  <div class="tiv-delta" [class.positive]="item.tiv_delta_pct >= 0" [class.negative]="item.tiv_delta_pct < 0">
                    <div class="delta-value">{{ item.tiv_delta_pct >= 0 ? '+' : '' }}{{ item.tiv_delta_pct.toFixed(1) }}%</div>
                    <div class="delta-label">TIV change</div>
                  </div>
                }
                <div class="tiv-value">
                  <div class="tiv-amount">{{ formatTiv(item.total_tiv) }}</div>
                  <div class="tiv-label">Total TIV</div>
                </div>
                <i class="pi pi-chevron-right arrow"></i>
              </div>
            </a>
          }
        </div>
      }
    </div>
  `,
  styles: [`
    .page-header { display: flex; justify-content: space-between; align-items: flex-end; margin-bottom: 24px; }
    .subtitle { color: var(--ink-4); font-size: 14px; margin-top: 4px; }

    .toolbar { display: flex; justify-content: space-between; align-items: center; margin-bottom: 20px; }
    .tabs { display: flex; gap: 4px; }
    .tab { display: inline-flex; align-items: center; gap: 6px; height: 34px; padding: 0 14px; border-radius: var(--r-md); border: 1px solid var(--border-strong); background: var(--surface); font-size: 13px; font-weight: 500; color: var(--ink-3); cursor: pointer; transition: all .1s; }
    .tab:hover { color: var(--ink-1); }
    .tab.active { background: var(--ink-1); color: #fff; border-color: var(--ink-1); }
    .tab-badge { background: rgba(255,255,255,.2); border-radius: 999px; padding: 0 6px; font-size: 11px; }
    .tab:not(.active) .tab-badge { background: var(--surface-3); color: var(--ink-4); }
    .flag-icon { color: #b45309; }
    .tab.active .flag-icon { color: #fbbf24; }

    .search-wrap { position: relative; }
    .search-icon { position: absolute; left: 10px; top: 50%; transform: translateY(-50%); color: var(--ink-4); font-size: 13px; }
    .search-input { height: 34px; padding: 0 10px 0 30px; border: 1px solid var(--border-strong); border-radius: var(--r-md); font-size: 13px; font-family: inherit; color: var(--ink-2); background: var(--surface); width: 220px; }
    .search-input:focus { outline: none; border-color: var(--accent); }

    .loading-state { padding: 48px; text-align: center; color: var(--ink-4); }
    .empty-state { text-align: center; padding: 64px 24px; }
    .empty-icon { font-size: 40px; color: var(--positive); display: block; margin-bottom: 12px; }
    .empty-title { font-size: 16px; font-weight: 600; color: var(--ink-2); margin-bottom: 6px; }
    .empty-sub { font-size: 14px; color: var(--ink-4); }

    .review-list { display: flex; flex-direction: column; gap: 10px; }
    .review-card { display: flex; justify-content: space-between; align-items: center; padding: 18px 20px; text-decoration: none; color: inherit; transition: box-shadow .15s, border-color .15s; }
    .review-card:hover { border-color: var(--border-strong); box-shadow: var(--shadow-md); }

    .card-left { flex: 1; }
    .assignee-row { display: flex; align-items: center; gap: 10px; margin-bottom: 4px; }
    .assignee-name { font-size: 15px; font-weight: 600; color: var(--ink-1); }
    .flag-badge { display: inline-flex; align-items: center; gap: 4px; font-size: 11px; font-weight: 500; color: #b45309; background: #fff8e7; border-radius: 999px; padding: 2px 8px; }
    .location { font-size: 13px; color: var(--ink-3); margin-bottom: 8px; }
    .meta-row { display: flex; gap: 16px; font-size: 12px; color: var(--ink-4); }
    .meta-row span { display: flex; align-items: center; gap: 4px; }

    .card-right { display: flex; align-items: center; gap: 20px; }
    .tiv-delta { text-align: right; }
    .tiv-delta.positive .delta-value { color: var(--positive); }
    .tiv-delta.negative .delta-value { color: var(--danger); }
    .delta-value { font-size: 18px; font-weight: 600; letter-spacing: -0.01em; }
    .delta-label { font-size: 11px; color: var(--ink-4); }
    .tiv-value { text-align: right; }
    .tiv-amount { font-size: 15px; font-weight: 500; color: var(--ink-1); }
    .tiv-label { font-size: 11px; color: var(--ink-4); }
    .arrow { color: var(--ink-4); font-size: 14px; }
  `],
})
export class ReviewQueueComponent implements OnInit {
  private api = inject(ApiService);

  queue = signal<ReviewQueueItem[]>([]);
  loading = signal(true);
  showFlaggedOnly = signal(false);
  searchQuery = '';

  pending = computed(() => this.queue().filter(i => i.status === 'submitted'));
  flagged = computed(() => this.pending().filter(i => i.material_change));

  displayed = computed(() => {
    let list = this.showFlaggedOnly() ? this.flagged() : this.pending();
    const q = this.searchQuery.toLowerCase().trim();
    if (q) {
      list = list.filter(i =>
        i.assignee_name?.toLowerCase().includes(q) ||
        i.property_address?.toLowerCase().includes(q) ||
        i.campaign_name?.toLowerCase().includes(q)
      );
    }
    return list;
  });

  ngOnInit(): void {
    this.api.getReviewQueue().subscribe({
      next: q => { this.queue.set(q); this.loading.set(false); },
      error: () => this.loading.set(false),
    });
  }

  formatDate(d: string): string {
    return new Date(d).toLocaleDateString('en', { month: 'short', day: 'numeric' });
  }

  formatTiv(tiv: number | null | undefined): string {
    if (tiv == null) return '—';
    if (tiv >= 1_000_000) return '$' + (tiv / 1_000_000).toFixed(1) + 'M';
    if (tiv >= 1_000) return '$' + (tiv / 1_000).toFixed(0) + 'K';
    return '$' + tiv.toFixed(0);
  }
}
