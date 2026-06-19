export const APP_NAME = "CRM Pro";

export const COLORS = {
  primary: "#2563EB",
  secondary: "#0F172A",
  success: "#10B981",
  warning: "#F59E0B",
  danger: "#EF4444",
  background: "#F8FAFC",
} as const;

export const SIDEBAR_WIDTH = 280;

export const NAV_ITEMS = [
  { title: "Dashboard", href: "/dashboard", icon: "LayoutDashboard" },
  { title: "Leads", href: "/leads", icon: "UserPlus" },
  { title: "Customers", href: "/customers", icon: "Building2" },
  { title: "Contacts", href: "/contacts", icon: "Contact" },
  { title: "Opportunities", href: "/opportunities", icon: "Target" },
  { title: "Activities", href: "/activities", icon: "Calendar" },
  { title: "Tasks", href: "/tasks", icon: "CheckSquare" },
  { title: "Quotations", href: "/quotations", icon: "FileText" },
  { title: "Documents", href: "/documents", icon: "FolderOpen" },
  { title: "Reports", href: "/reports", icon: "BarChart3" },
  { title: "Settings", href: "/settings", icon: "Settings" },
] as const;

export const LEAD_STATUSES = [
  "NEW", "CONTACTED", "QUALIFIED", "PROPOSAL_SENT", "WON", "LOST",
] as const;

export const OPPORTUNITY_STAGES = [
  "PROSPECT", "QUALIFICATION", "PROPOSAL", "NEGOTIATION", "WON", "LOST",
] as const;

export const TASK_STATUSES = ["TODO", "IN_PROGRESS", "COMPLETED"] as const;
export const TASK_PRIORITIES = ["LOW", "MEDIUM", "HIGH", "CRITICAL"] as const;
export const ACTIVITY_TYPES = ["CALL", "MEETING", "TASK", "EMAIL"] as const;
export const QUOTATION_STATUSES = ["DRAFT", "SENT", "ACCEPTED", "REJECTED"] as const;
export const DOCUMENT_CATEGORIES = ["CONTRACTS", "QUOTATIONS", "CUSTOMER_DOCUMENTS", "GENERAL"] as const;

export const ROLES = ["ADMIN", "SALES_MANAGER", "SALES_EXECUTIVE"] as const;

export const PERMISSIONS = [
  "leads.view", "leads.create", "leads.edit", "leads.delete",
  "customers.view", "customers.create", "customers.edit", "customers.delete",
  "opportunities.view", "opportunities.create", "opportunities.edit",
  "reports.view", "reports.export",
  "settings.view", "settings.edit", "users.manage",
] as const;

export const ROLE_PERMISSIONS: Record<string, string[]> = {
  ADMIN: [...PERMISSIONS],
  SALES_MANAGER: [
    "leads.view", "leads.create", "leads.edit", "leads.delete",
    "customers.view", "customers.create", "customers.edit",
    "opportunities.view", "opportunities.create", "opportunities.edit",
    "reports.view", "reports.export",
    "settings.view",
  ],
  SALES_EXECUTIVE: [
    "leads.view", "leads.create", "leads.edit",
    "customers.view", "customers.create",
    "opportunities.view", "opportunities.create",
    "reports.view",
  ],
};

export function formatLabel(value: string) {
  return value
    .replace(/_/g, " ")
    .toLowerCase()
    .replace(/\b\w/g, (c) => c.toUpperCase());
}
