
import React from 'react';

// --- Core Types ---

export interface User {
  id: string;
  name: string;
  role: string;
  scopes: string[];
  studentId?: string; // For parent portal
  alumniId?: string; // For alumni portal
}

export interface AuthContextType {
  user: User | null;
  loading: boolean;
  setUser: React.Dispatch<React.SetStateAction<User | null>>;
}

// --- Task Management Types ---
export interface Task {
  id: string;
  title: string;
  dueDate: string; // YYYY-MM-DD
  completed: boolean;
  createdAt: string; // ISO String
  ownerId: string;
}

// --- SIS (Student Information System) Types ---

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
  gender: 'Male' | 'Female' | 'Other';
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

// --- Attendance Types ---

export type AttendanceStatus = 'PRESENT' | 'ABSENT' | 'LATE' | 'EXCUSED';

export interface AttendanceEntry {
  studentId: string;
  status: AttendanceStatus;
  minutesAttended?: number;
}

export interface AttendanceRecord {
    id: string;
    studentId: string;
    sessionId: string;
    classId: string;
    date: string; // YYYY-MM-DD
    status: AttendanceStatus;
    minutesAttended?: number;
    createdAt: string; // ISO String
}

export interface WeeklyEmailSettings {
    enabled: boolean;
    sendHour: number; // 0-23
}


// --- Academics Types ---

export type DayOfWeek = 'MON' | 'TUE' | 'WED' | 'THU' | 'FRI';

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

export interface TimetableEntry {
    id: string;
    subjectId: string;
    teacherId: string;
    classId: string;
    day: DayOfWeek;
    timeSlot: string; // e.g., "09:00-10:00"
}

// --- Online Exams Types ---
export type OnlineExamStatus = 'Draft' | 'Published' | 'Archived';
export type ExamQuestionType = 'multiple-choice' | 'true-false';

export interface OnlineExamConfig {
    lockdownMode: boolean; // Prevents tab switching
    timePerQuestionSec?: number; // Optional time limit per question in seconds
    // List of question IDs from the central bank that are active for this exam.
    questionIds: string[]; 
}

export interface OnlineExam {
    id: string;
    title: string;
    subjectId: string;
    classId: string;
    instructions: string;
    durationMinutes: number;
    startTime: string; // ISO String for start of window
    endTime: string; // ISO String for end of window
    status: OnlineExamStatus;
    totalMarks: number;
    config: OnlineExamConfig;
    resultsPublishedAt?: string | null; // null = not published. ISO String = published.
}

export interface Question {
    id: string;
    subjectId: string;
    questionText: string;
    type: ExamQuestionType;
    // For 'multiple-choice', this will be an array of strings.
    // For 'true-false', this will be ['True', 'False'].
    options: string[];
    // For 'multiple-choice', this is the index of the correct option.
    // For 'true-false', this will be 0 for True, 1 for False.
    correctOptionIndex: number;
    marks: number;
}

export interface StudentExamSubmission {
    id: string;
    examId: string;
    studentId: string;
    startedAt: string; // ISO String
    submittedAt?: string; // ISO String
    answers: Map<string, number>; // questionId -> selectedOptionIndex
    score?: number;
    status: 'InProgress' | 'Submitted';
}

// --- Live Classes Types ---
export type LiveClassStatus = 'Scheduled' | 'Live' | 'Finished' | 'Cancelled';
export type IntegrationProvider = 'SelfHosted' | 'Zoom' | 'Google Meet';

export interface LiveClass {
    id: string;
    topic: string;
    classId: string;
    subjectId: string;
    teacherId: string;
    startTime: string; // ISO String
    durationMinutes: number;
    status: LiveClassStatus;
    joinUrl: string;
    meetingId?: string;
    recordedUrl?: string;
}

export interface LiveClassIntegrationSettings {
    provider: IntegrationProvider;
    enabled: boolean;
    apiKey?: string;
    apiSecret?: string;
    autoRecord?: boolean; // Automatically record all sessions
    autoPublishRecording?: boolean; // If recorded, automatically add to catch-up module
}

export interface LiveClassAttendance {
    id: string;
    liveClassId: string;
    studentId: string;
    joinedAt: string; // ISO String
    leftAt?: string; // ISO String
    durationAttendedMinutes: number;
}

export interface LiveClassParticipant {
    id: string;
    name: string;
    isHost: boolean;
}


// --- LMS (Learning Management System) Types ---

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

// --- Catch-up Module Types ---

export interface CatchupItem {
    id: string;
    title: string;
    subjectId: string;
    classId: string;
    kind: 'VIDEO'; // Expand if other kinds are added
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
    correct: number[];
}

export interface QuizAnswer {
    questionId: string;
    selected: number[];
}

// --- Homework Types ---

export type SubmissionStatus = 'On-time' | 'Late' | 'Not Submitted';

export interface HomeworkPolicy {
    lateGraceMinutes: number;
    latePenaltyPct: number;
    maxSubmissions: number;
}

export interface HomeworkAttachment {
    id: string;
    fileName: string;
    resourceId: string;
}

export interface Homework {
    id: string;
    classId: string;
    subjectId: string;
    title: string;
    instructions: string;
    dueDate: string; // YYYY-MM-DD
    assignedAt: string; // ISO String
    policy: HomeworkPolicy;
    status: 'Published' | 'Archived';
    attachments: HomeworkAttachment[];
}

export interface Submission {
    id: string;
    homeworkId: string;
    studentId: string;
    status: SubmissionStatus;
    submittedAt?: string; // ISO String
    submissionText?: string;
    submissionCount: number;
    attachments: HomeworkAttachment[];
}

export interface Feedback {
    id: string;
    submissionId: string;
    score?: number;
    comments: string;
    returnedAt: string; // ISO String
    meta?: {
        originalScore?: number;
        penaltyPctApplied?: number;
    };
}

export interface HomeworkNotificationSettings {
    enabled: boolean;
    triggers: {
        onPublish: boolean;
        preDueReminder: boolean;
        onOverdue: boolean;
        onFeedback: boolean;
    };
    reminderDaysBefore: number;
    quietHours: {
        start: number;
        end: number;
    };
    throttling: {
        maxPerHour: number;
    };
}


// --- Admissions & Front Office Types ---

export type ApplicationStatus = 'New' | 'Screening' | 'DocsMissing' | 'Interview' | 'Offer' | 'Accepted' | 'Approved' | 'Rejected' | 'Waitlist' | 'Withdrawn';
export type EnquiryStatus = 'New' | 'Contacted' | 'Qualified' | 'Converted' | 'Closed';
export type EnquirySource = 'Web' | 'Call' | 'Walk-in' | 'Referral' | 'Social';
export type CallDirection = 'Inbound' | 'Outbound';
export type CallTopic = 'Enquiry' | 'Complaint' | 'Attendance' | 'Fees' | 'Safeguarding' | 'Other';
export type CallStatus = 'Open' | 'Closed';
export type PostalDirection = 'Incoming' | 'Outgoing';

export interface ApplicantDetails {
    fullName: string;
    dob: string; // YYYY-MM-DD
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
    type: string;
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
    submittedAt: string; // ISO String
    applicantDetails: ApplicantDetails;
    guardians: GuardianDetails[];
    documents: ApplicationDocument[];
    screeningChecklist: {
        ageEligibility: boolean;
        prerequisitesMet: boolean;
        catchmentArea: boolean;
    };
    interviewDetails: {
        scheduledAt?: string; // ISO String
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
    pendingOffers: number;
    waitlisted: number;
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
    createdAt: string; // ISO String
    notes?: string;
}

export interface FollowUp {
    id: string;
    enquiryId: string;
    ownerId: string;
    dueAt: string; // ISO String
    doneAt?: string; // ISO String
    method: 'Call' | 'Email' | 'Visit';
    summary: string;
    outcome?: string;
}

export interface VisitorLog {
    id: string;
    name: string;
    company?: string;
    purpose: string;
    timeIn: string; // ISO String
    timeOut?: string; // ISO String
    hostUserId?: string;
    badgeNo: string;
    isUnresolved?: boolean;
    isOverstay?: boolean;
}

export interface CallLog {
    id: string;
    direction: CallDirection;
    callerName?: string;
    number?: string;
    topic: CallTopic;
    status: CallStatus;
    notes: string;
    callAt: string; // ISO String
    ownerUserId?: string;
    linkedEntity?: {
        type: 'Enquiry' | 'Student';
        id: string;
        name: string;
    };
}

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
    status: 'Received' | 'Dispatched' | 'Handed Over';
    attachments?: { name: string; url: string }[];
}

export interface Handover {
    id: string;
    postalId: string;
    fromUserId: string;
    toUserId: string;
    handedAt: string; // ISO String
}

export interface CsvValidationError {
    rowIndex: number;
    field: string;
    message: string;
}

export interface PublicApplicationView {
    applicantName: string;
    status: ApplicationStatus;
    nextSteps: string;
    interviewDetails?: { scheduledAt?: string };
    missingDocuments: string[];
}


// --- Fees Types ---

export type FeeFrequency = 'Once' | 'Monthly' | 'Termly' | 'Annually';
export type PaymentMethod = 'Cash' | 'Card' | 'Bank' | 'Mobile';
export type InvoiceStatus = 'Paid' | 'Partial' | 'Unpaid' | 'Overdue';

export interface FeeItem {
    id: string;
    name: string;
    code?: string;
    amount: number;
    frequency: FeeFrequency;
    active: boolean;
}

export interface InvoiceLineItem {
    feeItemId: string;
    description: string;
    amount: number;
}

export interface Invoice {
    id: string;
    invoiceNo: string;
    studentId: string;
    classId: string;
    issuedAt: string; // YYYY-MM-DD
    dueAt: string; // YYYY-MM-DD
    lineItems: InvoiceLineItem[];
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


// --- Transport Types ---

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

export interface EligibleStudent {
    id: string;
    name: string;
    admissionNo: string;
    transportRouteId: string;
    pickupStopId: string;
    dropoffStopId: string;
    guardianPhone: string;
}

export type TripStatus = 'Planned' | 'In Progress' | 'Completed' | 'Cancelled';

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

// --- Hostel Types ---
export type HostelType = 'Boys' | 'Girls' | 'Mixed' | 'Staff';
export type BedStatus = 'Available' | 'Occupied' | 'Blocked';
export type AllocationStatus = 'Scheduled' | 'CheckedIn' | 'CheckedOut';
export type CurfewStatus = 'In' | 'Late' | 'Absent';
export type GenderRule = 'Enforce' | 'Warn';

export interface Hostel {
    id: string;
    name: string;
    type: HostelType;
    wardenId?: string;
}

export interface Room {
    id: string;
    hostelId: string;
    roomNumber: string;
    capacity: number;
    floor?: string;
}

export interface Bed {
    id: string;
    roomId: string;
    bedIdentifier: string;
    status: BedStatus;
}

export interface Allocation {
    id: string;
    studentId: string;
    bedId: string;
    roomId: string;
    hostelId: string;
    status: AllocationStatus;
    checkInDate: string; // YYYY-MM-DD
    checkOutDate?: string; // YYYY-MM-DD
    checkOutReason?: string;
    depositNotes?: string;
}

export interface HostelDashboardSummary {
    kpis: {
        totalCapacity: number;
        totalOccupied: number;
        occupancyRate: number;
        totalAvailable: number;
    };
    occupancyByHostel: {
        id: string; name: string; type: HostelType;
        capacity: number; occupied: number; available: number; blocked: number;
    }[];
    alerts: {
        overcapacityRooms: { roomNumber: string; hostelName: string; capacity: number; occupied: number; }[];
        totalBlockedBeds: number;
    };
}

export interface HostelVisitor {
    id: string;
    visitorName: string;
    studentId: string;
    relation: string;
    idChecked: boolean;
    timeIn: string; // ISO String
    timeOut?: string; // ISO String
    isOverstay?: boolean;
}

export interface Curfew {
    id: string;
    date: string; // YYYY-MM-DD
    time: string; // HH:MM
}

export interface CurfewRecord {
    id: string;
    curfewId: string;
    studentId: string;
    status: CurfewStatus;
    notes?: string;
}

export interface CurfewSettings {
    alertsEnabled: boolean;
}

export interface HostelSettings {
    curfewTime: string; // HH:MM
    lateThresholdMin: number;
    genderRule: GenderRule;
    maxVisitorsPerDay: number;
    idRequiredForVisitors: boolean;
}

// FIX: Added HostelWithRoomsAndBeds and RoomWithBeds types
export interface RoomWithBeds extends Room {
    beds: Bed[];
}
export interface HostelWithRoomsAndBeds extends Hostel {
    rooms: RoomWithBeds[];
}

// --- Admin & Settings ---
// FIX: Added 'FINANCE' and 'TASKS' to AuditModule type
export type AuditModule = 'AUTH' | 'STUDENTS' | 'ATTENDANCE' | 'FEES' | 'ACADEMICS' | 'SETTINGS' | 'SYSTEM' | 'TRANSPORT' | 'LIBRARY' | 'HOSTEL' | 'INVENTORY' | 'ASSETS' | 'HR' | 'PAYROLL' | 'ALUMNI' | 'CMS' | 'CERTIFICATES' | 'ADMISSIONS' | 'FRONTOFFICE' | 'HOMEWORK' | 'LIVE_CLASS' | 'ONLINE_EXAMS' | 'FINANCE' | 'TASKS';
// FIX: Added 'GRADE' to AuditAction type
export type AuditAction = 'LOGIN' | 'LOGOUT' | 'CREATE' | 'UPDATE' | 'DELETE' | 'PAYMENT' | 'ROLE_CHANGE' | 'APPROVE' | 'REVOKE' | 'ISSUE' | 'RETURN' | 'RENEW' | 'NOTIFY' | 'ARCHIVE' | 'REQUEST' | 'CONVERT' | 'MENU_UPDATE' | 'MEDIA_UPLOAD' | 'PUBLISH' | 'UNPUBLISH' | 'RUN_PAYROLL' | 'START_EXAM' | 'SUBMIT_EXAM' | 'GRADE';

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

export type ToastType = 'success' | 'error' | 'warning' | 'info';
export interface ToastMessage {
  id: number;
  message: string;
  type: ToastType;
}
export interface ToastContextType {
  addToast: (message: string, type: ToastType) => void;
}

export interface Holiday {
    id: string;
    name: string;
    date: string; // YYYY-MM-DD
}

export interface ModuleConfig {
    enabled: boolean;
    name: string;
    description: string;
}
export type ModuleSettings = Record<string, ModuleConfig>;

export interface BrandingSettings {
    siteTitle: string;
    primaryColor: string;
    logoUrl: string;
}

export interface LocaleSettings {
    language: 'en-GB' | 'en-US';
    timezone: string;
    dateFormat: 'DD/MM/YYYY' | 'MM/DD/YYYY';
    timeFormat: '12h' | '24h';
}

export interface TenantSettings {
    branding: BrandingSettings;
    locale: LocaleSettings;
    modules: ModuleSettings;
}

// --- Library Types ---
export type BookCopyStatus = 'Available' | 'On Loan' | 'Reserved' | 'Maintenance' | 'Lost';
export type MemberType = 'Student' | 'Staff';

export interface Book {
    id: string;
    isbn?: string;
    title: string;
    author: string;
    category?: string;
    publisher?: string;
    publishedYear?: number;
}

export interface BookCopy {
    id: string;
    bookId: string;
    barcode: string;
    status: BookCopyStatus;
    rack?: string;
    shelf?: string;
    condition?: 'New' | 'Good' | 'Fair' | 'Poor';
}

export interface LibraryMember {
    id: string; // Corresponds to Student or Teacher ID
    type: MemberType;
    barcode: string;
    active: boolean;
}

export interface PotentialMember {
    id: string;
    name: string;
    type: MemberType;
    isMember: boolean;
    libraryMemberId?: string;
}

export interface Loan {
    id: string;
    copyId: string;
    memberId: string;
    issuedAt: string; // ISO String
    dueAt: string; // ISO String
    returnedAt?: string; // ISO String
    renewals?: number;
    fineIncurred?: number;
}

export interface LoanPolicy {
    loanDays: number;
    maxRenewals: number;
    graceDays: number;
    finePerDay: number;
}

export interface MemberTypePolicy {
    type: MemberType;
    maxConcurrentLoans: number;
}

export interface LibrarySettings {
    loanPolicy: LoanPolicy;
    memberTypePolicies: MemberTypePolicy[];
    taxonomy: {
        racks: string[];
        shelves: string[];
    };
    labelFormats: {
        bookBarcode: string;
        memberBarcode: string;
    };
    fineRounding: 'nearest_0.5' | 'up' | 'down';
}

export interface BookWithCopies extends Book {
    copies: BookCopy[];
}

export interface MemberLoanDetails extends Loan {
    bookTitle: string;
    bookAuthor: string;
    copyBarcode: string;
}
export interface MemberDetails {
    member: LibraryMember;
    user: { id: string, name: string, type: 'Student' | 'Staff' };
    currentLoans: MemberLoanDetails[];
    loanHistory: MemberLoanDetails[];
    totalFines: number;
}

export interface OverdueLoanDetails extends Loan {
    memberName: string;
    memberType: MemberType;
    bookTitle: string;
    copyBarcode: string;
    daysOverdue: number;
}

export interface CirculationStats {
    topTitles: { title: string; count: number }[];
    topCategories: { category: string; count: number }[];
    loansLast30Days: number;
    totalLoans: number;
}

export interface CirculationDetails {
    member?: (LibraryMember & { name: string; maxConcurrentLoans?: number; });
    book?: Book;
    copy?: BookCopy;
    loan?: Loan;
    policyViolations: string[];
};

// --- Inventory Types ---
export type ItemUnit = 'Pcs' | 'Box' | 'Kg' | 'Litre' | 'Set' | 'Other';
export type StockTransactionType = 'IN' | 'OUT' | 'ADJUST' | 'RETURN';
export type IssueRequestStatus = 'Pending' | 'Approved' | 'Rejected' | 'Fulfilled' | 'Cancelled';
export type AssetStatus = 'In Stock' | 'Assigned' | 'In Repair' | 'Lost' | 'Disposed';
export type AssetLocationType = 'Teacher' | 'Classroom' | 'Location';
export type StockEntity = 'Class' | 'Teacher' | 'Room';

export interface InventoryItem {
    id: string;
    name: string;
    sku: string;
    unit: ItemUnit;
    category: string;
    reorderLevel: number;
    reorderQty: number;
    location?: string;
    trackAsset: boolean;
    photoUrl?: string;
    active: boolean;
}

export interface Supplier {
    id: string;
    name: string;
    contactPerson?: string;
    phone?: string;
    email?: string;
    address?: string;
    active: boolean;
}

export interface StockTransaction {
    id: string;
    itemId: string;
    type: StockTransactionType;
    quantity: number; // Positive for IN/RETURN, negative for OUT/ADJUST
    unitCost?: number;
    supplierId?: string;
    toEntityType?: StockEntity;
    toEntityId?: string;
    reason?: string;
    ref?: string;
    createdAt: string; // ISO String
    actorId: string;
}

export interface IssueRequest {
    id: string;
    itemId: string;
    quantity: number;
    requesterId: string; // Teacher/Staff ID
    status: IssueRequestStatus;
    requestedAt: string; // ISO String
    approvedAt?: string;
    approverId?: string;
    notes?: string;
}

export interface AssetHistoryLog {
    timestamp: string; // ISO String
    status: AssetStatus;
    locationType?: AssetLocationType;
    locationId?: string;
    actorId: string;
    notes?: string;
}

export interface Asset {
    id: string; // e.g., ASSET-00001
    itemId: string;
    serialNumber?: string;
    status: AssetStatus;
    assignedToType?: AssetLocationType;
    assignedToId?: string;
    assignedToName?: string;
    history: AssetHistoryLog[];
}

// --- CMS Types ---
export type PageStatus = 'Draft' | 'InReview' | 'Published' | 'Archived';
export type CmsPostType = 'News' | 'Event';
export type BlockType = 'text' | 'image' | 'video' | 'quote';
export type MenuItemType = 'page' | 'url';

export interface SeoData {
    title: string;
    description: string;
    keywords: string;
}

export interface PageBlock {
    id: string;
    type: BlockType;
    order: number;
    content: any; // e.g., { text: '...' } or { mediaId: '...', caption: '...' }
}

export interface CmsPage {
    id: string;
    title: string;
    slug: string;
    status: PageStatus;
    authorId: string;
    createdAt: string; // ISO String
    updatedAt: string; // ISO String
    publishedAt?: string; // ISO String
    currentVersion: number;
    seo: SeoData;
    blocks: PageBlock[];
    versions: any[]; // Placeholder for version history
}

export interface CmsPost {
    id: string;
    postType: CmsPostType;
    title: string;
    slug: string;
    status: PageStatus;
    authorId: string;
    createdAt: string; // ISO String
    updatedAt: string; // ISO String
    publishedAt?: string; // ISO String
    seo: SeoData;
    excerpt: string;
    content: string;
    featuredImageId?: string;
    // Event-specific fields
    eventDate?: string; // YYYY-MM-DD
    eventTime?: string; // HH:MM
    eventLocation?: string;
}

export interface MediaAsset {
    id: string;
    fileName: string;
    mimeType: string;
    sizeBytes: number;
    url: string;
    altText?: string;
    uploadedAt: string; // ISO String
    uploadedBy: string;
}

export interface MenuItem {
    id: string;
    label: string;
    type: MenuItemType;
    value: string; // slug for page, URL for url
    order: number;
    children: MenuItem[];
}

export interface Menu {
    id: string;
    name: string;
    items: MenuItem[];
}

export interface WebsiteSettings {
    siteTitle: string;
    primaryColor: string;
    logoUrl: string;
}

// --- Certificates Types ---
export type CertificateType = 'ID_CARD' | 'CERTIFICATE';
export type CertificateStatus = 'Valid' | 'Revoked' | 'Expired';

export interface CertificateLayer {
    // ... define properties for design layers if needed
}

export interface CertificateTemplate {
    id: string;
    name: string;
    type: CertificateType;
    widthMm: number;
    heightMm: number;
    frontLayers: CertificateLayer[];
    backLayers: CertificateLayer[];
}

export interface IssuedCertificate {
    id: string;
    serialNo: string;
    qrToken: string;
    templateId: string;
    holderId: string; // Student ID
    holderName: string;
    status: CertificateStatus;
    issuedAt: string; // ISO String
    expiresAt?: string; // ISO String
    revokedAt?: string; // ISO String
    revocationReason?: string;
}

// --- Finance Types ---
export type TransactionType = 'INCOME' | 'EXPENSE';

export interface FinanceCategory {
    id: string;
    name: string;
    type: TransactionType;
}

export interface Payee {
    id: string;
    name: string;
    type: 'Staff' | 'Vendor' | 'Other';
    contact?: string;
}

export interface LedgerEntry {
    id: string;
    date: string; // YYYY-MM-DD
    categoryId: string;
    payeeId?: string;
    description: string;
    amount: number;
    type: TransactionType;
    refNo?: string;
    actorId: string;
    createdAt: string; // ISO String
    isReversal: boolean;
    reversalOf?: string;
}

export interface FinancialPeriod {
    id: string; // e.g., 2025-08
    month: number;
    year: number;
    status: 'Open' | 'Closed';
    closingBalance?: number;
    closedBy?: string;
    closedAt?: string; // ISO String
}

// --- Alumni Types ---
export interface Alumni {
    id: string;
    studentId: string;
    name: string;
    graduationYear: number;
    degree?: string;
    profession?: string;
    company?: string;
    contact: {
        email: string;
        phone?: string;
        linkedin?: string;
    };
    privacy: {
        profilePublic: boolean;
        contactPublic: boolean;
        mentorshipOptIn: boolean;
    };
}

export interface AlumniEvent {
    id: string;
    title: string;
    date: string; // ISO String
    location: string;
    description: string;
}

export interface Donation {
    id: string;
    alumniId: string;
    amount: number;
    date: string; // YYYY-MM-DD
    campaign?: string;
    isAnonymous: boolean;
}

// --- HR & Payroll Types ---
export type EmployeeStatus = 'Active' | 'On Leave' | 'Terminated';
export type LeaveStatus = 'Pending' | 'Approved' | 'Rejected';

export interface Employee {
    id: string;
    staffId: string;
    fullName: string;
    role: string;
    department: string;
    status: EmployeeStatus;
    contract: {
        type: 'Full-time' | 'Part-time' | 'Contract';
        startDate: string; // YYYY-MM-DD
        endDate?: string;
    };
    contact: {
        email: string;
        phone?: string;
    };
    payroll: {
        basicSalary: number; // Annually
        allowances: { name: string; amount: number }[];
    };
}

export interface LeaveApplication {
    id: string;
    employeeId: string;
    leaveType: 'Annual' | 'Sick' | 'Maternity' | 'Unpaid' | 'Other';
    startDate: string; // YYYY-MM-DD
    endDate: string; // YYYY-MM-DD
    reason: string;
    status: LeaveStatus;
    requestedAt: string; // ISO String
    reviewedAt?: string;
    reviewedBy?: string;
}

export interface Payslip {
    id: string;
    employeeId: string;
    period: string; // e.g., 2025-08
    grossSalary: number;
    deductions: { name: string; amount: number }[];
    netSalary: number;
    generatedAt: string; // ISO String
}
