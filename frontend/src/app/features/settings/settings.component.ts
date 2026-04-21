import { Component } from '@angular/core';
import { RouterLink, RouterLinkActive, RouterOutlet } from '@angular/router';

@Component({
  selector: 'app-settings',
  standalone: true,
  imports: [RouterLink, RouterLinkActive, RouterOutlet],
  template: `
    <div class="settings-layout">
      <nav class="settings-nav card">
        <div class="nav-title">Settings</div>
        @for (item of navItems; track item.path) {
          <a class="nav-item" [routerLink]="item.path" routerLinkActive="active">
            <i [class]="'pi ' + item.icon"></i>
            <div class="nav-item-info">
              <div class="nav-item-label">{{ item.label }}</div>
              <div class="nav-item-desc">{{ item.desc }}</div>
            </div>
          </a>
        }
      </nav>
      <div class="settings-content">
        <router-outlet />
      </div>
    </div>
  `,
  styles: [`
    .settings-layout { display: flex; gap: 20px; height: 100%; padding: 24px; overflow: hidden; }
    .settings-nav { width: 240px; flex-shrink: 0; padding: 8px; align-self: flex-start; }
    .nav-title { font-size: 11px; text-transform: uppercase; letter-spacing: .06em; font-weight: 600; color: var(--ink-4); padding: 8px 12px 10px; }
    .nav-item { display: flex; align-items: flex-start; gap: 10px; padding: 10px 12px; border-radius: var(--r-md); text-decoration: none; color: inherit; transition: background .1s; }
    .nav-item:hover { background: var(--surface-2); }
    .nav-item.active { background: var(--surface-3); }
    .nav-item i { color: var(--ink-4); font-size: 14px; margin-top: 2px; }
    .nav-item.active i { color: var(--accent); }
    .nav-item-label { font-size: 13px; font-weight: 500; color: var(--ink-1); }
    .nav-item-desc { font-size: 11px; color: var(--ink-4); margin-top: 1px; }
    .settings-content { flex: 1; overflow: auto; }
  `],
})
export class SettingsComponent {
  navItems = [
    { path: '/settings/reminders', label: 'Reminders', desc: 'Notification rules', icon: 'pi-bell' },
    { path: '/settings/delegations', label: 'Delegations', desc: 'OOO & delegate rules', icon: 'pi-users' },
    { path: '/settings/users', label: 'Users', desc: 'Manage team members', icon: 'pi-user' },
  ];
}
