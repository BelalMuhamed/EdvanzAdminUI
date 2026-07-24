import { HttpClient } from '@angular/common/http';
import { inject, Injectable } from '@angular/core';
import { map, Observable } from 'rxjs';
import { environment } from '../../../environments/environment';
import { ApiResult } from '../models/api-result.model';
import { ModulePermissions } from '../models/permission.model';

@Injectable({ providedIn: 'root' })
export class PermissionService {
  private readonly http = inject(HttpClient);
  private readonly base = environment.apiBaseUrl;

  /**
   * GET /api/permission/teacher/{teacherId} — the permission catalogue available
   * to assistants of this teacher, grouped by module. SuperAdmin/Teacher only.
   */
  getAvailablePermissions(teacherId: number): Observable<ModulePermissions[]> {
    return this.http
      .get<ApiResult<ModulePermissions[]>>(`${this.base}/permission/teacher/${teacherId}`)
      .pipe(map((r) => r.data ?? []));
  }
}
