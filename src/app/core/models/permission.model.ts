// ── Assistant permission catalogue (GET /api/permission/teacher/{teacherId}) ────────
// Mirrors Edvanz.Application.Dtos.ModulesPermissions.ModulePermissionsDto /
// Edvanz.Application.Dtos.PermissionsDtos.PermissionDto exactly (camelCase on the wire).

export interface PermissionItem {
  permissionId: number;
  permissionName: string;
  /** True for sensitive permissions (e.g. financial data) — surfaced as a badge, not filtered client-side. */
  isRestricted: boolean;
}

export interface ModulePermissions {
  id: number;
  moduleName: string;
  permissions: PermissionItem[];
}
