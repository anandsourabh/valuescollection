import { Routes } from '@angular/router';
import { authGuard } from './core/auth/auth.guard';

export const routes: Routes = [
  {
    path: 'login',
    loadComponent: () => import('./features/auth/login.component').then(m => m.LoginComponent),
  },
  {
    path: 'ext/:token',
    loadComponent: () => import('./features/external/external-landing.component').then(m => m.ExternalLandingComponent),
  },
  {
    path: 'ext/:token/locations',
    loadComponent: () => import('./features/external/contributor-portfolio.component').then(m => m.ContributorPortfolioComponent),
  },
  {
    path: 'ext/:token/locations/:locationId',
    loadComponent: () => import('./features/external/contributor-form.component').then(m => m.ContributorFormComponent),
  },
  {
    path: '',
    loadComponent: () => import('./shared/components/shell/shell.component').then(m => m.ShellComponent),
    canActivate: [authGuard],
    children: [
      { path: '', redirectTo: 'dashboard', pathMatch: 'full' },
      {
        path: 'dashboard',
        loadComponent: () => import('./features/dashboard/dashboard.component').then(m => m.DashboardComponent),
      },
      {
        path: 'campaigns',
        loadComponent: () => import('./features/campaigns/campaigns-list.component').then(m => m.CampaignsListComponent),
      },
      {
        path: 'campaigns/new',
        loadComponent: () => import('./features/campaigns/create-campaign.component').then(m => m.CreateCampaignComponent),
      },
      {
        path: 'campaigns/:id',
        loadComponent: () => import('./features/campaigns/campaign-detail.component').then(m => m.CampaignDetailComponent),
      },
      {
        path: 'campaigns/:id/form-builder',
        loadComponent: () => import('./features/form-builder/form-builder.component').then(m => m.FormBuilderComponent),
      },
      {
        path: 'assignments',
        loadComponent: () => import('./features/assignments/assignments-list.component').then(m => m.AssignmentsListComponent),
      },
      {
        path: 'reviews',
        loadComponent: () => import('./features/reviews/review-queue.component').then(m => m.ReviewQueueComponent),
      },
      {
        path: 'reviews/:submissionId',
        loadComponent: () => import('./features/reviews/review-detail.component').then(m => m.ReviewDetailComponent),
      },
      {
        path: 'settings',
        loadComponent: () => import('./features/settings/settings.component').then(m => m.SettingsComponent),
        children: [
          { path: '', redirectTo: 'reminders', pathMatch: 'full' },
          {
            path: 'reminders',
            loadComponent: () => import('./features/settings/reminders-panel.component').then(m => m.RemindersPanelComponent),
          },
          {
            path: 'delegations',
            loadComponent: () => import('./features/delegations/delegations-panel.component').then(m => m.DelegationsPanelComponent),
          },
          {
            path: 'users',
            loadComponent: () => import('./features/settings/users-panel.component').then(m => m.UsersPanelComponent),
          },
        ],
      },
    ],
  },
  { path: '**', redirectTo: '' },
];
