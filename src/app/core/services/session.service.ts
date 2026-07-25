import { HttpClient } from '@angular/common/http';
import { inject, Injectable } from '@angular/core';
import { map, Observable } from 'rxjs';
import { environment } from '../../../environments/environment';
import { ApiResult } from '../models/api-result.model';
import { SessionLookupItem } from '../models/session.model';

/**
 * Minimal session-lookup surface for the Admin Portal. Only wraps
 * GET api/session/{teacherId}/sessions/lookup — the SuperAdmin-callable
 * overload of SessionController.GetSessionLookup that takes an explicit
 * teacherId (ResolveTeacherIdAsync returns it verbatim for the SuperAdmin
 * role instead of resolving from the JWT). Used solely to populate the
 * "Assigned session" dropdown on the student create/edit forms — no other
 * Session-module surface is implemented here.
 */
@Injectable({ providedIn: 'root' })
export class SessionService {
  private readonly http = inject(HttpClient);
  private readonly base = environment.apiBaseUrl;

  /** GET api/session/{teacherId}/sessions/lookup — Id + SessionName only, no pagination. */
  getSessionLookup(teacherId: number): Observable<SessionLookupItem[]> {
    return this.http
      .get<ApiResult<SessionLookupItem[]>>(`${this.base}/session/${teacherId}/sessions/lookup`)
      .pipe(map((r) => r.data ?? []));
  }
}
