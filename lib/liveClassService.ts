import type { LiveClass, User, LiveClassStatus, LiveClassIntegrationSettings, LiveClassAttendance, LiveClassParticipant } from '../types';
import { logAuditEvent } from './auditService';
import { createCatchupFromLiveClass } from './catchupService';

// --- MOCK DATA STORE ---

const getISODateHoursFromNow = (hours: number): string => {
    const date = new Date();
    date.setHours(date.getHours() + hours);
    return date.toISOString();
};

let MOCK_LIVE_CLASSES: LiveClass[] = [
    { id: 'lc-1', topic: 'Introduction to Algebra', classId: 'c1', subjectId: 'subj-1', teacherId: 't-3', startTime: getISODateHoursFromNow(-1), durationMinutes: 45, status: 'Finished', joinUrl: '#', meetingId: '123-456-789', recordedUrl: 'https://test-streams.mux.dev/x36xhzz/x36xhzz.m3u8' },
    { id: 'lc-2', topic: 'The Laws of Motion', classId: 'c2', subjectId: 'subj-2', teacherId: 't-2', startTime: getISODateHoursFromNow(0), durationMinutes: 60, status: 'Live', joinUrl: '#', meetingId: '987-654-321' },
    { id: 'lc-3', topic: 'Sonnet 18 Analysis', classId: 'c1', subjectId: 'subj-4', teacherId: 't-4', startTime: getISODateHoursFromNow(2), durationMinutes: 45, status: 'Scheduled', joinUrl: '#', meetingId: '456-123-789' },
    { id: 'lc-4', topic: 'Advanced Physics Lab Briefing', classId: 'c4', subjectId: 'subj-6', teacherId: 't-2', startTime: getISODateHoursFromNow(24), durationMinutes: 30, status: 'Scheduled', joinUrl: '#' },
];

let MOCK_INTEGRATION_SETTINGS: LiveClassIntegrationSettings = {
    provider: 'SelfHosted',
    enabled: true,
    autoRecord: true,
    autoPublishRecording: false,
};

let MOCK_LIVE_CLASS_ATTENDANCE: LiveClassAttendance[] = [
    { id: 'lca-1', liveClassId: 'lc-1', studentId: 's01', joinedAt: getISODateHoursFromNow(-1), durationAttendedMinutes: 44 }
];

// --- MOCK API ---
const delay = (ms: number) => new Promise(res => setTimeout(res, ms));

export const listLiveClasses = async (params: { classId?: string, teacherId?: string, studentId?: string, date?: string } = {}): Promise<LiveClass[]> => {
    await delay(400);
    let results = [...MOCK_LIVE_CLASSES];
    if (params.classId) {
        results = results.filter(lc => lc.classId === params.classId);
    }
    // In a real app, studentId would filter by the student's class
    if (params.studentId) {
        results = results.filter(lc => lc.classId === 'c1'); // HACK for student s01
    }
    return results.sort((a,b) => new Date(a.startTime).getTime() - new Date(b.startTime).getTime());
};

export const getLiveClassDetails = async (id: string): Promise<LiveClass | null> => {
    await delay(150);
    return MOCK_LIVE_CLASSES.find(lc => lc.id === id) || null;
};

export const getLiveClassParticipants = async (id: string): Promise<LiveClassParticipant[]> => {
    await delay(300);
    // Mock participants
    return [
        { id: 's02', name: 'Bob Williams', isHost: false },
        { id: 's03', name: 'Charlie Brown', isHost: false },
        { id: 's04', name: 'Diana Miller', isHost: false },
    ];
};

export const createLiveClass = async (input: Omit<LiveClass, 'id'|'status'|'joinUrl'|'meetingId'|'recordedUrl'>, actor: User): Promise<LiveClass> => {
    await delay(500);
    const newClass: LiveClass = {
        ...input,
        id: `lc-${Date.now()}`,
        status: 'Scheduled',
        joinUrl: `/mock-meeting/${Date.now()}`,
    };
    MOCK_LIVE_CLASSES.push(newClass);
    logAuditEvent({ actorId: actor.id, actorName: actor.name, action: 'CREATE', module: 'LIVE_CLASS', entityType: 'LiveClass', entityId: newClass.id, entityDisplay: newClass.topic, after: newClass });
    return newClass;
};

export const updateLiveClassStatus = async (id: string, status: LiveClassStatus, actor: User): Promise<LiveClass> => {
    await delay(300);
    const liveClass = MOCK_LIVE_CLASSES.find(lc => lc.id === id);
    if (!liveClass) throw new Error("Live class not found");
    const before = { ...liveClass };
    liveClass.status = status;
    logAuditEvent({ actorId: actor.id, actorName: actor.name, action: 'UPDATE', module: 'LIVE_CLASS', entityType: 'LiveClass', entityId: id, entityDisplay: liveClass.topic, before, after: liveClass });
    return liveClass;
};

export const joinLiveClass = async (liveClassId: string, studentId: string): Promise<void> => {
    await delay(200);
    const newAttendance: LiveClassAttendance = {
        id: `lca-${Date.now()}`,
        liveClassId,
        studentId,
        joinedAt: new Date().toISOString(),
        durationAttendedMinutes: 0, // This would be updated on 'left' event
    };
    MOCK_LIVE_CLASS_ATTENDANCE.push(newAttendance);
    logAuditEvent({ actorId: studentId, actorName: `Student ${studentId}`, action: 'UPDATE', module: 'ATTENDANCE', entityType: 'LiveClass', entityId: liveClassId, entityDisplay: 'Joined Session', meta: { studentId } });
};

export const addRecordingToCatchUp = async (liveClassId: string, recordedUrl: string, actor: User): Promise<void> => {
    await delay(800);
    const liveClass = MOCK_LIVE_CLASSES.find(lc => lc.id === liveClassId);
    if (!liveClass) throw new Error("Live class not found");
    
    liveClass.recordedUrl = recordedUrl;
    await createCatchupFromLiveClass(liveClass, recordedUrl);

    logAuditEvent({ actorId: actor.id, actorName: actor.name, action: 'UPDATE', module: 'LIVE_CLASS', entityType: 'LiveClass', entityId: liveClassId, entityDisplay: `Recording for ${liveClass.topic}`, meta: { recordedUrl } });
};

export const getIntegrationSettings = async (): Promise<LiveClassIntegrationSettings> => {
    await delay(200);
    return { ...MOCK_INTEGRATION_SETTINGS };
};

export const updateIntegrationSettings = async (settings: LiveClassIntegrationSettings, actor: User): Promise<void> => {
    await delay(500);
    MOCK_INTEGRATION_SETTINGS = { ...settings };
    logAuditEvent({ actorId: actor.id, actorName: actor.name, action: 'UPDATE', module: 'SYSTEM', entityType: 'Settings', entityId: 'live-class-integrations', entityDisplay: 'Live Class Integrations', after: settings });
};
