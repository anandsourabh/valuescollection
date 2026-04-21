import { Component, inject, OnInit, signal, computed } from '@angular/core';
import { RouterLink } from '@angular/router';
import { FormsModule } from '@angular/forms';
import { ApiService } from '../../core/http/api.service';
import { Campaign } from '../../core/models/models';

type FilterTab = 'all' | 'active' | 'draft' | 'completed' | 'archived';

@Component({
  selector: 'app-campaigns-list',
  standalone: true,
  imports: [RouterLink, FormsModule],
  template: `
    <div class="page-pad">
      <div class="page-header">
        <div>
          <h1>Campaigns</h1>
          <p class="subtitle">{{ filtered().length }} campaign(s)</p>
        </div>
        <a class="btn btn-accent" routerLink="/campaigns/new">
          <i class="pi pi-plus"></i> New campaign
        </a>
      </div>

      <div class="toolbar">
        <div class="tabs">
          @for (tab of tabs; track tab.value) {
            <button class="tab" [class.active]="activeTab() === tab.value" (click)="activeTab.set(tab.value)">
              {{ tab.label }}
              @if (counts()[tab.value]) {
                <span class="tab-count">{{ counts()[tab.value] }}</span>
              }
            </button>
          }
        </div>
        <div class="search-wrap">
          <i class="pi pi-search search-icon"></i>
          <input class="search-input" placeholder="Search campaigns…" [(ngModel)]="searchQuery" />
        </div>
      </div>

      @if (loading()) {
        <div class="loading-row">
          <i class="pi pi-spin pi-spinner"></i> Loading…
        </div>
      } @else if (filtered().length === 0) {
        <div class="empty-state">
          <i class="pi pi-flag empty-icon"></i>
          <div class="empty-title">No campaigns found</div>
          <div class="empty-sub">Try adjusting your filters or <a routerLink="/campaigns/new">create a new campaign</a>.</div>
        </div>
      } @else {
        <div class="table-wrap card">
          <table class="data-table">
            <thead>
              <tr>
                <th>Campaign</th>
                <th>Status</th>
                <th>Due date</th>
                <th>SLA</th>
                <th>Assignments</th>
                <th>Progress</th>
                <th></th>
              </tr>
            </thead>
            <tbody>
              @for (c of filtered(); track c.id) {
                <tr>
                  <td>
                    <div class="campaign-name">{{ c.name }}</div>
                    <div class="campaign-sub">{{ c.description || '—' }}</div>
                  </td>
                  <td>
                    <span class="badge" [class]="'badge-' + c.status">{{ c.status }}</span>
                  </td>
                  <td class="mono">{{ formatDate(c.due_date) }}</td>
                  <td>{{ c.sla_days }}d</td>
                  <td>{{ c.assignment_count ?? '—' }}</td>
                  <td>
                    <div class="inline-progress">
                      <div class="progress-bar">
                        <div class="progress-fill" [style.width]="progressPct(c) + '%'"></div>
                      </div>
                      <span class="progress-label">{{ progressPct(c) }}%</span>
                    </div>
                  </td>
                  <td>
                    <a class="btn btn-ghost btn-sm" [routerLink]="['/campaigns', c.id]">
                      View <i class="pi pi-chevron-right"></i>
                    </a>
                  </td>
                </tr>
              }
            </tbody>
          </table>
        </div>
      }
    </div>
  `,
  styles: [`
    .page-header { display: flex; justify-content: space-between; align-items: flex-end; margin-bottom: 24px; }
    .subtitle { color: var(--ink-4); font-size: 14px; margin-top: 4px; }

    .toolbar { display: flex; justify-content: space-between; align-items: center; margin-bottom: 16px; flex-wrap: wrap; gap: 12px; }
    .tabs { display: flex; gap: 2px; background: var(--surface-2); border-radius: var(--r-md); padding: 3px; }
    .tab { background: none; border: none; padding: 5px 14px; border-radius: calc(var(--r-md) - 2px); font-size: 13px; font-weight: 500; color: var(--ink-3); cursor: pointer; display: flex; align-items: center; gap: 6px; transition: background .1s; }
    .tab:hover { color: var(--ink-1); }
    .tab.active { background: var(--surface); color: var(--ink-1); box-shadow: 0 1px 3px rgba(0,0,0,.08); }
    .tab-count { background: var(--surface-3); color: var(--ink-3); border-radius: 999px; font-size: 11px; padding: 0 6px; min-width: 18px; text-align: center; }

    .search-wrap { position: relative; }
    .search-icon { position: absolute; left: 10px; top: 50%; transform: translateY(-50%); color: var(--ink-4); font-size: 13px; }
    .search-input { height: 34px; padding: 0 10px 0 30px; border: 1px solid var(--border-strong); border-radius: var(--r-md); font-size: 13px; font-family: inherit; color: var(--ink-2); background: var(--surface); width: 220px; }
    .search-input:focus { outline: none; border-color: var(--accent); }

    .loading-row { padding: 48px; text-align: center; color: var(--ink-4); }

    .empty-state { text-align: center; padding: 64px 24px; }
    .empty-icon { font-size: 36px; color: var(--ink-5); display: block; margin-bottom: 12px; }
    .empty-title { font-size: 16px; font-weight: 600; color: var(--ink-2); margin-bottom: 6px; }
    .empty-sub { font-size: 14px; color: var(--ink-4); }

    .table-wrap { overflow: hidden; }
    .data-table { width: 100%; border-collapse: collapse; }
    .data-table th { text-align: left; font-size: 11px; text-transform: uppercase; letter-spacing: .04em; color: var(--ink-4); font-weight: 600; padding: 12px 16px; border-bottom: 1px solid var(--border); }
    .data-table td { padding: 14px 16px; border-bottom: 1px solid var(--border); font-size: 13px; color: var(--ink-2); vertical-align: middle; }
    .data-table tr:last-child td { border-bottom: none; }
    .data-table tr:hover td { background: var(--surface-2); }

    .campaign-name { font-weight: 500; color: var(--ink-1); }
    .campaign-sub { font-size: 12px; color: var(--ink-4); margin-top: 2px; }
    .mono { font-variant-numeric: tabular-nums; }

    .badge { padding: 2px 8px; border-radius: 999px; font-size: 11px; font-weight: 500; text-transform: capitalize; }
    .badge-active { background: var(--accent-soft); color: var(--accent-ink); }
    .badge-draft { background: var(--surface-3); color: var(--ink-3); }
    .badge-completed { background: var(--positive-soft); color: var(--positive); }
    .badge-archived { background: var(--surface-3); color: var(--ink-4); }

    .inline-progress { display: flex; align-items: center; gap: 8px; min-width: 120px; }
    .progress-bar { flex: 1; height: 6px; background: var(--surface-3); border-radius: 3px; overflow: hidden; }
    .progress-fill { height: 100%; background: var(--accent); border-radius: 3px; }
    .progress-label { font-size: 12px; color: var(--ink-4); width: 30px; text-align: right; }

    .btn { display: inline-flex; align-items: center; gap: 6px; height: 36px; padding: 0 14px; border-radius: var(--r-md); font-family: inherit; font-size: 13px; font-weight: 500; cursor: pointer; border: 1px solid transparent; text-decoration: none; transition: background .12s; }
    .btn-ghost { background: transparent; color: var(--ink-2); border-color: var(--border-strong); }
    .btn-ghost:hover { background: var(--surface-2); }
    .btn-accent { background: var(--accent); color: #fff; border: none; }
    .btn-accent:hover { background: var(--accent-hover); }
    .btn-sm { height: 30px; padding: 0 10px; font-size: 12px; }
  `],
})
export class CampaignsListComponent implements OnInit {
  private api = inject(ApiService);

  campaigns = signal<Campaign[]>([]);
  loading = signal(true);
  activeTab = signal<FilterTab>('all');
  searchQuery = '';

  tabs: { label: string; value: FilterTab }[] = [
    { label: 'All', value: 'all' },
    { label: 'Active', value: 'active' },
    { label: 'Draft', value: 'draft' },
    { label: 'Completed', value: 'completed' },
    { label: 'Archived', value: 'archived' },
  ];

  counts = computed(() => {
    const all = this.campaigns();
    return {
      all: all.length,
      active: all.filter(c => c.status === 'active').length,
      draft: all.filter(c => c.status === 'draft').length,
      completed: all.filter(c => c.status === 'completed').length,
      archived: all.filter(c => c.status === 'archived').length,
    };
  });

  filtered = computed(() => {
    let list = this.campaigns();
    if (this.activeTab() !== 'all') {
      list = list.filter(c => c.status === this.activeTab());
    }
    const q = this.searchQuery.toLowerCase().trim();
    if (q) {
      list = list.filter(c => c.name.toLowerCase().includes(q) || c.description?.toLowerCase().includes(q));
    }
    return list;
  });

  ngOnInit(): void {
    this.api.getCampaigns().subscribe({
      next: campaigns => { this.campaigns.set(campaigns); this.loading.set(false); },
      error: () => this.loading.set(false),
    });
  }

  formatDate(d: string): string {
    return new Date(d).toLocaleDateString('en', { month: 'short', day: 'numeric', year: 'numeric' });
  }

  progressPct(c: Campaign): number {
    if (!c.assignment_count) return 0;
    return Math.round(((c.completed_count ?? 0) / c.assignment_count) * 100);
  }
}
