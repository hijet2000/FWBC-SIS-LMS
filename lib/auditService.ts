import type { AuditEvent, User, UserSession, UserActivityEvent, AuditModule, AuditAction } from '../types';

// --- MOCK DATA STORE ---
const getISODateMinutesAgo = (minutes: number): string => {
    const date = new Date();
    date.setMinutes(date.getMinutes() - minutes);
    return date.toISOString();
};

const MOCK_USERS: Omit<User, 'scopes'>[] = [
    { id: 'user-evelyn-reed', name: 'Dr. Evelyn Reed', role: 'Administrator' },
    { id: 'user-alan-turing', name: 'Mr. Alan Turing', role: 'Teacher' },
    { id: 'user-marie-curie', name: 'Ms. Marie Curie', role: 'Teacher' },
    { id: 'user-student-01', name: 'Alice Johnson', role: 'Student' },
];

let MOCK_AUDIT_EVENTS: AuditEvent[] = [
    { id: 'evt-1', tsISO: getISODateMinutesAgo(5), actorId: 'user-evelyn-reed', actorName: 'Dr. Evelyn Reed', module: 'AUTH', action: 'LOGIN', ip: '192.168.1.10', ua: 'Chrome/125.0' },
    { id: 'evt-2', tsISO: getISODateMinutesAgo(15), actorId: 'user-marie-curie', actorName: 'Ms. Marie Curie', module: 'ATTENDANCE', action: 'UPDATE', entityType: 'AttendanceSheet', entityId: 'c2-2025-09-02', entityDisplay: 'Form 2 on 2025-09-02', meta: { entriesCount: 5 } },
    { id: 'evt-3', tsISO: getISODateMinutesAgo(30), actorId: 'user-evelyn-reed', actorName: 'Dr. Evelyn Reed', module: 'FEES', action: 'PAYMENT', entityType: 'INVOICE', entityId: 'inv-2', entityDisplay: 'INV-2025-002', before: { paid: 0, status: 'Unpaid' }, after: { paid: 500, status: 'Partial'}, meta: { receiptNo: 'REC-2025-002', amount: 500 } },
    { id: 'evt-4', tsISO: getISODateMinutesAgo(120), actorId: 'user-alan-turing', actorName: 'Mr. Alan Turing', module: 'ACADEMICS', action: 'CREATE', entityType: 'Mapping', entityId: 'map-new', entityDisplay: 'Mathematics for Form 1' },
    { id: 'evt-5', tsISO: getISODateMinutesAgo(1440), actorId: 'user-evelyn-reed', actorName: 'Dr. Evelyn Reed', module: 'AUTH', action: 'LOGOUT', ip: '192.168.1.10', ua: 'Chrome/125.0' },
];

let MOCK_SESSIONS: UserSession[] = [
    { id: 'sess-1', userId: 'user-evelyn-reed', loginISO: getISODateMinutesAgo(5), ip: '192.168.1.10', ua: 'Chrome/125.0', active: true },
    { id: 'sess-2', userId: 'user-evelyn-reed', loginISO: getISODateMinutesAgo(1445), logoutISO: getISODateMinutesAgo(1440), ip: '192.168.1.10', ua: 'Chrome/125.0', active: false },
    { id: 'sess-3', userId: 'user-marie-curie', loginISO: getISODateMinutesAgo(20), logoutISO: getISODateMinutesAgo(10), ip: '203.0.113.25', ua: 'Firefox/124.0', active: false },
];

// --- MOCK API ---
const delay = (ms: number) => new Promise(res => setTimeout(res, ms));

// Helper for instrumentation
type LogEventInput = Omit<AuditEvent, 'id' | 'tsISO'>;
export const logAuditEvent = (input: LogEventInput) => {
    const newEvent: AuditEvent = {
        ...input,
        id: `evt-${Date.now()}-${Math.random()}`,
        tsISO: new Date().toISOString(),
        ip: '127.0.0.1', // Mock IP
        ua: 'Mock User Agent', // Mock UA
    };
    MOCK_AUDIT_EVENTS.unshift(newEvent); // Add to the top
    console.log('[Audit Log]', newEvent);
};

// Audit Trail Page
export const listAuditEvents = async (siteId: string, params: { from?: string; to?: string; actorId?: string; module?: string; action?: AuditAction; q?: string }): Promise<AuditEvent[]> => {
    await delay(500);
    let results = [...MOCK_AUDIT_EVENTS];
    if (params.from) results = results.filter(e => e.tsISO >= params.from!);
    if (params.to) results = results.filter(e => e.tsISO <= params.to! + 'T23:59:59.999Z');
    if (params.actorId) results = results.filter(e => e.actorId === params.actorId);
    if (params.module) results = results.filter(e => e.module === params.module);
    if (params.action) results = results.filter(e => e.action === params.action);
    if (params.q) {
        const q = params.q.toLowerCase();
        results = results.filter(e => e.entityDisplay?.toLowerCase().includes(q) || e.actorName.toLowerCase().includes(q));
    }
    return results;
};

// User Activity Page
export const listUsers = async (siteId: string): Promise<Omit<User, 'scopes'>[]> => {
    await delay(200);
    return [...MOCK_USERS];
};

export const listUserSessions = async (siteId: string, userId: string, params: { from?: string; to?: string }): Promise<UserSession[]> => {
    await delay(300);
    let results = MOCK_SESSIONS.filter(s => s.userId === userId);
     if (params.from) results = results.filter(s => s.loginISO >= params.from!);
    if (params.to) results = results.filter(s => s.loginISO <= params.to! + 'T23:59:59.999Z');
    return results.sort((a,b) => b.loginISO.localeCompare(a.loginISO));
};

export const listUserEvents = async (siteId: string, userId: string, params: { from?: string; to?: string }): Promise<AuditEvent[]> => {
    await delay(400);
    let results = MOCK_AUDIT_EVENTS.filter(e => e.actorId === userId);
    if (params.from) results = results.filter(e => e.tsISO >= params.from!);
    if (params.to) results = results.filter(e => e.tsISO <= params.to! + 'T23:59:59.999Z');
    return results.sort((a,b) => b.tsISO.localeCompare(a.tsISO));
};

export const terminateSession = async (siteId: string, sessionId: string): Promise<{ ok: boolean }> => {
    await delay(600);
    const session = MOCK_SESSIONS.find(s => s.id === sessionId);
    if (session) {
        session.active = false;
        session.logoutISO = new Date().toISOString();
        logAuditEvent({ actorId: 'user-evelyn-reed', actorName: 'Dr. Evelyn Reed', action: 'LOGOUT', module: 'AUTH', entityType: 'SESSION', entityId: sessionId, entityDisplay: `Session for ${session.userId}`, meta: { reason: 'Forced termination by admin' }});
    }
    return { ok: true };
};