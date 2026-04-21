import { TestBed } from '@angular/core/testing';
import { HttpClientTestingModule, HttpTestingController } from '@angular/common/http/testing';
import { ApiService } from './api.service';
import { Campaign, Assignment, User, Submission, Review } from '../models/models';
import { environment } from '../../../environments/environment';

describe('ApiService', () => {
  let service: ApiService;
  let httpMock: HttpTestingController;
  const apiUrl = `${environment.apiUrl}`;

  beforeEach(() => {
    TestBed.configureTestingModule({
      imports: [HttpClientTestingModule],
      providers: [ApiService],
    });
    service = TestBed.inject(ApiService);
    httpMock = TestBed.inject(HttpTestingController);
  });

  afterEach(() => {
    httpMock.verify();
  });

  describe('Authentication', () => {
    it('should login and return user', () => {
      const mockUser: User = {
        id: '123',
        email: 'test@example.com',
        name: 'Test User',
        role: 'admin',
        delegate_l1_id: undefined,
        delegate_l2_id: undefined,
        delegate_l1_name: undefined,
        delegate_l2_name: undefined,
        password: undefined,
      };

      service.login('test@example.com', 'password123').subscribe((user) => {
        expect(user.email).toBe('test@example.com');
      });

      const req = httpMock.expectOne(`${apiUrl}/auth/login`);
      expect(req.request.method).toBe('POST');
      req.flush(mockUser);
    });

    it('should refresh token', () => {
      const mockTokens = {
        access_token: 'new-access-token',
        refresh_token: 'new-refresh-token',
        token_type: 'bearer',
      };

      service.refreshToken().subscribe((tokens) => {
        expect(tokens.access_token).toBe('new-access-token');
      });

      const req = httpMock.expectOne(`${apiUrl}/auth/refresh`);
      expect(req.request.method).toBe('POST');
      req.flush(mockTokens);
    });
  });

  describe('Campaigns', () => {
    it('should get all campaigns', () => {
      const mockCampaigns: Campaign[] = [
        {
          id: '1',
          name: 'Campaign 1',
          description: 'Test campaign',
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
      ];

      service.getCampaigns().subscribe((campaigns) => {
        expect(campaigns.length).toBe(1);
        expect(campaigns[0].name).toBe('Campaign 1');
      });

      const req = httpMock.expectOne(`${apiUrl}/campaigns`);
      expect(req.request.method).toBe('GET');
      req.flush(mockCampaigns);
    });

    it('should create a campaign', () => {
      const newCampaign = {
        name: 'New Campaign',
        description: 'Test',
        due_date: new Date('2024-12-31'),
        sla_days: 21,
        link_model: 'bundled' as const,
        breach_policy: 'escalate_and_continue',
        portfolio_ids: [],
      };

      const mockCreated: Campaign = {
        ...newCampaign,
        id: '999',
        owner_id: '123',
        status: 'draft',
        created_at: new Date(),
        updated_at: new Date(),
        assignment_count: 0,
        completed_count: 0,
      };

      service.createCampaign(newCampaign).subscribe((campaign) => {
        expect(campaign.id).toBe('999');
        expect(campaign.name).toBe('New Campaign');
      });

      const req = httpMock.expectOne(`${apiUrl}/campaigns`);
      expect(req.request.method).toBe('POST');
      req.flush(mockCreated);
    });

    it('should update a campaign', () => {
      const updates = { name: 'Updated Name' };

      service.updateCampaign('1', updates).subscribe((campaign) => {
        expect(campaign.name).toBe('Updated Name');
      });

      const req = httpMock.expectOne(`${apiUrl}/campaigns/1`);
      expect(req.request.method).toBe('PUT');
      req.flush({ ...updates, id: '1' });
    });
  });

  describe('Assignments', () => {
    it('should get assignments for a campaign', () => {
      const mockAssignments: Assignment[] = [
        {
          id: '1',
          campaign_id: '1',
          assignee_id: '123',
          status: 'pending',
          assigned_at: new Date(),
          submitted_at: undefined,
          assignee_name: 'John Doe',
          property_address: '123 Main St',
          property_city: 'New York',
          property_state: 'NY',
          campaign_name: 'Campaign 1',
          delegate_l1_name: undefined,
          delegate_l2_name: undefined,
        },
      ];

      service.getCampaignAssignments('1').subscribe((assignments) => {
        expect(assignments.length).toBe(1);
        expect(assignments[0].status).toBe('pending');
      });

      const req = httpMock.expectOne(`${apiUrl}/campaigns/1/assignments`);
      expect(req.request.method).toBe('GET');
      req.flush(mockAssignments);
    });

    it('should get all assignments across campaigns', () => {
      const mockAssignments: Assignment[] = [];

      service.getAssignments().subscribe((assignments) => {
        expect(assignments).toEqual(mockAssignments);
      });

      const req = httpMock.expectOne(`${apiUrl}/assignments`);
      expect(req.request.method).toBe('GET');
      req.flush(mockAssignments);
    });
  });

  describe('Submissions', () => {
    it('should submit form data', () => {
      const mockSubmission: Submission = {
        id: '1',
        assignment_id: '1',
        status: 'submitted',
        cope_value: 50000,
        tiv: 100000,
        material_change: false,
        prior_data: {},
        prior_tiv: 100000,
        tiv_delta_pct: 0,
        submitted_at: new Date(),
        reviewed_at: undefined,
        reviewed_by: undefined,
        created_at: new Date(),
        updated_at: new Date(),
      };

      const formData = {
        cope_value: 50000,
        tiv: 100000,
      };

      service.submitForm('1', formData).subscribe((submission) => {
        expect(submission.status).toBe('submitted');
      });

      const req = httpMock.expectOne(`${apiUrl}/submissions`);
      expect(req.request.method).toBe('POST');
      req.flush(mockSubmission);
    });
  });

  describe('Reviews', () => {
    it('should submit a review', () => {
      const mockReview: Review = {
        id: '1',
        submission_id: '1',
        reviewer_id: '456',
        status: 'approved',
        reason_code: 'data_confirmed',
        notes: 'Approved after verification',
        created_at: new Date(),
      };

      const reviewData = {
        status: 'approved' as const,
        reason_code: 'data_confirmed',
        notes: 'Approved after verification',
      };

      service.submitReview('1', reviewData).subscribe((review) => {
        expect(review.status).toBe('approved');
      });

      const req = httpMock.expectOne(`${apiUrl}/reviews`);
      expect(req.request.method).toBe('POST');
      req.flush(mockReview);
    });
  });

  describe('Form Schema', () => {
    it('should get form schema for campaign', () => {
      const mockSchema = {
        fields: [
          { name: 'cope_value', type: 'number', label: 'COPE Value' },
          { name: 'tiv', type: 'number', label: 'TIV' },
        ],
      };

      service.getFormSchema('1').subscribe((schema) => {
        expect(schema.fields.length).toBe(2);
      });

      const req = httpMock.expectOne(`${apiUrl}/campaigns/1/form-schema`);
      expect(req.request.method).toBe('GET');
      req.flush(mockSchema);
    });

    it('should save form schema', () => {
      const schema = { fields: [] };

      service.saveFormSchema('1', schema).subscribe(() => {
        expect(true).toBe(true);
      });

      const req = httpMock.expectOne(`${apiUrl}/campaigns/1/form-schema`);
      expect(req.request.method).toBe('PUT');
      req.flush({});
    });
  });
});
