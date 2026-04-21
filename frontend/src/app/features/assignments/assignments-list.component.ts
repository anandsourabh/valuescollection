import { Component, inject, OnInit, signal, computed } from '@angular/core';
import { RouterLink } from '@angular/router';
import { FormsModule } from '@angular/forms';
import { ApiService } from '../../core/http/api.service';
import { Assignment } from '../../core/models/models';

@Component({
  selector: 'app-assignments-list',
  standalone: true,
  imports: [RouterLink, FormsModule],
  template: `
    <div class="page-pad">
      <div class="page-header">
        <div>
          <h1>Assignments</h1>
          <p class="subtitle">{{ filtered().length }} of {{ assignments().length }} assignments</p>
        </div>
      </div>

      <div class="toolbar">
        <div class="search-wrap">
          <i class="pi pi-search search-icon"></i>
          <input class="search-input" placeholder="Search by assignee or location…" [(ngModel)]="searchQuery" />
        </div>
        <div class="filters">
          <select class="filter-select" [(ngModel)]="statusFilter">
            <option value="">All statuses</option>
            <option value="pending">Pending</option>
            <option value="in_progress">In progress</option>
            <option value="submitted">Submitted</option>
            <option value="approved">Approved</option>
            <option value="rejected">Rejected</option>
          </select>
        </div>
      </div>

      <!-- Status pills -->
      <div class="status-pills">
        @for (pill of statusPills; track pill.value) {
          <button class="pill" [class.active]="statusFilter === pill.value"
            (click)="statusFilter = pill.value">
            <span class="pill-dot" [style.background]="pill.color"></span>
            {{ pill.label }}
            <span class="pill-count">{{ counts()[pill.value] }}</span>
          </button>
        }
      </div>

      @if (loading()) {
        <div class="loading-state"><i class="pi pi-spin pi-spinner"></i> Loading…</div>
      } @else {
        <div class="table-wrap card">
          <table class="data-table">
            <thead>
              <tr>
                <th>Assignee</th>
                <th>Campaign</th>
                <th>Location</th>
                <th>Status</th>
                <th>Due date</th>
                <th>Delegate</th>
                <th>Submitted</th>
                <th></th>
              </tr>
            </thead>
            <tbody>
              @for (a of filtered(); track a.id) {
                <tr>
                  <td>
                    <div class="assignee-name">{{ a.assignee_name || a.external_email || 'Unassigned' }}</div>
                    <div class="assignee-type">{{ a.assignee_type }}</div>
                  </td>
                  <td>
                    <a class="campaign-link" [routerLink]="['/campaigns', a.campaign_id]">
                      {{ a.campaign_name || a.campaign_id }}
                    </a>
                  </td>
                  <td>{{ a.property_address || '—' }}</td>
                  <td><span class="badge" [class]="'badge-' + a.status">{{ a.status.replace('_', ' ') }}</span></td>
                  <td class="mono">{{ a.due_date ? formatDate(a.due_date) : '—' }}</td>
                  <td>{{ a.delegate_l1_name || '—' }}</td>
                  <td class="mono">{{ a.submitted_at ? formatDate(a.submitted_at) : '—' }}</td>
                  <td>
                    @if (a.status === 'submitted') {
                      <a class="btn btn-ghost btn-sm" [routerLink]="['/reviews', a.id]">Review</a>
                    }
                  </td>
                </tr>
              }
            </tbody>
          </table>
          @if (filtered().length === 0 && !loading()) {
            <div class="table-empty">
              No assignments match the current filters.
            </div>
          }
        </div>
      }
    </div>
  `,
  styles: [`
    .page-header { display: flex; justify-content: space-between; align-items: flex-end; margin-bottom: 20px; }
    .subtitle { color: var(--ink-4); font-size: 14px; margin-top: 4px; }

    .toolbar { display: flex; gap: 12px; margin-bottom: 14px; align-items: center; }
    .search-wrap { position: relative; flex: 1; max-width: 340px; }
    .search-icon { position: absolute; left: 10px; top: 50%; transform: translateY(-50%); color: var(--ink-4); font-size: 13px; }
    .search-input { width: 100%; height: 34px; padding: 0 10px 0 30px; border: 1px solid var(--border-strong); border-radius: var(--r-md); font-size: 13px; font-family: inherit; color: var(--ink-2); background: var(--surface); }
    .search-input:focus { outline: none; border-color: var(--accent); }
    .filters { display: flex; gap: 8px; }
    .filter-select { height: 34px; padding: 0 8px; border: 1px solid var(--border-strong); border-radius: var(--r-md); font-size: 13px; font-family: inherit; color: var(--ink-2); background: var(--surface); }

    .status-pills { display: flex; gap: 6px; margin-bottom: 16px; flex-wrap: wrap; }
    .pill { display: inline-flex; align-items: center; gap: 6px; height: 28px; padding: 0 12px; border-radius: 999px; border: 1px solid var(--border); background: var(--surface); font-size: 12px; font-weight: 500; color: var(--ink-3); cursor: pointer; transition: all .1s; }
    .pill:hover { border-color: var(--border-strong); color: var(--ink-1); }
    .pill.active { background: var(--ink-1); color: #fff; border-color: var(--ink-1); }
    .pill-dot { width: 6px; height: 6px; border-radius: 50%; }
    .pill-count { background: rgba(0,0,0,.1); border-radius: 999px; padding: 0 5px; font-size: 10px; }
    .pill.active .pill-count { background: rgba(255,255,255,.2); }

    .loading-state { padding: 48px; text-align: center; color: var(--ink-4); }

    .table-wrap { overflow: hidden; }
    .data-table { width: 100%; border-collapse: collapse; }
    .data-table th { text-align: left; font-size: 11px; text-transform: uppercase; letter-spacing: .04em; color: var(--ink-4); font-weight: 600; padding: 10px 16px; border-bottom: 1px solid var(--border); white-space: nowrap; }
    .data-table td { padding: 12px 16px; border-bottom: 1px solid var(--border); font-size: 13px; color: var(--ink-2); vertical-align: middle; }
    .data-table tr:last-child td { border-bottom: none; }
    .data-table tr:hover td { background: var(--surface-2); }
    .table-empty { padding: 40px; text-align: center; color: var(--ink-4); font-size: 13px; }

    .assignee-name { font-weight: 500; color: var(--ink-1); }
    .assignee-type { font-size: 11px; color: var(--ink-4); text-transform: capitalize; margin-top: 2px; }
    .campaign-link { color: var(--accent); text-decoration: none; font-size: 13px; }
    .campaign-link:hover { text-decoration: underline; }
    .mono { font-variant-numeric: tabular-nums; font-size: 12px; }

    .badge { padding: 2px 8px; border-radius: 999px; font-size: 11px; font-weight: 500; text-transform: capitalize; }
    .badge-pending { background: #fff8e7; color: #b45309; }
    .badge-in_progress { background: #eff6ff; color: #2563eb; }
    .badge-submitted { background: #f3e8ff; color: #7c3aed; }
    .badge-approved { background: var(--positive-soft); color: var(--positive); }
    .badge-rejected { background: var(--danger-soft); color: var(--danger); }

    .btn { display: inline-flex; align-items: center; gap: 6px; height: 36px; padding: 0 14px; border-radius: var(--r-md); font-family: inherit; font-size: 13px; font-weight: 500; cursor: pointer; border: 1px solid transparent; text-decoration: none; transition: background .12s; }
    .btn-ghost { background: transparent; color: var(--ink-2); border-color: var(--border-strong); }
    .btn-ghost:hover { background: var(--surface-2); }
    .btn-sm { height: 28px; padding: 0 10px; font-size: 12px; }
  `],
})
export class AssignmentsListComponent implements OnInit {
  private api = inject(ApiService);

  assignments = signal<Assignment[]>([]);
  loading = signal(true);
  searchQuery = '';
  statusFilter = '';

  statusPills = [
    { label: 'All', value: '', color: 'var(--ink-3)' },
    { label: 'Pending', value: 'pending', color: '#b45309' },
    { label: 'In progress', value: 'in_progress', color: '#2563eb' },
    { label: 'Submitted', value: 'submitted', color: '#7c3aed' },
    { label: 'Approved', value: 'approved', color: 'var(--positive)' },
    { label: 'Rejected', value: 'rejected', color: 'var(--danger)' },
  ];

  counts = computed(() => {
    const all = this.assignments();
    return {
      '': all.length,
      pending: all.filter(a => a.status === 'pending').length,
      in_progress: all.filter(a => a.status === 'in_progress').length,
      submitted: all.filter(a => a.status === 'submitted').length,
      approved: all.filter(a => a.status === 'approved').length,
      rejected: all.filter(a => a.status === 'rejected').length,
    } as Record<string, number>;
  });

  filtered = computed(() => {
    let list = this.assignments();
    if (this.statusFilter) list = list.filter(a => a.status === this.statusFilter);
    const q = this.searchQuery.toLowerCase().trim();
    if (q) {
      list = list.filter(a =>
        a.assignee_name?.toLowerCase().includes(q) ||
        a.external_email?.toLowerCase().includes(q) ||
        a.property_address?.toLowerCase().includes(q)
      );
    }
    return list;
  });

  ngOnInit(): void {
    this.api.getAssignments().subscribe({
      next: a => { this.assignments.set(a); this.loading.set(false); },
      error: () => this.loading.set(false),
    });
  }

  formatDate(d: string): string {
    return new Date(d).toLocaleDateString('en', { month: 'short', day: 'numeric', year: 'numeric' });
  }
}
