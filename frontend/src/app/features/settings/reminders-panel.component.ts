import { Component } from '@angular/core';

@Component({
  selector: 'app-reminders-panel',
  standalone: true,
  template: `
    <div class="panel">
      <div class="panel-header">
        <h2>Reminder rules</h2>
        <p class="panel-desc">Automatic reminders are sent based on assignment SLA and due date proximity.</p>
      </div>

      <div class="rules-list">
        @for (rule of rules; track rule.id) {
          <div class="rule-card card">
            <div class="rule-icon" [style.background]="rule.color + '20'" [style.color]="rule.color">
              <i [class]="'pi ' + rule.icon"></i>
            </div>
            <div class="rule-info">
              <div class="rule-title">{{ rule.title }}</div>
              <div class="rule-desc">{{ rule.description }}</div>
            </div>
            <div class="rule-toggle">
              <label class="toggle">
                <input type="checkbox" [checked]="rule.enabled" (change)="rule.enabled = !rule.enabled" />
                <span class="toggle-slider"></span>
              </label>
            </div>
          </div>
        }
      </div>

      <div class="info-box">
        <i class="pi pi-info-circle"></i>
        <div>
          <div class="info-title">How reminders work</div>
          <div class="info-desc">
            Reminders are scheduled automatically when assignments are created. They are sent via email
            to the assignee (and delegates, if applicable). You can manually trigger reminders from the
            campaign assignments view using the "Remind" bulk action.
          </div>
        </div>
      </div>
    </div>
  `,
  styles: [`
    .panel { max-width: 640px; }
    .panel-header { margin-bottom: 24px; }
    .panel-header h2 { margin: 0 0 6px; }
    .panel-desc { font-size: 13px; color: var(--ink-4); margin: 0; }

    .rules-list { display: flex; flex-direction: column; gap: 10px; margin-bottom: 24px; }
    .rule-card { display: flex; align-items: center; gap: 14px; padding: 16px; }
    .rule-icon { width: 36px; height: 36px; border-radius: var(--r-md); display: flex; align-items: center; justify-content: center; font-size: 16px; flex-shrink: 0; }
    .rule-info { flex: 1; }
    .rule-title { font-size: 14px; font-weight: 500; color: var(--ink-1); }
    .rule-desc { font-size: 12px; color: var(--ink-4); margin-top: 2px; }

    .toggle { position: relative; display: inline-block; width: 40px; height: 22px; }
    .toggle input { opacity: 0; width: 0; height: 0; }
    .toggle-slider { position: absolute; inset: 0; background: var(--surface-3); border-radius: 999px; cursor: pointer; transition: background .2s; }
    .toggle-slider::before { content: ''; position: absolute; width: 16px; height: 16px; left: 3px; top: 3px; background: #fff; border-radius: 50%; transition: transform .2s; }
    input:checked + .toggle-slider { background: var(--accent); }
    input:checked + .toggle-slider::before { transform: translateX(18px); }

    .info-box { display: flex; gap: 12px; padding: 16px; background: var(--surface-2); border-radius: var(--r-lg); font-size: 13px; }
    .info-box i { color: var(--accent); font-size: 16px; flex-shrink: 0; margin-top: 2px; }
    .info-title { font-weight: 500; color: var(--ink-1); margin-bottom: 4px; }
    .info-desc { color: var(--ink-4); line-height: 1.5; }
  `],
})
export class RemindersPanelComponent {
  rules = [
    {
      id: 'due_soon_7d',
      title: '7 days before due',
      description: 'Send a reminder 7 days before the assignment due date.',
      icon: 'pi-calendar',
      color: 'var(--accent)',
      enabled: true,
    },
    {
      id: 'due_soon_3d',
      title: '3 days before due',
      description: 'Send a reminder 3 days before the assignment due date.',
      icon: 'pi-calendar',
      color: '#f59e0b',
      enabled: true,
    },
    {
      id: 'due_tomorrow',
      title: 'Day before due',
      description: 'Send a final reminder the day before the assignment due date.',
      icon: 'pi-exclamation-triangle',
      color: 'var(--danger)',
      enabled: true,
    },
    {
      id: 'sla_breach',
      title: 'SLA breach',
      description: 'Notify reviewers and admin when an assignment breaches its SLA.',
      icon: 'pi-shield',
      color: 'var(--danger)',
      enabled: true,
    },
    {
      id: 'post_reject',
      title: 'After rejection',
      description: 'Notify assignee when a submission has been rejected and needs revision.',
      icon: 'pi-times-circle',
      color: '#7c3aed',
      enabled: true,
    },
  ];
}
