/**
 * PayRolled Core Library
 * © 2026 PayRolled Treasury Solutions
 */

export const ROUTE_PATHS = {
  HOME: '/',
  DASHBOARD: '/dashboard',
  EMPLOYEES: '/dashboard/employees',
  HISTORY: '/dashboard/history',
  SETTINGS: '/dashboard/settings',
} as const;

export type RoutePath = typeof ROUTE_PATHS[keyof typeof ROUTE_PATHS];

export interface Employee {
  id: string;
  name: string;
  walletAddress: string;
  role: string;
  salary: number; // Amount in USDC
  status: 'active' | 'on_leave' | 'terminated';
  joinedAt: string;
  lastPaidAt?: string;
}

export interface PayrollStats {
  totalTreasury: number; // Total USDC in treasury
  nextPayrollDate: string; // ISO date string
  activeEmployees: number;
  monthlyBurnRate: number;
}

/**
 * Truncates an Ethereum address to a readable format (e.g., 0x1234...abcd)
 */
export const formatAddress = (address: string | undefined): string => {
  if (!address) return 'Not Connected';
  if (address.length < 10) return address;
  return `${address.slice(0, 6)}...${address.slice(-4)}`;
};

/**
 * Formats a numeric value into a standardized USDC currency string
 * Uses tabular numbers alignment for dashboard consistency
 */
export const formatCurrency = (amount: number, includeSymbol: boolean = true): string => {
  const formatted = new Intl.NumberFormat('en-US', {
    style: 'decimal',
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  }).format(amount);

  return includeSymbol ? `${formatted} USDC` : formatted;
};

/**
 * Formats a date string for institutional reporting standards
 */
export const formatDate = (dateString: string): string => {
  return new Date(dateString).toLocaleDateString('en-US', {
    year: 'numeric',
    month: 'short',
    day: 'numeric',
  });
};
