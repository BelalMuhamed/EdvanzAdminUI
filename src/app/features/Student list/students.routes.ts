import { Routes } from '@angular/router';

/** Student area. List, create, detail/profile, and edit. */
export const STUDENTS_ROUTES: Routes = [
  {
    path: '',
    loadComponent: () =>
      import('./student-list.component').then(
        (m) => m.StudentListComponent,
      ),
    data: { breadcrumb: 'Students' },
  },
  {
    path: 'new',
    loadComponent: () =>
      import('../student-form/student-form.component').then(
        (m) => m.StudentFormComponent,
      ),
    data: { breadcrumb: 'New student' },
  },
  {
    path: ':id/edit',
    loadComponent: () =>
      import('../student-edit/student-edit.component').then(
        (m) => m.StudentEditComponent,
      ),
    data: { breadcrumb: 'Edit student' },
  },
  {
    path: ':id',
    loadComponent: () =>
      import('../student-detail/student-detail.component').then(
        (m) => m.StudentDetailComponent,
      ),
    data: { breadcrumb: 'Student profile' },
  },
];
