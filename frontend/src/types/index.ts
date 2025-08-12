// User types
export interface User {
  id: string;
  email: string;
  firstName: string;
  lastName: string;
  role: 'admin' | 'user';
  createdAt: string;
  updatedAt: string;
}

// Task types
export interface Task {
  id: string;
  title: string;
  description: string;
  status: 'todo' | 'in-progress' | 'done';
  priority: 'low' | 'medium' | 'high';
  dueDate?: string;
  createdAt: string;
  updatedAt: string;
  userId: string;
  user?: User;
}

// Time Entry types
export interface TimeEntry {
  id: string;
  taskId: string;
  userId: string;
  startTime: string;
  endTime?: string;
  duration?: number; // in minutes
  description?: string;
  billable: boolean;
  rate?: number;
  status: 'draft' | 'submitted' | 'approved' | 'rejected';
  createdAt: string;
  updatedAt: string;
  task?: Task;
  user?: User;
}

// Timesheet types
export interface Timesheet {
  id: string;
  userId: string;
  startDate: string;
  endDate: string;
  status: 'draft' | 'submitted' | 'approved' | 'rejected';
  notes?: string;
  totalHours: number;
  approvedById?: string;
  approvedAt?: string;
  createdAt: string;
  updatedAt: string;
  user?: User;
  approvedBy?: User;
  timeEntries?: TimeEntry[];
}

// Invoice types
export interface Invoice {
  id: string;
  clientId: string;
  timesheetIds: string[];
  invoiceNumber: string;
  issueDate: string;
  dueDate: string;
  status: 'draft' | 'sent' | 'paid' | 'overdue' | 'cancelled';
  subtotal: number;
  tax: number;
  total: number;
  notes?: string;
  createdAt: string;
  updatedAt: string;
  client?: Client;
  timesheets?: Timesheet[];
}

// Client types
export interface Client {
  id: string;
  name: string;
  email: string;
  phone?: string;
  address?: string;
  taxId?: string;
  paymentTerms?: string;
  createdAt: string;
  updatedAt: string;
}

// Auth types
export interface AuthResponse {
  user: User;
  token: string;
}

export interface LoginCredentials {
  email: string;
  password: string;
}

export interface RegisterData extends LoginCredentials {
  firstName: string;
  lastName: string;
}

// API Response types
export interface ApiResponse<T> {
  success: boolean;
  data?: T;
  error?: string;
  message?: string;
}

// Pagination types
export interface PaginatedResponse<T> {
  items: T[];
  total: number;
  page: number;
  limit: number;
  totalPages: number;
}

// Form field types
export interface FormField<T> {
  value: T;
  error?: string;
  touched: boolean;
  required?: boolean;
  validate?: (value: T) => string | undefined;
}

// Utility types
export type Optional<T, K extends keyof T> = Omit<T, K> & Partial<Pick<T, K>>;
export type Nullable<T> = T | null;

// Redux state types
export interface AuthState {
  user: User | null;
  token: string | null;
  isAuthenticated: boolean;
  loading: boolean;
  error: string | null;
}

export interface AppState {
  auth: AuthState;
  // Add other state slices here as needed
}
