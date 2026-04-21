import { Injectable, inject } from '@angular/core';
import { HttpClient, HttpParams } from '@angular/common/http';
import { Observable } from 'rxjs';
import { environment } from '../../../environments/environment';
import {
  Campaign, Assignment, User, Portfolio, Property, Submission,
  Review, Delegation, SignedLink, AuditEvent, CampaignStats, ReviewQueueItem,
} from '../models/models';

const API = environment.apiUrl;

@Injectable({ providedIn: 'root' })
export class ApiService {
  private http = inject(HttpClient);

  // ── Campaigns ──────────────────────────────────────────────
  getCampaigns(status?: string): Observable<Campaign[]> {
    const params = status ? new HttpParams().set('status', status) : undefined;
    return this.http.get<Campaign[]>(`${API}/campaigns`, { params });
  }
  getCampaign(id: string): Observable<Campaign> {
    return this.http.get<Campaign>(`${API}/campaigns/${id}`);
  }
  createCampaign(data: Partial<Campaign> & { portfolio_ids?: string[] }): Observable<Campaign> {
    return this.http.post<Campaign>(`${API}/campaigns`, data);
  }
  updateCampaign(id: string, data: Partial<Campaign>): Observable<Campaign> {
    return this.http.put<Campaign>(`${API}/campaigns/${id}`, data);
  }
  activateCampaign(id: string): Observable<Campaign> {
    return this.http.post<Campaign>(`${API}/campaigns/${id}/activate`, {});
  }
  extendCampaignDeadline(id: string, payload: { new_due_date?: string; days?: number; reason_code: string; notes?: string; notify_assignees?: boolean }): Observable<Campaign> {
    return this.http.post<Campaign>(`${API}/campaigns/${id}/extend-deadline`, payload);
  }
  getCampaignStats(id: string): Observable<CampaignStats> {
    return this.http.get<CampaignStats>(`${API}/campaigns/${id}/stats`);
  }
  getCampaignAudit(id: string, limit = 50): Observable<AuditEvent[]> {
    return this.http.get<AuditEvent[]>(`${API}/campaigns/${id}/audit`, { params: { limit } });
  }

  // ── Portfolios & Properties ─────────────────────────────────
  getPortfolios(): Observable<Portfolio[]> {
    return this.http.get<Portfolio[]>(`${API}/portfolios`);
  }
  getPortfolioProperties(portfolioId: string): Observable<Property[]> {
    return this.http.get<Property[]>(`${API}/portfolios/${portfolioId}/properties`);
  }

  // ── Assignments ─────────────────────────────────────────────
  getAssignments(campaignId?: string, status?: string): Observable<Assignment[]> {
    let params = new HttpParams();
    if (status) params = params.set('status', status);
    if (campaignId) {
      return this.http.get<Assignment[]>(`${API}/campaigns/${campaignId}/assignments`, { params });
    }
    return this.http.get<Assignment[]>(`${API}/assignments`, { params });
  }
  getCampaignAssignments(campaignId: string, status?: string): Observable<Assignment[]> {
    return this.getAssignments(campaignId, status);
  }
  createAssignment(campaignId: string, data: Partial<Assignment> & { delegate_l1_id?: string; delegate_l2_id?: string }): Observable<Assignment> {
    return this.http.post<Assignment>(`${API}/campaigns/${campaignId}/assignments`, data);
  }
  updateAssignment(id: string, data: Partial<Assignment>): Observable<Assignment> {
    return this.http.put<Assignment>(`${API}/assignments/${id}`, data);
  }
  bulkActionAssignments(payload: { action: string; assignment_ids: string[]; [key: string]: unknown }): Observable<{ detail: string }> {
    return this.http.post<{ detail: string }>(`${API}/assignments/bulk-action`, payload);
  }
  bulkAction(action: string, ids: string[], payload: Record<string, unknown> = {}): Observable<{ detail: string }> {
    return this.bulkActionAssignments({ action, assignment_ids: ids, ...payload });
  }
  extendAssignmentDeadline(id: string, payload: { days?: number; new_due_date?: string; reason_code: string; notify_assignees?: boolean }): Observable<Assignment> {
    return this.http.post<Assignment>(`${API}/assignments/${id}/extend-deadline`, payload);
  }
  getExternalAssignments(): Observable<Assignment[]> {
    return this.http.get<Assignment[]>(`${API}/ext/assignments`);
  }

  // ── Delegations ─────────────────────────────────────────────
  getMyDelegations(): Observable<Delegation[]> {
    return this.http.get<Delegation[]>(`${API}/delegations`);
  }
  getCampaignDelegations(campaignId: string): Observable<Delegation[]> {
    return this.http.get<Delegation[]>(`${API}/delegations/campaign/${campaignId}`);
  }
  createDelegation(data: Partial<Delegation>): Observable<Delegation> {
    return this.http.post<Delegation>(`${API}/delegations`, data);
  }
  revokeDelegation(id: string): Observable<void> {
    return this.http.delete<void>(`${API}/delegations/${id}`);
  }
  setUserOOO(userId: string, data: { delegate_id: string; ooo_start: string; ooo_end: string; reason?: string }): Observable<Delegation> {
    return this.http.post<Delegation>(`${API}/delegations/users/${userId}/ooo`, data);
  }
  setOooDelegation(userId: string, data: { delegate_to_id: string; ooo_start: string; ooo_end: string }): Observable<Delegation> {
    return this.http.post<Delegation>(`${API}/delegations/users/${userId}/ooo`, {
      delegate_id: data.delegate_to_id,
      ooo_start: data.ooo_start,
      ooo_end: data.ooo_end,
    });
  }

  // ── Submissions ─────────────────────────────────────────────
  getSubmission(assignmentId: string): Observable<Submission> {
    return this.http.get<Submission>(`${API}/assignments/${assignmentId}/submission`);
  }
  saveSubmission(assignmentId: string, data: { data: Record<string, unknown>; actor_type?: string }): Observable<Submission> {
    return this.http.put<Submission>(`${API}/assignments/${assignmentId}/submission`, data);
  }
  submitSubmission(assignmentId: string): Observable<Submission> {
    return this.http.post<Submission>(`${API}/assignments/${assignmentId}/submission/submit`, {});
  }

  // ── Form Schema ─────────────────────────────────────────────
  getFormSchema(campaignId: string): Observable<any> {
    return this.http.get<any>(`${API}/campaigns/${campaignId}/form-schema`);
  }
  saveFormSchema(campaignId: string, schema: Record<string, unknown>): Observable<any> {
    return this.http.put<any>(`${API}/campaigns/${campaignId}/form-schema`, schema);
  }
  publishFormSchema(campaignId: string): Observable<any> {
    return this.http.post<any>(`${API}/campaigns/${campaignId}/form-schema/publish`, {});
  }

  // ── Auth (external) ──────────────────────────────────────────
  verifyExternalToken(data: { token: string; passcode: string }): Observable<{ access_token: string }> {
    return this.http.post<{ access_token: string }>(`${API}/auth/external-verify`, data);
  }

  // ── Reviews ─────────────────────────────────────────────────
  getReviewQueue(): Observable<ReviewQueueItem[]> {
    return this.http.get<ReviewQueueItem[]>(`${API}/reviews/queue`);
  }
  submitReview(submissionId: string, data: Partial<Review>): Observable<Review> {
    return this.http.post<Review>(`${API}/submissions/${submissionId}/review`, data);
  }

  // ── Signed Links ─────────────────────────────────────────────
  createSignedLink(campaignId: string, data: { contributor_email: string; link_model?: string; expires_days?: number }): Observable<SignedLink> {
    return this.http.post<SignedLink>(`${API}/campaigns/${campaignId}/signed-links`, data);
  }
  revokeSignedLink(id: string): Observable<void> {
    return this.http.delete<void>(`${API}/signed-links/${id}`);
  }

  // ── Users ───────────────────────────────────────────────────
  getUsers(): Observable<User[]> {
    return this.http.get<User[]>(`${API}/users`);
  }
  createUser(data: Partial<User> & { password?: string }): Observable<User> {
    return this.http.post<User>(`${API}/users`, data);
  }
}
