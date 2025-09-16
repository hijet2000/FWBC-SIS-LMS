// types.ts

// --- CORE ---
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

// --- UI ---
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

export interface SchoolClass {
  id: string;
  name: string;
  teacherId: string;
}

// --- Academics ---
export interface Subject {
  id: string;
  name:string;
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

export type DayOfWeek = 'MON' | 'TUE' | 'WED' | 'THU' | 'FRI' | 'SAT' | 'SUN';

export interface TimetableEntry {
    id: string;
    subjectId: string;
    teacherId: string;
    classId: string;
    day: DayOfWeek;
    timeSlot: string; // e.g., "09:00-10:00"
}

// --- Attendance ---
export type AttendanceStatus = 'PRESENT' | 'ABSENT' | 'LATE' | 'EXCUSED';

export interface AttendanceRecord {
  id: string;
  studentId: string;
  sessionId: string;
  classId: string;
  date: string; // YYYY-MM-DD
  status: AttendanceStatus;
  minutesAttended?: number;
  createdAt: string; // ISO
}

export interface AttendanceEntry {
    studentId: string;
    status: AttendanceStatus;
    minutesAttended?: number;
}

export interface WeeklyEmailSettings {
    enabled: boolean;
    sendHour: number; // 0-23
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
  lineItems: { feeItemId: string; description: string; amount: number }[];
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
  ref?: string;
  paidAt: string; // YYYY-MM-DD
  note?: string;
}

// --- LMS ---
export interface Course {
    id: string;
    name: string;
    status: 'Open' | 'Closed' | 'Draft';
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
    correct: number[]; // indices of correct choices
}

export interface QuizAnswer {
    questionId: string;
    selected: number[]; // indices of selected choices
}

// --- Homework ---
export interface Homework {
    id: string;
    classId: string;
    subjectId: string;
    title: string;
    instructions: string;
    dueDate: string; // YYYY-MM-DD
    assignedAt: string; // ISO
    attachments?: { name: string; url: string }[];
    visibility: 'Published' | 'Draft';
    allowLateSubmissions: boolean;
    allowResubmission: boolean;
    maxAttachments?: number;
    allowedFileTypes?: string[];
    maxFileSizeMB?: number;
    maxAttempts?: number;
    stats?: HomeworkStats;
}

export type SubmissionStatus = 'On-time' | 'Late' | 'Not Submitted';

export interface Submission {
    id: string;
    homeworkId: string;
    studentId: string;
    status: SubmissionStatus;
    submittedAt?: string; // ISO
    text?: string;
    files?: { name: string; url: string }[];
    attemptNumber?: number;
    latePenaltyWaived?: boolean;
}

export interface Feedback {
    id: string;
    submissionId: string;
    score?: number;
    comments: string;
    returnedAt: string; // ISO
}

export interface EnrichedSubmission extends Submission {
    studentName: string;
    feedback?: Feedback;
}

export interface EnrichedHomeworkForStudent extends Homework {
    submission?: Submission & { feedback?: Feedback };
}

export interface HomeworkStats {
    totalStudents: number;
    submitted: number;
    onTime: number;
    late: number;
    notSubmitted: number;
    submissionRate: number;
}

export interface HomeworkDashboardStats {
    dueToday: number;
    overdueSubmissions: number;
    needsMarking: number;
}

export interface HomeworkAnalytics {
    submissionRate: number;
    onTimeRate: number;
    lateRate: number;
    averageScore: number | null;
    lateDistribution: { daysLate: number; count: number }[];
    totalSubmissions: number;
    markedCount: number;
}

export interface StudentWatchlistItem {
    studentId: string;
    studentName: string;
    lateCount: number;
    missedCount: number;
    lastIncidentDate: string;
}


// --- Admissions & Front Office ---
export type ApplicationStatus = 'New' | 'Screening' | 'DocsMissing' | 'Interview' | 'Offer' | 'Accepted' | 'Approved' | 'Rejected' | 'Waitlist' | 'Withdrawn';

export interface ApplicantDetails {
    fullName: string;
    dob: string;
    gender: 'Male' | 'Female' | 'Other';
    nationality: string;
    priorSchool?: string;
}
export interface GuardianDetails {
    name: string;
    relationship: string;
    phone: string;
    email: string;
    address: string;
}
export interface ApplicationDocument {
    type: 'BirthCertificate' | 'Photo' | 'ReportCard';
    fileName: string;
    url: string;
    verified: boolean;
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
  screeningChecklist: {
      ageEligibility: boolean;
      prerequisitesMet: boolean;
      catchmentArea: boolean;
  };
  interviewDetails: {
      scheduledAt?: string; // ISO
      interviewerId?: string;
      notes?: string;
  };
  decisionDetails: {
      offerExpiresAt?: string; // YYYY-MM-DD
      rejectionReason?: string;
  };
}

export interface SeatAllocation {
    classId: string;
    capacity: number;
    allocated: number;
}

export type EnquiryStatus = 'New' | 'Contacted' | 'Qualified' | 'Converted' | 'Closed';
export type EnquirySource = 'Web' | 'Call' | 'Walk-in' | 'Referral' | 'Social';

export interface Enquiry {
    id: string;
    name: string;
    phone?: string;
    email?: string;
    source: EnquirySource;
    status: EnquiryStatus;
    ownerUserId: string;
    targetClassId?: string;
    createdAt: string; // ISO
    notes?: string;
}

export interface FollowUp {
    id: string;
    enquiryId: string;
    ownerId: string;
    dueAt: string; // ISO
    doneAt?: string; // ISO
    method: 'Call' | 'Email' | 'Visit';
    summary: string;
    outcome?: string;
}

export interface VisitorLog {
    id: string;
    name: string;
    company?: string;
    purpose: string;
    timeIn: string; // ISO
    timeOut?: string; // ISO
    hostUserId?: string;
    badgeNo: string;
    isOverstay?: boolean;
    isUnresolved?: boolean;
}

export type CallDirection = 'Inbound' | 'Outbound';
export type CallTopic = 'Enquiry' | 'Complaint' | 'Attendance' | 'Fees' | 'Safeguarding' | 'Other';
export type CallStatus = 'Open' | 'Closed';

export interface CallLog {
    id: string;
    direction: CallDirection;
    callerName: string;
    number: string;
    topic: CallTopic;
    status: CallStatus;
    notes: string;
    callAt: string; // ISO
    ownerUserId?: string;
    linkedEntity?: { type: 'Student' | 'Enquiry'; id: string; name: string; };
}

export type PostalDirection = 'Incoming' | 'Outgoing';
export type PostalStatus = 'Received' | 'Handed Over' | 'Dispatched' | 'Delivered';

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
    attachments?: { name: string, url: string }[];
}

export interface Handover {
    id: string;
    postalId: string;
    fromUserId: string;
    toUserId: string;
    handedAt: string; // ISO
}

export interface PublicApplicationView {
    applicantName: string;
    status: ApplicationStatus;
    nextSteps: string;
    interviewDetails: Application['interviewDetails'];
    missingDocuments: ApplicationDocument['type'][];
}

export interface OnlineAdmissionsSettings {
    acceptingNewApplications: boolean;
    message: string;
}

export interface CommunicationTemplate {
    id: string;
    name: string;
    subject: string;
    body: string;
}

export interface CsvValidationError {
    rowIndex: number;
    field: string;
    message: string;
}

// --- Transport ---
export interface Vehicle {
  id: string;
  regNo: string;
  make: string;
  model: string;
  capacity: number;
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

export type TripStatus = 'Planned' | 'In Progress' | 'Completed' | 'Cancelled';

export interface Trip {
    id: string;
    date: string; // YYYY-MM-DD
    vehicleId: string;
    driverId: string;
    routeId: string;
    startTime?: string; // HH:mm
    endTime?: string; // HH:mm
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
    alertSent: boolean;
    deviceId?: string;
}

export interface AlertSettings {
    enabled: boolean;
    onPickup: boolean;
    onDropoff: boolean;
}

// --- Admin & Security ---
export type AuditModule = 'AUTH' | 'STUDENTS' | 'ACADEMICS' | 'ATTENDANCE' | 'FEES' | 'LMS' | 'HOMEWORK' | 'TRANSPORT' | 'SYSTEM' | 'ADMISSIONS' | 'FRONTOFFICE' | 'LIBRARY' | 'ROLES' | 'HOSTEL';
export type AuditAction = 'LOGIN' | 'LOGOUT' | 'CREATE' | 'UPDATE' | 'DELETE' | 'PAYMENT' | 'ROLE_CHANGE' | 'CONVERT' | 'APPROVE' | 'GRADE';

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

export interface Role {
    id: string;
    name: string;
    description: string;
    scopes: string[];
}

export interface Permission {
    scope: string;
    label: string;
    description: string;
}

export interface PermissionGroup {
    module: string;
    permissions: Permission[];
}

// --- Library ---
export interface Book {
    id: string;
    title: string;
    author: string;
    isbn?: string;
    category?: string;
    language: string;
    copies: BookCopy[];
}

export type CopyStatus = 'Available' | 'On Loan' | 'Damaged' | 'Lost' | 'Maintenance';

export interface BookCopy {
    id: string;
    bookId: string;
    barcode: string;
    rack?: string;
    shelf?: string;
    status: CopyStatus;
}

export type MemberType = 'Student' | 'Teacher';

export interface LibraryMember {
    id: string;
    name: string;
    memberType: MemberType;
    barcode: string;
    maxConcurrentLoans: number;
}

export interface LibraryPolicy {
    memberType: MemberType;
    loanDays: number;
    maxRenewals: number;
    maxConcurrentLoans: number;
    graceDays: number;
    finePerDay: number;
    lostReplacementFee: number;
}

export interface Loan {
    id: string;
    copyId: string;
    memberId: string;
    issuedAt: string; // ISO
    dueAt: string; // YYYY-MM-DD
    returnedAt?: string; // ISO
    renewals: number;
}

export interface EnrichedLoan extends Loan {
    bookTitle: string;
    bookAuthor: string;
    copyBarcode: string;
    memberName: string;
    fine: number;
}

// --- Hostel ---
export interface Hostel {
    id: string;
    name: string;
    type: 'Boys' | 'Girls';
}

export interface HostelFloor {
    id: string;
    hostelId: string;
    name: string; // e.g., 'Ground Floor', 'First Floor'
}

export interface HostelRoom {
    id: string;
    floorId: string;
    name: string; // e.g., '101', '102'
    capacity: number;
    roomType: 'Standard' | 'Premium' | 'Accessible';
}

export type BedStatus = 'Available' | 'Occupied' | 'Blocked';

export interface Bed {
    id: string;
    roomId: string;
    name: string; // e.g., 'A', 'B'
    status: BedStatus;
}

export interface Allocation {
    id: string;
    studentId: string;
    bedId: string;
    checkInDate: string; // YYYY-MM-DD
    checkOutDate?: string; // YYYY-MM-DD
    notes?: string;
}

export interface HostelVisitor {
    id: string;
    studentId: string; // The student being visited
    visitorName: string;
    relationship: string;
    timeIn: string; // ISO
    timeOut?: string; // ISO
}

export interface CurfewCheck {
    id: string;
    date: string; // YYYY-MM-DD
    studentId: string;
    status: 'Present' | 'Absent';
    notes?: string;
    checkedByUserId: string;
}

export interface CurfewException {
    id: string;
    studentId: string;
    fromDate: string; // YYYY-MM-DD
    toDate: string; // YYYY-MM-DD
    reason: string;
    approvedByUserId: string;
}
