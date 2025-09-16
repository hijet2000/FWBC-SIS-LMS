// FIX: Removed invalid CDATA wrapper.
// --- CORE & AUTH ---

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

// --- SHARED UI ---

export type ToastType = 'success' | 'error' | 'warning' | 'info';

export interface ToastMessage {
  id: number;
  message: string;
  type: ToastType;
}

export interface ToastContextType {
  addToast: (message: string, type: ToastType) => void;
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

// --- ATTENDANCE ---
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


// --- ACADEMICS & TIMETABLING ---
export type DayOfWeek = 'MON' | 'TUE' | 'WED' | 'THU' | 'FRI';

export interface Subject {
  id: string;
  name: string;
  code?: string;
  level?: 'O' | 'A' | 'Other';
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

export interface TimetableEntry {
    id: string;
    subjectId: string;
    teacherId: string;
    classId: string;
    day: DayOfWeek;
    timeSlot: string; // e.g., "09:00-10:00"
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
  category: string;
  createdAt: string; // YYYY-MM-DD
}

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
    type: 'single' | 'multi';
    prompt: string;
    choices: string[];
    correct: number[]; // indices
}

export interface QuizAnswer {
    questionId: string;
    selected: number[]; // indices
}


// --- HOMEWORK ---
export type SubmissionStatus = 'On-time' | 'Late' | 'Not Submitted';

export interface Homework {
    id: string;
    classId: string;
    subjectId: string;
    title: string;
    instructions: string;
    dueDate: string; // YYYY-MM-DD
    assignedAt: string; // ISO
}

export interface Submission {
    id: string;
    homeworkId: string;
    studentId: string;
    status: SubmissionStatus;
    submittedAt?: string; // ISO
    text?: string;
    files?: { name: string; url: string }[];
}

export interface Feedback {
    id: string;
    submissionId: string;
    score?: number;
    comments: string;
    returnedAt: string; // ISO
}

// --- FEES ---
export type FeeFrequency = 'Once' | 'Monthly' | 'Termly' | 'Annually';
export type InvoiceStatus = 'Paid' | 'Partial' | 'Unpaid' | 'Overdue';
export type PaymentMethod = 'Cash' | 'Card' | 'Mobile' | 'Bank';

export interface FeeItem {
  id: string;
  name: string;
  code?: string;
  amount: number;
  frequency: FeeFrequency;
  active: boolean;
}

export interface Invoice {
    id: string;
    invoiceNo: string;
    studentId: string;
    classId: string;
    issuedAt: string; // YYYY-MM-DD
    dueAt: string; // YYYY-MM-DD
    lineItems: { feeItemId: string; description: string; amount: number }[];
    total: number;
    paid: number;
    status: InvoiceStatus;
}

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

// --- ADMISSIONS & FRONT OFFICE ---
export type ApplicationStatus = 'New' | 'Screening' | 'DocsMissing' | 'Interview' | 'Offer' | 'Accepted' | 'Approved' | 'Rejected' | 'Waitlist' | 'Withdrawn';
export type EnquiryStatus = 'New' | 'Contacted' | 'Qualified' | 'Converted' | 'Closed';
export type EnquirySource = 'Call' | 'Web' | 'Walk-in' | 'Referral' | 'Social';

export interface ApplicantDetails {
    fullName: string;
    dob: string;
    gender: 'Male' | 'Female' | 'Other';
    nationality: string;
    priorSchool: string;
}

export interface GuardianDetails {
    name: string;
    relationship: 'Father' | 'Mother' | 'Guardian';
    phone: string;
    email: string;
    address: string;
}

export interface ApplicationDocument {
    type: 'BirthCertificate' | 'ReportCard' | 'Photo';
    fileName: string;
    url: string;
    verified: boolean;
}

export interface ScreeningChecklist {
    ageEligibility: boolean;
    prerequisitesMet: boolean;
    catchmentArea: boolean;
}

export interface InterviewDetails {
    scheduledAt?: string; // ISO
    interviewerId?: string;
    notes?: string;
}

export interface DecisionDetails {
    offerExpiresAt?: string; // YYYY-MM-DD
    rejectionReason?: string;
}

export interface Application {
    id: string;
    enquiryId?: string;
    applicantName: string;
    desiredClassId: string;
    intakeSession: string;
    status: ApplicationStatus;
    submittedAt: string; // ISO
    applicantDetails: ApplicantDetails;
    guardians: GuardianDetails[];
    documents: ApplicationDocument[];
    // New detailed pipeline fields
    screeningChecklist: ScreeningChecklist;
    interviewDetails: InterviewDetails;
    decisionDetails: DecisionDetails;
    notes?: string;
}

export interface PublicApplicationView {
    applicantName: string;
    status: ApplicationStatus;
    nextSteps: string;
    interviewDetails?: InterviewDetails;
    missingDocuments: string[];
}

export interface CsvValidationError {
    rowIndex: number;
    field: string;
    message: string;
}

export interface Enquiry {
    id: string;
    name: string;
    phone?: string;
    email?: string;
    source: EnquirySource;
    status: EnquiryStatus;
    ownerUserId: string;
    targetClassId?: string;
    preferredIntake?: string;
    notes?: string;
    createdAt: string; // ISO
}

export interface FollowUp {
    id: string;
    enquiryId: string;
    applicationId?: string;
    ownerId: string;
    dueAt: string; // ISO
    doneAt?: string; // ISO
    method: 'Call' | 'Email' | 'Visit';
    summary: string;
    outcome?: string;
}

export interface SeatAllocation {
    classId: string;
    capacity: number;
    allocated: number;
}

export interface VisitorLog {
    id: string;
    name: string;
    company?: string;
    purpose: string;
    timeIn: string; // ISO
    timeOut?: string; // ISO
    hostUserId?: string;
    badgeNo?: string;
    isOverstay?: boolean;
    isUnresolved?: boolean;
}

export type CallDirection = 'Inbound' | 'Outbound';
export type CallTopic = 'Enquiry' | 'Complaint' | 'Attendance' | 'Fees' | 'Safeguarding' | 'Other';
export type CallStatus = 'Open' | 'Closed';

export interface CallLog {
    id: string;
    direction: CallDirection;
    callerName?: string;
    number?: string;
    topic: CallTopic;
    status: CallStatus;
    notes: string;
    callAt: string; // ISO
    ownerUserId?: string;
    linkedEntity?: {
        type: 'Student' | 'Enquiry';
        id: string;
        name: string;
    }
}

export type PostalDirection = 'Incoming' | 'Outgoing';
export type PostalStatus = 'Received' | 'Dispatched' | 'Handed Over';

export interface Postal {
    id: string;
    direction: PostalDirection;
    date: string; // YYYY-MM-DD
    subject: string;
    sender: string;
    recipient: string;
    carrier?: string;
    refNo?: string;
    confidential: boolean;
    status: PostalStatus;
    attachments?: { name: string; url: string }[];
}

export interface Handover {
    id: string;
    postalId: string;
    fromUserId: string;
    toUserId: string;
    handedAt: string; // ISO
}

export interface OnlineAdmissionsSettings {
    acceptingNewApplications: boolean;
    message: string;
}

export interface CommunicationTemplate {
    id: string;
    name: string;
    subject: string;
    body: string; // Could use placeholders like {{applicantName}}
}


// --- TRANSPORT ---
export type TripStatus = 'Planned' | 'In Progress' | 'Completed' | 'Cancelled';
export type BoardingDirection = 'Pickup' | 'Dropoff';

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

export interface TransportRoute {
    id: string;
    name: string;
    stops: { id: string; label: string }[];
}

export interface Trip {
    id: string;
    date: string; // YYYY-MM-DD
    vehicleId: string;
    driverId: string;
    routeId: string;
    startTime?: string; // HH:MM
    endTime?: string; // HH:MM
    status: TripStatus;
}

export interface EligibleStudent extends Student {
    transportRouteId: string;
    pickupStopId: string;
    dropoffStopId: string;
    guardianPhone: string;
}

export interface BoardingEvent {
    id: string;
    tripId: string;
    studentId: string;
    direction: BoardingDirection;
    timestampISO: string;
    alertSent: boolean;
}

export interface AlertSettings {
    enabled: boolean;
    onPickup: boolean;
    onDropoff: boolean;
}

// --- ADMIN & AUDIT ---
export type AuditModule = 'STUDENTS' | 'ATTENDANCE' | 'ACADEMICS' | 'LMS' | 'HOMEWORK' | 'FEES' | 'TRANSPORT' | 'ADMISSIONS' | 'FRONTOFFICE' | 'AUTH' | 'SYSTEM';
export type AuditAction = 'CREATE' | 'READ' | 'UPDATE' | 'DELETE' | 'LOGIN' | 'LOGOUT' | 'ROLE_CHANGE' | 'PAYMENT' | 'GRADE' | 'CONVERT' | 'APPROVE';

export interface AuditEvent {
  id: string;
  tsISO: string;
  actorId: string;
  actorName: string;
  module: AuditModule;
  action: AuditAction;
  entityType?: string;
  entityId?: string;
  entityDisplay?: string;
  before?: any;
  after?: any;
  meta?: any;
  ip?: string;
  ua?: string;
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