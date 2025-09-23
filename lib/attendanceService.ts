

import type { AttendanceRecord, WeeklyEmailSettings, SchoolClass, Student, AttendanceStatus, AttendanceEntry } from '../types';
import { getClasses, getStudents } from './schoolService';
import { logAuditEvent } from './auditService';

// --- MOCK DATA GENERATION ---
let MOCK_RECORDS: AttendanceRecord[] = [];
let MOCK_SETTINGS: WeeklyEmailSettings = { enabled: true, sendHour: 8 };

const getTodayDateStringForGeneration = () => {
    const today = new Date();
    // No timezone offset needed for mock data comparison
    return today.toISOString().split('T')[0];
};

const generateMockData = async () => {
    if (MOCK_RECORDS.length > 0) return;

    const classes = await getClasses();
    // FIX: Destructure `students` array from the response of `getStudents` to fix .filter call.
    const { students } = await getStudents({limit: 1000});
    const records: AttendanceRecord[] = [];
    const today = new Date();

    for (let i = 0; i < 90; i++) { // 90 days of history
        const date = new Date(today);
        date.setDate(today.getDate() - i);
        const dateStr = date.toISOString().split('T')[0];

        // Only generate for weekdays
        if (date.getDay() === 0 || date.getDay() === 6) continue;

        // Pick 2 classes to have attendance today
        const activeClasses = [classes[0], classes[1]];

        for (const schoolClass of activeClasses) {
            const classStudents = students.filter(s => s.classId === schoolClass.id);
            for (const student of classStudents) {
                const random = Math.random();
                let status: AttendanceStatus;
                let minutesAttended: number | undefined = 420; // 7 hours

                if (random < 0.85) {
                    status = 'PRESENT';
                } else if (random < 0.90) {
                    status = 'LATE';
                    minutesAttended = Math.floor(Math.random() * (410 - 360 + 1) + 360);
                } else if (random < 0.98) {
                    status = 'ABSENT';
                    minutesAttended = 0;
                } else {
                    status = 'EXCUSED';
                    minutesAttended = undefined;
                }
                
                const createdAt = new Date(date);
                createdAt.setHours(8 + Math.floor(Math.random() * 2), Math.floor(Math.random() * 60));

                records.push({
                    id: `att-${dateStr}-${student.id}`,
                    studentId: student.id,
                    sessionId: `sess-${dateStr}-${schoolClass.id}`,
                    classId: schoolClass.id,
                    date: dateStr,
                    status,
                    minutesAttended,
                    createdAt: createdAt.toISOString(),
                });
            }
        }
    }
    MOCK_RECORDS = records;
};

// Initialize data on load
generateMockData();

// --- MOCK API FUNCTIONS ---
const delay = (ms: number) => new Promise(res => setTimeout(res, ms));

interface SaveAttendancePayload {
    siteId: string;
    classId: string;
    date: string; // YYYY-MM-DD
    entries: AttendanceEntry[];
    actor: { id: string; name: string; }; // Added for audit
    className: string; // Added for audit
}

export const saveAttendance = async (payload: SaveAttendancePayload): Promise<{ success: true }> => {
    await delay(800);
    console.log('Saving attendance:', payload);
    
    // Instrumentation
    logAuditEvent({
        actorId: payload.actor.id,
        actorName: payload.actor.name,
        action: 'UPDATE',
        module: 'ATTENDANCE',
        entityType: 'AttendanceSheet',
        entityId: `${payload.classId}-${payload.date}`,
        entityDisplay: `${payload.className} on ${payload.date}`,
        meta: {
            entriesCount: payload.entries.length,
        }
    });

    // In a real app, this would persist to a database.
    return Promise.resolve({ success: true });
};


export const listAttendanceRecords = async (params: { classId?: string; from?: string; to?: string }): Promise<AttendanceRecord[]> => {
    await delay(600);
    let results = [...MOCK_RECORDS];
    if (params.classId) {
        results = results.filter(r => r.classId === params.classId);
    }
    if (params.from) {
        results = results.filter(r => r.date >= params.from!);
    }
    if (params.to) {
        results = results.filter(r => r.date <= params.to!);
    }
    return Promise.resolve(results.sort((a, b) => b.createdAt.localeCompare(a.createdAt)));
};

export const getTodaysAttendanceSummary = async (): Promise<{ presentRate: number }> => {
    await delay(550);
    
    // To make the demo robust, let's use the most recent day with data.
    const mostRecentDate = MOCK_RECORDS.reduce((max, r) => r.date > max ? r.date : max, '1970-01-01');
    if (mostRecentDate === '1970-01-01') {
        return Promise.resolve({ presentRate: 0 });
    }
    const recentRecords = MOCK_RECORDS.filter(r => r.date === mostRecentDate);
    
    if (recentRecords.length === 0) return Promise.resolve({ presentRate: 0 });
    
    const presentCount = recentRecords.filter(r => r.status === 'PRESENT' || r.status === 'LATE').length;
    return Promise.resolve({ presentRate: (presentCount / recentRecords.length) * 100 });
};

export const getWeeklyEmailSettings = async (): Promise<WeeklyEmailSettings> => {
    await delay(200);
    return Promise.resolve(MOCK_SETTINGS);
};

export const updateWeeklyEmailSettings = async (settings: WeeklyEmailSettings): Promise<WeeklyEmailSettings> => {
    await delay(500);
    MOCK_SETTINGS = { ...settings };
    // To test a failure case:
    // return Promise.reject(new Error("Failed to save settings."));
    return Promise.resolve(MOCK_SETTINGS);
};


// --- SERVER EXPORT STUBS ---
const mockExport = async (type: string) => {
    await delay(1500);
    const blob = new Blob([`This is a mock ${type} export from the server.`], { type: 'text/plain' });
    const url = URL.createObjectURL(blob);
    return Promise.resolve({ url });
};

export const exportRecordsCSV = () => mockExport('Records CSV');
export const exportRecordsPDF = () => mockExport('Records PDF');
export const exportAnalyticsCSV = () => mockExport('Analytics CSV');
export const exportAnalyticsPDF = () => mockExport('Analytics PDF');
