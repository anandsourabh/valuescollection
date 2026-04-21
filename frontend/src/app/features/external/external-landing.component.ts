import { Component, inject, OnInit, signal } from '@angular/core';
import { ActivatedRoute, Router } from '@angular/router';
import { FormsModule } from '@angular/forms';
import { ApiService } from '../../core/http/api.service';

@Component({
  selector: 'app-external-landing',
  standalone: true,
  imports: [FormsModule],
  template: `
    <div class="landing-page">
      <div class="landing-card">
        <div class="brand">
          <div class="brand-mark">i</div>
          <span class="brand-name">Blue<span class="accent">[i]</span> Property</span>
        </div>

        @if (!verified()) {
          <div class="card-body">
            <h1 class="title">Values Collection</h1>
            <p class="subtitle">Enter the 6-digit passcode from your invitation email to access your assigned locations.</p>

            @if (error()) {
              <div class="error-banner">{{ error() }}</div>
            }

            <div class="passcode-form">
              <div class="field">
                <label>Passcode</label>
                <input type="text" [(ngModel)]="passcode" class="passcode-input" maxlength="6"
                  placeholder="000000" (keyup.enter)="verify()" />
              </div>
              <button class="btn-submit" (click)="verify()" [disabled]="loading() || passcode.length !== 6">
                {{ loading() ? 'Verifying…' : 'Access my assignments' }}
              </button>
            </div>
          </div>
        } @else {
          <div class="card-body success">
            <div class="success-icon"><i class="pi pi-check-circle"></i></div>
            <h2>Identity verified</h2>
            <p>Redirecting to your assignments…</p>
          </div>
        }

        <div class="card-footer">
          If you have trouble accessing your assignments, contact your insurer or broker.
        </div>
      </div>
    </div>
  `,
  styles: [`
    .landing-page { min-height: 100vh; background: var(--bg); display: flex; align-items: center; justify-content: center; padding: 24px; }
    .landing-card { width: 100%; max-width: 420px; background: var(--surface); border: 1px solid var(--border); border-radius: var(--r-xl); box-shadow: var(--shadow-lg); overflow: hidden; }
    .brand { display: flex; align-items: center; gap: 8px; padding: 24px 28px 20px; border-bottom: 1px solid var(--border); }
    .brand-mark { width: 24px; height: 24px; border-radius: 5px; background: linear-gradient(135deg, #0E1116 0%, #2E4BFF 100%); color: #fff; font-weight: 700; font-size: 12px; display: flex; align-items: center; justify-content: center; }
    .brand-name { font-size: 14px; font-weight: 600; color: var(--ink-1); }
    .accent { color: var(--accent); }

    .card-body { padding: 28px; }
    .title { font-size: 22px; margin: 0 0 8px; }
    .subtitle { color: var(--ink-4); font-size: 13px; margin: 0 0 24px; line-height: 1.5; }

    .error-banner { padding: 10px 14px; background: var(--danger-soft); color: var(--danger); border-radius: var(--r-md); font-size: 13px; margin-bottom: 16px; }

    .passcode-form { display: flex; flex-direction: column; gap: 16px; }
    .field { display: flex; flex-direction: column; gap: 5px; }
    .field label { font-size: 12px; font-weight: 500; color: var(--ink-3); }
    .passcode-input { height: 52px; padding: 0 16px; border: 1px solid var(--border-strong); border-radius: var(--r-md); font-size: 24px; font-family: monospace; letter-spacing: 8px; text-align: center; color: var(--ink-1); background: var(--surface); }
    .passcode-input:focus { outline: none; border-color: var(--accent); box-shadow: var(--shadow-focus); }
    .btn-submit { width: 100%; height: 44px; background: var(--accent); color: #fff; border: none; border-radius: var(--r-md); font-size: 14px; font-weight: 500; cursor: pointer; font-family: inherit; transition: background .12s; }
    .btn-submit:hover:not(:disabled) { background: var(--accent-hover); }
    .btn-submit:disabled { opacity: .5; cursor: not-allowed; }

    .card-body.success { text-align: center; padding: 40px 28px; }
    .success-icon { font-size: 44px; color: var(--positive); margin-bottom: 12px; }
    .success-icon i { display: block; }
    .card-body.success h2 { margin: 0 0 8px; }
    .card-body.success p { color: var(--ink-4); font-size: 13px; margin: 0; }

    .card-footer { padding: 14px 28px; border-top: 1px solid var(--border); font-size: 12px; color: var(--ink-4); background: var(--surface-2); }
  `],
})
export class ExternalLandingComponent implements OnInit {
  private route = inject(ActivatedRoute);
  private router = inject(Router);
  private api = inject(ApiService);

  token = '';
  passcode = '';
  loading = signal(false);
  error = signal('');
  verified = signal(false);

  ngOnInit(): void {
    this.token = this.route.snapshot.paramMap.get('token')!;
  }

  verify(): void {
    if (this.passcode.length !== 6) return;
    this.loading.set(true);
    this.error.set('');
    this.api.verifyExternalToken({ token: this.token, passcode: this.passcode }).subscribe({
      next: res => {
        localStorage.setItem('ext_token', res.access_token);
        this.verified.set(true);
        setTimeout(() => this.router.navigate(['/ext', this.token, 'locations']), 800);
      },
      error: err => {
        this.error.set(err.status === 401 ? 'Incorrect passcode. Please try again.' : 'Verification failed. Please contact support.');
        this.loading.set(false);
      },
    });
  }
}
