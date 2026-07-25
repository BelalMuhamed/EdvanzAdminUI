import { Component, OnInit, inject, signal } from '@angular/core';
import { FormBuilder, ReactiveFormsModule, Validators } from '@angular/forms';
import { ActivatedRoute, Router, RouterLink } from '@angular/router';
import { EmptyStateComponent } from '../../shared/components/empty-state/empty-state.component';
import { SearchableSelectComponent, SearchableSelectOption } from '../../shared/components/searchable-select/searchable-select.component';
import { StudentService } from '../../core/services/student.service';
import { SessionService } from '../../core/services/session.service';
import { ToastService } from '../../core/services/toast.service';
import { StudentProfile, UpdateStudentRequest } from '../../core/models/student.model';
import { SessionLookupItem } from '../../core/models/session.model';


/**
 * Edit-student screen. Loads the student by id
 * (GET teacherstudent/admin/students/{id}), pre-fills the form, and saves via
 * PUT teacherstudent/admin/students/{id}. Mirrors AssistantEditComponent's
 * load/populate/submit structure.
 *
 * The teacher selector is locked — UpdateTeacherStudentDto has no teacherId
 * field, so reassignment to a different teacher isn't supported by the API
 * (confirmed: no such domain logic exists anywhere in the backend). A
 * single-option, disabled SearchableSelect keeps the layout identical to
 * Create without implying the field is editable.
 */
@Component({
  selector: 'app-student-edit',
  standalone: true,
  imports: [ReactiveFormsModule, RouterLink, EmptyStateComponent, SearchableSelectComponent],
  templateUrl: './student-edit.component.html',
  styleUrl: './student-edit.component.css',
})
export class StudentEditComponent implements OnInit {
  private readonly route = inject(ActivatedRoute);
  private readonly router = inject(Router);
  private readonly fb = inject(FormBuilder);
  private readonly studentService = inject(StudentService);
  private readonly sessionService = inject(SessionService);
  private readonly toast = inject(ToastService);

  protected studentId!: number;

  protected readonly loading = signal(true);
  protected readonly notFound = signal(false);
  protected readonly submitting = signal(false);

  // Teacher is fixed — see class doc.
  protected readonly teacherOptions = signal<SearchableSelectOption[]>([]);

  protected readonly sessionsLoading = signal(false);
  protected readonly sessionOptions = signal<SearchableSelectOption[]>([]);
  protected readonly selectedSessionId = signal<number | null>(null);

  protected readonly form = this.fb.nonNullable.group({
    studentName: ['', [Validators.required]],
    studentPhoneNumber: [''],
    parentPhoneNumber: [''],
    studentCode: [''],
  });

  ngOnInit(): void {
    const idParam = this.route.snapshot.paramMap.get('id');
    if (!idParam) {
      this.notFound.set(true);
      this.loading.set(false);
      return;
    }
    this.studentId = Number(idParam);
    this.loadStudent();
  }

  private loadStudent(): void {
    this.studentService.getById(this.studentId).subscribe({
      next: (profile) => this.populateFrom(profile),
      error: () => {
        this.notFound.set(true);
        this.loading.set(false);
      },
    });
  }

  private populateFrom(profile: StudentProfile): void {
    this.form.patchValue({
      studentName: profile.studentName,
      studentPhoneNumber: profile.studentPhoneNumber ?? '',
      parentPhoneNumber: profile.parentPhoneNumber ?? '',
      studentCode: profile.studentCode ?? '',
    });

    // No teacher-name field ships on TeacherStudentDto; the id is enough for
    // a locked, single-option select — same trade-off AssistantEdit accepts.
    this.teacherOptions.set([{ value: profile.teacherId, label: `Teacher #${profile.teacherId}` }]);

    this.selectedSessionId.set(profile.sessionId ?? null);

    this.loading.set(false);
    this.loadSessions(profile.teacherId);
  }

  private loadSessions(teacherId: number): void {
    this.sessionsLoading.set(true);
    this.sessionService.getSessionLookup(teacherId).subscribe({
      next: (sessions: SessionLookupItem[]) => {
        this.sessionOptions.set(sessions.map((s) => ({ value: s.id, label: s.sessionName })));
        this.sessionsLoading.set(false);
      },
      error: () => {
        this.sessionOptions.set([]);
        this.sessionsLoading.set(false);
      },
    });
  }

  protected onSessionChange(value: number | string | null): void {
    this.selectedSessionId.set(value == null ? null : Number(value));
  }

  protected invalid(control: keyof typeof this.form.controls): boolean {
    const c = this.form.controls[control];
    return c.invalid && (c.touched || c.dirty);
  }

  // ── Submit ────────────────────────────────────────────────────────────────

  protected submit(): void {
    if (this.form.invalid) {
      this.form.markAllAsTouched();
      return;
    }

    this.submitting.set(true);

    const raw = this.form.getRawValue();
    const request: UpdateStudentRequest = {
      studentName: raw.studentName.trim(),
      studentPhoneNumber: raw.studentPhoneNumber.trim() || undefined,
      parentPhoneNumber: raw.parentPhoneNumber.trim() || undefined,
      studentCode: raw.studentCode.trim() || undefined,
      sessionId: this.selectedSessionId() ?? undefined,
    };

    this.studentService.updateStudent(this.studentId, request).subscribe({
      next: (res) => {
        this.toast.success(res.message ?? 'Student updated.');
        void this.router.navigate(['/students', this.studentId]);
      },
      // Interceptor surfaces the localized backend message; just release the button.
      error: () => this.submitting.set(false),
    });
  }
}
