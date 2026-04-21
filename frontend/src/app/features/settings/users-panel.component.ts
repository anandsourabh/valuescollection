import { Component, inject, OnInit, signal } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { ApiService } from '../../core/http/api.service';
import { User } from '../../core/models/models';

@Component({
  selector: 'app-users-panel',
  standalone: true,
  imports: [FormsModule],
  template: `
    <div class="panel">
      <div class="panel-header">
        <h2>Users</h2>
        <p class="panel-desc">Manage team members and configure their default delegation settings.</p>
      </div>

      <div class="toolbar">
        <div class="search-wrap">
          <i class="pi pi-search search-icon"></i>
          <input class="search-input" placeholder="Search users…" [(ngModel)]="searchQuery" />
        </div>
        <button class="btn btn-accent btn-sm" (click)="showAddForm = !showAddForm">
          <i class="pi pi-plus"></i> Add user
        </button>
      </div>

      <!-- Add user form -->
      @if (showAddForm) {
        <div class="add-form card">
          <h3>Add new user</h3>
          <div class="form-grid">
            <div class="field">
              <label>Full name <span class="req">*</span></label>
              <input type="text" [(ngModel)]="newName" class="form-input" placeholder="Jane Smith" />
            </div>
            <div class="field">
              <label>Email <span class="req">*</span></label>
              <input type="email" [(ngModel)]="newEmail" class="form-input" placeholder="jane@company.com" />
            </div>
            <div class="field">
              <label>Password <span class="req">*</span></label>
              <input type="password" [(ngModel)]="newPassword" class="form-input" placeholder="Min 8 chars" />
            </div>
            <div class="field">
              <label>Role <span class="req">*</span></label>
              <select [(ngModel)]="newRole" class="form-input">
                <option value="admin">Admin</option>
                <option value="reviewer">Reviewer</option>
                <option value="coordinator">Coordinator</option>
                <option value="data_provider">Data provider</option>
                <option value="read_only">Read only</option>
              </select>
            </div>
          </div>

          <div class="delegation-config">
            <div class="delegation-title">Default delegation</div>
            <div class="delegation-sub">Configure who this user's work delegates to by default when assignments are created.</div>
            <div class="form-grid" style="margin-top: 12px;">
              <div class="field">
                <label>Level 1 delegate</label>
                <select [(ngModel)]="newDelegateL1" class="form-input">
                  <option value="">None</option>
                  @for (u of users(); track u.id) {
                    <option [value]="u.id">{{ u.name }} ({{ u.roles?.[0] || 'Member' }})</option>
                  }
                </select>
                <div class="field-hint">Receives assignment immediately upon creation.</div>
              </div>
              <div class="field">
                <label>Level 2 delegate</label>
                <select [(ngModel)]="newDelegateL2" class="form-input">
                  <option value="">None</option>
                  @for (u of users(); track u.id) {
                    <option [value]="u.id">{{ u.name }} ({{ u.roles?.[0] || 'Member' }})</option>
                  }
                </select>
                <div class="field-hint">Activates only on SLA breach or manual escalation.</div>
              </div>
            </div>
          </div>

          @if (addError()) {
            <div class="error-banner">{{ addError() }}</div>
          }

          <div class="form-footer">
            <button class="btn btn-ghost" (click)="showAddForm = false">Cancel</button>
            <button class="btn btn-accent" (click)="addUser()" [disabled]="adding() || !newName || !newEmail || !newPassword">
              {{ adding() ? 'Adding…' : 'Add user' }}
            </button>
          </div>
        </div>
      }

      <!-- Users table -->
      @if (loading()) {
        <div class="loading-sm">Loading users…</div>
      } @else {
        <div class="table-wrap card">
          <table class="data-table">
            <thead>
              <tr>
                <th>Name</th>
                <th>Email</th>
                <th>Role</th>
                <th>L1 Delegate</th>
                <th>L2 Delegate</th>
              </tr>
            </thead>
            <tbody>
              @for (u of filteredUsers(); track u.id) {
                <tr>
                  <td>
                    <div class="user-cell">
                      <div class="user-avatar">{{ initials(u.name) }}</div>
                      <div class="user-name">{{ u.name }}</div>
                    </div>
                  </td>
                  <td class="email">{{ u.email }}</td>
                  <td>
                    <span class="role-badge" [class]="'role-' + (u.roles?.[0] || 'member')">
                      {{ u.roles?.[0] || 'Member' }}
                    </span>
                  </td>
                  <td>{{ u.delegate_l1_name || '—' }}</td>
                  <td>{{ u.delegate_l2_name || '—' }}</td>
                </tr>
              }
            </tbody>
          </table>
          @if (filteredUsers().length === 0) {
            <div class="table-empty">No users match the search.</div>
          }
        </div>
      }
    </div>
  `,
  styles: [`
    .panel { max-width: 800px; }
    .panel-header { margin-bottom: 20px; }
    .panel-header h2 { margin: 0 0 6px; }
    .panel-desc { font-size: 13px; color: var(--ink-4); margin: 0; }

    .toolbar { display: flex; justify-content: space-between; align-items: center; margin-bottom: 16px; }
    .search-wrap { position: relative; }
    .search-icon { position: absolute; left: 10px; top: 50%; transform: translateY(-50%); color: var(--ink-4); font-size: 13px; }
    .search-input { height: 34px; padding: 0 10px 0 30px; border: 1px solid var(--border-strong); border-radius: var(--r-md); font-size: 13px; font-family: inherit; color: var(--ink-2); background: var(--surface); width: 220px; }
    .search-input:focus { outline: none; border-color: var(--accent); }

    .add-form { padding: 20px; margin-bottom: 20px; }
    .add-form h3 { margin: 0 0 16px; font-size: 14px; }
    .form-grid { display: grid; grid-template-columns: 1fr 1fr; gap: 14px; margin-bottom: 16px; }
    .field { display: flex; flex-direction: column; gap: 4px; }
    .field label { font-size: 11px; font-weight: 500; color: var(--ink-3); }
    .field-hint { font-size: 11px; color: var(--ink-4); margin-top: 2px; }
    .req { color: var(--danger); }
    .form-input { height: 36px; padding: 0 10px; border: 1px solid var(--border-strong); border-radius: var(--r-md); font-size: 13px; font-family: inherit; color: var(--ink-2); background: var(--surface); }
    .form-input:focus { outline: none; border-color: var(--accent); }

    .delegation-config { padding: 14px; background: var(--surface-2); border-radius: var(--r-lg); margin-bottom: 16px; }
    .delegation-title { font-size: 13px; font-weight: 500; color: var(--ink-1); }
    .delegation-sub { font-size: 12px; color: var(--ink-4); margin-top: 2px; }

    .error-banner { padding: 10px 14px; background: var(--danger-soft); color: var(--danger); border-radius: var(--r-md); font-size: 13px; margin-bottom: 14px; }
    .form-footer { display: flex; gap: 8px; justify-content: flex-end; }

    .loading-sm, .table-empty { font-size: 13px; color: var(--ink-4); padding: 24px; text-align: center; }

    .table-wrap { overflow: hidden; }
    .data-table { width: 100%; border-collapse: collapse; }
    .data-table th { text-align: left; font-size: 11px; text-transform: uppercase; letter-spacing: .04em; color: var(--ink-4); font-weight: 600; padding: 10px 16px; border-bottom: 1px solid var(--border); white-space: nowrap; }
    .data-table td { padding: 12px 16px; border-bottom: 1px solid var(--border); font-size: 13px; color: var(--ink-2); vertical-align: middle; }
    .data-table tr:last-child td { border-bottom: none; }
    .data-table tr:hover td { background: var(--surface-2); }

    .user-cell { display: flex; align-items: center; gap: 8px; }
    .user-avatar { width: 28px; height: 28px; border-radius: 50%; background: var(--accent); color: #fff; font-size: 11px; font-weight: 600; display: flex; align-items: center; justify-content: center; flex-shrink: 0; }
    .user-name { font-weight: 500; color: var(--ink-1); }
    .email { color: var(--ink-3); font-size: 12px; }

    .role-badge { padding: 2px 8px; border-radius: 999px; font-size: 11px; font-weight: 500; text-transform: capitalize; background: var(--surface-3); color: var(--ink-3); }
    .role-admin { background: #fee2e2; color: #b91c1c; }
    .role-reviewer { background: #eff6ff; color: #2563eb; }
    .role-coordinator { background: #f3e8ff; color: #7c3aed; }
    .role-data_provider { background: var(--positive-soft); color: var(--positive); }

    .btn { display: inline-flex; align-items: center; gap: 6px; height: 36px; padding: 0 14px; border-radius: var(--r-md); font-family: inherit; font-size: 13px; font-weight: 500; cursor: pointer; border: 1px solid transparent; text-decoration: none; transition: background .12s; }
    .btn-ghost { background: transparent; color: var(--ink-2); border-color: var(--border-strong); }
    .btn-ghost:hover { background: var(--surface-2); }
    .btn-accent { background: var(--accent); color: #fff; border: none; }
    .btn-accent:hover { background: var(--accent-hover); }
    .btn:disabled { opacity: .5; cursor: not-allowed; }
    .btn-sm { height: 30px; padding: 0 10px; font-size: 12px; }
  `],
})
export class UsersPanelComponent implements OnInit {
  private api = inject(ApiService);

  users = signal<User[]>([]);
  loading = signal(true);
  adding = signal(false);
  addError = signal('');
  searchQuery = '';
  showAddForm = false;

  newName = '';
  newEmail = '';
  newPassword = '';
  newRole = 'data_provider';
  newDelegateL1 = '';
  newDelegateL2 = '';

  filteredUsers = () => {
    const q = this.searchQuery.toLowerCase().trim();
    if (!q) return this.users();
    return this.users().filter(u =>
      u.name.toLowerCase().includes(q) || u.email.toLowerCase().includes(q)
    );
  };

  ngOnInit(): void {
    this.api.getUsers().subscribe({
      next: u => { this.users.set(u); this.loading.set(false); },
      error: () => this.loading.set(false),
    });
  }

  addUser(): void {
    this.adding.set(true);
    this.addError.set('');
    this.api.createUser({
      name: this.newName,
      email: this.newEmail,
      password: this.newPassword,
      roles: [this.newRole],
      delegate_l1_id: this.newDelegateL1 || undefined,
      delegate_l2_id: this.newDelegateL2 || undefined,
    }).subscribe({
      next: u => {
        this.users.update(list => [...list, u]);
        this.showAddForm = false;
        this.newName = '';
        this.newEmail = '';
        this.newPassword = '';
        this.newRole = 'data_provider';
        this.newDelegateL1 = '';
        this.newDelegateL2 = '';
        this.adding.set(false);
      },
      error: err => {
        this.addError.set(err.error?.detail || 'Failed to add user.');
        this.adding.set(false);
      },
    });
  }

  initials(name: string): string {
    return name.split(' ').map(n => n[0]).slice(0, 2).join('').toUpperCase();
  }
}
