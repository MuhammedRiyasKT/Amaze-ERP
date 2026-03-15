export type UserRole = "admin" | "crm" | "sales" | "project" | "designer" | "production" | "logistics"

export interface User {
  id: string
  username: string
  role: UserRole
  name: string
  email: string
}

// API Response types
export interface LoginResponse {
  access_token: string
  token_type: string
}

export interface ApiUser {
  sub: string // user ID
  role: string
  exp: number
  iat: number
}

// Hardcoded users as per specification
export const DEMO_USERS: Record<string, { password: string; user: User }> = {
  admin: {
    password: "admin123",
    user: {
      id: "1",
      username: "admin",
      role: "admin",
      name: "System Administrator",
      email: "admin@amazeframing.com",
    },
  },
  crm_user: {
    password: "crm123",
    user: {
      id: "2",
      username: "crm_user",
      role: "crm",
      name: "CRM Manager",
      email: "crm@amazeframing.com",
    },
  },
  sales_user: {
    password: "sales123",
    user: {
      id: "3",
      username: "sales_user",
      role: "sales",
      name: "Sales Representative",
      email: "sales@amazeframing.com",
    },
  },
  project_user: {
    password: "project123",
    user: {
      id: "4",
      username: "project_user",
      role: "project",
      name: "Project Manager",
      email: "project@amazeframing.com",
    },
  },
  designer: {
    password: "design123",
    user: {
      id: "5",
      username: "designer",
      role: "designer",
      name: "Lead Designer",
      email: "designer@amazeframing.com",
    },
  },
  printing_user: {
    password: "print123",
    user: {
      id: "6",
      username: "printing_user",
      role: "printing",
      name: "Printing Operator",
      email: "printing@amazeframing.com",
    },
  },
  logistics_user: {
    password: "logistics123",
    user: {
      id: "7",
      username: "logistics_user",
      role: "logistics",
      name: "Logistics Coordinator",
      email: "logistics@amazeframing.com",
    },
  },
}

export const ROLE_PERMISSIONS = {
  admin: ["users", "settings", "reports", "all_modules"],
  crm: ["customers", "leads", "communications"],
  sales: ["orders", "quotations", "customers", "inventory"],
  project: ["projects", "tasks", "timeline", "resources"],
  designer: ["designs", "projects", "assets", "approvals"],
  printing: ["print_queue", "materials", "quality_control"],
  logistics: ["shipping", "inventory", "tracking", "delivery"],
}

// Utility function to get stored token
export const getStoredToken = (): string | null => {
  if (typeof window === "undefined") return null
  return localStorage.getItem("amaze_token")
}

// Utility function to create headers with authorization
export const getAuthHeaders = (): Record<string, string> => {
  const token = getStoredToken()
  if (!token) return {}
  
  return {
    "Authorization": `Bearer ${token}`,
    "Content-Type": "application/json",
  }
}
