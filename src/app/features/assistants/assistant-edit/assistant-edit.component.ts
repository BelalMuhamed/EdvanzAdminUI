import { Component, OnInit, inject, signal } from '@angular/core';
import {
  AbstractControl,
  FormBuilder,
  ReactiveFormsModule,
  ValidationErrors,
  Validators,
} from '@angular/forms';
import { ActivatedRoute, Router, RouterLink } from '@angular/router';
import { AssistantDetail, UpdateAssistantRequest } from '../../../core/models/assistant.model';
import { ModulePermissions } from '../../../core/models/permission.model';
import { TeacherProfile } from '../../../core/models/teacher.model';
import { AssistantService } from '../../../core/services/assistant.service';
import { PermissionService } from '../../../core/services/permission.service';
import { TeacherService } from '../../../core/services/teacher.service';
import { ToastService } from '../../../core/services/toast.service';
import { EmptyStateComponent } from '../../../shared/components/empty-state/empty-state.component';
import {
  SearchableSelectComponent,
  SearchableSelectOption,
} from '../../../shared/components/searchable-select/searchable-select.component';
import { SubscriptionStatusBadgeComponent } from '../../teachers/subscription-panel/subscription-status-badge.component';

/**
 * Optional password change: only validated when a new password is actually
 * entered. Leaving both fields blank keeps the current password untouched
 * server-side (UpdateAssistantRequest.newPassword is optional).
 */
function optionalPasswordsMatchValidator(group: AbstractControl): ValidationErrors | null {
  const newPassword = group.get('newPassword')?.value;
  const confirmNewPassword = group.get('confirmNewPassword')?.value;
  if (!newPassword) return null;
  return newPassword === confirmNewPassword ? null : { passwordMismatch: true };
}

/**
 * Edit-assistant screen. Loads the assistant by id (GET /api/assistant/{id}),
 * pre-fills the form and the permission catalogue, and saves via
 * PUT /api/assistant/{id}. Mirrors AssistantFormComponent's UX and validation
 * as closely as the backend contract allows.
 *
 * Two things are intentionally different from Create, both backend-driven:
 *  - The teacher selector is locked: UpdateAssistantRequest has no teacherId
 *    field, so reassignment isn't supported by the API.
 *  - permissionProfileIds is always sent as `null`, same as Create — no
 *    profile-selection UI exists here per spec.
 */
@Component({
  selector: 'app-assistant-edit',
  standalone: true,
  imports: [
    ReactiveFormsModule,
    RouterLink,
    EmptyStateComponent,
    SearchableSelectComponent,
    SubscriptionStatusBadgeComponent,
  ],
  templateUrl: './assistant-edit.component.html',
  styleUrl: './assistant-edit.component.css',
})
export class AssistantEditComponent implements OnInit {
  private readonly route = inject(ActivatedRoute);
  private readonly router = inject(Router);
  private readonly fb = inject(FormBuilder);
  private readonly assistantService = inject(AssistantService);
  private readonly permissionService = inject(PermissionService);
  private readonly teacherService = inject(TeacherService);
  private readonly toast = inject(ToastService);

  private assistantId!: number;

  protected readonly loading = signal(true);
  protected readonly notFound = signal(false);
  protected readonly submitting = signal(false);

  // Teacher is fixed — see class doc. A single-option, disabled SearchableSelect
  // keeps the layout identical to the Create page without a second network call.
  protected readonly teacherOptions = signal<SearchableSelectOption[]>([]);
  protected readonly teacherId = signal<number | null>(null);

  // Display-only — see requirement 4. Never influences the save payload.
  protected readonly teacherSubscriptionStatus = signal<string | null>(null);
  protected readonly subscriptionLoading = signal(false);

  protected readonly permissionsLoading = signal(false);
  protected readonly moduleGroups = signal<ModulePermissions[]>([]);
  protected readonly selectedPermissionIds = signal<Set<number>>(new Set());

  protected readonly form = this.fb.nonNullable.group(
    {
      fullName: ['', [Validators.required]],
      username: ['', [Validators.required]],
      email: ['', [Validators.email]],
      phoneNumber: [''],
      newPassword: ['', [Validators.minLength(8)]],
      confirmNewPassword: [''],
    },
    { validators: optionalPasswordsMatchValidator },
  );

  ngOnInit(): void {
    const idParam = this.route.snapshot.paramMap.get('id');
    if (!idParam) {
      this.notFound.set(true);
      this.loading.set(false);
      return;
    }
    this.assistantId = Number(idParam);
    this.loadAssistant();
  }

  private loadAssistant(): void {
    this.assistantService.getById(this.assistantId).subscribe({
      next: (detail) => this.populateFrom(detail),
      error: () => {
        this.notFound.set(true);
        this.loading.set(false);
      },
    });
  }

  private populateFrom(detail: AssistantDetail): void {
    this.form.patchValue({
      fullName: detail.fullName,
      username: detail.username,
      email: detail.email ?? '',
      phoneNumber: detail.phoneNumber ?? '',
    });

    this.teacherId.set(detail.teacherId);
    this.teacherOptions.set([{ value: detail.teacherId, label: detail.teacherName }]);

    const assignedIds = new Set<number>(
      detail.userPermissions.flatMap((g) => g.permissions.map((p) => p.permissionId)),
    );
    this.selectedPermissionIds.set(assignedIds);

    this.loading.set(false);
    this.loadPermissionCatalogue(detail.teacherId);
    this.loadTeacherSubscriptionStatus(detail.teacherId);
  }

  private loadPermissionCatalogue(teacherId: number): void {
    this.permissionsLoading.set(true);
    this.permissionService.getAvailablePermissions(teacherId).subscribe({
      next: (modules) => {
        this.moduleGroups.set(modules);
        this.permissionsLoading.set(false);
      },
      error: () => {
        this.moduleGroups.set([]);
        this.permissionsLoading.set(false);
      },
    });
  }

  private loadTeacherSubscriptionStatus(teacherId: number): void {
    this.subscriptionLoading.set(true);
    this.teacherService.getTeacherById(teacherId).subscribe({
      next: (profile: TeacherProfile) => {
        this.teacherSubscriptionStatus.set(
          profile.activeSubscription?.subscriptionStatus ?? 'None',
        );
        this.subscriptionLoading.set(false);
      },
      error: () => {
        this.teacherSubscriptionStatus.set(null);
        this.subscriptionLoading.set(false);
      },
    });
  }

  protected invalid(control: keyof typeof this.form.controls): boolean {
    const c = this.form.controls[control];
    return c.invalid && (c.touched || c.dirty);
  }

  protected confirmInvalid(): boolean {
    const c = this.form.controls.confirmNewPassword;
    const touched = c.touched || c.dirty;
    return touched && this.form.hasError('passwordMismatch');
  }

  // ── Permission selection — identical mechanics to AssistantFormComponent ───

  protected isSelected(permissionId: number): boolean {
    return this.selectedPermissionIds().has(permissionId);
  }

  protected togglePermission(permissionId: number): void {
    const next = new Set(this.selectedPermissionIds());
    if (next.has(permissionId)) next.delete(permissionId);
    else next.add(permissionId);
    this.selectedPermissionIds.set(next);
  }

  protected isModuleFullySelected(group: ModulePermissions): boolean {
    return group.permissions.every((p) => this.isSelected(p.permissionId));
  }

  protected toggleModule(group: ModulePermissions): void {
    const next = new Set(this.selectedPermissionIds());
    const fullySelected = this.isModuleFullySelected(group);
    for (const perm of group.permissions) {
      if (fullySelected) next.delete(perm.permissionId);
      else next.add(perm.permissionId);
    }
    this.selectedPermissionIds.set(next);
  }

  // ── Submit ────────────────────────────────────────────────────────────────

  protected submit(): void {
    if (this.form.invalid) {
      this.form.markAllAsTouched();
      return;
    }

    this.submitting.set(true);

    const raw = this.form.getRawValue();
    const request: UpdateAssistantRequest = {
      fullName: raw.fullName.trim(),
      username: raw.username.trim(),
      email: raw.email.trim() || undefined,
      phoneNumber: raw.phoneNumber.trim() || undefined,
      newPassword: raw.newPassword.trim() || undefined,
      permissionIds: Array.from(this.selectedPermissionIds()),
      permissionProfileIds: null,
    };

    this.assistantService.updateAssistant(this.assistantId, request).subscribe({
      next: (res) => {
        this.toast.success(res.message ?? 'Assistant updated.');
        this.router.navigate(['/assistants']);
      },
      // Interceptor surfaces the localized backend message; just release the button.
      error: () => this.submitting.set(false),
    });
  }
}
