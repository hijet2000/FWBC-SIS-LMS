// --- Core & Auth ---
export interface User {
  id: string;
  name: string;
  role: string;
  scopes: string[];
}

export interface AuthContextType {
  user: User | null;
  loading: boolean;
  setUser: React.Dispatch<React.SetStateAction<User | null>>;
}

// --- SIS (Student Information System) ---
export interface SchoolClass {
  id: string;
  name: string;
  teacherId: string;
}

export interface Student {
  id: string;
  name: string;
  admissionNo: string;
  classId: string;
  roll?: string;
  contact: {
    email: string;
    phone: string;
  };
  address: {
    line1: string;
    city: string;
    postcode: string;
  };
  photoUrl?: string;
}

// --- Attendance ---
export type AttendanceStatus = 'PRESENT' | 'ABSENT' | 'LATE' | 'EXCUSED';

export interface AttendanceEntry {
  studentId: string;
  status: AttendanceStatus;
  minutesAttended?: number;
}

export interface AttendanceRecord extends AttendanceEntry {
  id: string;
  sessionId: string;
  classId: string;
  date: string; // YYYY-MM-DD
  createdAt: string; // ISO
}

export interface WeeklyEmailSettings {
  enabled: boolean;
  sendHour: number; // 0-23
}

// --- Academics ---
export interface Subject {
  id: string;
  name: string;
  code?: string;
  level: 'O' | 'A' | 'Other';
}

export interface Teacher {
  id: string;
  name: string;
  email: string;
}

export interface Mapping {
  id: string;
  subjectId: string;
  teacherId: string;
  classIds: string[];
  notes?: string;
}

export interface Exam {
    id: string;
    subjectName: string;
    className: string;
    date: string; // YYYY-MM-DD
}

// --- LMS (Learning Management System) ---
export interface Course {
    id: string;
    name: string;
    status: 'Open' | 'Closed';
}

export type AssetKind = 'VIDEO' | 'AUDIO' | 'EBOOK';
export interface DigitalAsset {
  id: string;
  title: string;
  kind: AssetKind;
  url: string;
  category?: string;
  createdAt: string; // YYYY-MM-DD
}

// --- Fees ---
export type FeeFrequency = 'Once' | 'Monthly' | 'Termly' | 'Annually';

export interface FeeItem {
  id: string;
  name: string;
  code?: string;
  amount: number;
  frequency: FeeFrequency;
  active: boolean;
}

export type InvoiceStatus = 'Paid' | 'Partial' | 'Unpaid' | 'Overdue';

export interface Invoice {
  id: string;
  invoiceNo: string;
  studentId: string;
  classId: string;
  issuedAt: string; // YYYY-MM-DD
  dueAt: string; // YYYY-MM-DD
  lineItems: {
    feeItemId: string;
    description: string;
    amount: number;
  }[];
  total: number;
  paid: number;
  status: InvoiceStatus;
}

export type PaymentMethod = 'Cash' | 'Card' | 'Mobile' | 'Bank';

export interface Payment {
  id: string;
  invoiceId: string;
  receiptNo: string;
  amount: number;
  method: PaymentMethod;
  paidAt: string; // YYYY-MM-DD
  ref?: string;
  note?: string;
}

// --- Transport ---
export interface Vehicle {
    id: string;
    regNo: string;
    make: string;
    model: string;
    capacity?: number;
    active: boolean;
    notes?: string;
}

export interface Driver {
    id: string;
    name: string;
    phone: string;
    licenseNo: string;
    active: boolean;
}

export interface RouteStop {
    id: string;
    label: string;
}

export interface TransportRoute {
    id: string;
    name: string;
    stops: RouteStop[];
}

export type TripStatus = 'Planned' | 'In Progress' | 'Completed' | 'Cancelled';

export interface Trip {
    id: string;
    date: string;
    vehicleId: string;
    driverId: string;
    routeId: string;
    startTime?: string;
    endTime?: string;
    status: TripStatus;
}

export interface EligibleStudent extends Student {
    transportRouteId: string;
    pickupStopId: string;
    dropoffStopId: string;
    guardianPhone: string;
}

export type BoardingDirection = 'Pickup' | 'Dropoff';

export interface BoardingEvent {
    id: string;
    tripId: string;
    studentId: string;
    direction: BoardingDirection;
    timestampISO: string;
    deviceId?: string;
    alertSent: boolean;
}

export interface AlertSettings {
    enabled: boolean;
    onPickup: boolean;
    onDropoff: boolean;
}


// --- Catch-up / Library ---
export interface CatchupItem {
    id: string;
    title: string;
    subjectId: string;
    classId: string;
    kind: 'VIDEO';
    url: string;
    durationSec: number;
    teacherId: string;
    publishedAt: string; // YYYY-MM-DD
}

export interface WatchProgress {
    secondsWatched: number;
    lastSecond: number;
    completed: boolean;
    lastUpdatedISO: string;
}

export interface CatchupPolicy {
    requiredWatchPct: number;
    minimumQuizScorePct: number;
}

export interface QuizQuestion {
    id: string;
    type: 'single' | 'multiple';
    prompt: string;
    choices: string[];
    correct: number[]; // indices
}

export interface QuizAnswer {
    questionId: string;
    selected: number[]; // indices
}

// --- Admin / Audit ---
export type AuditModule = 'STUDENTS' | 'ATTENDANCE' | 'ACADEMICS' | 'FEES' | 'AUTH' | 'SYSTEM' | 'TRANSPORT';
export type AuditAction = 'CREATE' | 'UPDATE' | 'DELETE' | 'PAYMENT' | 'LOGIN' | 'LOGOUT' | 'ROLE_CHANGE';

export interface AuditEvent {
  id: string;
  tsISO: string;
  actorId: string;
  actorName: string;
  module: AuditModule;
  action: AuditAction;
  ip?: string;
  ua?: string;
  entityType?: string;
  entityId?: string;
  entityDisplay?: string;
  before?: any;
  after?: any;
  meta?: any;
}

export interface UserSession {
    id: string;
    userId: string;
    loginISO: string;
    logoutISO?: string;
    ip: string;
    ua: string;
    active: boolean;
}

export interface UserActivityEvent extends AuditEvent {}
