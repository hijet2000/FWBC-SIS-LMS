import type { TenantSettings, Holiday, User } from '../types';
import { logAuditEvent } from './auditService';

let MOCK_SETTINGS: TenantSettings = {
    branding: {
        siteTitle: 'FWBC School 2025',
        primaryColor: '#4f46e5',
        logoUrl: '/logo.png',
    },
    locale: {
        language: 'en-GB',
        timezone: 'Europe/London',
        dateFormat: 'DD/MM/YYYY',
        timeFormat: '24h',
    },
    modules: {
        sis: { enabled: true, name: 'Student Information System', description: 'Core student records, attendance, and academics.' },
        lms: { enabled: true, name: 'Learning Management System', description: 'Digital library, courses, and catch-up content.' },
        admissions: { enabled: true, name: 'Admissions', description: 'Manages student applications and intake.' },
        frontoffice: { enabled: true, name: 'Front Office', description: 'Visitor, call, and postal logs.' },
        fees: { enabled: true, name: 'Fees Management', description: 'Handles fee structures and payments.' },
        finance: { enabled: true, name: 'Finance', description: 'General ledger for non-fee income and expenses.' },
        library: { enabled: true, name: 'Physical Library', description: 'Manages physical book catalog and circulation.' },
        hostel: { enabled: false, name: 'Hostel Management', description: 'Manages student boarding facilities.' },
        transport: { enabled: false, name: 'Transport', description: 'Manages school bus routes and vehicles.' },
        inventory: { enabled: true, name: 'Inventory & Assets', description: 'Tracks school supplies and trackable assets.' },
        hr: { enabled: true, name: 'HR', description: 'Manages staff records and leave.' },
        payroll: { enabled: false, name: 'Payroll', description: 'Handles staff salary processing.' },
        alumni: { enabled: false, name: 'Alumni Portal', description: 'Manages the alumni network and donations.' },
        cms: { enabled: true, name: 'Website CMS', description: 'Manages the public-facing website.' },
        certificates: { enabled: true, name: 'Certificates', description: 'Issues and verifies digital certificates.' },
    }
};

let MOCK_HOLIDAYS: Holiday[] = [
    { id: 'hol-1', name: 'Christmas Day', date: '2025-12-25' },
    { id: 'hol-2', name: 'Boxing Day', date: '2025-12-26' },
    { id: 'hol-3', name: 'New Year\'s Day', date: '2026-01-01' },
];

const delay = (ms: number) => new Promise(res => setTimeout(res, ms));

export const getTenantSettings = async (): Promise<TenantSettings> => {
    await delay(200);
    return JSON.parse(JSON.stringify(MOCK_SETTINGS));
};

export const updateTenantSettings = async (settings: TenantSettings, actor: User): Promise<TenantSettings> => {
    await delay(500);
    const before = JSON.parse(JSON.stringify(MOCK_SETTINGS));
    MOCK_SETTINGS = JSON.parse(JSON.stringify(settings));
    logAuditEvent({ actorId: actor.id, actorName: actor.name, action: 'UPDATE', module: 'SETTINGS', entityType: 'TenantSettings', entityId: 'global', entityDisplay: 'Tenant Settings', before, after: MOCK_SETTINGS });
    return MOCK_SETTINGS;
};

export const listHolidays = async (): Promise<Holiday[]> => {
    await delay(150);
    return JSON.parse(JSON.stringify(MOCK_HOLIDAYS.sort((a,b) => a.date.localeCompare(b.date))));
};

export const addHoliday = async (input: Omit<Holiday, 'id'>, actor: User): Promise<Holiday> => {
    await delay(300);
    const newHoliday: Holiday = { ...input, id: `hol-${Date.now()}` };
    MOCK_HOLIDAYS.push(newHoliday);
    logAuditEvent({ actorId: actor.id, actorName: actor.name, action: 'CREATE', module: 'SETTINGS', entityType: 'Holiday', entityId: newHoliday.id, entityDisplay: newHoliday.name, after: newHoliday });
    return newHoliday;
};

export const deleteHoliday = async (id: string, actor: User): Promise<void> => {
    await delay(300);
    MOCK_HOLIDAYS = MOCK_HOLIDAYS.filter(h => h.id !== id);
    logAuditEvent({ actorId: actor.id, actorName: actor.name, action: 'DELETE', module: 'SETTINGS', entityType: 'Holiday', entityId: id });
};
