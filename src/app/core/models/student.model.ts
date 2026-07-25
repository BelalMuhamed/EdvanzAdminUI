import { PagedQuery } from './paginated-response.model';

// ── Student row for the Admin Portal's platform-wide list ──────────────────
// (GET /api/teacherstudent/admin/students). Mirrors
// Edvanz.Application.Dtos.TeacherStudent.TeacherStudentDto exactly.
export interface StudentAdminListItem {
  id: number;
  teacherId: number;
  studentName: string;
  studentCode: string;
  studentPhoneNumber?: string;
  parentPhoneNumber?: string;
  barcode?: string;
  sessionId?: number;
  /** Share with the student for the mobile-app linking flow (TeacherCode + StudentCode + HashedToken). */
  hashedToken: string;
  /** REQ-STU-UX-007: colored-dot indicator — true when all optional fields are filled. */
  isComplete: boolean;
  createdAt: string;
  /** Null when unassigned. */
  sessionName?: string;
  /** Owning teacher's display name. Always present on the admin list/profile paths. */
  teacherName?: string;
  /**
   * Id of the Active StudentTeacherLink currently bound to this row, if any.
   * Present → student's mobile account is linked (show "Unlink", calls
   * admin/{linkId}/unbind). Absent → not linked (show "Link", opens the picker
   * that lists the teacher's unbound Active links, then calls admin/{linkId}/bind
   * with this row's id as the target).
   */
  linkId?: number;
}

/** Valid sort columns per Edvanz.Domain.Enums.StudentSortBy (string enum on the wire). */
export type StudentSortBy = 'DateAdded' | 'StudentName' | 'StudentCode';

// ── Query params for GET /api/teacherstudent/admin/students ────────────────
// Mirrors Edvanz.Application.Dtos.TeacherStudent.StudentListByAdminRequest.
export interface StudentAdminListQuery extends PagedQuery {
  /** Restrict to a single teacher's students. Omit/undefined = all teachers. */
  teacherId?: number | null;
  sessionId?: number | null;
  missingStudentPhone?: boolean;
  missingParentPhone?: boolean;
  missingSession?: boolean;
  sortBy?: StudentSortBy;
}

// ── Create student on behalf of a teacher (POST /api/teacherstudent/admin) ─
// Mirrors Edvanz.Application.Dtos.TeacherStudent.CreateTeacherStudentByAdminDto.
// StudentName is the only other mandatory field (REQ-STU-005); StudentCode is
// only meaningful when the teacher's GenerationMode is Manual, otherwise the
// backend auto-generates it — the create form always allows entering it, and
// the backend silently ignores it under Auto generation mode.
export interface CreateStudentByAdminRequest {
  teacherId: number;
  studentName: string;
  studentPhoneNumber?: string;
  parentPhoneNumber?: string;
  studentCode?: string;
  sessionId?: number;
}

// ── Update student (PUT /api/teacherstudent/admin/students/{id}) ───────────
// Mirrors Edvanz.Application.Dtos.TeacherStudent.UpdateTeacherStudentDto.
// Deliberately has NO teacherId — the backend DTO doesn't support
// reassignment to a different teacher, so the Edit page must not offer it.
export interface UpdateStudentRequest {
  studentName: string;
  studentPhoneNumber?: string;
  parentPhoneNumber?: string;
  studentCode?: string;
  sessionId?: number;
}

/** Recurrence pattern — Edvanz.Domain.Enums.OccurrenceType (string enum on the wire). */
export type OccurrenceType = 'Weekly' | 'BiWeekly' | 'Monthly';

/** Charging model — Edvanz.Domain.Enums.PaymentType (string enum on the wire). */
export type PaymentType = 'Monthly' | 'PerSession';

// ── Assigned-session summary embedded in the profile screen ────────────────
// Mirrors Edvanz.Application.Dtos.TeacherStudent.AssignedSessionSummaryDto.
export interface AssignedSessionSummary {
  sessionId: number;
  sessionName: string;
  occurrenceType: OccurrenceType;
  paymentType: PaymentType;
  sessionAmount: number;
}

// ── Student profile (GET /api/teacherstudent/admin/students/{id}) ──────────
// Mirrors Edvanz.Application.Dtos.TeacherStudent.TeacherStudentProfileDto,
// which extends TeacherStudentDto with the assigned-session card payload.
export interface StudentProfile extends StudentAdminListItem {
  /** Null when the student has no assigned session. */
  assignedSession?: AssignedSessionSummary;
}

// ── Picker item for "connected but not yet linked" accounts ────────────────
// GET api/teacher/student-links/admin/teachers/{teacherId}/unbound-links
// (TeacherStudentLinksController). Mirrors Edvanz.Application.Dtos.TeacherLinks
// .LinkedStudentListItemDto as returned by that endpoint — TeacherStudentId/
// RosterStudentName/RosterStudentCode are always null here by construction
// (that's the definition of "unbound"), so this trims them from the shape.
export interface UnboundLinkItem {
  linkId: number;
  linkedAt: string;
  studentAccountCode: string;
  studentFullName: string;
  studentPhoneNumber?: string;
}
