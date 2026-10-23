// ==========================================
// MULTI-TENANT ROLE-BASED ACCESS CONTROL (RBAC)
// Settlement Trust Suite (Epiq, Kroll, Angeion, JND)
// ==========================================

export type Role =
  | "CLAIMS_EXAMINER"
  | "COMPLIANCE_AUDITOR"
  | "SETTLEMENT_ADMIN"
  | "CLASS_COUNSEL";

export type Permission =
  | "claims:view"
  | "claims:adjudicate"
  | "escrow:freeze"
  | "escrow:release"
  | "audit:export_rule23"
  | "webhooks:configure";

export type SettlementTenantId = "epiq" | "kroll" | "angeion" | "jnd" | "global";

export interface SettlementTenant {
  id: SettlementTenantId;
  name: string;
  fullName: string;
  domain: string;
  colorScheme: {
    bg: string;
    border: string;
    text: string;
    pill: string;
  };
  activeDockets: string[];
}

export interface ExaminerProfile {
  id: string;
  name: string;
  email: string;
  role: Role;
  tenantId: SettlementTenantId;
  title: string;
  organization: string;
}

// ==========================================
// ROLE TO PERMISSIONS MATRIX
// ==========================================

export const ROLE_PERMISSIONS: Record<Role, readonly Permission[]> = {
  CLAIMS_EXAMINER: [
    "claims:view",
    "claims:adjudicate",
    "escrow:freeze",
    "escrow:release"
  ],
  COMPLIANCE_AUDITOR: [
    "claims:view",
    "audit:export_rule23"
  ],
  SETTLEMENT_ADMIN: [
    "claims:view",
    "claims:adjudicate",
    "escrow:freeze",
    "escrow:release",
    "audit:export_rule23",
    "webhooks:configure"
  ],
  CLASS_COUNSEL: [
    "claims:view",
    "escrow:freeze",
    "audit:export_rule23"
  ]
};

// ==========================================
// PERMISSION CHECK UTILITY
// ==========================================

/**
 * Checks whether a given role possesses a specific granular permission.
 */
export function hasPermission(role: Role, action: Permission): boolean {
  const permissions = ROLE_PERMISSIONS[role];
  if (!permissions) return false;
  return permissions.includes(action);
}

/**
 * Returns all assigned permissions for a role.
 */
export function getPermissionsForRole(role: Role): Permission[] {
  return [...(ROLE_PERMISSIONS[role] || [])];
}

/**
 * Verifies multi-tenant tenancy boundaries.
 * "global" tenant possesses cross-tenant oversight.
 */
export function hasTenantAccess(
  userTenant: SettlementTenantId | string,
  resourceTenant: SettlementTenantId | string
): boolean {
  if (!userTenant || !resourceTenant) return false;
  if (userTenant.toLowerCase() === "global") return true;
  return userTenant.toLowerCase() === resourceTenant.toLowerCase();
}

/**
 * Evaluates whether an examiner can perform an action within a multi-tenant boundary.
 */
export function canExaminerPerform(
  examiner: ExaminerProfile,
  action: Permission,
  resourceTenant?: SettlementTenantId | string
): { allowed: boolean; reason?: string } {
  if (!hasPermission(examiner.role, action)) {
    return {
      allowed: false,
      reason: `Role '${examiner.role}' lacks required permission '${action}'.`
    };
  }

  if (resourceTenant && !hasTenantAccess(examiner.tenantId, resourceTenant)) {
    return {
      allowed: false,
      reason: `Tenant '${examiner.tenantId.toUpperCase()}' is restricted from accessing '${resourceTenant.toUpperCase()}' records.`
    };
  }

  return { allowed: true };
}

// ==========================================
// TENANT REGISTRY & SAMPLE PROFILES
// ==========================================

export const SETTLEMENT_TENANTS: Record<SettlementTenantId, SettlementTenant> = {
  epiq: {
    id: "epiq",
    name: "Epiq",
    fullName: "Epiq Systems Inc.",
    domain: "epiqsystems.com",
    colorScheme: {
      bg: "bg-blue-950/70",
      border: "border-blue-800/60",
      text: "text-blue-400",
      pill: "bg-blue-500/10 text-blue-300 border-blue-500/20"
    },
    activeDockets: ["Ticketmaster / Live Nation Breach", "MoveIT Transfer Security Incident"]
  },
  kroll: {
    id: "kroll",
    name: "Kroll",
    fullName: "Kroll Settlement Administration",
    domain: "kroll.com",
    colorScheme: {
      bg: "bg-purple-950/70",
      border: "border-purple-800/60",
      text: "text-purple-400",
      pill: "bg-purple-500/10 text-purple-300 border-purple-500/20"
    },
    activeDockets: ["AT&T Customer Data Incident", "T-Mobile US Security Breach", "Dell Technologies Scraping"]
  },
  angeion: {
    id: "angeion",
    name: "Angeion",
    fullName: "Angeion Group",
    domain: "angeiongroup.com",
    colorScheme: {
      bg: "bg-teal-950/70",
      border: "border-teal-800/60",
      text: "text-teal-400",
      pill: "bg-teal-500/10 text-teal-300 border-teal-500/20"
    },
    activeDockets: ["23andMe Genetic Data Breach"]
  },
  jnd: {
    id: "jnd",
    name: "JND",
    fullName: "JND Legal Administration",
    domain: "jndla.com",
    colorScheme: {
      bg: "bg-emerald-950/70",
      border: "border-emerald-800/60",
      text: "text-emerald-400",
      pill: "bg-emerald-500/10 text-emerald-300 border-emerald-500/20"
    },
    activeDockets: ["Change Healthcare / UnitedHealth Ransomware"]
  },
  global: {
    id: "global",
    name: "Master Court Monitor",
    fullName: "Federal Special Master Oversight",
    domain: "uscourts.gov",
    colorScheme: {
      bg: "bg-amber-950/70",
      border: "border-amber-800/60",
      text: "text-amber-400",
      pill: "bg-amber-500/10 text-amber-300 border-amber-500/20"
    },
    activeDockets: ["All Federal Dockets"]
  }
};

export const SAMPLE_EXAMINER_PROFILES: ExaminerProfile[] = [
  {
    id: "user-examiner-kroll",
    name: "Eleanor Vance, Esq.",
    email: "e.vance@kroll-claims.com",
    role: "CLAIMS_EXAMINER",
    tenantId: "kroll",
    title: "Senior Adjudication Examiner",
    organization: "Kroll Settlement Administration"
  },
  {
    id: "user-admin-epiq",
    name: "Marcus Reynolds",
    email: "m.reynolds@epiqglobal.com",
    role: "SETTLEMENT_ADMIN",
    tenantId: "epiq",
    title: "VP of Settlement Operations",
    organization: "Epiq Systems Inc."
  },
  {
    id: "user-auditor-angeion",
    name: "Rachel Goldman, CAMS",
    email: "r.goldman@angeiongroup.com",
    role: "COMPLIANCE_AUDITOR",
    tenantId: "angeion",
    title: "Rule 23 Compliance Officer",
    organization: "Angeion Group"
  },
  {
    id: "user-counsel-plaintiff",
    name: "David Ross, Class Counsel",
    email: "dross@classlitigation.org",
    role: "CLASS_COUNSEL",
    tenantId: "global",
    title: "Plaintiffs' Co-Lead Class Counsel",
    organization: "Lieff Cabraser Heimann & Bernstein"
  }
];

export function getRoleBadgeInfo(role: Role): {
  label: string;
  badgeClass: string;
  description: string;
} {
  switch (role) {
    case "CLAIMS_EXAMINER":
      return {
        label: "Claims Examiner",
        badgeClass: "bg-blue-900/60 text-blue-300 border-blue-700/60",
        description: "Adjudicates contested claims, releases escrow, and freezes hijacked funds."
      };
    case "SETTLEMENT_ADMIN":
      return {
        label: "Settlement Administrator",
        badgeClass: "bg-cyan-900/60 text-cyan-300 border-cyan-700/60",
        description: "Full enterprise privileges including webhook endpoints and master configuration."
      };
    case "COMPLIANCE_AUDITOR":
      return {
        label: "Compliance Auditor",
        badgeClass: "bg-amber-900/60 text-amber-300 border-amber-700/60",
        description: "Read-only inspection rights and certified Rule 23 audit log exportation."
      };
    case "CLASS_COUNSEL":
      return {
        label: "Class Counsel",
        badgeClass: "bg-purple-900/60 text-purple-300 border-purple-700/60",
        description: "Court-appointed plaintiffs' counsel with escrow emergency freeze and audit powers."
      };
  }
}
