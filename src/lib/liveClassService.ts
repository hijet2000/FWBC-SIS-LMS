import type { LiveClassSession, LiveClassProvider, LiveClassStatus, LiveIntegration, User, LiveClassAttendance } from '../types';
import { logAuditEvent } from './auditService';
import { getStudentsByClass } from './schoolService';
import { createCatchupFromLiveClass } from './catchupService';

// --- MOCK DATA STORE ---
const getISODateHoursFromNow = (hours: number): string => {
    const date = new Date();
    date.setHours(date.getHours() + hours);
    return date.toISOString();
};

let MOCK_SESSIONS: LiveClassSession[] = [
    { id: 'lc-1', title: 'Algebra Basics', classId: 'c1', subjectId: 'subj-1', teacherId: 't-3', provider: 'Zoom', startTime: getISODateHoursFromNow(-1), endTime: getISODateHoursFromNow(0), status: 'Finished', joinUrl: '#', isRecordingPublished: true, recordingUrl: '#', catchupId: 'cu-live-lc-1' },
    { id: 'lc-2', title: 'Introduction to Forces', classId: 'c2', subjectId: 'subj-2', teacherId: 't-2', provider: 'Google Meet', startTime: getISODateHoursFromNow(0), endTime: getISODateHoursFromNow(1), status: 'In Progress', joinUrl: '#', isRecordingPublished: false },
    { id: 'lc-3', title: 'Shakespeare\'s Sonnets', classId: 'c1', subjectId: 'subj-4', teacherId: 't-4', provider: 'Self-hosted', startTime: getISODateHoursFromNow(2), endTime: getISODateHoursFromNow(3), status: 'Scheduled', joinUrl: '#', isRecordingPublished: false },
    { id: 'lc-4', title: 'Chemical Reactions', classId: 'c4', subjectId: 'subj-8', teacherId: 't-6', provider: 'Zoom', startTime: getISODateHoursFromNow(24), endTime: getISODateHoursFromNow(25), status: 'Scheduled', joinUrl: '#', isRecordingPublished: false },
];

let MOCK_INTEGRATIONS: LiveIntegration[] = [
    { provider: 'Zoom', connected: true, health: 'OK', lastSync: new Date().toISOString() },
    { provider: 'Google Meet', connected: true, health: 'OK', lastSync: new Date().toISOString() },
    { provider: 'Self-hosted', connected: false, health: 'Error', lastSync: getISODateHoursFromNow(-24) },
];

// In a real app, this would be complex. Here we just mock the final results.
let MOCK_ATTENDANCE: LiveClassAttendance[] = [];

// --- MOCK API FUNCTIONS ---
const delay = (ms: number) => new Promise(res => setTimeout(res, ms));

// --- Sessions ---
export const listSessions = async (params: { from: string; to: string }): Promise<LiveClassSession[]> => {
    await delay(400);
    return MOCK_SESSIONS.filter(s => {
        const start = new Date(s.startTime).getTime();
        return start >= new Date(params.from).getTime() && start <= new Date(params.to).getTime();
    }).sort((a,b) => new Date(a.startTime).getTime() - new Date(b.startTime).getTime());
};

export const createSession = async (input: Omit<LiveClassSession, 'id' | 'status' | 'isRecordingPublished'>, actor: User): Promise<LiveClassSession> => {
    await delay(500);
    const newSession: LiveClassSession = {
        ...input,
        id: `lc-${Date.now()}`,
        status: 'Scheduled',
        isRecordingPublished: false,
    };
    MOCK_SESSIONS.push(newSession);
    logAuditEvent({ actorId: actor.id, actorName: actor.name, action: 'CREATE', module: 'LIVE_CLASSES', entityType: 'LiveClass', entityId: newSession.id, entityDisplay: newSession.title, after: newSession });
    return newSession;
};

export const updateSessionStatus = async (sessionId: string, status: LiveClassStatus, actor: User): Promise<void> => {
    await delay(300);
    const session = MOCK_SESSIONS.find(s => s.id === sessionId);
    if (session) {
        session.status = status;
        logAuditEvent({ actorId: actor.id, actorName: actor.name, action: 'UPDATE', module: 'LIVE_CLASSES', entityType: 'LiveClass', entityId: sessionId, entityDisplay: session.title, meta: { newStatus: status } });
    }
};

// --- Attendance Simulation ---
export const getAttendanceForSession = async (sessionId: string): Promise<LiveClassAttendance[]> => {
    await delay(600);
    const existing = MOCK_ATTENDANCE.filter(a => a.sessionId === sessionId);
    if (existing.length > 0) return existing;

    const session = MOCK_SESSIONS.find(s => s.id === sessionId);
    if (!session) return [];
    
    const students = await getStudentsByClass(session.classId);
    const sessionDuration = (new Date(session.endTime).getTime() - new Date(session.startTime).getTime()) / 1000 / 60; // in minutes

    const attendanceThresholdPct = 80;
    const lateJoinGraceMin = 5;

    const results = students.map(student => {
        const randomFactor = Math.random();
        let minutesAttended = 0;
        let isLate = false;

        if (randomFactor > 0.9) {
            minutesAttended = 0;
        } else if (randomFactor > 0.7) {
            const lateMinutes = 5 + Math.random() * 20;
            minutesAttended = Math.max(0, sessionDuration - lateMinutes);
            isLate = lateMinutes > lateJoinGraceMin;
        } else {
            minutesAttended = sessionDuration - (Math.random() * 5);
        }
        
        const attendancePercentage = sessionDuration > 0 ? (minutesAttended / sessionDuration) * 100 : 0;

        return {
            sessionId,
            studentId: student.id,
            minutesAttended: Math.round(minutesAttended),
            attendancePercentage: Math.round(attendancePercentage),
            isLate,
            isOverridden: false,
        };
    });
    
    MOCK_ATTENDANCE.push(...results);
    return results;
};

export const overrideAttendance = async (sessionId: string, studentId: string, overrideReason: string, actor: User): Promise<void> => {
    await delay(400);
    const record = MOCK_ATTENDANCE.find(a => a.sessionId === sessionId && a.studentId === studentId);
    if (record) {
        record.isOverridden = true;
        record.overrideReason = overrideReason;
        // In this mock, we'll just mark them as fully present.
        record.attendancePercentage = 100;
        record.isLate = false;

        logAuditEvent({ actorId: actor.id, actorName: actor.name, action: 'UPDATE', module: 'LIVE_CLASSES', entityType: 'Attendance', entityId: `${sessionId}-${studentId}`, entityDisplay: `Attendance for ${studentId}`, meta: { reason: overrideReason } });
    }
};

// --- Recordings ---
export const publishRecording = async (sessionId: string, actor: User): Promise<void> => {
    await delay(1000);
    const session = MOCK_SESSIONS.find(s => s.id === sessionId);
    if (session && session.status === 'Finished' && !session.isRecordingPublished) {
        const catchupItem = await createCatchupFromLiveClass(session);
        session.isRecordingPublished = true;
        session.catchupId = catchupItem.id;
        logAuditEvent({ actorId: actor.id, actorName: actor.name, action: 'UPDATE', module: 'LIVE_CLASSES', entityType: 'Recording', entityId: sessionId, entityDisplay: `Recording for ${session.title}`, meta: { publish: true, catchupId: catchupItem.id } });
    }
};

// --- Integrations ---
export const listIntegrations = async (): Promise<LiveIntegration[]> => {
    await delay(200);
    return [...MOCK_INTEGRATIONS];
};