import type { User, Audience, AudienceRule, CommunicationTemplate, Campaign, Message, CommunicationChannel, CampaignStatus, MessageStatus } from '../types';
import { logAuditEvent } from './auditService';
import { getStudents } from './schoolService';
import { listInvoices } from './feesService';

// --- MOCK DATA STORE ---
let MOCK_AUDIENCES: Audience[] = [
    { id: 'aud-1', name: 'All Students', description: 'All active students in the school.', rules: [] },
    { id: 'aud-2', name: 'Form 1 Parents (Fees Overdue)', description: 'Guardians of Form 1 students with overdue fees.', rules: [
        { field: 'classId', condition: 'is', value: 'c1' },
        { field: 'feeStatus', condition: 'is', value: 'Overdue' }
    ]},
];

let MOCK_TEMPLATES: CommunicationTemplate[] = [
    { id: 'tpl-1', name: 'General Announcement', channel: 'Email', subject: 'Important Announcement from FWBC', body: 'Dear {{guardian.name}},\n\nThis is an important announcement...\n\nRegards,\nFWBC' },
    { id: 'tpl-2', name: 'Fee Reminder', channel: 'SMS', subject: '', body: 'FWBC Reminder: The fees for {{student.name}} are due. Please check the portal. Thank you.' },
];

let MOCK_CAMPAIGNS: Campaign[] = [];
let MOCK_MESSAGES: Message[] = [];

// --- MOCK API FUNCTIONS ---
const delay = (ms: number) => new Promise(res => setTimeout(res, ms));

// --- Audiences ---
export const listAudiences = async (): Promise<Audience[]> => {
    await delay(200);
    return JSON.parse(JSON.stringify(MOCK_AUDIENCES));
};

export const saveAudience = async (audience: Omit<Audience, 'id'> | Audience, actor: User): Promise<Audience> => {
    await delay(400);
    if ('id' in audience) {
        const index = MOCK_AUDIENCES.findIndex(a => a.id === audience.id);
        if (index > -1) MOCK_AUDIENCES[index] = audience;
        return audience;
    } else {
        const newAudience: Audience = { ...audience, id: `aud-${Date.now()}` };
        MOCK_AUDIENCES.push(newAudience);
        return newAudience;
    }
};

export const resolveAudience = async (audienceId: string): Promise<{ id: string, name: string }[]> => {
    await delay(800);
    const audience = MOCK_AUDIENCES.find(a => a.id === audienceId);
    if (!audience) return [];

    let { students } = await getStudents({ limit: 5000 });
    const invoices = await listInvoices({});

    // Apply rules
    for (const rule of audience.rules) {
        if (rule.field === 'classId' && rule.condition === 'is') {
            students = students.filter(s => s.classId === rule.value);
        }
        if (rule.field === 'feeStatus' && rule.condition === 'is') {
            const overdueStudentIds = new Set(invoices.filter(i => i.status === rule.value).map(i => i.studentId));
            students = students.filter(s => overdueStudentIds.has(s.id));
        }
    }
    return students.map(s => ({ id: s.id, name: s.name }));
};

// --- Templates ---
export const listTemplates = async (): Promise<CommunicationTemplate[]> => {
    await delay(200);
    return JSON.parse(JSON.stringify(MOCK_TEMPLATES));
};

// --- Campaigns & Messages ---
export const createCampaign = async (campaign: Omit<Campaign, 'id' | 'status' | 'createdAt'>, recipients: { id: string, name: string }[], actor: User): Promise<Campaign> => {
    await delay(1000);
    const newCampaign: Campaign = {
        ...campaign,
        id: `camp-${Date.now()}`,
        status: 'Queued',
        createdAt: new Date().toISOString(),
    };
    MOCK_CAMPAIGNS.push(newCampaign);

    const template = MOCK_TEMPLATES.find(t => t.id === newCampaign.templateId)!;
    
    // Create individual messages
    const newMessages: Message[] = recipients.map(r => ({
        id: `msg-${newCampaign.id}-${r.id}`,
        campaignId: newCampaign.id,
        recipientId: r.id,
        channel: template.channel,
        status: 'Queued',
    }));
    MOCK_MESSAGES.push(...newMessages);
    
    // Simulate sending process
    setTimeout(() => {
        newCampaign.status = 'Sending';
        newMessages.forEach(msg => {
            setTimeout(() => {
                msg.status = Math.random() > 0.1 ? 'Delivered' : 'Failed';
                msg.sentAt = new Date().toISOString();
                if(msg.status === 'Failed') msg.failedReason = 'Invalid phone number';
            }, Math.random() * 2000);
        });
        setTimeout(() => { newCampaign.status = 'Sent'; }, 2500);
    }, 1000);

    logAuditEvent({ actorId: actor.id, actorName: actor.name, action: 'CREATE', module: 'COMMUNICATIONS', entityType: 'Campaign', entityId: newCampaign.id, entityDisplay: newCampaign.name, meta: { recipients: recipients.length } });

    return newCampaign;
};

export const listCampaigns = async (): Promise<Campaign[]> => {
    await delay(400);
    return MOCK_CAMPAIGNS.sort((a,b) => b.createdAt.localeCompare(a.createdAt));
};

export const listMessages = async (params: { campaignId?: string }): Promise<Message[]> => {
    await delay(500);
    if(params.campaignId) return MOCK_MESSAGES.filter(m => m.campaignId === params.campaignId);
    return MOCK_MESSAGES;
};