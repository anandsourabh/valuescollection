import { Component, inject, OnInit, signal } from '@angular/core';
import { ActivatedRoute, RouterLink } from '@angular/router';
import { FormsModule } from '@angular/forms';
import { ApiService } from '../../core/http/api.service';

interface FormField {
  key: string;
  label: string;
  type: 'text' | 'number' | 'select' | 'textarea' | 'date';
  required: boolean;
  options?: string[];
  section: string;
  helpText?: string;
}

@Component({
  selector: 'app-form-builder',
  standalone: true,
  imports: [RouterLink, FormsModule],
  template: `
    <div class="page-pad">
      <div class="page-header">
        <div class="header-left">
          <a class="back-link" [routerLink]="['/campaigns', campaignId]">
            <i class="pi pi-chevron-left"></i> Campaign
          </a>
          <h1>Form builder</h1>
          <p class="subtitle">Configure the data collection form for this campaign.</p>
        </div>
        <div class="header-actions">
          @if (schema()?.is_published) {
            <span class="published-badge"><i class="pi pi-check-circle"></i> Published</span>
          }
          <button class="btn btn-ghost" (click)="saveSchema()" [disabled]="saving()">
            {{ saving() ? 'Saving…' : 'Save draft' }}
          </button>
          <button class="btn btn-accent" (click)="publishSchema()" [disabled]="publishing()">
            <i class="pi pi-send"></i> {{ publishing() ? 'Publishing…' : 'Publish' }}
          </button>
        </div>
      </div>

      @if (loading()) {
        <div class="loading-state"><i class="pi pi-spin pi-spinner"></i> Loading form schema…</div>
      } @else {
        <div class="builder-layout">
          <!-- Sections panel -->
          <div class="sections-panel card">
            <div class="panel-title">Sections</div>
            <div class="section-list">
              @for (section of sections; track section) {
                <button class="section-btn" [class.active]="activeSection() === section"
                  (click)="activeSection.set(section)">
                  {{ section }}
                  <span class="field-count">{{ fieldsInSection(section).length }}</span>
                </button>
              }
            </div>
          </div>

          <!-- Fields panel -->
          <div class="fields-panel">
            <div class="fields-header">
              <h2>{{ activeSection() }}</h2>
              <button class="btn btn-ghost btn-sm" (click)="addField()">
                <i class="pi pi-plus"></i> Add field
              </button>
            </div>

            <div class="fields-list">
              @for (field of fieldsInSection(activeSection()); track field.key; let i = $index) {
                <div class="field-card card" [class.editing]="editingKey() === field.key">
                  <div class="field-summary" (click)="toggleEdit(field.key)">
                    <div class="field-info">
                      <span class="field-key">{{ field.key }}</span>
                      <span class="field-label">{{ field.label }}</span>
                      @if (field.required) {
                        <span class="req-badge">Required</span>
                      }
                    </div>
                    <div class="field-type-badge">{{ field.type }}</div>
                    <div class="field-actions">
                      <button class="btn-icon" (click)="moveField(field.key, -1); $event.stopPropagation()" title="Move up">
                        <i class="pi pi-chevron-up"></i>
                      </button>
                      <button class="btn-icon" (click)="moveField(field.key, 1); $event.stopPropagation()" title="Move down">
                        <i class="pi pi-chevron-down"></i>
                      </button>
                      <button class="btn-icon danger" (click)="removeField(field.key); $event.stopPropagation()" title="Remove">
                        <i class="pi pi-trash"></i>
                      </button>
                      <i class="pi" [class]="editingKey() === field.key ? 'pi-chevron-up' : 'pi-chevron-down'"></i>
                    </div>
                  </div>

                  @if (editingKey() === field.key) {
                    <div class="field-editor">
                      <div class="editor-row">
                        <div class="field">
                          <label>Field key</label>
                          <input type="text" [(ngModel)]="field.key" class="form-input" />
                        </div>
                        <div class="field">
                          <label>Label</label>
                          <input type="text" [(ngModel)]="field.label" class="form-input" />
                        </div>
                        <div class="field">
                          <label>Type</label>
                          <select [(ngModel)]="field.type" class="form-input">
                            <option value="text">Text</option>
                            <option value="number">Number</option>
                            <option value="select">Select</option>
                            <option value="textarea">Textarea</option>
                            <option value="date">Date</option>
                          </select>
                        </div>
                      </div>
                      @if (field.type === 'select') {
                        <div class="field">
                          <label>Options (comma-separated)</label>
                          <input type="text" [ngModel]="field.options?.join(', ')"
                            (ngModelChange)="updateOptions(field, $event)"
                            class="form-input" placeholder="Option 1, Option 2, Option 3" />
                        </div>
                      }
                      <div class="field">
                        <label>Help text (optional)</label>
                        <input type="text" [(ngModel)]="field.helpText" class="form-input" placeholder="Guidance for the contributor…" />
                      </div>
                      <div class="editor-check">
                        <label class="check-label">
                          <input type="checkbox" [(ngModel)]="field.required" />
                          Required field
                        </label>
                      </div>
                    </div>
                  }
                </div>
              }

              @if (fieldsInSection(activeSection()).length === 0) {
                <div class="empty-section">
                  No fields in this section yet.
                  <button class="btn btn-ghost btn-sm" (click)="addField()">Add a field</button>
                </div>
              }
            </div>
          </div>

          <!-- Preview panel -->
          <div class="preview-panel card">
            <div class="panel-title">Preview</div>
            <div class="preview-form">
              @for (field of fieldsInSection(activeSection()); track field.key) {
                <div class="preview-field">
                  <label class="preview-label">
                    {{ field.label }}
                    @if (field.required) { <span class="req">*</span> }
                  </label>
                  @if (field.helpText) {
                    <div class="preview-help">{{ field.helpText }}</div>
                  }
                  @if (field.type === 'text') {
                    <input type="text" class="form-input" [placeholder]="field.label" disabled />
                  }
                  @if (field.type === 'number') {
                    <input type="number" class="form-input" [placeholder]="field.label" disabled />
                  }
                  @if (field.type === 'date') {
                    <input type="date" class="form-input" disabled />
                  }
                  @if (field.type === 'select') {
                    <select class="form-input" disabled>
                      <option>Select…</option>
                      @for (opt of field.options || []; track opt) {
                        <option>{{ opt }}</option>
                      }
                    </select>
                  }
                  @if (field.type === 'textarea') {
                    <textarea class="form-textarea" rows="3" [placeholder]="field.label" disabled></textarea>
                  }
                </div>
              }
            </div>
          </div>
        </div>
      }
    </div>
  `,
  styles: [`
    .page-header { display: flex; justify-content: space-between; align-items: flex-start; margin-bottom: 24px; }
    .back-link { display: inline-flex; align-items: center; gap: 4px; font-size: 13px; color: var(--ink-4); text-decoration: none; margin-bottom: 6px; }
    .back-link:hover { color: var(--ink-1); }
    .subtitle { color: var(--ink-4); font-size: 13px; margin-top: 4px; }
    .header-actions { display: flex; gap: 8px; align-items: center; padding-top: 24px; }
    .published-badge { display: inline-flex; align-items: center; gap: 5px; font-size: 12px; font-weight: 500; color: var(--positive); background: var(--positive-soft); padding: 4px 10px; border-radius: 999px; }

    .loading-state { padding: 48px; text-align: center; color: var(--ink-4); }

    .builder-layout { display: grid; grid-template-columns: 180px 1fr 260px; gap: 16px; align-items: start; }

    .sections-panel { padding: 0; overflow: hidden; }
    .panel-title { font-size: 11px; text-transform: uppercase; letter-spacing: .06em; font-weight: 600; color: var(--ink-4); padding: 12px 14px 8px; border-bottom: 1px solid var(--border); }
    .section-list { padding: 6px; display: flex; flex-direction: column; gap: 2px; }
    .section-btn { width: 100%; text-align: left; background: none; border: none; padding: 7px 10px; border-radius: var(--r-md); font-size: 13px; font-weight: 500; color: var(--ink-3); cursor: pointer; display: flex; justify-content: space-between; align-items: center; }
    .section-btn:hover { background: var(--surface-3); color: var(--ink-1); }
    .section-btn.active { background: var(--ink-1); color: #fff; }
    .field-count { font-size: 11px; background: rgba(255,255,255,.2); border-radius: 999px; padding: 0 6px; }
    .section-btn:not(.active) .field-count { background: var(--surface-3); color: var(--ink-4); }

    .fields-panel { }
    .fields-header { display: flex; justify-content: space-between; align-items: center; margin-bottom: 12px; }
    .fields-header h2 { margin: 0; font-size: 15px; }
    .fields-list { display: flex; flex-direction: column; gap: 8px; }

    .field-card { padding: 0; overflow: hidden; }
    .field-summary { display: flex; align-items: center; gap: 10px; padding: 12px 14px; cursor: pointer; }
    .field-summary:hover { background: var(--surface-2); }
    .field-card.editing .field-summary { background: var(--surface-2); }
    .field-info { flex: 1; display: flex; align-items: center; gap: 8px; }
    .field-key { font-size: 11px; font-family: monospace; color: var(--ink-4); background: var(--surface-3); padding: 1px 6px; border-radius: 3px; }
    .field-label { font-size: 13px; font-weight: 500; color: var(--ink-1); }
    .req-badge { font-size: 10px; color: var(--danger); background: var(--danger-soft); padding: 1px 6px; border-radius: 999px; }
    .field-type-badge { font-size: 11px; color: var(--ink-4); background: var(--surface-3); padding: 2px 8px; border-radius: 999px; }
    .field-actions { display: flex; align-items: center; gap: 2px; }

    .field-editor { padding: 14px; border-top: 1px solid var(--border); display: flex; flex-direction: column; gap: 12px; }
    .editor-row { display: grid; grid-template-columns: 1fr 1fr 1fr; gap: 12px; }
    .field { display: flex; flex-direction: column; gap: 4px; }
    .field label { font-size: 11px; font-weight: 500; color: var(--ink-4); }
    .editor-check { }
    .check-label { display: flex; align-items: center; gap: 6px; font-size: 13px; color: var(--ink-2); cursor: pointer; }

    .form-input { height: 34px; padding: 0 10px; border: 1px solid var(--border-strong); border-radius: var(--r-md); font-size: 13px; font-family: inherit; color: var(--ink-2); background: var(--surface); }
    .form-input:focus { outline: none; border-color: var(--accent); }
    .form-textarea { padding: 8px 10px; border: 1px solid var(--border-strong); border-radius: var(--r-md); font-size: 13px; font-family: inherit; color: var(--ink-2); background: var(--surface); resize: vertical; }

    .btn-icon { background: none; border: none; cursor: pointer; color: var(--ink-4); padding: 4px 5px; border-radius: var(--r-md); }
    .btn-icon:hover { background: var(--surface-3); color: var(--ink-1); }
    .btn-icon.danger:hover { background: var(--danger-soft); color: var(--danger); }

    .empty-section { padding: 32px; text-align: center; color: var(--ink-4); font-size: 13px; display: flex; flex-direction: column; align-items: center; gap: 10px; }

    .preview-panel { padding: 0; overflow: hidden; }
    .preview-form { padding: 12px; display: flex; flex-direction: column; gap: 14px; }
    .preview-field { display: flex; flex-direction: column; gap: 5px; }
    .preview-label { font-size: 12px; font-weight: 500; color: var(--ink-3); }
    .preview-help { font-size: 11px; color: var(--ink-4); }
    .req { color: var(--danger); }
    .preview-form .form-input, .preview-form .form-textarea { opacity: .7; pointer-events: none; }

    .btn { display: inline-flex; align-items: center; gap: 6px; height: 36px; padding: 0 14px; border-radius: var(--r-md); font-family: inherit; font-size: 13px; font-weight: 500; cursor: pointer; border: 1px solid transparent; text-decoration: none; transition: background .12s; }
    .btn-ghost { background: transparent; color: var(--ink-2); border-color: var(--border-strong); }
    .btn-ghost:hover { background: var(--surface-2); }
    .btn-accent { background: var(--accent); color: #fff; border: none; }
    .btn-accent:hover { background: var(--accent-hover); }
    .btn:disabled { opacity: .5; cursor: not-allowed; }
    .btn-sm { height: 30px; padding: 0 10px; font-size: 12px; }
  `],
})
export class FormBuilderComponent implements OnInit {
  private route = inject(ActivatedRoute);
  private api = inject(ApiService);

  campaignId = '';
  schema = signal<any>(null);
  loading = signal(true);
  saving = signal(false);
  publishing = signal(false);
  editingKey = signal('');
  activeSection = signal('General');

  fields = signal<FormField[]>([]);

  sections = ['General', 'Building', 'Contents', 'Attachments'];

  ngOnInit(): void {
    this.campaignId = this.route.snapshot.paramMap.get('id')!;
    this.api.getFormSchema(this.campaignId).subscribe({
      next: s => {
        this.schema.set(s);
        this.fields.set(s.schema?.fields || this.defaultFields());
        this.loading.set(false);
      },
      error: () => {
        this.fields.set(this.defaultFields());
        this.loading.set(false);
      },
    });
  }

  fieldsInSection(section: string): FormField[] {
    return this.fields().filter(f => f.section === section);
  }

  toggleEdit(key: string): void {
    this.editingKey.set(this.editingKey() === key ? '' : key);
  }

  addField(): void {
    const newField: FormField = {
      key: 'new_field_' + Date.now(),
      label: 'New field',
      type: 'text',
      required: false,
      section: this.activeSection(),
    };
    this.fields.update(f => [...f, newField]);
    this.editingKey.set(newField.key);
  }

  removeField(key: string): void {
    this.fields.update(f => f.filter(field => field.key !== key));
    if (this.editingKey() === key) this.editingKey.set('');
  }

  moveField(key: string, dir: number): void {
    const sectionFields = this.fieldsInSection(this.activeSection());
    const idx = sectionFields.findIndex(f => f.key === key);
    if (idx < 0) return;
    const newIdx = idx + dir;
    if (newIdx < 0 || newIdx >= sectionFields.length) return;
    const allFields = [...this.fields()];
    const globalIdx = allFields.findIndex(f => f.key === key);
    const swapKey = sectionFields[newIdx].key;
    const swapGlobalIdx = allFields.findIndex(f => f.key === swapKey);
    [allFields[globalIdx], allFields[swapGlobalIdx]] = [allFields[swapGlobalIdx], allFields[globalIdx]];
    this.fields.set(allFields);
  }

  saveSchema(): void {
    this.saving.set(true);
    this.api.saveFormSchema(this.campaignId, { fields: this.fields() }).subscribe({
      next: s => { this.schema.set(s); this.saving.set(false); },
      error: () => this.saving.set(false),
    });
  }

  publishSchema(): void {
    this.publishing.set(true);
    this.api.saveFormSchema(this.campaignId, { fields: this.fields() }).subscribe({
      next: () => {
        this.api.publishFormSchema(this.campaignId).subscribe({
          next: s => { this.schema.set(s); this.publishing.set(false); },
          error: () => this.publishing.set(false),
        });
      },
      error: () => this.publishing.set(false),
    });
  }

  updateOptions(field: FormField, value: string): void {
    field.options = value.split(',').map(o => o.trim()).filter(o => !!o);
  }

  private defaultFields(): FormField[] {
    return [
      { key: 'occupancy', label: 'Occupancy', type: 'select', required: true, section: 'General', options: ['Office', 'Retail', 'Industrial', 'Warehouse', 'Mixed Use', 'Other'] },
      { key: 'construction', label: 'Construction type', type: 'select', required: true, section: 'Building', options: ['Frame', 'Joisted Masonry', 'Non-Combustible', 'Masonry Non-Combustible', 'Modified Fire Resistive', 'Fire Resistive'] },
      { key: 'year_built', label: 'Year built', type: 'number', required: true, section: 'Building' },
      { key: 'stories', label: 'Number of stories', type: 'number', required: true, section: 'Building' },
      { key: 'total_area_sqft', label: 'Total area (sq ft)', type: 'number', required: true, section: 'Building' },
      { key: 'roof_year', label: 'Roof year', type: 'number', required: false, section: 'Building' },
      { key: 'roof_material', label: 'Roof material', type: 'select', required: false, section: 'Building', options: ['Asphalt Shingle', 'Metal', 'Tile', 'Flat/Membrane', 'Other'] },
      { key: 'sprinkler_type', label: 'Sprinkler type', type: 'select', required: false, section: 'Building', options: ['None', 'Wet', 'Dry', 'Pre-action', 'Deluge'] },
      { key: 'building_tiv', label: 'Building TIV ($)', type: 'number', required: true, section: 'Contents', helpText: 'Replacement cost value for the building structure' },
      { key: 'contents_tiv', label: 'Contents TIV ($)', type: 'number', required: true, section: 'Contents', helpText: 'Replacement cost of contents and equipment' },
      { key: 'bi_12mo', label: 'Business Interruption 12 months ($)', type: 'number', required: false, section: 'Contents' },
    ];
  }
}
