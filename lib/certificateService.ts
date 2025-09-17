import type { User, CertificateTemplate, IssuedCertificate, Student } from '../types';
import { logAuditEvent } from './auditService';
import { getStudents } from './schoolService';

// This is a complete mock service. In a real application, this would involve
// interactions with a database, a templating engine (like Puppeteer for PDF),
// and potentially a blockchain for verification.

// --- MOCK DATA STORE ---
let MOCK_TEMPLATES: CertificateTemplate[] = [
    { 
        id: 'tpl-1', name: 'Certificate of Achievement', type: 'Certificate', size: 'A4_Landscape',
        frontDesign: { 
            backgroundColor: '#e0f2fe', 
            elements: [
                { id: 'el-1', type: 'TEXT', content: 'Certificate of Achievement', x: 148.5, y: 30, width: 200, height: 20, fontSize: 36, fontWeight: 'bold', textAlign: 'center', color: '#0c4a6e' },
                { id: 'el-2', type: 'TEXT', content: 'This certifies that', x: 148.5, y: 60, width: 200, height: 10, fontSize: 18, textAlign: 'center', color: '#0c4a6e' },
                { id: 'el-3', type: 'TEXT', content: '{{student.name}}', x: 148.5, y: 80, width: 200, height: 20, fontSize: 32, fontWeight: 'bold', textAlign: 'center', color: '#0c4a6e' },
                { id: 'el-4', type: 'TEXT', content: 'has successfully completed the requirements for', x: 148.5, y: 110, width: 200, height: 10, fontSize: 18, textAlign: 'center', color: '#0c4a6e' },
                { id: 'el-5', type: 'TEXT', content: '{{details.main}}', x: 148.5, y: 130, width: 200, height: 15, fontSize: 24, fontWeight: 'bold', textAlign: 'center', color: '#0c4a6e' },
                { id: 'el-6', type: 'QR_CODE', content: '{{verifyUrl}}', x: 20, y: 170, width: 20, height: 20 },
                { id: 'el-7', type: 'TEXT', content: 'Issued on: {{issue.date}}', x: 20, y: 160, width: 100, height: 10, fontSize: 12, textAlign: 'left', color: '#0c4a6e' }
            ]
        },
    },
    { 
        id: 'tpl-2', name: 'Student ID Card', type: 'ID_Card', size: 'ID_Card_CR80',
        frontDesign: {
            backgroundColor: '#f0fdf4',
            elements: [
                 { id: 'el-10', type: 'IMAGE', content: '{{student.photoUrl}}', x: 10, y: 15, width: 25, height: 25 },
                 { id: 'el-11', type: 'TEXT', content: '{{student.name}}', x: 55, y: 20, width: 40, height: 10, fontSize: 14, fontWeight: 'bold', color: '#166534' },
                 { id: 'el-12', type: 'TEXT', content: '{{student.admissionNo}}', x: 55, y: 30, width: 40, height: 5, fontSize: 10, color: '#166534' },
                 { id: 'el-13', type: 'QR_CODE', content: '{{student.id}}', x: 65, y: 40, width: 15, height: 15 },
            ]
        }
    },
];

let MOCK_ISSUES: IssuedCertificate[] = [
    { id: 'iss-1', templateId: 'tpl-1', studentId: 's01', studentName: 'Alice Johnson', issueDate: '2025-06-15', details: { main: 'Outstanding performance in Mathematics.' }, status: 'Issued', serialNumber: 'CERT-2025-FWBC-000001', qrToken: 'QR-ABC-123' },
    { id: 'iss-2', templateId: 'tpl-2', studentId: 's02', studentName: 'Bob Williams', issueDate: '2025-06-20', expiryDate: '2026-06-20', details: {}, status: 'Issued', serialNumber: 'ID-2025-FWBC-000002', qrToken: 'QR-DEF-456' },
     { id: 'iss-3', templateId: 'tpl-1', studentId: 's03', studentName: 'Charlie Brown', issueDate: '2024-05-10', details: { main: 'Science Fair 1st Place' }, status: 'Revoked', serialNumber: 'CERT-2024-FWBC-000101', qrToken: 'QR-GHI-789', revocation: { reason: 'Issued in error.', revokedAt: new Date().toISOString(), revokedBy: 'Dr. Evelyn Reed' } },
];
let issueCounter = MOCK_ISSUES.length;

// --- MOCK API FUNCTIONS ---
const delay = (ms: number) => new Promise(res => setTimeout(res, ms));

// --- Templates ---
export const listTemplates = async (): Promise<CertificateTemplate[]> => {
    await delay(300);
    return JSON.parse(JSON.stringify(MOCK_TEMPLATES));
};

export const getTemplate = async (id: string): Promise<CertificateTemplate | null> => {
    await delay(200);
    const tpl = MOCK_TEMPLATES.find(t => t.id === id);
    return tpl ? JSON.parse(JSON.stringify(tpl)) : null;
};

export const saveTemplate = async (template: Partial<CertificateTemplate> & { id?: string }, actor: User) => {
    await delay(500);
    if (template.id) {
        const index = MOCK_TEMPLATES.findIndex(t => t.id === template.id);
        if (index > -1) MOCK_TEMPLATES[index] = template as CertificateTemplate;
    } else {
        const newTemplate: CertificateTemplate = {
            id: `tpl-${Date.now()}`,
            name: template.name || 'Untitled Template',
            type: template.type || 'Certificate',
            size: template.size || 'A4_Landscape',
            frontDesign: template.frontDesign || { backgroundColor: '#ffffff', elements: [] }
        };
        MOCK_TEMPLATES.push(newTemplate);
    }
};

// --- Issuance ---
export const listIssuedCertificates = async (): Promise<IssuedCertificate[]> => {
    await delay(400);
    return [...MOCK_ISSUES];
};

export const issueCertificates = async (templateId: string, studentIds: string[], details: Record<string, string>, actor: User): Promise<{ count: number }> => {
    await delay(1000);
    const { students } = await getStudents({ limit: 1000 });
    const studentMap = new Map(students.map(s => [s.id, s]));
    const template = MOCK_TEMPLATES.find(t => t.id === templateId);
    if (!template) throw new Error("Template not found");

    const newIssues: IssuedCertificate[] = [];
    for (const sid of studentIds) {
        issueCounter++;
        const student = studentMap.get(sid);
        if(!student) continue;

        const serialPrefix = template.type === 'ID_Card' ? 'ID' : 'CERT';
        const serialNumber = `${serialPrefix}-${new Date().getFullYear()}-FWBC-${issueCounter.toString().padStart(6, '0')}`;
        
        const issue: IssuedCertificate = {
            id: `iss-${Date.now()}-${sid}`,
            templateId,
            studentId: sid,
            studentName: student.name,
            issueDate: new Date().toISOString().split('T')[0],
            details,
            status: 'Issued',
            serialNumber,
            qrToken: `QR-${Math.random().toString(36).substring(2, 11).toUpperCase()}`,
        };
        if(template.type === 'ID_Card') {
            const expiry = new Date();
            expiry.setFullYear(expiry.getFullYear() + 1);
            issue.expiryDate = expiry.toISOString().split('T')[0];
        }
        newIssues.push(issue);
    };

    MOCK_ISSUES.push(...newIssues);
    logAuditEvent({ actorId: actor.id, actorName: actor.name, action: 'CREATE', module: 'CERTIFICATES', entityType: 'Certificate', entityDisplay: `Batch issue (${newIssues.length})`, meta: { count: newIssues.length, templateId } });
    return { count: newIssues.length };
};

export const revokeIssue = async (issueId: string, reason: string, actor: User) => {
    await delay(600);
    const issue = MOCK_ISSUES.find(i => i.id === issueId);
    if(issue) {
        issue.status = 'Revoked';
        issue.revocation = {
            reason,
            revokedAt: new Date().toISOString(),
            revokedBy: actor.name,
        };
        logAuditEvent({ actorId: actor.id, actorName: actor.name, action: 'UPDATE', module: 'CERTIFICATES', entityType: 'Certificate', entityId: issueId, entityDisplay: `Certificate for ${issue.studentName}`, meta: { newStatus: 'Revoked', reason } });
    }
};

// --- Public Verification ---
export const verifyBySerial = async (serial: string) => {
    await delay(500);
    logAuditEvent({ actorId: 'public', actorName: 'Public User', action: 'UPDATE', module: 'CERTIFICATES', entityType: 'Verification', entityDisplay: serial });
    const issue = MOCK_ISSUES.find(i => i.serialNumber === serial);
    if (!issue) return null;
    const template = MOCK_TEMPLATES.find(t => t.id === issue.templateId);
    return {
        studentName: issue.studentName,
        templateName: template?.name || 'Unknown Template',
        issueDate: issue.issueDate,
        status: issue.status,
        revocation: issue.revocation,
    };
};

// --- Student View ---
export const listMyCertificates = async (studentId: string): Promise<IssuedCertificate[]> => {
     await delay(400);
     return MOCK_ISSUES.filter(i => i.studentId === studentId);
};
