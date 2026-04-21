import { Component, inject, OnInit, signal } from '@angular/core';
import { Router, RouterLink } from '@angular/router';
import { FormsModule } from '@angular/forms';
import { ApiService } from '../../core/http/api.service';
import { Portfolio } from '../../core/models/models';

@Component({
  selector: 'app-create-campaign',
  standalone: true,
  imports: [RouterLink, FormsModule],
  template: `
    <div class="page-pad narrow">
      <div class="page-header">
        <div>
          <a class="back-link" routerLink="/campaigns"><i class="pi pi-chevron-left"></i> Campaigns</a>
          <h1>New campaign</h1>
        </div>
      </div>

      <!-- Step indicator -->
      <div class="steps-bar">
        @for (s of steps; track s.num) {
          <div class="step" [class.active]="step() === s.num" [class.done]="step() > s.num">
            <div class="step-dot">
              @if (step() > s.num) {
                <i class="pi pi-check"></i>
              } @else {
                {{ s.num }}
              }
            </div>
            <div class="step-label">{{ s.label }}</div>
          </div>
          @if (s.num < steps.length) {
            <div class="step-line" [class.done]="step() > s.num"></div>
          }
        }
      </div>

      <div class="card form-card">
        <!-- Step 1: Campaign details -->
        @if (step() === 1) {
          <div class="form-section">
            <h2 class="section-title">Campaign details</h2>
            <p class="section-sub">Basic information about this renewal campaign.</p>

            <div class="field">
              <label>Campaign name <span class="req">*</span></label>
              <input type="text" [(ngModel)]="name" class="form-input" placeholder="e.g. NA Renewal 2026" />
            </div>

            <div class="field">
              <label>Description</label>
              <textarea [(ngModel)]="description" class="form-textarea" rows="3" placeholder="Brief description of this campaign…"></textarea>
            </div>

            <div class="field-row">
              <div class="field">
                <label>Due date <span class="req">*</span></label>
                <input type="date" [(ngModel)]="dueDate" class="form-input" />
              </div>
              <div class="field">
                <label>SLA days <span class="req">*</span></label>
                <input type="number" [(ngModel)]="slaDays" class="form-input" min="1" max="90" placeholder="30" />
              </div>
            </div>

            <div class="field-row">
              <div class="field">
                <label>Signed link model</label>
                <select [(ngModel)]="linkModel" class="form-input">
                  <option value="bundled">Bundled (one link per assignee)</option>
                  <option value="per_location">Per location (one link per property)</option>
                </select>
              </div>
              <div class="field">
                <label>SLA breach policy</label>
                <select [(ngModel)]="breachPolicy" class="form-input">
                  <option value="notify_only">Notify only</option>
                  <option value="auto_escalate">Auto-escalate to L2 delegate</option>
                  <option value="auto_approve">Auto-approve on breach</option>
                </select>
              </div>
            </div>
          </div>
        }

        <!-- Step 2: Select portfolios -->
        @if (step() === 2) {
          <div class="form-section">
            <h2 class="section-title">Select portfolios</h2>
            <p class="section-sub">Choose which portfolios are included in this campaign.</p>

            @if (loadingPortfolios()) {
              <div class="loading-sm">Loading portfolios…</div>
            } @else {
              <div class="portfolio-list">
                @for (p of portfolios(); track p.id) {
                  <label class="portfolio-item" [class.selected]="selectedPortfolios().includes(p.id)">
                    <input type="checkbox" [checked]="selectedPortfolios().includes(p.id)"
                      (change)="togglePortfolio(p.id)" />
                    <div class="portfolio-info">
                      <div class="portfolio-name">{{ p.name }}</div>
                      <div class="portfolio-sub">{{ p.description || 'No description' }}</div>
                    </div>
                    @if (selectedPortfolios().includes(p.id)) {
                      <i class="pi pi-check-circle check-mark"></i>
                    }
                  </label>
                }
                @if (portfolios().length === 0) {
                  <div class="empty-sm">No portfolios found. Create portfolios first.</div>
                }
              </div>
            }
          </div>
        }

        <!-- Step 3: Review -->
        @if (step() === 3) {
          <div class="form-section">
            <h2 class="section-title">Review & create</h2>
            <p class="section-sub">Confirm campaign details before creating.</p>

            <div class="review-grid">
              <div class="review-item">
                <div class="review-label">Name</div>
                <div class="review-value">{{ name }}</div>
              </div>
              <div class="review-item">
                <div class="review-label">Description</div>
                <div class="review-value">{{ description || '—' }}</div>
              </div>
              <div class="review-item">
                <div class="review-label">Due date</div>
                <div class="review-value">{{ formatDate(dueDate) }}</div>
              </div>
              <div class="review-item">
                <div class="review-label">SLA days</div>
                <div class="review-value">{{ slaDays }} days</div>
              </div>
              <div class="review-item">
                <div class="review-label">Link model</div>
                <div class="review-value">{{ linkModel }}</div>
              </div>
              <div class="review-item">
                <div class="review-label">Breach policy</div>
                <div class="review-value">{{ formatLabel(breachPolicy) }}</div>
              </div>
              <div class="review-item">
                <div class="review-label">Portfolios</div>
                <div class="review-value">
                  @if (selectedPortfolios().length === 0) {
                    <span class="dim">None selected</span>
                  } @else {
                    {{ selectedPortfolioNames() }}
                  }
                </div>
              </div>
            </div>

            @if (error()) {
              <div class="error-banner">{{ error() }}</div>
            }
          </div>
        }

        <!-- Footer actions -->
        <div class="form-footer">
          <div>
            @if (step() > 1) {
              <button class="btn btn-ghost" (click)="prevStep()">
                <i class="pi pi-chevron-left"></i> Back
              </button>
            }
          </div>
          <div class="right-actions">
            <a class="btn btn-ghost" routerLink="/campaigns">Cancel</a>
            @if (step() < 3) {
              <button class="btn btn-accent" (click)="nextStep()" [disabled]="!canProceed()">
                Continue <i class="pi pi-chevron-right"></i>
              </button>
            }  @else {
              <button class="btn btn-accent" (click)="submit()" [disabled]="submitting()">
                {{ submitting() ? 'Creating…' : 'Create campaign' }}
              </button>
            }
          </div>
        </div>
      </div>
    </div>
  `,
  styles: [`
    .narrow { max-width: 680px; }
    .page-header { margin-bottom: 24px; }
    .back-link { display: inline-flex; align-items: center; gap: 4px; font-size: 13px; color: var(--ink-4); text-decoration: none; margin-bottom: 6px; }
    .back-link:hover { color: var(--ink-1); }

    .steps-bar { display: flex; align-items: center; margin-bottom: 28px; }
    .step { display: flex; flex-direction: column; align-items: center; gap: 6px; }
    .step-dot { width: 28px; height: 28px; border-radius: 50%; border: 2px solid var(--border-strong); display: flex; align-items: center; justify-content: center; font-size: 13px; font-weight: 600; color: var(--ink-4); background: var(--surface); transition: all .2s; }
    .step.active .step-dot { border-color: var(--accent); color: var(--accent); }
    .step.done .step-dot { border-color: var(--positive); background: var(--positive); color: #fff; }
    .step-label { font-size: 11px; font-weight: 500; color: var(--ink-4); white-space: nowrap; }
    .step.active .step-label { color: var(--accent); }
    .step-line { flex: 1; height: 1px; background: var(--border); margin: 0 8px; margin-bottom: 18px; }
    .step-line.done { background: var(--positive); }

    .form-card { padding: 0; overflow: hidden; }
    .form-section { padding: 28px; }
    .section-title { margin: 0 0 4px; font-size: 16px; }
    .section-sub { color: var(--ink-4); font-size: 13px; margin-bottom: 24px; }

    .field { display: flex; flex-direction: column; gap: 5px; margin-bottom: 18px; }
    .field-row { display: grid; grid-template-columns: 1fr 1fr; gap: 16px; }
    .field label { font-size: 12px; font-weight: 500; color: var(--ink-3); }
    .req { color: var(--danger); }
    .form-input { height: 38px; padding: 0 10px; border: 1px solid var(--border-strong); border-radius: var(--r-md); font-size: 13px; font-family: inherit; color: var(--ink-2); background: var(--surface); }
    .form-input:focus { outline: none; border-color: var(--accent); box-shadow: var(--shadow-focus); }
    .form-textarea { padding: 8px 10px; border: 1px solid var(--border-strong); border-radius: var(--r-md); font-size: 13px; font-family: inherit; color: var(--ink-2); background: var(--surface); resize: vertical; }
    .form-textarea:focus { outline: none; border-color: var(--accent); }

    .portfolio-list { display: flex; flex-direction: column; gap: 8px; }
    .portfolio-item { display: flex; align-items: center; gap: 12px; padding: 14px; border: 1px solid var(--border); border-radius: var(--r-lg); cursor: pointer; transition: border-color .1s, background .1s; }
    .portfolio-item:hover { border-color: var(--border-strong); background: var(--surface-2); }
    .portfolio-item.selected { border-color: var(--accent); background: var(--accent-soft); }
    .portfolio-info { flex: 1; }
    .portfolio-name { font-size: 14px; font-weight: 500; color: var(--ink-1); }
    .portfolio-sub { font-size: 12px; color: var(--ink-4); margin-top: 2px; }
    .check-mark { color: var(--accent); font-size: 16px; }

    .review-grid { display: grid; grid-template-columns: 1fr 1fr; gap: 16px; margin-bottom: 24px; }
    .review-item { }
    .review-label { font-size: 11px; text-transform: uppercase; letter-spacing: .04em; color: var(--ink-4); font-weight: 600; margin-bottom: 3px; }
    .review-value { font-size: 14px; color: var(--ink-1); font-weight: 500; text-transform: capitalize; }
    .dim { color: var(--ink-4); }

    .error-banner { padding: 10px 14px; background: var(--danger-soft); color: var(--danger); border-radius: var(--r-md); font-size: 13px; }

    .form-footer { display: flex; justify-content: space-between; align-items: center; padding: 16px 28px; border-top: 1px solid var(--border); background: var(--surface-2); }
    .right-actions { display: flex; gap: 8px; }

    .loading-sm { color: var(--ink-4); font-size: 13px; padding: 16px 0; }
    .empty-sm { color: var(--ink-4); font-size: 13px; padding: 24px 0; }

    .btn { display: inline-flex; align-items: center; gap: 6px; height: 36px; padding: 0 14px; border-radius: var(--r-md); font-family: inherit; font-size: 13px; font-weight: 500; cursor: pointer; border: 1px solid transparent; text-decoration: none; transition: background .12s; }
    .btn-ghost { background: transparent; color: var(--ink-2); border-color: var(--border-strong); }
    .btn-ghost:hover { background: var(--surface-2); }
    .btn-accent { background: var(--accent); color: #fff; border: none; }
    .btn-accent:hover { background: var(--accent-hover); }
    .btn-accent:disabled { opacity: .5; cursor: not-allowed; }
  `],
})
export class CreateCampaignComponent implements OnInit {
  private api = inject(ApiService);
  private router = inject(Router);

  step = signal(1);
  portfolios = signal<Portfolio[]>([]);
  selectedPortfolios = signal<string[]>([]);
  loadingPortfolios = signal(false);
  submitting = signal(false);
  error = signal('');

  name = '';
  description = '';
  dueDate = '';
  slaDays = 30;
  linkModel = 'bundled';
  breachPolicy = 'notify_only';

  steps = [
    { num: 1, label: 'Details' },
    { num: 2, label: 'Portfolios' },
    { num: 3, label: 'Review' },
  ];

  ngOnInit(): void {
    this.loadingPortfolios.set(true);
    this.api.getPortfolios().subscribe({
      next: p => { this.portfolios.set(p); this.loadingPortfolios.set(false); },
      error: () => this.loadingPortfolios.set(false),
    });
    const tomorrow = new Date();
    tomorrow.setDate(tomorrow.getDate() + 30);
    this.dueDate = tomorrow.toISOString().split('T')[0];
  }

  canProceed(): boolean {
    if (this.step() === 1) return !!this.name.trim() && !!this.dueDate && this.slaDays > 0;
    return true;
  }

  nextStep(): void {
    if (this.canProceed()) this.step.update(s => s + 1);
  }

  togglePortfolio(id: string): void {
    this.selectedPortfolios.update(ids =>
      ids.includes(id) ? ids.filter(i => i !== id) : [...ids, id]
    );
  }

  selectedPortfolioNames(): string {
    return this.portfolios()
      .filter(p => this.selectedPortfolios().includes(p.id))
      .map(p => p.name)
      .join(', ');
  }

  submit(): void {
    this.submitting.set(true);
    this.error.set('');
    this.api.createCampaign({
      name: this.name,
      description: this.description,
      due_date: this.dueDate,
      sla_days: this.slaDays,
      link_model: this.linkModel as 'bundled' | 'per_location',
      breach_policy: this.breachPolicy,
      portfolio_ids: this.selectedPortfolios(),
    }).subscribe({
      next: c => this.router.navigate(['/campaigns', c.id]),
      error: err => {
        this.error.set(err.error?.detail || 'Failed to create campaign. Please try again.');
        this.submitting.set(false);
      },
    });
  }

  prevStep(): void {
    this.step.update(s => s - 1);
  }

  formatDate(d: string): string {
    if (!d) return '—';
    return new Date(d).toLocaleDateString('en', { month: 'long', day: 'numeric', year: 'numeric' });
  }

  formatLabel(s: string): string {
    return s.split('_').join(' ');
  }
}
