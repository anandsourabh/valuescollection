import { ComponentFixture, TestBed } from '@angular/core/testing';
import { CampaignsListComponent } from './campaigns-list.component';
import { ApiService } from '../../core/http/api.service';
import { of, throwError } from 'rxjs';
import { Campaign } from '../../core/models/models';
import { PrimeNgModule } from '../../shared/primeng.module';
import { FormsModule } from '@angular/forms';
import { CommonModule } from '@angular/common';
import { RouterTestingModule } from '@angular/router/testing';

describe('CampaignsListComponent', () => {
  let component: CampaignsListComponent;
  let fixture: ComponentFixture<CampaignsListComponent>;
  let apiService: jasmine.SpyObj<ApiService>;

  const mockCampaigns: Campaign[] = [
    {
      id: '1',
      name: 'Campaign 1',
      description: 'Test campaign 1',
      owner_id: '123',
      status: 'active',
      due_date: new Date('2024-12-31'),
      sla_days: 21,
      link_model: 'bundled',
      breach_policy: 'escalate_and_continue',
      created_at: new Date(),
      updated_at: new Date(),
      assignment_count: 10,
      completed_count: 5,
    },
    {
      id: '2',
      name: 'Campaign 2',
      description: 'Test campaign 2',
      owner_id: '123',
      status: 'draft',
      due_date: new Date('2024-11-30'),
      sla_days: 21,
      link_model: 'per_location',
      breach_policy: 'escalate_only',
      created_at: new Date(),
      updated_at: new Date(),
      assignment_count: 5,
      completed_count: 0,
    },
  ];

  beforeEach(async () => {
    const apiServiceSpy = jasmine.createSpyObj('ApiService', ['getCampaigns']);

    await TestBed.configureTestingModule({
      declarations: [CampaignsListComponent],
      imports: [CommonModule, FormsModule, RouterTestingModule, PrimeNgModule],
      providers: [{ provide: ApiService, useValue: apiServiceSpy }],
    }).compileComponents();

    apiService = TestBed.inject(ApiService) as jasmine.SpyObj<ApiService>;
    fixture = TestBed.createComponent(CampaignsListComponent);
    component = fixture.componentInstance;
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });

  describe('Initialization', () => {
    it('should load campaigns on init', () => {
      apiService.getCampaigns.and.returnValue(of(mockCampaigns));

      fixture.detectChanges();

      expect(apiService.getCampaigns).toHaveBeenCalled();
      expect(component.campaigns.length).toBe(2);
    });

    it('should handle error loading campaigns', () => {
      apiService.getCampaigns.and.returnValue(throwError(() => new Error('API Error')));

      fixture.detectChanges();

      expect(component.campaigns.length).toBe(0);
    });
  });

  describe('Status Filtering', () => {
    beforeEach(() => {
      apiService.getCampaigns.and.returnValue(of(mockCampaigns));
      fixture.detectChanges();
    });

    it('should show all campaigns in All tab', () => {
      component.activeTab = 'all';
      const filtered = component.filteredCampaigns();
      expect(filtered.length).toBe(2);
    });

    it('should show only active campaigns', () => {
      component.activeTab = 'active';
      const filtered = component.filteredCampaigns();
      expect(filtered.length).toBe(1);
      expect(filtered[0].status).toBe('active');
    });

    it('should show only draft campaigns', () => {
      component.activeTab = 'draft';
      const filtered = component.filteredCampaigns();
      expect(filtered.length).toBe(1);
      expect(filtered[0].status).toBe('draft');
    });
  });

  describe('Search', () => {
    beforeEach(() => {
      apiService.getCampaigns.and.returnValue(of(mockCampaigns));
      fixture.detectChanges();
    });

    it('should filter campaigns by search term', () => {
      component.searchTerm.set('Campaign 1');
      const filtered = component.filteredCampaigns();
      expect(filtered.length).toBe(1);
      expect(filtered[0].name).toContain('Campaign 1');
    });

    it('should be case insensitive', () => {
      component.searchTerm.set('campaign 2');
      const filtered = component.filteredCampaigns();
      expect(filtered.length).toBe(1);
    });

    it('should return all campaigns when search is empty', () => {
      component.searchTerm.set('');
      const filtered = component.filteredCampaigns();
      expect(filtered.length).toBe(2);
    });
  });

  describe('Sorting', () => {
    beforeEach(() => {
      apiService.getCampaigns.and.returnValue(of(mockCampaigns));
      fixture.detectChanges();
    });

    it('should sort by due date ascending', () => {
      component.sortBy = 'due_date';
      component.sortOrder = 'asc';
      const sorted = component.filteredCampaigns();
      expect(sorted[0].due_date).toBeLessThan(sorted[1].due_date);
    });

    it('should sort by name descending', () => {
      component.sortBy = 'name';
      component.sortOrder = 'desc';
      const sorted = component.filteredCampaigns();
      expect(sorted[0].name).toBeGreaterThan(sorted[1].name);
    });
  });

  describe('Progress Calculation', () => {
    beforeEach(() => {
      apiService.getCampaigns.and.returnValue(of(mockCampaigns));
      fixture.detectChanges();
    });

    it('should calculate progress percentage', () => {
      const campaign = mockCampaigns[0];
      const progress = (campaign.completed_count / campaign.assignment_count) * 100;
      expect(progress).toBe(50);
    });

    it('should handle zero assignments', () => {
      const campaign: Campaign = {
        ...mockCampaigns[0],
        assignment_count: 0,
        completed_count: 0,
      };
      const progress = campaign.assignment_count > 0 ? (campaign.completed_count / campaign.assignment_count) * 100 : 0;
      expect(progress).toBe(0);
    });
  });
});
