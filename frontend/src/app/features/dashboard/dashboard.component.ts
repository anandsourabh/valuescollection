import { Component, inject, OnInit } from '@angular/core';
import { RouterLink } from '@angular/router';
import { ApiService } from '../../core/http/api.service';
import { AuthService } from '../../core/auth/auth.service';
import { Campaign } from '../../core/models/models';

@Component({
  selector: 'app-dashboard',
  standalone: true,
  imports: [RouterLink],
  template: `
    <div class="page-pad">
      <div class="page-header">
        <div>
          <h1>Good morning, {{ auth.currentUser()?.name?.split(' ')[0] || 'there' }}</h1>
          <p class="subtitle">{{ activeCampaigns.length }} active campaign(s) · {{ totalAssignments }} assignments in flight</p>
        </div>
        <div class="header-actions">
          <button class="btn btn-ghost">
            <i class="pi pi-download"></i> Export
          </button>
          <a class="btn btn-accent" routerLink="/campaigns/new">
            <i class="pi pi-plus"></i> New campaign
          </a>
        </div>
      </div>

      <!-- KPI Strip -->
      <div class="kpi-grid">
        @for (kpi of kpis; track kpi.label) {
          <div class="kpi-card card">
            <div class="kpi-icon" [style.color]="kpi.color">
              <i [class]="'pi ' + kpi.icon"></i>
            </div>
            <div class="kpi-label">{{ kpi.label }}</div>
            <div class="kpi-value" [style.color]="kpi.color">{{ kpi.value }}</div>
            <div class="kpi-trend">{{ kpi.trend }}</div>
          </div>
        }
      </div>

      <!-- Active Campaigns -->
      <div class="section-header">
        <h2>Active campaigns</h2>
        <a class="btn btn-ghost btn-sm" routerLink="/campaigns">View all <i class="pi pi-chevron-right"></i></a>
      </div>

      <div class="campaigns-grid">
        @for (c of activeCampaigns; track c.id) {
          <a class="campaign-card card" [routerLink]="['/campaigns', c.id]">
            <div class="campaign-header">
              <div>
                <div class="campaign-name">{{ c.name }}</div>
                <div class="campaign-meta">{{ c.sla_days }}d SLA</div>
              </div>
            </div>
            <div class="campaign-progress-bar">
              <div class="progress-fill accent" style="width: 36%"></div>
            </div>
            <div class="campaign-footer">
              <span><i class="pi pi-calendar"></i> Due {{ formatDate(c.due_date) }}</span>
              <span class="badge active">Active</span>
            </div>
          </a>
        }
        @if (activeCampaigns.length === 0 && !loading) {
          <div class="empty">No active campaigns. <a routerLink="/campaigns/new">Create one</a>.</div>
        }
      </div>
    </div>
  `,
  styles: [`
    .page-header { display: flex; justify-content: space-between; align-items: flex-end; margin-bottom: 24px; }
    .subtitle { color: var(--ink-4); font-size: 14px; margin-top: 4px; }
    .header-actions { display: flex; gap: 8px; }

    .kpi-grid { display: grid; grid-template-columns: repeat(4, 1fr); gap: 12px; margin-bottom: 28px; }
    .kpi-card { padding: 16px; }
    .kpi-icon { font-size: 18px; margin-bottom: 8px; }
    .kpi-label { font-size: 11px; text-transform: uppercase; letter-spacing: .04em; color: var(--ink-4); font-weight: 500; margin-bottom: 4px; }
    .kpi-value { font-size: 28px; font-weight: 600; letter-spacing: -0.02em; }
    .kpi-trend { font-size: 11px; color: var(--ink-4); margin-top: 4px; }

    .section-header { display: flex; align-items: center; justify-content: space-between; margin-bottom: 12px; }
    .campaigns-grid { display: grid; grid-template-columns: repeat(2, 1fr); gap: 12px; }
    .campaign-card { padding: 18px; cursor: pointer; text-decoration: none; display: block; transition: box-shadow .15s, border-color .15s; color: inherit; }
    .campaign-card:hover { border-color: var(--border-strong); box-shadow: var(--shadow-md); }
    .campaign-header { display: flex; justify-content: space-between; align-items: flex-start; margin-bottom: 14px; }
    .campaign-name { font-weight: 600; color: var(--ink-1); font-size: 15px; margin-bottom: 2px; }
    .campaign-meta { font-size: 12px; color: var(--ink-4); }
    .campaign-progress-bar { height: 8px; background: var(--surface-3); border-radius: 4px; overflow: hidden; margin-bottom: 12px; }
    .progress-fill { height: 100%; border-radius: 4px; }
    .accent { background: var(--accent); }
    .campaign-footer { display: flex; justify-content: space-between; align-items: center; font-size: 12px; color: var(--ink-4); }
    .badge { padding: 2px 8px; border-radius: 999px; font-size: 11px; font-weight: 500; }
    .badge.active { background: var(--accent-soft); color: var(--accent-ink); }
    .empty { color: var(--ink-4); font-size: 14px; padding: 24px 0; }

    .btn { display: inline-flex; align-items: center; gap: 6px; height: 36px; padding: 0 14px; border-radius: var(--r-md); font-family: inherit; font-size: 13px; font-weight: 500; cursor: pointer; border: 1px solid transparent; text-decoration: none; transition: background .12s; }
    .btn-ghost { background: transparent; color: var(--ink-2); }
    .btn-ghost:hover { background: var(--surface-3); }
    .btn-accent { background: var(--accent); color: #fff; border: none; }
    .btn-accent:hover { background: var(--accent-hover); }
    .btn-sm { height: 28px; padding: 0 10px; font-size: 12px; }
  `],
})
export class DashboardComponent implements OnInit {
  auth = inject(AuthService);
  private api = inject(ApiService);

  campaigns: Campaign[] = [];
  loading = true;

  get activeCampaigns() { return this.campaigns.filter(c => c.status === 'active'); }
  get totalAssignments() { return this.activeCampaigns.reduce((sum) => sum + 142, 0); }

  kpis = [
    { label: 'Active campaigns', value: '0', trend: 'Loading…', color: 'var(--accent)', icon: 'pi-flag' },
    { label: 'Assignments', value: '—', trend: '—', color: 'var(--ink-1)', icon: 'pi-list' },
    { label: 'Approved', value: '—', trend: '—', color: 'var(--positive)', icon: 'pi-check' },
    { label: 'SLA breaches', value: '—', trend: 'Needs attention', color: 'var(--danger)', icon: 'pi-exclamation-triangle' },
  ];

  ngOnInit(): void {
    this.api.getCampaigns().subscribe({
      next: campaigns => {
        this.campaigns = campaigns;
        this.kpis[0].value = String(campaigns.filter(c => c.status === 'active').length);
        this.kpis[0].trend = `${campaigns.length} total`;
        this.loading = false;
      },
      error: () => { this.loading = false; },
    });
  }

  formatDate(d: string): string {
    return new Date(d).toLocaleDateString('en', { month: 'short', day: 'numeric' });
  }
}
