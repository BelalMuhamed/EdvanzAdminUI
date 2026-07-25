import { Component, inject, signal } from '@angular/core';
import { FormBuilder, ReactiveFormsModule, Validators } from '@angular/forms';
import { Router, RouterLink } from '@angular/router';
import { SearchableSelectComponent, SearchableSelectOption } from '../../shared/components/searchable-select/searchable-select.component';
import { StudentService } from '../../core/services/student.service';
import { SessionService } from '../../core/services/session.service';
import { TeacherService } from '../../core/services/teacher.service';
import { ToastService } from '../../core/services/toast.service';
import { SessionLookupItem } from '../../core/models/session.model';
import { CreateStudentByAdminRequest } from '../../core/models/student.model';

/**
 * Create-student screen (Admin Portal, SuperAdmin only). Teacher selection
 * gates the session dropdown — sessions belong to a teacher, so none can be
 * offered until one is picked. Mirrors AssistantFormComponent's
 * teacher-gates-dependent-data structure; StudentName is the only mandatory
 * field beyond the teacher (REQ-STU-005), matching CreateTeacherStudentDto.
 *
 * StudentCode is always shown: under Manual code-generation mode the backend
 * uses it, under Auto mode it silently ignores it — there is no per-teacher
 * signal available here to hide the field conditionally.
 */
@Component({
  selector: 'app-student-form',
  standalone: true,
  imports: [ReactiveFormsModule, RouterLink, SearchableSelectComponent],
  templateUrl: './student-form.component.html',
  styleUrl: './student-form.component.css',
})
export class StudentFormComponent {
  private readonly fb = inject(FormBuilder);
  private readonly studentService = inject(StudentService);
  private readonly sessionService = inject(SessionService);
  private readonly teacherService = inject(TeacherService);
  private readonly toast = inject(ToastService);
  private readonly router = inject(Router);

  protected readonly submitting = signal(false);
  protected readonly teacherTouched = signal(false);
  protected readonly teacherOptions = signal<SearchableSelectOption[]>([]);
  protected readonly selectedTeacherId = signal<number | null>(null);

  protected readonly sessionsLoading = signal(false);
  protected readonly sessionOptions = signal<SearchableSelectOption[]>([]);
  protected readonly selectedSessionId = signal<number | null>(null);

  protected readonly form = this.fb.nonNullable.group({
    studentName: ['', [Validators.required]],
    studentPhoneNumber: [''],
    parentPhoneNumber: [''],
    studentCode: [''],
  });

  constructor() {
    this.teacherService.getTeacherLookup().subscribe((teachers) => {
      this.teacherOptions.set(teachers.map((t) => ({ value: t.id, label: t.fullName })));
    });
  }

  protected invalid(control: keyof typeof this.form.controls): boolean {
    const c = this.form.controls[control];
    return c.invalid && (c.touched || c.dirty);
  }

  // ── Teacher selection gates session loading ─────────────────────────────

  protected onTeacherChange(value: number | string | null): void {
    this.teacherTouched.set(true);
    const teacherId = value == null ? null : Number(value);
    this.selectedTeacherId.set(teacherId);
    this.selectedSessionId.set(null);
    this.sessionOptions.set([]);

    if (teacherId != null) {
      this.loadSessions(teacherId);
    }
  }

  protected onSessionChange(value: number | string | null): void {
    this.selectedSessionId.set(value == null ? null : Number(value));
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

  // ── Submit ────────────────────────────────────────────────────────────────

  protected submit(): void {
    this.teacherTouched.set(true);

    if (this.form.invalid || this.selectedTeacherId() == null) {
      this.form.markAllAsTouched();
      return;
    }

    this.submitting.set(true);

    const raw = this.form.getRawValue();
    const request: CreateStudentByAdminRequest = {
      teacherId: this.selectedTeacherId()!,
      studentName: raw.studentName.trim(),
      studentPhoneNumber: raw.studentPhoneNumber.trim() || undefined,
      parentPhoneNumber: raw.parentPhoneNumber.trim() || undefined,
      studentCode: raw.studentCode.trim() || undefined,
      sessionId: this.selectedSessionId() ?? undefined,
    };

    this.studentService.createStudent(request).subscribe({
      next: (res) => {
        this.toast.success(res.message ?? 'Student created.');
        void this.router.navigate(['/students']);
      },
      // Interceptor surfaces the localized backend message; just release the button.
      error: () => this.submitting.set(false),
    });
  }
}
