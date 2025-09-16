import type { AttendanceRecord, WeeklyEmailSettings, SchoolClass, Student, AttendanceStatus, AttendanceEntry, User } from '../types';
import { getClasses, getStudents } from './schoolService';
import { logAuditEvent } from './auditService';
import { exportToCsv } from './exporters';
import { generateSimplePdf } from './pdfGenerator';

// --- MOCK DATA GENERATION ---
let MOCK_RECORDS: AttendanceRecord[] = [];
let MOCK_SETTINGS: WeeklyEmailSettings = { enabled: true, sendHour: 8 };

const generateMockData = async () => {
    if (MOCK_RECORDS.length > 0) return;

    const classes = await getClasses();
    const { students } = await getStudents({limit: 1000});
    const records: AttendanceRecord[] = [];
    const today = new Date();
    
    for (let i = 0; i < 30; i++) { // Generate for last 30 days
        const date = new Date(today);
        date.setDate(today.getDate() - i);
        const dateString = date.toISOString().split('T')[0];

        for (const student of students) {
            const statusChance = Math.random();
            let status: AttendanceStatus = 'PRESENT';
            if (statusChance > 0.95) status = 'ABSENT';
            else if (statusChance > 0.9) status = 'LATE';
            else if (statusChance > 0.88) status = 'EXCUSED';

            if (status !== 'ABSENT' || Math.random() > 0.5) { // Log some absences too
                 records.push({
                    id: `rec-${student.id}-${dateString}`,
                    studentId: student.id,
                    sessionId: `sess-${dateString}`,
                    classId: student.classId,
                    date: dateString,
                    status: status,
                    minutesAttended: status === 'PRESENT' ? 360 : status === 'LATE' ? 300 : undefined,
                    createdAt: new Date().toISOString(),
                });
            }
        }
    }
    MOCK_RECORDS = records;
};

// --- MOCK API ---
const delay = (ms: number) => new Promise(res => setTimeout(res, ms));

export const listAttendanceRecords = async (filters: { classId?: string; studentId?: string; from?: string; to?: string }): Promise<AttendanceRecord[]> => {
    await delay(400);
    let results = [...MOCK_RECORDS];
    if (filters.classId) results = results.filter(r => r.classId === filters.classId);
    if (filters.studentId) results = results.filter(r => r.studentId === filters.studentId);
    if (filters.from) results = results.filter(r => r.date >= filters.from!);
    if (filters.to) results = results.filter(r => r.date <= filters.to!);
    return results.sort((a,b) => b.date.localeCompare(a.date));
};

export const getTodaysAttendanceSummary = async (): Promise<{ present: number; absent: number; total: number; presentRate: number; }> => {
    await delay(350);
    const todayString = new Date().toISOString().split('T')[0];
    const todaysRecords = MOCK_RECORDS.filter(r => r.date === todayString);
    const present = todaysRecords.filter(r => r.status === 'PRESENT' || r.status === 'LATE').length;
    const total = (await getStudents({limit: 1000})).students.length; // Approximate total students for today
    const absent = total - present;
    return { present, absent, total, presentRate: total > 0 ? (present/total) * 100 : 0 };
};

interface SaveAttendancePayload {
    siteId: string;
    classId: string;
    date: string;
    entries: AttendanceEntry[];
    actor: { id: string, name: string };
    className: string;
}
export const saveAttendance = async (payload: SaveAttendancePayload): Promise<void> => {
    await delay(800);
    // Remove existing records for this class and date to prevent duplicates
    MOCK_RECORDS = MOCK_RECORDS.filter(r => !(r.classId === payload.classId && r.date === payload.date));
    
    const newRecords: AttendanceRecord[] = payload.entries.map(entry => ({
        id: `rec-${entry.studentId}-${payload.date}-${Math.random()}`,
        studentId: entry.studentId,
        sessionId: `sess-${payload.date}`,
        classId: payload.classId,
        date: payload.date,
        status: entry.status,
        minutesAttended: entry.minutesAttended,
        createdAt: new Date().toISOString(),
    }));
    
    MOCK_RECORDS.push(...newRecords);

    logAuditEvent({
        actorId: payload.actor.id,
        actorName: payload.actor.name,
        action: 'UPDATE',
        module: 'ATTENDANCE',
        entityType: 'AttendanceSheet',
        entityId: `${payload.classId}-${payload.date}`,
        entityDisplay: `${payload.className} on ${payload.date}`,
        meta: { entriesCount: newRecords.length }
    });
};

export const saveStudentAttendanceRecord = async (payload: { studentId: string; classId: string; date: string; status: AttendanceStatus; actor: User }): Promise<void> => {
    await delay(500);
    const newRecord: AttendanceRecord = {
        id: `rec-${payload.studentId}-${payload.date}-${Math.random()}`,
        studentId: payload.studentId,
        sessionId: `sess-${payload.date}`,
        classId: payload.classId,
        date: payload.date,
        status: payload.status,
        createdAt: new Date().toISOString(),
    };
    MOCK_RECORDS.unshift(newRecord);
     logAuditEvent({
        actorId: payload.actor.id,
        actorName: payload.actor.name,
        action: 'CREATE',
        module: 'ATTENDANCE',
        entityType: 'AttendanceRecord',
        entityId: newRecord.id,
        entityDisplay: `Record for ${payload.studentId} on ${payload.date}`,
        after: { status: payload.status }
    });
};

export const getWeeklyEmailSettings = async (): Promise<WeeklyEmailSettings> => {
    await delay(150);
    return { ...MOCK_SETTINGS };
};

export const updateWeeklyEmailSettings = async (settings: WeeklyEmailSettings): Promise<void> => {
    await delay(400);
    MOCK_SETTINGS = settings;
};

// Mock Export Functions
export const exportRecordsCSV = async (): Promise<{ url: string }> => {
    await delay(1000);
    exportToCsv('server_attendance_records.csv', [{key: 'id', label: 'ID'}, {key: 'date', label: 'Date'}, {key: 'status', label: 'Status'}], MOCK_RECORDS);
    return { url: '#' }; // In real app, this would be a URL to a generated file
};
export const exportRecordsPDF = async (): Promise<{ url: string }> => {
    await delay(1500);
    generateSimplePdf('Server Attendance Records', JSON.stringify(MOCK_RECORDS.slice(0, 10), null, 2));
    return { url: '#' };
};
export const exportAnalyticsCSV = async (): Promise<{ url: string }> => {
    await delay(1000);
     exportToCsv('server_attendance_analytics.csv', [{key: 'date', label: 'Date'}, {key: 'presentRate', label: 'PresentRate'}], [{date: '2025-09-01', presentRate: 95.2}]);
    return { url: '#' };
};
export const exportAnalyticsPDF = async (): Promise<{ url: string }> => {
    await delay(1500);
    generateSimplePdf('Server Attendance Analytics', 'Date,Present\n2025-09-01,95.2%');
    return { url: '#' };
};


// Initialize mock data
generateMockData();
