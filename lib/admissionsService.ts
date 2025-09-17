import type { Application, ApplicationStatus, Enquiry, EnquiryStatus, FollowUp, VisitorLog, CallLog, Postal, Handover, User, SeatAllocation, CallDirection, CallTopic, PublicApplicationView, OnlineAdmissionsSettings, CommunicationTemplate } from '../types';
import { logAuditEvent } from './auditService';
import { createStudentFromApplication } from './schoolService';

// --- MOCK DATA STORE ---
const getISODateMinutesAgo = (minutes: number): string => {
    const date = new Date();
    date.setMinutes(date.getMinutes() - minutes);
    return date.toISOString();
};

let MOCK_APPLICATIONS: Application[] = [
    { id: 'app-1', enquiryId: 'enq-1', applicantName: 'John Doe', desiredClassId: 'c1', intakeSession: '2025-2026', status: 'Offer', submittedAt: getISODateMinutesAgo(1440), applicantDetails: { fullName: 'John Doe', dob: '2018-05-20', gender: 'Male', nationality: 'British', priorSchool: 'Little Sprouts Nursery' }, guardians: [{ name: 'Jane Doe', relationship: 'Mother', phone: '555-1234', email: 'jane.doe@example.com', address: '123 Fake St' }], documents: [{ type: 'BirthCertificate', fileName: 'jd_bc.pdf', url: '#', verified: true }], screeningChecklist: { ageEligibility: true, prerequisitesMet: true, catchmentArea: true }, interviewDetails: {}, decisionDetails: { offerExpiresAt: '2025-09-15' } },
    { id: 'app-2', applicantName: 'Samantha Smith', desiredClassId: 'c2', intakeSession: '2025-2026', status: 'Accepted', submittedAt: getISODateMinutesAgo(2880), applicantDetails: { fullName: 'Samantha Smith', dob: '2017-02-15', gender: 'Female', nationality: 'American', priorSchool: 'Oak Tree Primary' }, guardians: [{ name: 'Mark Smith', relationship: 'Father', phone: '555-5678', email: 'mark.smith@example.com', address: '456 Main St' }], documents: [], screeningChecklist: { ageEligibility: true, prerequisitesMet: true, catchmentArea: true }, interviewDetails: { scheduledAt: getISODateMinutesAgo(1440), interviewerId: 't-1', notes: 'Very bright candidate.' }, decisionDetails: { offerExpiresAt: '2025-09-10' } },
    { id: 'app-3', enquiryId: 'enq-2', applicantName: 'Chen Wei', desiredClassId: 'c1', intakeSession: '2025-2026', status: 'Approved', submittedAt: getISODateMinutesAgo(10080), applicantDetails: { fullName: 'Chen Wei', dob: '2018-08-10', gender: 'Male', nationality: 'Singaporean', priorSchool: 'Global Tots' }, guardians: [{ name: 'Li Wei', relationship: 'Father', phone: '555-8765', email: 'li.wei@example.com', address: '789 Orchard Rd' }], documents: [], screeningChecklist: { ageEligibility: true, prerequisitesMet: true, catchmentArea: true }, interviewDetails: {}, decisionDetails: {} },
    { id: 'app-4', applicantName: 'Isabella Rossi', desiredClassId: 'c1', intakeSession: '2025-2026', status: 'Screening', submittedAt: getISODateMinutesAgo(500), applicantDetails: { fullName: 'Isabella Rossi', dob: '2018-01-01', gender: 'Female', nationality: 'Italian', priorSchool: 'Bambini Felici' }, guardians: [{ name: 'Marco Rossi', relationship: 'Father', phone: '555-1122', email: 'marco.rossi@example.com', address: '1 Villa Borghese' }], documents: [], screeningChecklist: { ageEligibility: false, prerequisitesMet: false, catchmentArea: false }, interviewDetails: {}, decisionDetails: {} },
];

let MOCK_SEAT_ALLOCATIONS: SeatAllocation[] = [
    { classId: 'c1', capacity: 20, allocated: 5 },
    { classId: 'c2', capacity: 25, allocated: 18 },
    { classId: 'c3', capacity: 15, allocated: 12 },
    { classId: 'c4', capacity: 15, allocated: 16 }, // Over capacity example
];

let MOCK_ENQUIRIES: Enquiry[] = [
    { id: 'enq-1', name: 'Jane Doe (for John)', phone: '555-1234', source: 'Web', status: 'Converted', ownerUserId: 'user-evelyn-reed', targetClassId: 'c1', createdAt: getISODateMinutesAgo(2000) },
    { id: 'enq-2', name: 'Li Wei (for Chen)', email: 'li.wei@example.com', source: 'Referral', status: 'Converted', ownerUserId: 'user-evelyn-reed', targetClassId: 'c1', createdAt: getISODateMinutesAgo(11000) },
];
// FIX: Add mock data for Front Office features
let MOCK_FOLLOW_UPS: FollowUp[] = [
    { id: 'fu-1', enquiryId: 'enq-1', ownerId: 'user-evelyn-reed', dueAt: getISODateMinutesAgo(-1440), doneAt: getISODateMinutesAgo(-1430), method: 'Call', summary: 'Initial follow-up call', outcome: 'Scheduled a tour' },
    { id: 'fu-2', enquiryId: 'enq-1', ownerId: 'user-evelyn-reed', dueAt: getISODateMinutesAgo(-100), method: 'Email', summary: 'Send information packet' },
];

let MOCK_VISITOR_LOGS: VisitorLog[] = [
    { id: 'vis-1', name: 'Mark Smith', company: 'Self-Employed', purpose: 'Parent Tour', timeIn: getISODateMinutesAgo(120), timeOut: getISODateMinutesAgo(60), hostUserId: 'user-evelyn-reed', badgeNo: 'B12345' },
    { id: 'vis-2', name: 'Contractor Dave', company: 'ABC Plumbing', purpose: 'Maintenance', timeIn: getISODateMinutesAgo(30), badgeNo: 'B12346' },
    { id: 'vis-3', name: 'Previous Day Visitor', company: 'Courier', purpose: 'Delivery', timeIn: getISODateMinutesAgo(1500), isUnresolved: true, badgeNo: 'B11111' },
];

let MOCK_CALL_LOGS: CallLog[] = [
    { id: 'call-1', direction: 'Inbound', callerName: 'Jane Doe', number: '555-1234', topic: 'Enquiry', status: 'Closed', notes: 'Enquired about Form 1 for John Doe. Directed to online application form.', callAt: getISODateMinutesAgo(2100), ownerUserId: 'user-evelyn-reed', linkedEntity: { type: 'Enquiry', id: 'enq-1', name: 'Jane Doe (for John)' } },
    // FIX: Added missing 'callerName' property to satisfy the CallLog type.
    { id: 'call-2', direction: 'Outbound', callerName: 'Mr. Rodriguez (Guardian)', number: '555-8765', topic: 'Attendance', status: 'Open', notes: 'Called about repeated absences. Left voicemail.', callAt: getISODateMinutesAgo(20), ownerUserId: 'user-evelyn-reed' },
];

let MOCK_POSTAL_ITEMS: Postal[] = [
    { id: 'post-1', direction: 'Incoming', date: '2025-08-20', subject: 'Exam Results from Oak Tree Primary', sender: 'Oak Tree Primary', recipient: 'Admissions Office', confidential: true, status: 'Handed Over', attachments: [{ name: 'results.pdf', url: '#'}] },
    { id: 'post-2', direction: 'Outgoing', date: '2025-08-21', subject: 'Welcome Pack for Samantha Smith', sender: 'Admissions Office', recipient: 'Mark Smith', carrier: 'Royal Mail', refNo: 'RM123456789GB', confidential: false, status: 'Dispatched' },
];

let MOCK_HANDOVERS: Handover[] = [
    { id: 'ho-1', postalId: 'post-1', fromUserId: 'user-evelyn-reed', toUserId: 't-1', handedAt: getISODateMinutesAgo(500) }
];

let MOCK_ONLINE_SETTINGS: OnlineAdmissionsSettings = {
    acceptingNewApplications: true,
    message: 'Welcome to FWBC. We are now accepting applications for the 2025-2026 academic year.',
};

const MOCK_COMM_TEMPLATES: CommunicationTemplate[] = [
    { id: 't-remind', name: 'Interview Reminder', subject: 'Your Interview Reminder', body: 'Dear {{guardianName}}, this is a reminder for {{applicantName}}\'s interview on...' },
    { id: 't-docs', name: 'Missing Documents Request', subject: 'Action Required: Missing Documents', body: 'Dear {{guardianName}}, we require additional documents for {{applicantName}}\'s application...' },
    { id: 't-offer', name: 'Offer Letter', subject: 'Congratulations! An Offer from FWBC', body: 'Dear {{guardianName}}, we are pleased to offer {{applicantName}} a place at...' },
];


// --- MOCK API ---
const delay = (ms: number) => new Promise(res => setTimeout(res, ms));

// Applications
export const listApplications = async (): Promise<Application[]> => { await delay(400); return [...MOCK_APPLICATIONS]; };
export const getApplication = async (id: string): Promise<Application | null> => { await delay(300); return MOCK_APPLICATIONS.find(a => a.id === id) || null; };

export const updateApplication = async (id: string, update: Partial<Application>, actor: User): Promise<Application> => {
    await delay(500);
    const index = MOCK_APPLICATIONS.findIndex(a => a.id === id);
    if (index === -1) throw new Error("Application not found");
    const before = { ...MOCK_APPLICATIONS[index] };
    MOCK_APPLICATIONS[index] = { ...MOCK_APPLICATIONS[index], ...update };
    const after = MOCK_APPLICATIONS[index];
    logAuditEvent({ actorId: actor.id, actorName: actor.name, action: 'UPDATE', module: 'ADMISSIONS', entityType: 'Application', entityId: id, entityDisplay: after.applicantName, before, after });
    return after;
};

export const approveApplication = async (applicationId: string, actor: User): Promise<{ studentId: string; admissionNo: string; }> => {
    await delay(1000);
    const app = MOCK_APPLICATIONS.find(a => a.id === applicationId);
    if (!app || app.status !== 'Accepted') {
        throw new Error("Application cannot be approved.");
    }

    const before = { ...app };
    app.status = 'Approved';
    
    // Create student record
    const newStudent = createStudentFromApplication(app);

    // Update seat allocation
    const allocation = MOCK_SEAT_ALLOCATIONS.find(s => s.classId === app.desiredClassId);
    if (allocation) {
        allocation.allocated += 1;
    }

    logAuditEvent({ actorId: actor.id, actorName: actor.name, action: 'APPROVE', module: 'ADMISSIONS', entityType: 'Application', entityId: applicationId, entityDisplay: app.applicantName, before, after: app, meta: { newStudentId: newStudent.id, newAdmissionNo: newStudent.admissionNo } });
    
    return { studentId: newStudent.id, admissionNo: newStudent.admissionNo };
};

// Seat Allocation
export const getSeatAllocations = async (): Promise<SeatAllocation[]> => { await delay(200); return [...MOCK_SEAT_ALLOCATIONS]; };

export const updateSeatCapacity = async (classId: string, newCapacity: number, actor: User): Promise<void> => {
    await delay(400);
    const allocation = MOCK_SEAT_ALLOCATIONS.find(s => s.classId === classId);
    if (allocation) {
        const oldCapacity = allocation.capacity;
        allocation.capacity = newCapacity;
        logAuditEvent({ actorId: actor.id, actorName: actor.name, action: 'UPDATE', module: 'ADMISSIONS', entityType: 'SeatPlan', entityId: classId, entityDisplay: `Class ${classId} Capacity`, before: { capacity: oldCapacity }, after: { capacity: newCapacity } });
    }
};

export const checkSeatAvailability = async (classId: string): Promise<{ available: boolean; pendingOffers: number }> => {
    await delay(150);
    const allocation = MOCK_SEAT_ALLOCATIONS.find(s => s.classId === classId);
    if (!allocation) return { available: false, pendingOffers: 0 };
    
    const pendingOffers = MOCK_APPLICATIONS.filter(a => a.desiredClassId === classId && a.status === 'Offer').length;
    const available = allocation.allocated + pendingOffers < allocation.capacity;
    
    return { available, pendingOffers };
};


// Public Application
type PublicAppInput = Omit<Application, 'id' | 'enquiryId' | 'status' | 'submittedAt' | 'applicantName' | 'screeningChecklist' | 'interviewDetails' | 'decisionDetails'>;
export const submitPublicApplication = async (input: PublicAppInput): Promise<{ application: Application, duplicate: boolean }> => {
    await delay(1000);
    const { applicantDetails, guardians } = input;
    
    // More robust duplicate check
    const duplicate = MOCK_APPLICATIONS.some(a =>
        a.applicantDetails.fullName.toLowerCase() === applicantDetails.fullName.toLowerCase() &&
        a.applicantDetails.dob === applicantDetails.dob &&
        a.guardians.some(g => g.email && guardians[0]?.email && g.email.toLowerCase() === guardians[0].email.toLowerCase())
    );

    const applicantName = input.applicantDetails.fullName;
    const newApp: Application = {
        ...input,
        id: `app-pub-${Date.now()}`,
        status: 'New',
        submittedAt: new Date().toISOString(),
        applicantName,
        screeningChecklist: { ageEligibility: false, prerequisitesMet: false, catchmentArea: false },
        interviewDetails: {},
        decisionDetails: {},
    };
    MOCK_APPLICATIONS.unshift(newApp);
    return { application: newApp, duplicate };
};

export const getPublicApplicationStatus = async (ref: string, email: string): Promise<PublicApplicationView | null> => {
    await delay(600);
    const app = MOCK_APPLICATIONS.find(a => a.id === ref);
    if (!app || !app.guardians.some(g => g.email.toLowerCase() === email.toLowerCase())) {
        return null;
    }
    
    // Derive next steps based on status
    let nextSteps = 'Your application is under review.';
    if (app.status === 'DocsMissing') nextSteps = 'Please submit the required documents.';
    if (app.status === 'Interview') nextSteps = 'An interview has been scheduled.';
    if (app.status === 'Offer') nextSteps = 'An offer has been made. Please respond by the deadline.';
    if (app.status === 'Accepted' || app.status === 'Approved') nextSteps = 'Welcome! Please look out for our onboarding email.';
    if (app.status === 'Rejected' || app.status === 'Waitlist') nextSteps = 'A decision has been made. Please check your email for details.';

    return {
        applicantName: app.applicantName,
        status: app.status,
        nextSteps,
        interviewDetails: app.interviewDetails,
        missingDocuments: app.documents.filter(d => !d.verified).map(d => d.type),
    };
};

export const bulkImportApplications = async (newApps: Omit<Application, 'id'|'status'|'submittedAt'>[], actor: User): Promise<{ success: boolean; count: number }> => {
    await delay(1200);
    const createdApps = newApps.map((app, i) => ({
        ...app,
        id: `bulk-${Date.now()}-${i}`,
        status: 'New' as ApplicationStatus,
        submittedAt: new Date().toISOString(),
    }));
    MOCK_APPLICATIONS.unshift(...createdApps);
    logAuditEvent({ actorId: actor.id, actorName: actor.name, action: 'CREATE', module: 'ADMISSIONS', entityType: 'Application', entityDisplay: 'Bulk Import', meta: { count: newApps.length } });
    return { success: true, count: newApps.length };
};

export const getOnlineAdmissionsSettings = async (): Promise<OnlineAdmissionsSettings> => {
    await delay(200);
    return { ...MOCK_ONLINE_SETTINGS };
};

export const updateOnlineAdmissionsSettings = async (settings: OnlineAdmissionsSettings, actor: User): Promise<void> => {
    await delay(500);
    const before = { ...MOCK_ONLINE_SETTINGS };
    MOCK_ONLINE_SETTINGS = settings;
    logAuditEvent({ actorId: actor.id, actorName: actor.name, action: 'UPDATE', module: 'ADMISSIONS', entityType: 'Settings', entityDisplay: 'Online Admissions Settings', before, after: settings });
};

export const listCommunicationTemplates = async (): Promise<CommunicationTemplate[]> => {
    await delay(150);
    return [...MOCK_COMM_TEMPLATES];
};

export const sendBulkCommunication = async (applicationIds: string[], templateId: string, actor: User): Promise<{ success: boolean; count: number }> => {
    await delay(1200);
    const template = MOCK_COMM_TEMPLATES.find(t => t.id === templateId);
    console.log(`[MOCK SEND] Sending template "${template?.name}" to ${applicationIds.length} applicants.`);
    logAuditEvent({ actorId: actor.id, actorName: actor.name, action: 'UPDATE', module: 'ADMISSIONS', entityType: 'Communication', entityDisplay: `Bulk Send: ${template?.name}`, meta: { count: applicationIds.length, templateId } });
    return { success: true, count: applicationIds.length };
};



// --- REST OF THE SERVICE (Enquiries, Visitors, etc.) ---
// --- Follow-ups ---
export const listFollowUps = async (enquiryId: string): Promise<FollowUp[]> => {
    await delay(200);
    return MOCK_FOLLOW_UPS.filter(f => f.enquiryId === enquiryId).sort((a,b) => b.dueAt.localeCompare(a.dueAt));
};

export const createFollowUp = async (input: Omit<FollowUp, 'id'>, actor: User): Promise<FollowUp> => {
    await delay(400);
    const newFollowUp: FollowUp = { ...input, id: `fu-${Date.now()}` };
    MOCK_FOLLOW_UPS.push(newFollowUp);
    logAuditEvent({ actorId: actor.id, actorName: actor.name, action: 'CREATE', module: 'ADMISSIONS', entityType: 'FollowUp', entityId: newFollowUp.id, entityDisplay: `Follow-up for enquiry ${input.enquiryId}` });
    return newFollowUp;
};

// Visitors
export const listVisitorLogs = async (): Promise<VisitorLog[]> => {
    await delay(300);
    return [...MOCK_VISITOR_LOGS].sort((a, b) => b.timeIn.localeCompare(a.timeIn));
};

export const createVisitorLog = async (input: Omit<VisitorLog, 'id'>, actor: User): Promise<VisitorLog> => {
    await delay(500);
    const newLog: VisitorLog = { ...input, id: `vis-${Date.now()}` };
    MOCK_VISITOR_LOGS.unshift(newLog);
    logAuditEvent({ actorId: actor.id, actorName: actor.name, action: 'CREATE', module: 'FRONTOFFICE', entityType: 'VisitorLog', entityId: newLog.id, entityDisplay: newLog.name });
    return newLog;
};

export const signOutVisitor = async (logId: string, actor: User): Promise<void> => {
    await delay(400);
    const log = MOCK_VISITOR_LOGS.find(l => l.id === logId);
    if (log) {
        log.timeOut = new Date().toISOString();
        logAuditEvent({ actorId: actor.id, actorName: actor.name, action: 'UPDATE', module: 'FRONTOFFICE', entityType: 'VisitorLog', entityId: log.id, entityDisplay: log.name, meta: { action: 'SignOut' } });
    }
};

// Call Logs
export const listCallLogs = async (): Promise<CallLog[]> => {
    await delay(300);
    return [...MOCK_CALL_LOGS].sort((a,b) => b.callAt.localeCompare(a.callAt));
};

export const createCallLog = async (input: Omit<CallLog, 'id' | 'status'>, actor: User): Promise<CallLog> => {
    await delay(500);
    const newLog: CallLog = { ...input, id: `call-${Date.now()}`, status: 'Open', ownerUserId: actor.id };
    MOCK_CALL_LOGS.unshift(newLog);
    logAuditEvent({ actorId: actor.id, actorName: actor.name, action: 'CREATE', module: 'FRONTOFFICE', entityType: 'CallLog', entityId: newLog.id, entityDisplay: `Call with ${input.callerName}` });
    return newLog;
};

export const updateCallLog = async (logId: string, update: Partial<CallLog>, actor: User): Promise<void> => {
    await delay(300);
    const index = MOCK_CALL_LOGS.findIndex(l => l.id === logId);
    if (index > -1) {
        const before = { ...MOCK_CALL_LOGS[index] };
        MOCK_CALL_LOGS[index] = { ...MOCK_CALL_LOGS[index], ...update };
        logAuditEvent({ actorId: actor.id, actorName: actor.name, action: 'UPDATE', module: 'FRONTOFFICE', entityType: 'CallLog', entityId: logId, entityDisplay: `Call with ${MOCK_CALL_LOGS[index].callerName}`, before, after: MOCK_CALL_LOGS[index] });
    }
};

// Postal
export const listPostalItems = async (): Promise<Postal[]> => {
    await delay(300);
    return [...MOCK_POSTAL_ITEMS].sort((a,b) => b.date.localeCompare(a.date));
};

export const getPostalItem = async (id: string): Promise<Postal | null> => {
    await delay(200);
    return MOCK_POSTAL_ITEMS.find(p => p.id === id) || null;
};

export const createPostalItem = async (input: Omit<Postal, 'id'>, actor: User): Promise<Postal> => {
    await delay(500);
    const newItem: Postal = { ...input, id: `post-${Date.now()}` };
    MOCK_POSTAL_ITEMS.unshift(newItem);
    logAuditEvent({ actorId: actor.id, actorName: actor.name, action: 'CREATE', module: 'FRONTOFFICE', entityType: 'Postal', entityId: newItem.id, entityDisplay: newItem.subject });
    return newItem;
};

export const listHandovers = async (postalId: string): Promise<Handover[]> => {
    await delay(150);
    return MOCK_HANDOVERS.filter(h => h.postalId === postalId).sort((a,b) => b.handedAt.localeCompare(a.handedAt));
};

export const createHandover = async (input: Omit<Handover, 'id'>, actor: User): Promise<Handover> => {
    await delay(400);
    // FIX: Correctly add fromUserId from actor
    const newHandover: Handover = { ...input, id: `ho-${Date.now()}`, fromUserId: actor.id };
    MOCK_HANDOVERS.push(newHandover);
    
    // Also update postal item status
    const postalItem = MOCK_POSTAL_ITEMS.find(p => p.id === input.postalId);
    if (postalItem) {
        postalItem.status = 'Handed Over';
    }

    logAuditEvent({ actorId: actor.id, actorName: actor.name, action: 'UPDATE', module: 'FRONTOFFICE', entityType: 'Postal', entityId: input.postalId, entityDisplay: 'Handover', meta: { toUserId: input.toUserId }});
    return newHandover;
};

// Enquiries
export const listEnquiries = async (): Promise<Enquiry[]> => { await delay(300); return [...MOCK_ENQUIRIES]; };
export const getEnquiry = async (id: string): Promise<Enquiry | null> => { await delay(200); return MOCK_ENQUIRIES.find(e => e.id === id) || null; };
export const createEnquiry = async (input: Omit<Enquiry, 'id' | 'createdAt' | 'status'>, actor: User): Promise<Enquiry> => {
    await delay(500);
    const newEnquiry: Enquiry = { ...input, id: `enq-${Date.now()}`, createdAt: new Date().toISOString(), status: 'New' };
    MOCK_ENQUIRIES.unshift(newEnquiry);
    logAuditEvent({ actorId: actor.id, actorName: actor.name, action: 'CREATE', module: 'ADMISSIONS', entityType: 'Enquiry', entityId: newEnquiry.id, entityDisplay: newEnquiry.name, after: newEnquiry });
    return newEnquiry;
};
export const updateEnquiry = async (id: string, update: Partial<Enquiry>, actor: User): Promise<Enquiry> => {
    await delay(300);
    const index = MOCK_ENQUIRIES.findIndex(e => e.id === id);
    if (index === -1) throw new Error("Not found");
    const before = { ...MOCK_ENQUIRIES[index] };
    MOCK_ENQUIRIES[index] = { ...MOCK_ENQUIRIES[index], ...update };
    logAuditEvent({ actorId: actor.id, actorName: actor.name, action: 'UPDATE', module: 'ADMISSIONS', entityType: 'Enquiry', entityId: id, entityDisplay: MOCK_ENQUIRIES[index].name, before, after: MOCK_ENQUIRIES[index] });
    return MOCK_ENQUIRIES[index];
};
export const convertEnquiryToApplication = async (enquiryId: string, actor: User): Promise<{ id: string }> => {
    await delay(800);
    const enquiry = MOCK_ENQUIRIES.find(e => e.id === enquiryId);
    if (!enquiry) throw new Error("Enquiry not found");
    enquiry.status = 'Converted';
    // FIX: Added missing 'intakeSession' property to satisfy Application type
    const newApp: Application = { id: `app-${Date.now()}`, enquiryId, applicantName: `${enquiry.name}'s child`, desiredClassId: enquiry.targetClassId || 'c1', intakeSession: '2025-2026', status: 'New', submittedAt: new Date().toISOString(), applicantDetails: { fullName: '', dob: '', gender: 'Male', nationality: '', priorSchool: '' }, guardians: [], documents: [], screeningChecklist: { ageEligibility: false, prerequisitesMet: false, catchmentArea: false }, interviewDetails: {}, decisionDetails: {} };
    MOCK_APPLICATIONS.unshift(newApp);
    logAuditEvent({ actorId: actor.id, actorName: actor.name, action: 'CONVERT', module: 'ADMISSIONS', entityType: 'Enquiry', entityId: enquiryId, entityDisplay: enquiry.name, meta: { newApplicationId: newApp.id } });
    return { id: newApp.id };
};
