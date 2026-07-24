import { Routes } from '@angular/router';

/** Assistant area. List, create, and edit — no separate detail/view screen. */
export const ASSISTANTS_ROUTES: Routes = [
  {
    path: '',
    loadComponent: () =>
      import('../assistant-list/assistant-list.component').then(
        (m) => m.AssistantListComponent,
      ),
    data: { breadcrumb: 'Assistants' },
  },
  {
    path: 'new',
    loadComponent: () =>
      import('./assistant-form/assistant-form.component').then(
        (m) => m.AssistantFormComponent,
      ),
    data: { breadcrumb: 'New assistant' },
  },
  {
    path: ':id/edit',
    loadComponent: () =>
      import('./assistant-edit/assistant-edit.component').then(
        (m) => m.AssistantEditComponent,
      ),
    data: { breadcrumb: 'Edit assistant' },
  },
];
