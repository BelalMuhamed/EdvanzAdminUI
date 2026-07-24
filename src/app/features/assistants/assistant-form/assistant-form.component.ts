import { Component, computed, inject, signal } from '@angular/core';
import {
  AbstractControl,
  FormBuilder,
  ReactiveFormsModule,
  ValidationErrors,
  Validators,
} from '@angular/forms';
import { Router, RouterLink } from '@angular/router';
import { CreateAssistantRequest } from '../../../core/models/assistant.model';
import { ModulePermissions } from '../../../core/models/permission.model';
import { AssistantService } from '../../../core/services/assistant.service';
import { PermissionService } from '../../../core/services/permission.service';
import { TeacherService } from '../../../core/services/teacher.service';
import { ToastService } from '../../../core/services/toast.service';
import { EmptyStateComponent } from '../../../shared/components/empty-state/empty-state.component';
import {
  SearchableSelectComponent,
  SearchableSelectOption,
} from '../../../shared/components/searchable-select/searchable-select.component';

/** Group-level validator: password and confirmPassword must match (UX-only — the
 *  backend enforces min length 8 and nothing else on this endpoint). */
function passwordsMatchValidator(group: AbstractControl): ValidationErrors | null {
  const password = group.get('password')?.value;
  const confirmPassword = group.get('confirmPassword')?.value;
  return password && confirmPassword && password !== confirmPassword
    ? { passwordMismatch: true }
    : null;
}

/**
 * Create-assistant screen. Teacher selection gates everything else: permissions
 * cannot load and the form cannot submit until a teacher is chosen. Mirrors
 * TeacherFormComponent's submit/navigate/error convention exactly.
 *
 * permissionProfileIds is always sent as `null` — no profile-selection UI exists
 * here per spec; only individual permissionIds are collected.
 */
@Component({
  selector: 'app-assistant-form',
  standalone: true,
  imports: [ReactiveFormsModule, RouterLink, EmptyStateComponent, SearchableSelectComponent],
  template: `
    <div class="page-header">
      <h2 class="h4 mb-0">New assistant</h2>
      <a routerLink="/assistants" class="btn btn-outline-secondary">Back to list</a>
    </div>

    <div class="card">
      <div class="card-body">
        <form [formGroup]="form" (ngSubmit)="submit()" novalidate>
          <div class="row g-3">
            <div class="col-md-6">
              <label class="form-label" for="teacher">Teacher *</label>
              <app-searchable-select
                id="teacher"
                [options]="teacherOptions()"
                [selectedValue]="selectedTeacherId()"
                allLabel="Select a teacher…"
                placeholder="Select a teacher…"
                searchPlaceholder="Search teachers…"
                (selectedValueChange)="onTeacherChange($event)"
              />
              @if (teacherTouched() && selectedTeacherId() == null) {
                <div class="text-danger small mt-1">Select a teacher before continuing.</div>
              }
            </div>

            <div class="col-md-6">
              <label class="form-label" for="fullName">Full name *</label>
              <input
                id="fullName"
                class="form-control"
                formControlName="fullName"
                [class.is-invalid]="invalid('fullName')"
              />
              @if (invalid('fullName')) {
                <div class="invalid-feedback">Full name is required.</div>
              }
            </div>

            <div class="col-md-6">
              <label class="form-label" for="username">Username *</label>
              <input
                id="username"
                class="form-control"
                formControlName="username"
                [class.is-invalid]="invalid('username')"
              />
              @if (invalid('username')) {
                <div class="invalid-feedback">Username is required.</div>
              }
            </div>

            <div class="col-md-6">
              <label class="form-label" for="email">Email</label>
              <input
                id="email"
                type="email"
                class="form-control"
                formControlName="email"
                [class.is-invalid]="invalid('email')"
              />
              @if (invalid('email')) {
                <div class="invalid-feedback">Enter a valid email address.</div>
              }
            </div>

            <div class="col-md-6">
              <label class="form-label" for="phoneNumber">Phone</label>
              <input id="phoneNumber" class="form-control" formControlName="phoneNumber" />
            </div>

            <div class="col-md-6">
              <label class="form-label" for="password">Password *</label>
              <input
                id="password"
                type="password"
                class="form-control"
                formControlName="password"
                autocomplete="new-password"
                [class.is-invalid]="invalid('password')"
              />
              @if (invalid('password')) {
                <div class="invalid-feedback">Minimum 8 characters.</div>
              }
            </div>

            <div class="col-md-6">
              <label class="form-label" for="confirmPassword">Confirm password *</label>
              <input
                id="confirmPassword"
                type="password"
                class="form-control"
                formControlName="confirmPassword"
                autocomplete="new-password"
                [class.is-invalid]="confirmInvalid()"
              />
              @if (confirmInvalid()) {
                <div class="invalid-feedback">Passwords do not match.</div>
              }
            </div>
          </div>

          <hr class="my-4" />

          <h3 class="h6 mb-3">Permissions</h3>

          @if (selectedTeacherId() == null) {
            <p class="text-muted">Select a teacher above to load their permission catalogue.</p>
          } @else if (permissionsLoading()) {
            <p class="text-muted">Loading permissions…</p>
          } @else if (moduleGroups().length === 0) {
            <app-empty-state
              icon="🔒"
              title="No permissions available"
              message="This teacher has no modules assigned yet, so there are no permissions to grant."
            />
          } @else {
            <div class="module-groups">
              @for (group of moduleGroups(); track group.id) {
                <div class="module-group">
                  <div class="module-group-head">
                    <span class="module-name">{{ group.moduleName }}</span>
                    <button
                      type="button"
                      class="btn btn-link btn-sm p-0"
                      (click)="toggleModule(group)"
                    >
                      {{ isModuleFullySelected(group) ? 'Clear all' : 'Select all' }}
                    </button>
                  </div>
                  <div class="permission-grid">
                    @for (perm of group.permissions; track perm.permissionId) {
                      <label class="permission-item">
                        <input
                          type="checkbox"
                          class="form-check-input"
                          [checked]="isSelected(perm.permissionId)"
                          (change)="togglePermission(perm.permissionId)"
                        />
                        <span class="permission-name">{{ perm.permissionName }}</span>
                        @if (perm.isRestricted) {
                          <span class="badge text-bg-warning ms-1">Restricted</span>
                        }
                      </label>
                    }
                  </div>
                </div>
              }
            </div>
          }

          <div class="d-flex justify-content-end gap-2 pt-4">
            <a routerLink="/assistants" class="btn btn-outline-secondary">Cancel</a>
            <button type="submit" class="btn btn-primary" [disabled]="submitting()">
              {{ submitting() ? 'Creating…' : 'Create assistant' }}
            </button>
          </div>
        </form>
      </div>
    </div>
  `,
  styles: [
    `
      .page-header {
        display: flex;
        align-items: center;
        justify-content: space-between;
        gap: 1rem;
        margin-bottom: 1.5rem;
      }
      .card {
        border: 1px solid var(--edvanz-border, #e5e7eb);
        border-radius: 14px;
      }
      .module-groups {
        display: flex;
        flex-direction: column;
        gap: 1rem;
      }
      .module-group {
        border: 1px solid var(--edvanz-border, #e5e7eb);
        border-radius: 10px;
        padding: 1rem;
      }
      .module-group-head {
        display: flex;
        align-items: center;
        justify-content: space-between;
        margin-bottom: 0.75rem;
      }
      .module-name {
        font-weight: 600;
      }
      .permission-grid {
        display: grid;
        grid-template-columns: repeat(auto-fill, minmax(220px, 1fr));
        gap: 0.6rem;
      }
      .permission-item {
        display: flex;
        align-items: center;
        gap: 0.5rem;
        cursor: pointer;
      }
    `,
  ],
})
export class AssistantFormComponent {
  private readonly fb = inject(FormBuilder);
  private readonly assistantService = inject(AssistantService);
  private readonly permissionService = inject(PermissionService);
  private readonly teacherService = inject(TeacherService);
  private readonly toast = inject(ToastService);
  private readonly router = inject(Router);

  protected readonly submitting = signal(false);
  protected readonly teacherTouched = signal(false);
  protected readonly teacherOptions = signal<SearchableSelectOption[]>([]);
  protected readonly selectedTeacherId = signal<number | null>(null);

  protected readonly permissionsLoading = signal(false);
  protected readonly moduleGroups = signal<ModulePermissions[]>([]);
  protected readonly selectedPermissionIds = signal<Set<number>>(new Set());

  protected readonly form = this.fb.nonNullable.group(
    {
      fullName: ['', [Validators.required]],
      username: ['', [Validators.required]],
      email: ['', [Validators.email]],
      phoneNumber: [''],
      password: ['', [Validators.required, Validators.minLength(8)]],
      confirmPassword: ['', [Validators.required]],
    },
    { validators: passwordsMatchValidator },
  );

  constructor() {
    this.teacherService.getTeacherLookup().subscribe((teachers) => {
      this.teacherOptions.set(teachers.map((t) => ({ value: t.id, label: t.fullName })));
    });
  }

  protected invalid(control: keyof typeof this.form.controls): boolean {
    const c = this.form.controls[control];
    return c.invalid && (c.touched || c.dirty);
  }

  protected confirmInvalid(): boolean {
    const c = this.form.controls.confirmPassword;
    const touched = c.touched || c.dirty;
    return touched && (c.invalid || this.form.hasError('passwordMismatch'));
  }

  // ── Teacher selection gates permission loading ─────────────────────────────

  protected onTeacherChange(value: number | string | null): void {
    this.teacherTouched.set(true);
    const teacherId = value == null ? null : Number(value);
    this.selectedTeacherId.set(teacherId);
    this.selectedPermissionIds.set(new Set());
    this.moduleGroups.set([]);

    if (teacherId != null) {
      this.loadPermissions(teacherId);
    }
  }

  private loadPermissions(teacherId: number): void {
    this.permissionsLoading.set(true);
    this.permissionService.getAvailablePermissions(teacherId).subscribe({
      next: (modules) => {
        this.moduleGroups.set(modules);
        this.permissionsLoading.set(false);
      },
      error: () => {
        // HTTP error already toasted by the global errorInterceptor.
        this.moduleGroups.set([]);
        this.permissionsLoading.set(false);
      },
    });
  }

  // ── Permission selection ─────────────────────────────────────────────────

  protected isSelected(permissionId: number): boolean {
    return this.selectedPermissionIds().has(permissionId);
  }

  protected togglePermission(permissionId: number): void {
    const next = new Set(this.selectedPermissionIds());
    if (next.has(permissionId)) {
      next.delete(permissionId);
    } else {
      next.add(permissionId);
    }
    this.selectedPermissionIds.set(next);
  }

  protected isModuleFullySelected(group: ModulePermissions): boolean {
    return group.permissions.every((p) => this.isSelected(p.permissionId));
  }

  protected toggleModule(group: ModulePermissions): void {
    const next = new Set(this.selectedPermissionIds());
    const fullySelected = this.isModuleFullySelected(group);
    for (const perm of group.permissions) {
      if (fullySelected) {
        next.delete(perm.permissionId);
      } else {
        next.add(perm.permissionId);
      }
    }
    this.selectedPermissionIds.set(next);
  }

  // ── Submit ────────────────────────────────────────────────────────────────

  protected submit(): void {
    this.teacherTouched.set(true);

    if (this.form.invalid || this.selectedTeacherId() == null) {
      this.form.markAllAsTouched();
      return;
    }

    this.submitting.set(true);

    const raw = this.form.getRawValue();
    const request: CreateAssistantRequest = {
      fullName: raw.fullName.trim(),
      username: raw.username.trim(),
      password: raw.password,
      email: raw.email.trim() || undefined,
      phoneNumber: raw.phoneNumber.trim() || undefined,
      teacherId: this.selectedTeacherId()!,
      permissionIds: Array.from(this.selectedPermissionIds()),
      permissionProfileIds: null,
    };

    this.assistantService.createAssistant(request).subscribe({
      next: (res) => {
        this.toast.success(res.message ?? 'Assistant created.');
        void this.router.navigate(['/assistants']);
      },
      // Interceptor surfaces the localized backend message; just release the button.
      error: () => this.submitting.set(false),
    });
  }
}
