import { Component, inject, OnInit, signal } from '@angular/core';
import { ActivatedRoute, RouterLink } from '@angular/router';
import { FormsModule } from '@angular/forms';
import { ApiService } from '../../core/http/api.service';
import { Campaign, Assignment, AuditEvent } from '../../core/models/models';

type Tab = 'assignments' | 'progress' | 'reminders' | 'audit' | 'delegations';

@Component({
  selector: 'app-campaign-detail',
  standalone: true,
  imports: [RouterLink, FormsModule],
  template: `
    <div class="page-pad">
      <!-- Header -->
      <div class="page-header">
        <div class="header-left">
          <a class="back-link" routerLink="/campaigns"><i class="pi pi-chevron-left"></i> Campaigns</a>
          <div class="header-title-row">
            <h1>{{ campaign()?.name || 'Loading…' }}</h1>
            @if (campaign()) {
              <span class="badge" [class]="'badge-' + campaign()!.status">{{ campaign()!.status }}</span>
            }
          </div>
          @if (campaign()) {
            <p class="subtitle">
              SLA {{ campaign()!.sla_days }}d &nbsp;·&nbsp;
              Due {{ formatDate(campaign()!.due_date) }}
            </p>
          }
        </div>
        <div class="header-actions">
          @if (campaign()?.status === 'draft') {
            <button class="btn btn-accent" (click)="activateCampaign()">
              <i class="pi pi-play"></i> Activate
            </button>
          }
          <button class="btn btn-ghost" (click)="showExtendModal = true">
            <i class="pi pi-calendar"></i> Extend deadline
          </button>
          <a class="btn btn-ghost" [routerLink]="['/campaigns', campaignId, 'form-builder']">
            <i class="pi pi-pencil"></i> Form builder
          </a>
        </div>
      </div>

      <!-- Stats strip -->
      @if (campaign()) {
        <div class="stats-strip">
          @for (s of statsItems(); track s.label) {
            <div class="stat-item">
              <div class="stat-value" [style.color]="s.color">{{ s.value }}</div>
              <div class="stat-label">{{ s.label }}</div>
            </div>
          }
        </div>
      }

      <!-- Tabs -->
      <div class="tabs-row">
        @for (tab of tabs; track tab.value) {
          <button class="tab" [class.active]="activeTab() === tab.value" (click)="activeTab.set(tab.value)">
            <i [class]="'pi ' + tab.icon"></i> {{ tab.label }}
          </button>
        }
      </div>

      <!-- Assignments Tab -->
      @if (activeTab() === 'assignments') {
        <div class="tab-content">
          <div class="assignments-toolbar">
            <div class="left-tools">
              @if (selectedIds().length > 0) {
                <span class="sel-count">{{ selectedIds().length }} selected</span>
                <button class="btn btn-ghost btn-sm" (click)="bulkAction('remind')">
                  <i class="pi pi-bell"></i> Remind
                </button>
                <button class="btn btn-ghost btn-sm" (click)="showBulkExtend = true">
                  <i class="pi pi-calendar"></i> Extend deadline
                </button>
                <button class="btn btn-ghost btn-sm" (click)="showBulkDelegate = true">
                  <i class="pi pi-users"></i> Delegate
                </button>
                <button class="btn btn-ghost btn-sm" (click)="bulkAction('bulk_approve')">
                  <i class="pi pi-check"></i> Approve
                </button>
              }
            </div>
            <div class="right-tools">
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

          <div class="table-wrap card">
            <table class="data-table">
              <thead>
                <tr>
                  <th class="check-col">
                    <input type="checkbox" (change)="toggleAll($event)" [checked]="allSelected()" />
                  </th>
                  <th>Assignee / Location</th>
                  <th>Status</th>
                  <th>Due date</th>
                  <th>L1 Delegate</th>
                  <th>Submitted</th>
                  <th></th>
                </tr>
              </thead>
              <tbody>
                @for (a of filteredAssignments(); track a.id) {
                  <tr>
                    <td class="check-col">
                      <input type="checkbox" [checked]="selectedIds().includes(a.id)"
                        (change)="toggleSelect(a.id)" />
                    </td>
                    <td>
                      <div class="assignee-name">{{ a.assignee_name || a.external_email || 'Unassigned' }}</div>
                      <div class="location-sub">{{ a.property_address || '—' }}</div>
                    </td>
                    <td><span class="badge" [class]="'badge-' + a.status">{{ a.status.replace('_', ' ') }}</span></td>
                    <td class="mono">{{ a.due_date ? formatDate(a.due_date) : '—' }}</td>
                    <td>{{ a.delegate_l1_name || '—' }}</td>
                    <td class="mono">{{ a.submitted_at ? formatDate(a.submitted_at) : '—' }}</td>
                    <td>
                      <div class="row-actions">
                        @if (a.status === 'submitted') {
                          <a class="btn btn-ghost btn-sm" [routerLink]="['/reviews', a.id]">Review</a>
                        }
                        <button class="btn-icon" title="Send reminder" (click)="remindOne(a.id)">
                          <i class="pi pi-bell"></i>
                        </button>
                      </div>
                    </td>
                  </tr>
                }
              </tbody>
            </table>
            @if (filteredAssignments().length === 0) {
              <div class="table-empty">No assignments match the current filter.</div>
            }
          </div>
        </div>
      }

      <!-- Progress Tab -->
      @if (activeTab() === 'progress') {
        <div class="tab-content card padded">
          <h3>Submission progress</h3>
          <div class="progress-section">
            @for (s of progressStats(); track s.label) {
              <div class="progress-row">
                <div class="prog-label">{{ s.label }}</div>
                <div class="prog-bar-wrap">
                  <div class="prog-bar">
                    <div class="prog-fill" [style.width]="s.pct + '%'" [style.background]="s.color"></div>
                  </div>
                </div>
                <div class="prog-count">{{ s.count }}</div>
              </div>
            }
          </div>
        </div>
      }

      <!-- Reminders Tab -->
      @if (activeTab() === 'reminders') {
        <div class="tab-content card padded">
          <h3>Scheduled reminders</h3>
          <p class="tab-desc">Reminders are auto-scheduled based on SLA rules.</p>
          @if (loadingReminders()) {
            <div class="loading-sm">Loading…</div>
          } @else {
            <div class="reminder-list">
              @for (r of reminders(); track r.id) {
                <div class="reminder-row">
                  <i class="pi pi-bell reminder-icon"></i>
                  <div class="reminder-info">
                    <div class="reminder-type">{{ r.reminder_type.replace(/_/g, ' ') }}</div>
                    <div class="reminder-when">Scheduled {{ formatDate(r.scheduled_for) }}</div>
                  </div>
                  <span class="badge" [class]="'badge-reminder-' + r.status">{{ r.status }}</span>
                </div>
              }
              @if (reminders().length === 0) {
                <div class="empty-sm">No reminders scheduled.</div>
              }
            </div>
          }
        </div>
      }

      <!-- Audit Tab -->
      @if (activeTab() === 'audit') {
        <div class="tab-content card padded">
          <h3>Audit trail</h3>
          @if (loadingAudit()) {
            <div class="loading-sm">Loading…</div>
          } @else {
            <div class="audit-list">
              @for (e of auditEvents(); track e.id) {
                <div class="audit-row">
                  <div class="audit-dot"></div>
                  <div class="audit-body">
                    <div class="audit-action">{{ formatAction(e.action) }}</div>
                    <div class="audit-meta">{{ e.actor_name || 'System' }} &middot; {{ formatDateTime(e.created_at) }}</div>
                  </div>
                </div>
              }
              @if (auditEvents().length === 0) {
                <div class="empty-sm">No audit events found.</div>
              }
            </div>
          }
        </div>
      }

      <!-- Delegations Tab -->
      @if (activeTab() === 'delegations') {
        <div class="tab-content card padded">
          <h3>Campaign delegations</h3>
          <p class="tab-desc">Active delegations for all assignments in this campaign.</p>
          @if (loadingDelegations()) {
            <div class="loading-sm">Loading…</div>
          } @else {
            <div class="table-wrap">
              <table class="data-table">
                <thead>
                  <tr>
                    <th>From</th>
                    <th>To</th>
                    <th>Level</th>
                    <th>Type</th>
                    <th>Active</th>
                  </tr>
                </thead>
                <tbody>
                  @for (d of delegations(); track d.id) {
                    <tr>
                      <td>{{ d.delegator_name }}</td>
                      <td>{{ d.delegate_name }}</td>
                      <td>L{{ d.level }}</td>
                      <td>{{ d.delegation_type.replace('_', ' ') }}</td>
                      <td>
                        <span class="badge" [class]="d.is_active ? 'badge-active' : 'badge-draft'">
                          {{ d.is_active ? 'Active' : 'Revoked' }}
                        </span>
                      </td>
                    </tr>
                  }
                  @if (delegations().length === 0) {
                    <tr><td colspan="5" class="empty-cell">No delegations for this campaign.</td></tr>
                  }
                </tbody>
              </table>
            </div>
          }
        </div>
      }
    </div>

    <!-- Extend Deadline Modal -->
    @if (showExtendModal) {
      <div class="modal-backdrop" (click)="showExtendModal = false">
        <div class="modal" (click)="$event.stopPropagation()">
          <div class="modal-header">
            <h3>Extend campaign deadline</h3>
            <button class="modal-close" (click)="showExtendModal = false"><i class="pi pi-times"></i></button>
          </div>
          <div class="modal-body">
            <div class="field">
              <label>New due date</label>
              <input type="date" [(ngModel)]="extendDate" class="form-input" />
            </div>
            <div class="field">
              <label>Reason</label>
              <select [(ngModel)]="extendReason" class="form-input">
                <option value="data_unavailable">Data unavailable</option>
                <option value="stakeholder_request">Stakeholder request</option>
                <option value="system_issue">System issue</option>
                <option value="other">Other</option>
              </select>
            </div>
            <div class="field">
              <label>Notes (optional)</label>
              <textarea [(ngModel)]="extendNotes" class="form-textarea" rows="3" placeholder="Add context…"></textarea>
            </div>
          </div>
          <div class="modal-footer">
            <button class="btn btn-ghost" (click)="showExtendModal = false">Cancel</button>
            <button class="btn btn-accent" (click)="submitExtend()" [disabled]="!extendDate">Extend deadline</button>
          </div>
        </div>
      </div>
    }

    <!-- Bulk Extend Modal -->
    @if (showBulkExtend) {
      <div class="modal-backdrop" (click)="showBulkExtend = false">
        <div class="modal" (click)="$event.stopPropagation()">
          <div class="modal-header">
            <h3>Extend deadline for {{ selectedIds().length }} assignment(s)</h3>
            <button class="modal-close" (click)="showBulkExtend = false"><i class="pi pi-times"></i></button>
          </div>
          <div class="modal-body">
            <div class="field">
              <label>New due date</label>
              <input type="date" [(ngModel)]="bulkExtendDate" class="form-input" />
            </div>
            <div class="field">
              <label>Reason</label>
              <select [(ngModel)]="bulkExtendReason" class="form-input">
                <option value="data_unavailable">Data unavailable</option>
                <option value="stakeholder_request">Stakeholder request</option>
                <option value="system_issue">System issue</option>
                <option value="other">Other</option>
              </select>
            </div>
          </div>
          <div class="modal-footer">
            <button class="btn btn-ghost" (click)="showBulkExtend = false">Cancel</button>
            <button class="btn btn-accent" (click)="submitBulkExtend()" [disabled]="!bulkExtendDate">Extend</button>
          </div>
        </div>
      </div>
    }

    <!-- Bulk Delegate Modal -->
    @if (showBulkDelegate) {
      <div class="modal-backdrop" (click)="showBulkDelegate = false">
        <div class="modal" (click)="$event.stopPropagation()">
          <div class="modal-header">
            <h3>Delegate {{ selectedIds().length }} assignment(s)</h3>
            <button class="modal-close" (click)="showBulkDelegate = false"><i class="pi pi-times"></i></button>
          </div>
          <div class="modal-body">
            <div class="field">
              <label>Delegate to (user ID)</label>
              <input type="text" [(ngModel)]="delegateToId" class="form-input" placeholder="User ID" />
            </div>
            <div class="field">
              <label>Level</label>
              <select [(ngModel)]="delegateLevel" class="form-input">
                <option value="1">Level 1 (immediate)</option>
                <option value="2">Level 2 (on SLA breach)</option>
              </select>
            </div>
          </div>
          <div class="modal-footer">
            <button class="btn btn-ghost" (click)="showBulkDelegate = false">Cancel</button>
            <button class="btn btn-accent" (click)="submitBulkDelegate()" [disabled]="!delegateToId">Delegate</button>
          </div>
        </div>
      </div>
    }
  `,
  styles: [`
    .page-header { display: flex; justify-content: space-between; align-items: flex-start; margin-bottom: 20px; }
    .back-link { display: inline-flex; align-items: center; gap: 4px; font-size: 13px; color: var(--ink-4); text-decoration: none; margin-bottom: 6px; }
    .back-link:hover { color: var(--ink-1); }
    .header-title-row { display: flex; align-items: center; gap: 10px; }
    .header-title-row h1 { margin: 0; }
    .subtitle { color: var(--ink-4); font-size: 13px; margin-top: 4px; }
    .header-actions { display: flex; gap: 8px; align-items: center; padding-top: 24px; }

    .stats-strip { display: flex; gap: 0; background: var(--surface); border: 1px solid var(--border); border-radius: var(--r-lg); margin-bottom: 20px; overflow: hidden; }
    .stat-item { flex: 1; padding: 14px 20px; border-right: 1px solid var(--border); }
    .stat-item:last-child { border-right: none; }
    .stat-value { font-size: 24px; font-weight: 600; letter-spacing: -0.02em; }
    .stat-label { font-size: 11px; text-transform: uppercase; letter-spacing: .04em; color: var(--ink-4); font-weight: 500; margin-top: 2px; }

    .tabs-row { display: flex; gap: 2px; border-bottom: 1px solid var(--border); margin-bottom: 20px; }
    .tab { background: none; border: none; border-bottom: 2px solid transparent; padding: 8px 16px; margin-bottom: -1px; font-size: 13px; font-weight: 500; color: var(--ink-3); cursor: pointer; display: flex; align-items: center; gap: 6px; transition: color .1s; }
    .tab:hover { color: var(--ink-1); }
    .tab.active { color: var(--accent); border-bottom-color: var(--accent); }

    .assignments-toolbar { display: flex; justify-content: space-between; align-items: center; margin-bottom: 12px; }
    .left-tools { display: flex; align-items: center; gap: 6px; }
    .sel-count { font-size: 13px; font-weight: 500; color: var(--ink-2); margin-right: 4px; }
    .filter-select { height: 32px; padding: 0 8px; border: 1px solid var(--border-strong); border-radius: var(--r-md); font-size: 13px; font-family: inherit; color: var(--ink-2); background: var(--surface); }

    .table-wrap { overflow: hidden; }
    .table-wrap.card { border-radius: var(--r-lg); border: 1px solid var(--border); }
    .data-table { width: 100%; border-collapse: collapse; }
    .data-table th { text-align: left; font-size: 11px; text-transform: uppercase; letter-spacing: .04em; color: var(--ink-4); font-weight: 600; padding: 10px 16px; border-bottom: 1px solid var(--border); white-space: nowrap; }
    .data-table td { padding: 12px 16px; border-bottom: 1px solid var(--border); font-size: 13px; color: var(--ink-2); vertical-align: middle; }
    .data-table tr:last-child td { border-bottom: none; }
    .data-table tr:hover td { background: var(--surface-2); }
    .check-col { width: 40px; }
    .table-empty { padding: 32px; text-align: center; color: var(--ink-4); font-size: 13px; }
    .empty-cell { text-align: center; color: var(--ink-4); padding: 24px !important; }

    .assignee-name { font-weight: 500; color: var(--ink-1); }
    .location-sub { font-size: 12px; color: var(--ink-4); margin-top: 2px; }
    .mono { font-variant-numeric: tabular-nums; font-size: 12px; }
    .row-actions { display: flex; gap: 4px; align-items: center; }
    .btn-icon { background: none; border: none; cursor: pointer; color: var(--ink-4); padding: 4px 6px; border-radius: var(--r-md); }
    .btn-icon:hover { background: var(--surface-3); color: var(--ink-1); }

    .badge { padding: 2px 8px; border-radius: 999px; font-size: 11px; font-weight: 500; text-transform: capitalize; }
    .badge-active { background: var(--accent-soft); color: var(--accent-ink); }
    .badge-draft { background: var(--surface-3); color: var(--ink-3); }
    .badge-completed, .badge-approved { background: var(--positive-soft); color: var(--positive); }
    .badge-pending { background: #fff8e7; color: #b45309; }
    .badge-in_progress { background: #eff6ff; color: #2563eb; }
    .badge-submitted { background: #f3e8ff; color: #7c3aed; }
    .badge-rejected { background: var(--danger-soft); color: var(--danger); }
    .badge-reminder-pending { background: var(--accent-soft); color: var(--accent-ink); }
    .badge-reminder-sent { background: var(--positive-soft); color: var(--positive); }
    .badge-reminder-skipped { background: var(--surface-3); color: var(--ink-4); }

    .padded { padding: 24px; }
    h3 { margin: 0 0 4px; font-size: 15px; }
    .tab-desc { font-size: 13px; color: var(--ink-4); margin-bottom: 20px; }
    .loading-sm { color: var(--ink-4); font-size: 13px; padding: 16px 0; }
    .empty-sm { color: var(--ink-4); font-size: 13px; padding: 24px 0; }

    .progress-section { margin-top: 20px; display: flex; flex-direction: column; gap: 14px; }
    .progress-row { display: flex; align-items: center; gap: 12px; }
    .prog-label { width: 120px; font-size: 13px; color: var(--ink-2); text-transform: capitalize; }
    .prog-bar-wrap { flex: 1; }
    .prog-bar { height: 8px; background: var(--surface-3); border-radius: 4px; overflow: hidden; }
    .prog-fill { height: 100%; border-radius: 4px; transition: width .3s; }
    .prog-count { width: 30px; text-align: right; font-size: 12px; color: var(--ink-4); }

    .reminder-list { display: flex; flex-direction: column; gap: 10px; margin-top: 16px; }
    .reminder-row { display: flex; align-items: center; gap: 12px; padding: 12px; background: var(--surface-2); border-radius: var(--r-md); }
    .reminder-icon { color: var(--ink-4); font-size: 14px; }
    .reminder-info { flex: 1; }
    .reminder-type { font-size: 13px; font-weight: 500; color: var(--ink-1); text-transform: capitalize; }
    .reminder-when { font-size: 12px; color: var(--ink-4); margin-top: 2px; }

    .audit-list { margin-top: 16px; }
    .audit-row { display: flex; gap: 12px; padding-bottom: 16px; position: relative; }
    .audit-row::before { content: ''; position: absolute; left: 5px; top: 16px; bottom: 0; width: 1px; background: var(--border); }
    .audit-row:last-child::before { display: none; }
    .audit-dot { width: 10px; height: 10px; border-radius: 50%; background: var(--accent); flex-shrink: 0; margin-top: 4px; }
    .audit-body { flex: 1; }
    .audit-action { font-size: 13px; font-weight: 500; color: var(--ink-1); }
    .audit-meta { font-size: 12px; color: var(--ink-4); margin-top: 2px; }

    .modal-backdrop { position: fixed; inset: 0; background: rgba(0,0,0,.4); display: flex; align-items: center; justify-content: center; z-index: 1000; }
    .modal { background: var(--surface); border-radius: var(--r-xl); width: 440px; max-width: calc(100vw - 32px); box-shadow: var(--shadow-lg); }
    .modal-header { display: flex; justify-content: space-between; align-items: center; padding: 20px 24px 16px; border-bottom: 1px solid var(--border); }
    .modal-header h3 { margin: 0; font-size: 15px; }
    .modal-close { background: none; border: none; cursor: pointer; color: var(--ink-4); font-size: 16px; }
    .modal-body { padding: 20px 24px; display: flex; flex-direction: column; gap: 14px; }
    .modal-footer { padding: 16px 24px; border-top: 1px solid var(--border); display: flex; justify-content: flex-end; gap: 8px; }
    .field { display: flex; flex-direction: column; gap: 5px; }
    .field label { font-size: 12px; font-weight: 500; color: var(--ink-3); }
    .form-input { height: 38px; padding: 0 10px; border: 1px solid var(--border-strong); border-radius: var(--r-md); font-size: 13px; font-family: inherit; color: var(--ink-2); background: var(--surface); }
    .form-input:focus { outline: none; border-color: var(--accent); }
    .form-textarea { padding: 8px 10px; border: 1px solid var(--border-strong); border-radius: var(--r-md); font-size: 13px; font-family: inherit; color: var(--ink-2); background: var(--surface); resize: vertical; }
    .form-textarea:focus { outline: none; border-color: var(--accent); }

    .btn { display: inline-flex; align-items: center; gap: 6px; height: 36px; padding: 0 14px; border-radius: var(--r-md); font-family: inherit; font-size: 13px; font-weight: 500; cursor: pointer; border: 1px solid transparent; text-decoration: none; transition: background .12s; }
    .btn-ghost { background: transparent; color: var(--ink-2); border-color: var(--border-strong); }
    .btn-ghost:hover { background: var(--surface-2); }
    .btn-accent { background: var(--accent); color: #fff; border: none; }
    .btn-accent:hover { background: var(--accent-hover); }
    .btn-accent:disabled { opacity: .5; cursor: not-allowed; }
    .btn-sm { height: 30px; padding: 0 10px; font-size: 12px; }
  `],
})
export class CampaignDetailComponent implements OnInit {
  private route = inject(ActivatedRoute);
  private api = inject(ApiService);

  campaignId = '';
  campaign = signal<Campaign | null>(null);
  assignments = signal<Assignment[]>([]);
  auditEvents = signal<AuditEvent[]>([]);
  reminders = signal<any[]>([]);
  delegations = signal<any[]>([]);

  loadingAudit = signal(false);
  loadingReminders = signal(false);
  loadingDelegations = signal(false);

  activeTab = signal<Tab>('assignments');
  selectedIds = signal<string[]>([]);
  statusFilter = '';

  showExtendModal = false;
  showBulkExtend = false;
  showBulkDelegate = false;

  extendDate = '';
  extendReason = 'stakeholder_request';
  extendNotes = '';
  bulkExtendDate = '';
  bulkExtendReason = 'stakeholder_request';
  delegateToId = '';
  delegateLevel = '1';

  tabs = [
    { value: 'assignments' as Tab, label: 'Assignments', icon: 'pi-list' },
    { value: 'progress' as Tab, label: 'Progress', icon: 'pi-chart-bar' },
    { value: 'reminders' as Tab, label: 'Reminders', icon: 'pi-bell' },
    { value: 'audit' as Tab, label: 'Audit trail', icon: 'pi-history' },
    { value: 'delegations' as Tab, label: 'Delegations', icon: 'pi-users' },
  ];

  statsItems = () => {
    const c = this.campaign();
    if (!c) return [];
    const total = c.assignment_count ?? 0;
    const completed = c.completed_count ?? 0;
    return [
      { label: 'Total assignments', value: String(total), color: 'var(--ink-1)' },
      { label: 'Submitted', value: String(completed), color: 'var(--positive)' },
      { label: 'Pending', value: String(total - completed), color: 'var(--accent)' },
      { label: 'SLA days', value: String(c.sla_days), color: 'var(--ink-1)' },
    ];
  };

  filteredAssignments = () => {
    let list = this.assignments();
    if (this.statusFilter) {
      list = list.filter(a => a.status === this.statusFilter);
    }
    return list;
  };

  progressStats = () => {
    const all = this.assignments();
    const total = all.length || 1;
    const statuses = ['pending', 'in_progress', 'submitted', 'approved', 'rejected'];
    const colors: Record<string, string> = {
      pending: '#b45309', in_progress: '#2563eb', submitted: '#7c3aed',
      approved: 'var(--positive)', rejected: 'var(--danger)',
    };
    return statuses.map(s => {
      const count = all.filter(a => a.status === s).length;
      return { label: s.replace('_', ' '), count, pct: Math.round((count / total) * 100), color: colors[s] };
    });
  };

  allSelected = () => {
    const filtered = this.filteredAssignments();
    return filtered.length > 0 && filtered.every(a => this.selectedIds().includes(a.id));
  };

  ngOnInit(): void {
    this.campaignId = this.route.snapshot.paramMap.get('id')!;
    this.loadCampaign();
    this.loadAssignments();
  }

  private loadCampaign(): void {
    this.api.getCampaign(this.campaignId).subscribe({
      next: c => this.campaign.set(c),
    });
  }

  private loadAssignments(): void {
    this.api.getAssignments(this.campaignId).subscribe({
      next: a => this.assignments.set(a),
    });
  }

  activateCampaign(): void {
    this.api.activateCampaign(this.campaignId).subscribe({
      next: c => this.campaign.set(c),
    });
  }

  toggleAll(evt: Event): void {
    const checked = (evt.target as HTMLInputElement).checked;
    this.selectedIds.set(checked ? this.filteredAssignments().map(a => a.id) : []);
  }

  toggleSelect(id: string): void {
    this.selectedIds.update(ids =>
      ids.includes(id) ? ids.filter(i => i !== id) : [...ids, id]
    );
  }

  bulkAction(action: string): void {
    this.api.bulkActionAssignments({ action, assignment_ids: this.selectedIds() }).subscribe({
      next: () => { this.selectedIds.set([]); this.loadAssignments(); },
    });
  }

  remindOne(id: string): void {
    this.api.bulkActionAssignments({ action: 'remind', assignment_ids: [id] }).subscribe();
  }

  submitExtend(): void {
    this.api.extendCampaignDeadline(this.campaignId, {
      new_due_date: this.extendDate,
      reason_code: this.extendReason,
      notes: this.extendNotes,
    }).subscribe({
      next: c => { this.campaign.set(c); this.showExtendModal = false; },
    });
  }

  submitBulkExtend(): void {
    this.api.bulkActionAssignments({
      action: 'extend_deadline',
      assignment_ids: this.selectedIds(),
      new_due_date: this.bulkExtendDate,
      reason_code: this.bulkExtendReason,
    }).subscribe({
      next: () => { this.showBulkExtend = false; this.selectedIds.set([]); this.loadAssignments(); },
    });
  }

  submitBulkDelegate(): void {
    this.api.bulkActionAssignments({
      action: 'delegate',
      assignment_ids: this.selectedIds(),
      delegate_to_id: this.delegateToId,
      level: Number(this.delegateLevel),
    }).subscribe({
      next: () => { this.showBulkDelegate = false; this.selectedIds.set([]); },
    });
  }

  onTabChange(tab: Tab): void {
    this.activeTab.set(tab);
    if (tab === 'audit' && this.auditEvents().length === 0) {
      this.loadingAudit.set(true);
      this.api.getCampaignAudit(this.campaignId).subscribe({
        next: events => { this.auditEvents.set(events); this.loadingAudit.set(false); },
        error: () => this.loadingAudit.set(false),
      });
    }
    if (tab === 'delegations' && this.delegations().length === 0) {
      this.loadingDelegations.set(true);
      this.api.getCampaignDelegations(this.campaignId).subscribe({
        next: d => { this.delegations.set(d); this.loadingDelegations.set(false); },
        error: () => this.loadingDelegations.set(false),
      });
    }
  }

  formatDate(d: string): string {
    return new Date(d).toLocaleDateString('en', { month: 'short', day: 'numeric', year: 'numeric' });
  }

  formatDateTime(d: string): string {
    return new Date(d).toLocaleString('en', { month: 'short', day: 'numeric', hour: '2-digit', minute: '2-digit' });
  }

  formatAction(action: string): string {
    return action.replace(/_/g, ' ').replace(/\b\w/g, l => l.toUpperCase());
  }
}
