export interface User {
  id: string;
  email: string;
  name: string;
  roles: string[];
  team_type: 'internal' | 'external';
  is_active: boolean;
  created_at: string;
}

export interface Portfolio {
  id: string;
  name: string;
  description?: string;
}

export interface Property {
  id: string;
  portfolio_id?: string;
  address: string;
  city?: string;
  state?: string;
  country: string;
  property_type?: string;
  prior_tiv?: number;
}

export interface Campaign {
  id: string;
  name: string;
  description?: string;
  owner_id: string;
  status: 'draft' | 'active' | 'completed' | 'archived';
  due_date: string;
  sla_days: number;
  link_model: 'bundled' | 'per_location';
  breach_policy: string;
  created_at: string;
  updated_at: string;
}

export interface Assignment {
  id: string;
  campaign_id: string;
  property_id: string;
  primary_assignee_id?: string;
  external_email?: string;
  assignee_type: 'internal' | 'external';
  status: AssignmentStatus;
  due_date?: string;
  reminder_count: number;
  last_reminded_at?: string;
  created_at: string;
  updated_at: string;
  // Joined
  property?: Property;
  assignee?: User;
  delegations?: Delegation[];
}

export type AssignmentStatus =
  | 'not_started'
  | 'in_progress'
  | 'submitted'
  | 'under_review'
  | 'approved'
  | 'rejected';

export interface Delegation {
  id: string;
  assignment_id?: string;
  delegator_id: string;
  delegate_id: string;
  level: 1 | 2;
  delegation_type: 'specific' | 'ooo_blanket';
  ooo_start?: string;
  ooo_end?: string;
  is_active: boolean;
  reason?: string;
  created_by_id: string;
  created_at: string;
  revoked_at?: string;
  // Joined
  delegator?: User;
  delegate?: User;
}

export interface Submission {
  id: string;
  assignment_id: string;
  submitted_by_id?: string;
  actor_type: 'primary' | 'delegate_l1' | 'delegate_l2' | 'external';
  data: Record<string, unknown>;
  total_tiv?: number;
  status: 'draft' | 'submitted';
  version: number;
  submitted_at?: string;
  created_at: string;
  updated_at: string;
}

export interface Review {
  id: string;
  submission_id: string;
  reviewer_id: string;
  decision: 'approved' | 'rejected' | 'requested_info';
  comment?: string;
  reason_code?: string;
  requires_escalation: boolean;
  created_at: string;
}

export interface SignedLink {
  id: string;
  campaign_id: string;
  contributor_email: string;
  link_model: 'bundled' | 'per_location';
  expires_at: string;
  is_revoked: boolean;
  accessed_at?: string;
  created_at: string;
  url?: string;
}

export interface AuditEvent {
  id: string;
  event_type: string;
  actor_id?: string;
  actor_ip?: string;
  entity_type: string;
  entity_id: string;
  payload: Record<string, unknown>;
  created_at: string;
}

export interface CampaignStats {
  campaign_id: string;
  status_counts: Partial<Record<AssignmentStatus, number>>;
  total: number;
}

export interface ReviewQueueItem {
  submission_id: string;
  assignment_id: string;
  property_address: string;
  property_city?: string;
  property_state?: string;
  property_type?: string;
  total_tiv?: number;
  prior_tiv?: number;
  submitted_at?: string;
  status: AssignmentStatus;
  total_tiv_change_pct?: number;
  material_change: boolean;
}
