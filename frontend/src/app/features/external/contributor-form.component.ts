import { Component, inject, OnInit, signal } from '@angular/core';
import { ActivatedRoute, Router } from '@angular/router';
import { FormsModule } from '@angular/forms';
import { ApiService } from '../../core/http/api.service';

interface FormData {
  occupancy: string;
  year_built: number | null;
  construction: string;
  stories: number | null;
  total_area_sqft: number | null;
  sprinkler_type: string;
  roof_year: number | null;
  roof_material: string;
  building_tiv: number | null;
  contents_tiv: number | null;
  bi_12mo: number | null;
}

@Component({
  selector: 'app-contributor-form',
  standalone: true,
  imports: [FormsModule],
  template: `
    <div class="ext-page">
      <div class="ext-header">
        <button class="back-btn" (click)="goBack()">
          <i class="pi pi-chevron-left"></i> Back to locations
        </button>
        <h1>{{ assignment()?.property_address || 'Location values' }}</h1>
        @if (assignment()?.property_city) {
          <p class="subtitle">{{ assignment().property_city }}, {{ assignment().property_state }}</p>
        }
        @if (assignment()?.status === 'approved' || assignment()?.status === 'submitted') {
          <div class="submitted-notice">
            <i class="pi pi-check-circle"></i>
            Form already {{ assignment().status }}. Values are read-only.
          </div>
        }
      </div>

      @if (loading()) {
        <div class="loading-state"><i class="pi pi-spin pi-spinner"></i> Loading form…</div>
      } @else {
        <form (ngSubmit)="$event.preventDefault()">
          <!-- General section -->
          <div class="form-section card">
            <div class="section-title">General information</div>
            <div class="form-grid">
              <div class="field">
                <label>Occupancy <span class="req">*</span></label>
                <select [(ngModel)]="formData.occupancy" name="occupancy" class="form-input" [disabled]="isReadOnly()">
                  <option value="">Select…</option>
                  @for (opt of occupancyOptions; track opt) {
                    <option [value]="opt">{{ opt }}</option>
                  }
                </select>
              </div>
              <div class="field">
                <label>Year built</label>
                <input type="number" [(ngModel)]="formData.year_built" name="year_built" class="form-input"
                  placeholder="e.g. 1985" [disabled]="isReadOnly()" />
              </div>
            </div>
          </div>

          <!-- Building section -->
          <div class="form-section card">
            <div class="section-title">Building details</div>
            <div class="form-grid">
              <div class="field">
                <label>Construction type <span class="req">*</span></label>
                <select [(ngModel)]="formData.construction" name="construction" class="form-input" [disabled]="isReadOnly()">
                  <option value="">Select…</option>
                  @for (opt of constructionOptions; track opt) {
                    <option [value]="opt">{{ opt }}</option>
                  }
                </select>
              </div>
              <div class="field">
                <label>Number of stories</label>
                <input type="number" [(ngModel)]="formData.stories" name="stories" class="form-input"
                  placeholder="e.g. 3" min="1" [disabled]="isReadOnly()" />
              </div>
              <div class="field">
                <label>Total area (sq ft) <span class="req">*</span></label>
                <input type="number" [(ngModel)]="formData.total_area_sqft" name="total_area_sqft" class="form-input"
                  placeholder="e.g. 25000" [disabled]="isReadOnly()" />
              </div>
              <div class="field">
                <label>Sprinkler type</label>
                <select [(ngModel)]="formData.sprinkler_type" name="sprinkler_type" class="form-input" [disabled]="isReadOnly()">
                  <option value="">Select…</option>
                  @for (opt of sprinklerOptions; track opt) {
                    <option [value]="opt">{{ opt }}</option>
                  }
                </select>
              </div>
              <div class="field">
                <label>Roof year</label>
                <input type="number" [(ngModel)]="formData.roof_year" name="roof_year" class="form-input"
                  placeholder="e.g. 2010" [disabled]="isReadOnly()" />
              </div>
              <div class="field">
                <label>Roof material</label>
                <select [(ngModel)]="formData.roof_material" name="roof_material" class="form-input" [disabled]="isReadOnly()">
                  <option value="">Select…</option>
                  @for (opt of roofOptions; track opt) {
                    <option [value]="opt">{{ opt }}</option>
                  }
                </select>
              </div>
            </div>
          </div>

          <!-- Values section -->
          <div class="form-section card">
            <div class="section-title">Insured values</div>
            <div class="section-hint">Enter replacement cost values. All monetary amounts in USD.</div>
            <div class="form-grid">
              <div class="field">
                <label>Building TIV ($) <span class="req">*</span></label>
                <input type="number" [(ngModel)]="formData.building_tiv" name="building_tiv" class="form-input"
                  placeholder="0.00" [disabled]="isReadOnly()" (input)="updateTotalTiv()" />
                <div class="field-hint">Replacement cost value of the building structure.</div>
              </div>
              <div class="field">
                <label>Contents TIV ($) <span class="req">*</span></label>
                <input type="number" [(ngModel)]="formData.contents_tiv" name="contents_tiv" class="form-input"
                  placeholder="0.00" [disabled]="isReadOnly()" (input)="updateTotalTiv()" />
                <div class="field-hint">Replacement cost of contents and equipment.</div>
              </div>
              <div class="field">
                <label>Business Interruption — 12 months ($)</label>
                <input type="number" [(ngModel)]="formData.bi_12mo" name="bi_12mo" class="form-input"
                  placeholder="0.00" [disabled]="isReadOnly()" (input)="updateTotalTiv()" />
                <div class="field-hint">Annual business interruption value.</div>
              </div>
              <div class="field total-field">
                <label>Total insured value</label>
                <div class="total-tiv">{{ formatTiv(totalTiv()) }}</div>
              </div>
            </div>
          </div>

          @if (!isReadOnly()) {
            @if (saveError()) {
              <div class="error-banner">{{ saveError() }}</div>
            }
            <div class="form-actions">
              <button type="button" class="btn btn-ghost" (click)="saveDraft()" [disabled]="saving()">
                {{ saving() ? 'Saving…' : 'Save draft' }}
              </button>
              <button type="button" class="btn btn-accent" (click)="submit()" [disabled]="submitting() || !isComplete()">
                {{ submitting() ? 'Submitting…' : 'Submit values' }}
              </button>
            </div>
          }
        </form>
      }
    </div>
  `,
  styles: [`
    .ext-page { min-height: 100vh; background: var(--bg); padding: 24px; max-width: 680px; margin: 0 auto; }
    .back-btn { display: inline-flex; align-items: center; gap: 4px; background: none; border: none; font-size: 13px; color: var(--ink-4); cursor: pointer; padding: 0; margin-bottom: 12px; }
    .back-btn:hover { color: var(--ink-1); }
    h1 { margin: 0 0 4px; font-size: 22px; }
    .subtitle { color: var(--ink-4); font-size: 13px; margin: 0 0 16px; }
    .submitted-notice { display: flex; align-items: center; gap: 8px; padding: 10px 14px; background: var(--positive-soft); color: var(--positive); border-radius: var(--r-md); font-size: 13px; font-weight: 500; margin-bottom: 20px; }

    .loading-state { padding: 40px; text-align: center; color: var(--ink-4); }

    .form-section { padding: 20px; margin-bottom: 16px; }
    .section-title { font-size: 14px; font-weight: 600; color: var(--ink-1); margin-bottom: 4px; }
    .section-hint { font-size: 12px; color: var(--ink-4); margin-bottom: 16px; }

    .form-grid { display: grid; grid-template-columns: 1fr 1fr; gap: 16px; }
    .field { display: flex; flex-direction: column; gap: 4px; }
    .field label { font-size: 12px; font-weight: 500; color: var(--ink-3); }
    .req { color: var(--danger); }
    .field-hint { font-size: 11px; color: var(--ink-4); }
    .form-input { height: 38px; padding: 0 10px; border: 1px solid var(--border-strong); border-radius: var(--r-md); font-size: 13px; font-family: inherit; color: var(--ink-2); background: var(--surface); }
    .form-input:focus { outline: none; border-color: var(--accent); box-shadow: var(--shadow-focus); }
    .form-input:disabled { background: var(--surface-2); color: var(--ink-4); cursor: not-allowed; }

    .total-field { grid-column: span 2; }
    .total-tiv { font-size: 28px; font-weight: 700; color: var(--accent); letter-spacing: -0.02em; }

    .error-banner { padding: 10px 14px; background: var(--danger-soft); color: var(--danger); border-radius: var(--r-md); font-size: 13px; margin-bottom: 16px; }

    .form-actions { display: flex; gap: 10px; justify-content: flex-end; padding: 4px 0 24px; }
    .btn { display: inline-flex; align-items: center; gap: 6px; height: 40px; padding: 0 18px; border-radius: var(--r-md); font-family: inherit; font-size: 14px; font-weight: 500; cursor: pointer; border: 1px solid transparent; text-decoration: none; transition: background .12s; }
    .btn-ghost { background: transparent; color: var(--ink-2); border-color: var(--border-strong); }
    .btn-ghost:hover { background: var(--surface-2); }
    .btn-accent { background: var(--accent); color: #fff; border: none; }
    .btn-accent:hover { background: var(--accent-hover); }
    .btn:disabled { opacity: .5; cursor: not-allowed; }
  `],
})
export class ContributorFormComponent implements OnInit {
  private route = inject(ActivatedRoute);
  private router = inject(Router);
  private api = inject(ApiService);

  token = '';
  locationId = '';
  assignment = signal<any>(null);
  loading = signal(true);
  saving = signal(false);
  submitting = signal(false);
  saveError = signal('');

  formData: FormData = {
    occupancy: '',
    year_built: null,
    construction: '',
    stories: null,
    total_area_sqft: null,
    sprinkler_type: '',
    roof_year: null,
    roof_material: '',
    building_tiv: null,
    contents_tiv: null,
    bi_12mo: null,
  };

  totalTiv = signal(0);

  occupancyOptions = ['Office', 'Retail', 'Industrial', 'Warehouse', 'Mixed Use', 'Restaurant', 'Hotel', 'Other'];
  constructionOptions = ['Frame', 'Joisted Masonry', 'Non-Combustible', 'Masonry Non-Combustible', 'Modified Fire Resistive', 'Fire Resistive'];
  sprinklerOptions = ['None', 'Wet', 'Dry', 'Pre-action', 'Deluge'];
  roofOptions = ['Asphalt Shingle', 'Metal', 'Tile', 'Flat/Membrane', 'Other'];

  isReadOnly = () => {
    const s = this.assignment()?.status;
    return s === 'submitted' || s === 'approved';
  };

  isComplete = () => this.formData.occupancy && this.formData.construction &&
    this.formData.total_area_sqft && this.formData.building_tiv && this.formData.contents_tiv;

  ngOnInit(): void {
    this.token = this.route.snapshot.paramMap.get('token')!;
    this.locationId = this.route.snapshot.paramMap.get('locationId')!;
    this.api.getSubmission(this.locationId).subscribe({
      next: s => {
        this.assignment.set(s);
        if (s.data) {
          this.formData = { ...this.formData, ...(s.data as Partial<FormData>) };
          this.updateTotalTiv();
        }
        this.loading.set(false);
      },
      error: () => this.loading.set(false),
    });
  }

  updateTotalTiv(): void {
    const building = Number(this.formData.building_tiv) || 0;
    const contents = Number(this.formData.contents_tiv) || 0;
    const bi = Number(this.formData.bi_12mo) || 0;
    this.totalTiv.set(building + contents + bi);
  }

  goBack(): void {
    this.router.navigate(['/ext', this.token, 'locations']);
  }

  saveDraft(): void {
    this.saving.set(true);
    this.saveError.set('');
    this.api.saveSubmission(this.locationId, { data: this.formData as unknown as Record<string, unknown> }).subscribe({
      next: () => this.saving.set(false),
      error: err => {
        this.saveError.set(err.error?.detail || 'Failed to save. Please try again.');
        this.saving.set(false);
      },
    });
  }

  submit(): void {
    this.submitting.set(true);
    this.saveError.set('');
    this.api.submitSubmission(this.locationId).subscribe({
      next: () => {
        this.assignment.update(a => ({ ...a, status: 'submitted' }));
        this.submitting.set(false);
      },
      error: err => {
        this.saveError.set(err.error?.detail || 'Submission failed. Please save as draft and try again.');
        this.submitting.set(false);
      },
    });
  }

  formatTiv(v: number): string {
    if (!v) return '$0';
    if (v >= 1_000_000) return '$' + (v / 1_000_000).toFixed(2) + 'M';
    if (v >= 1_000) return '$' + (v / 1_000).toFixed(0) + 'K';
    return '$' + v.toFixed(0);
  }
}
