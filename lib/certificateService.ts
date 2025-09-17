
import type { User } from '../types';

// This is a complete mock service. In a real application, this would involve
// interactions with a database, a templating engine (like Puppeteer for PDF),
// and potentially a blockchain for verification.

// --- MOCK DATA STORE ---
let MOCK_TEMPLATES = [
    { id: 'tpl-1', name: 'Certificate of Achievement', design: { backgroundColor: '#e0f2fe', textColor: '#0c4a6e', logoUrl: '/logo.png' } },
    { id: 'tpl-2', name: 'Course Completion', design: { backgroundColor: '#f0fdf4', textColor: '#166534', logoUrl: '/logo.png' } },
];

let MOCK_ISSUES = [
    { id: 'iss-1', templateId: 'tpl-1', studentId: 's01', studentName: 'Alice Johnson', issueDate: '2025-06-15', details: 'For outstanding performance in Mathematics.', verificationCode: 'VERIFY-ABC-123' },
    { id: 'iss-2', templateId: 'tpl-2', studentId: 's02', studentName: 'Bob Williams', issueDate: '2025-06-20', details: 'Completed the "Introduction to Physics" course.', verificationCode: 'VERIFY-DEF-456' },
];

// --- MOCK API FUNCTIONS ---
const delay = (ms: number) => new Promise(res => setTimeout(res, ms));

// --- Templates ---
export const listTemplates = async () => {
    await delay(300);
    return [...MOCK_TEMPLATES];
};

export const getTemplate = async (id: string) => {
    await delay(200);
    return MOCK_TEMPLATES.find(t => t.id === id) || null;
};

export const saveTemplate = async (template: any, actor: User) => {
    await delay(500);
    if (template.id) {
        const index = MOCK_TEMPLATES.findIndex(t => t.id === template.id);
        if (index > -1) MOCK_TEMPLATES[index] = template;
    } else {
        const newTemplate = { ...template, id: `tpl-${Date.now()}` };
        MOCK_TEMPLATES.push(newTemplate);
    }
};

// --- Issuance ---
export const listIssuedCertificates = async () => {
    await delay(400);
    return [...MOCK_ISSUES];
};

export const issueCertificates = async (templateId: string, studentIds: string[], details: string, actor: User) => {
    await delay(1000);
    // In a real app, you would fetch student names
    const newIssues = studentIds.map(sid => ({
        id: `iss-${Date.now()}-${sid}`,
        templateId,
        studentId: sid,
        studentName: `Student ${sid}`,
        issueDate: new Date().toISOString().split('T')[0],
        details,
        verificationCode: `VERIFY-${Math.random().toString(36).substring(2, 8).toUpperCase()}`,
    }));
    MOCK_ISSUES.push(...newIssues);
    return { count: newIssues.length };
};

export const revokeCertificate = async (issueId: string, actor: User) => {
    await delay(600);
    MOCK_ISSUES = MOCK_ISSUES.filter(i => i.id !== issueId);
};

// --- Public Verification ---
export const verifyCertificate = async (code: string) => {
    await delay(500);
    const issue = MOCK_ISSUES.find(i => i.verificationCode === code);
    if (!issue) return null;
    const template = MOCK_TEMPLATES.find(t => t.id === issue.templateId);
    return {
        ...issue,
        templateName: template?.name || 'Unknown Template',
    };
};

// --- Student View ---
export const listMyCertificates = async (studentId: string) => {
     await delay(400);
     return MOCK_ISSUES.filter(i => i.studentId === studentId);
};
