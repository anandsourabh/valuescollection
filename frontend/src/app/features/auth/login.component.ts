import { Component, inject } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { Router } from '@angular/router';
import { AuthService } from '../../core/auth/auth.service';

@Component({
  selector: 'app-login',
  standalone: true,
  imports: [FormsModule],
  template: `
    <div class="login-page">
      <div class="login-card">
        <div class="brand">
          <div class="brand-mark">i</div>
          <span class="brand-name">Blue<span class="accent">[i]</span> Property</span>
        </div>
        <h1 class="title">Sign in to Values Collection</h1>
        <p class="subtitle">Enter your credentials to access the platform.</p>

        @if (error) {
          <div class="error-banner">{{ error }}</div>
        }

        <form (ngSubmit)="submit()" class="form">
          <div class="field">
            <label>Email</label>
            <input type="email" [(ngModel)]="email" name="email" placeholder="you@company.com" required />
          </div>
          <div class="field">
            <label>Password</label>
            <input type="password" [(ngModel)]="password" name="password" placeholder="••••••••" required />
          </div>
          <button type="submit" class="btn-submit" [disabled]="loading">
            {{ loading ? 'Signing in…' : 'Sign in' }}
          </button>
        </form>

        <div class="hint">
          <strong>Dev credentials:</strong> alex.morgan&#64;hartwell.com / password123
        </div>
      </div>
    </div>
  `,
  styles: [`
    .login-page {
      min-height: 100vh; background: var(--bg);
      display: flex; align-items: center; justify-content: center; padding: 24px;
    }
    .login-card {
      width: 100%; max-width: 400px;
      background: var(--surface); border: 1px solid var(--border);
      border-radius: var(--r-xl); padding: 36px; box-shadow: var(--shadow-lg);
    }
    .brand { display: flex; align-items: center; gap: 8px; margin-bottom: 24px; }
    .brand-mark {
      width: 28px; height: 28px; border-radius: 6px;
      background: linear-gradient(135deg, #0E1116 0%, #2E4BFF 100%);
      color: #fff; font-weight: 700; font-size: 14px;
      display: flex; align-items: center; justify-content: center;
    }
    .brand-name { font-size: 16px; font-weight: 600; color: var(--ink-1); }
    .accent { color: var(--accent); }
    .title { font-size: 22px; margin-bottom: 6px; }
    .subtitle { color: var(--ink-4); font-size: 13px; margin-bottom: 24px; }
    .error-banner {
      padding: 10px 14px; background: var(--danger-soft); color: var(--danger);
      border-radius: var(--r-md); font-size: 13px; margin-bottom: 16px;
    }
    .field { margin-bottom: 16px; }
    .field label { display: block; font-size: 12px; font-weight: 500; color: var(--ink-3); margin-bottom: 6px; }
    .field input {
      width: 100%; height: 40px; padding: 0 12px;
      border: 1px solid var(--border-strong); border-radius: var(--r-md);
      font-size: 13px; font-family: inherit; color: var(--ink-2);
      transition: border-color .12s, box-shadow .12s;
    }
    .field input:focus { outline: none; border-color: var(--accent); box-shadow: var(--shadow-focus); }
    .btn-submit {
      width: 100%; height: 44px; background: var(--accent); color: #fff;
      border: none; border-radius: var(--r-md); font-size: 14px; font-weight: 500;
      cursor: pointer; font-family: inherit; transition: background .12s;
    }
    .btn-submit:hover:not(:disabled) { background: var(--accent-hover); }
    .btn-submit:disabled { opacity: .6; cursor: not-allowed; }
    .hint { margin-top: 20px; padding: 12px; background: var(--surface-2); border-radius: var(--r-md); font-size: 12px; color: var(--ink-4); }
  `],
})
export class LoginComponent {
  private auth = inject(AuthService);
  private router = inject(Router);

  email = '';
  password = '';
  loading = false;
  error = '';

  submit(): void {
    this.loading = true;
    this.error = '';
    this.auth.login(this.email, this.password).subscribe({
      next: () => this.router.navigate(['/dashboard']),
      error: () => {
        this.error = 'Invalid email or password.';
        this.loading = false;
      },
    });
  }
}
