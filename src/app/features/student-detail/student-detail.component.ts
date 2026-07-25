import { DatePipe } from '@angular/common';
import { Component, inject, OnInit, signal } from '@angular/core';
import { ActivatedRoute, RouterLink } from '@angular/router';
import { EmptyStateComponent } from '../../shared/components/empty-state/empty-state.component';
import { StudentService } from '../../core/services/student.service';
import { StudentProfile } from '../../core/models/student.model';


/**
 * Single-student profile screen (Admin Portal, SuperAdmin only). Renders
 * GET teacherstudent/admin/students/{id} in full: contact info, completeness
 * indicator, mobile-linking credentials (student code + hashed token), and
 * the assigned-session card when present. No tabs — unlike TeacherDetails,
 * there's only one screen's worth of data here, so this stays a flat panel.
 */
@Component({
  selector: 'app-student-detail',
  standalone: true,
  imports: [RouterLink, EmptyStateComponent, DatePipe],
  templateUrl: './student-detail.component.html',
  styleUrl: './student-detail.component.css',
})
export class StudentDetailComponent implements OnInit {
  private readonly route = inject(ActivatedRoute);
  private readonly studentService = inject(StudentService);

  protected readonly student = signal<StudentProfile | null>(null);
  protected readonly loading = signal(true);
  protected readonly notFound = signal(false);

  ngOnInit(): void {
    const idParam = this.route.snapshot.paramMap.get('id');
    if (!idParam) {
      this.notFound.set(true);
      this.loading.set(false);
      return;
    }

    this.studentService.getById(Number(idParam)).subscribe({
      next: (profile) => {
        this.student.set(profile);
        this.loading.set(false);
      },
      error: () => {
        this.notFound.set(true);
        this.loading.set(false);
      },
    });
  }

  protected initials(name: string): string {
    return name
      .split(' ')
      .map((p) => p.charAt(0))
      .slice(0, 2)
      .join('')
      .toUpperCase();
  }
}
