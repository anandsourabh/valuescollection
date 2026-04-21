import { Component, inject, OnInit } from '@angular/core';
import { RouterOutlet, RouterLink, RouterLinkActive } from '@angular/router';
import { AuthService } from '../../../core/auth/auth.service';

@Component({
  selector: 'app-shell',
  standalone: true,
  imports: [RouterOutlet, RouterLink, RouterLinkActive],
  template: `
    <div class="shell">
      <nav class="sidebar">
        <div class="sidebar-brand">
          <div class="brand-mark">i</div>
          <span class="brand-name">Blue<span class="accent">[i]</span> Property</span>
        </div>
        <div class="sidebar-section-label">Values Collection</div>
        <div class="sidebar-nav">
          @for (item of navItems; track item.path) {
            <a class="nav-item" [routerLink]="item.path" routerLinkActive="active">
              <i [class]="'pi ' + item.icon"></i>
              <span>{{ item.label }}</span>
            </a>
          }
        </div>
        <div class="sidebar-user">
          <div class="user-avatar">{{ initials }}</div>
          <div class="user-info">
            <div class="user-name">{{ auth.currentUser()?.name || 'User' }}</div>
            <div class="user-role">{{ auth.currentUser()?.roles?.[0] || 'Member' }}</div>
          </div>
          <button class="logout-btn" (click)="auth.logout()" title="Log out">
            <i class="pi pi-sign-out"></i>
          </button>
        </div>
      </nav>
      <main class="main-content">
        <router-outlet />
      </main>
    </div>
  `,
  styles: [`
    .shell { display: flex; height: 100vh; overflow: hidden; }

    .sidebar {
      width: 220px; flex-shrink: 0;
      background: var(--surface-2); border-right: 1px solid var(--border);
      display: flex; flex-direction: column; height: 100%;
    }
    .sidebar-brand {
      padding: 18px 20px 14px;
      display: flex; align-items: center; gap: 8px;
    }
    .brand-mark {
      width: 22px; height: 22px; border-radius: 5px;
      background: linear-gradient(135deg, #0E1116 0%, #2E4BFF 100%);
      color: #fff; font-weight: 700; font-size: 12px;
      display: flex; align-items: center; justify-content: center;
    }
    .brand-name { font-size: 14px; font-weight: 600; color: var(--ink-1); }
    .accent { color: var(--accent); }

    .sidebar-section-label {
      font-size: 10px; text-transform: uppercase; letter-spacing: 0.08em;
      color: var(--ink-4); padding: 12px 20px 6px; font-weight: 600;
    }
    .sidebar-nav { flex: 1; }
    .nav-item {
      display: flex; align-items: center; gap: 10px;
      padding: 8px 12px; margin: 1px 10px; border-radius: var(--r-md);
      color: var(--ink-3); font-size: 13px; font-weight: 500;
      cursor: pointer; text-decoration: none; transition: background .1s;
    }
    .nav-item:hover { background: var(--surface-3); color: var(--ink-2); }
    .nav-item.active { background: var(--ink-1); color: #fff; }

    .sidebar-user {
      padding: 14px; border-top: 1px solid var(--border);
      display: flex; align-items: center; gap: 10px;
    }
    .user-avatar {
      width: 30px; height: 30px; border-radius: 15px;
      background: var(--accent); color: #fff;
      font-size: 12px; font-weight: 600;
      display: flex; align-items: center; justify-content: center; flex-shrink: 0;
    }
    .user-info { flex: 1; min-width: 0; }
    .user-name { font-size: 12px; font-weight: 600; color: var(--ink-1); white-space: nowrap; overflow: hidden; text-overflow: ellipsis; }
    .user-role { font-size: 11px; color: var(--ink-4); text-transform: capitalize; }
    .logout-btn { background: none; border: none; cursor: pointer; color: var(--ink-4); padding: 4px; }
    .logout-btn:hover { color: var(--ink-1); }

    .main-content { flex: 1; display: flex; flex-direction: column; overflow: hidden; }
  `],
})
export class ShellComponent implements OnInit {
  auth = inject(AuthService);

  navItems = [
    { path: '/dashboard',   label: 'Overview',      icon: 'pi-home' },
    { path: '/campaigns',   label: 'Campaigns',     icon: 'pi-flag' },
    { path: '/assignments', label: 'Assignments',   icon: 'pi-list' },
    { path: '/reviews',     label: 'Reviews',       icon: 'pi-check-square' },
    { path: '/settings',    label: 'Settings',      icon: 'pi-cog' },
  ];

  get initials(): string {
    const name = this.auth.currentUser()?.name || 'U';
    return name.split(' ').map((n: string) => n[0]).slice(0, 2).join('').toUpperCase();
  }

  ngOnInit(): void {
    if (this.auth.isLoggedIn && !this.auth.currentUser()) {
      this.auth.loadCurrentUser().subscribe();
    }
  }
}
