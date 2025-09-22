import type { IssuedCertificate, CertificateTemplate, CertificateStatus, User, CertificateType } from '../types';
import { logAuditEvent } from './auditService';

// --- MOCK DATA STORE ---
const getISODateDaysAgo = (days: number): string => {
    const date = new Date();
    date.setDate(date.getDate() - days);
    return date.toISOString();
};

const MOCK_TEMPLATES: CertificateTemplate[] = [
    { id: 'tpl-id-card-2025', name: 'Student ID Card 2025', type: 'ID_CARD', widthMm: 85.6, heightMm: 53.98, frontLayers: [], backLayers: [] },
    { id: 'tpl-cert-excellence', name: 'Certificate of Excellence', type: 'CERTIFICATE', widthMm: 297, heightMm: 210, frontLayers: [], backLayers: [] },
];

let MOCK_ISSUED_CERTIFICATES: IssuedCertificate[] = [
    { id: 'issue-1', serialNo: 'ID-2025-FWBC-000001', qrToken: 'qr_tok_1a2b3c', templateId: 'tpl-id-card-2025', holderId: 's01', holderName: 'Alice Johnson', status: 'Valid', issuedAt: getISODateDaysAgo(30), expiresAt: '2025-08-31T23:59:59Z' },
    { id: 'issue-2', serialNo: 'ID-2025-FWBC-000002', qrToken: 'qr_tok_4d5e6f', templateId: 'tpl-id-card-2025', holderId: 's02', holderName: 'Bob Williams', status: 'Valid', issuedAt: getISODateDaysAgo(30), expiresAt: '2025-08-31T23:59:59Z' },
    { id: 'issue-3', serialNo: 'CERT-2025-FWBC-000003', qrToken: 'qr_tok_7g8h9i', templateId: 'tpl-cert-excellence', holderId: 's01', holderName: 'Alice Johnson', status: 'Valid', issuedAt: getISODateDaysAgo(15) },
    { id: 'issue-4', serialNo: 'ID-2024-FWBC-000004', qrToken: 'qr_tok_j1k2l3', templateId: 'tpl-id-card-2025', holderId: 's03', holderName: 'Charlie Brown', status: 'Revoked', issuedAt: getISODateDaysAgo(300), expiresAt: '2024-08-31T23:59:59Z', revokedAt: getISODateDaysAgo(100), revocationReason: 'Student left the school.' },
    { id: 'issue-5', serialNo: 'ID-2024-FWBC-000005', qrToken: 'qr_tok_m4n5o6', templateId: 'tpl-id-card-2025', holderId: 's04', holderName: 'Diana Miller', status: 'Expired', issuedAt: getISODateDaysAgo(400), expiresAt: '2024-08-31T23:59:59Z' },
];

// --- MOCK API ---
const delay = (ms: number) => new Promise(res => setTimeout(res, ms));

export const listIssuedCertificates = async (): Promise<IssuedCertificate[]> => {
    await delay(500);
    return JSON.parse(JSON.stringify(MOCK_ISSUED_CERTIFICATES.sort((a, b) => b.issuedAt.localeCompare(a.issuedAt))));
};

export const getTemplates = async (): Promise<CertificateTemplate[]> => {
    await delay(200);
    return JSON.parse(JSON.stringify(MOCK_TEMPLATES));
};

export const getIssuedCertificateBySerial = async (serialNo: string): Promise<IssuedCertificate | null> => {
    await delay(400);
    const cert = MOCK_ISSUED_CERTIFICATES.find(c => c.serialNo === serialNo);
    return cert ? JSON.parse(JSON.stringify(cert)) : null;
};

export const revokeCertificate = async (id: string, reason: string, actor: User): Promise<IssuedCertificate> => {
    await delay(600);
    const index = MOCK_ISSUED_CERTIFICATES.findIndex(c => c.id === id);
    if (index === -1) throw new Error("Certificate not found");
    
    const before = { ...MOCK_ISSUED_CERTIFICATES[index] };

    MOCK_ISSUED_CERTIFICATES[index].status = 'Revoked';
    MOCK_ISSUED_CERTIFICATES[index].revokedAt = new Date().toISOString();
    MOCK_ISSUED_CERTIFICATES[index].revocationReason = reason;

    const after = MOCK_ISSUED_CERTIFICATES[index];
    
    logAuditEvent({
        actorId: actor.id,
        actorName: actor.name,
        action: 'REVOKE',
        module: 'CERTIFICATES',
        entityType: 'Certificate',
        entityId: after.id,
        entityDisplay: after.serialNo,
        before,
        after,
        meta: { reason },
    });

    return after;
};
