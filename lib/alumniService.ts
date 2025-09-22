import type { Alumni, AlumniEvent, Donation, User } from '../types';
import { logAuditEvent } from './auditService';

// --- MOCK DATA STORE ---
let MOCK_ALUMNI: Alumni[] = [
    { 
        id: 's01', studentId: 's01', name: 'Alice Johnson', graduationYear: 2020, degree: 'BSc Computer Science', 
        profession: 'Software Engineer', company: 'Tech Corp', 
        contact: { email: 'alice.alumni@example.com', phone: '555-1111', linkedin: 'linkedin.com/in/alicej' },
        privacy: { profilePublic: true, contactPublic: true, mentorshipOptIn: true }
    },
    { 
        id: 's02', studentId: 's02', name: 'Bob Williams', graduationYear: 2021, degree: 'BA History',
        profession: 'Archivist', company: 'National Museum',
        contact: { email: 'bob.alumni@example.com' },
        privacy: { profilePublic: true, contactPublic: false, mentorshipOptIn: false }
    },
    { 
        id: 's03', studentId: 's03', name: 'Charlie Brown', graduationYear: 2020, degree: 'BSc Physics',
        profession: 'Researcher', company: 'University Labs',
        contact: { email: 'charlie.alumni@example.com' },
        privacy: { profilePublic: false, contactPublic: false, mentorshipOptIn: true }
    },
];

let MOCK_EVENTS: AlumniEvent[] = [
    { id: 'ae-1', title: 'Alumni Homecoming 2025', date: '2025-10-15T18:00:00Z', location: 'Main Hall', description: 'Join us for the annual homecoming event.' },
    { id: 'ae-2', title: 'London Networking Night', date: '2025-11-20T19:00:00Z', location: 'The Griffin Pub, London', description: 'An informal get-together for alumni in the London area.' },
];

let MOCK_DONATIONS: Donation[] = [
    { id: 'don-1', alumniId: 's01', amount: 100, date: '2025-08-01', campaign: 'Library Fund', isAnonymous: false },
    { id: 'don-2', alumniId: 's03', amount: 50, date: '2025-07-20', isAnonymous: true },
];

// --- MOCK API ---
const delay = (ms: number) => new Promise(res => setTimeout(res, ms));

export const listAlumni = async (isPublicDirectory: boolean = false): Promise<Partial<Alumni>[]> => {
    await delay(500);
    let results = MOCK_ALUMNI;
    if (isPublicDirectory) {
        results = results.filter(a => a.privacy.profilePublic);
    }
    // Sanitize data for directory view
    return results.map(alumnus => {
        const publicProfile: Partial<Alumni> = {
            id: alumnus.id,
            name: alumnus.name,
            graduationYear: alumnus.graduationYear,
            profession: alumnus.profession,
            company: alumnus.company,
        };
        if (alumnus.privacy.contactPublic) {
            publicProfile.contact = { email: alumnus.contact.email, linkedin: alumnus.contact.linkedin };
        }
        return publicProfile;
    });
};

export const getAlumniProfile = async (alumniId: string): Promise<Alumni | null> => {
    await delay(300);
    const profile = MOCK_ALUMNI.find(a => a.id === alumniId);
    return profile ? JSON.parse(JSON.stringify(profile)) : null;
};

export const updateAlumniProfile = async (alumniId: string, update: Partial<Alumni>, actor: User): Promise<Alumni> => {
    await delay(600);
    // Security check: Only admins or the alumnus themself can update
    if (!actor.scopes.includes('alumni:admin') && actor.alumniId !== alumniId) {
        throw new Error("Permission denied.");
    }

    const index = MOCK_ALUMNI.findIndex(a => a.id === alumniId);
    if (index === -1) throw new Error("Alumni not found");

    const before = { ...MOCK_ALUMNI[index] };
    MOCK_ALUMNI[index] = { ...MOCK_ALUMNI[index], ...update };
    const after = MOCK_ALUMNI[index];
    
    logAuditEvent({ actorId: actor.id, actorName: actor.name, action: 'UPDATE', module: 'ALUMNI', entityType: 'AlumniProfile', entityId: alumniId, entityDisplay: after.name, before, after });

    return after;
};

export const listAlumniEvents = async (): Promise<AlumniEvent[]> => {
    await delay(400);
    return JSON.parse(JSON.stringify(MOCK_EVENTS));
};

export const listDonations = async (): Promise<(Donation & { alumniName?: string })[]> => {
    await delay(500);
    return MOCK_DONATIONS.map(d => ({
        ...d,
        alumniName: d.isAnonymous ? 'Anonymous' : MOCK_ALUMNI.find(a => a.id === d.alumniId)?.name || 'Unknown',
    })).sort((a,b) => b.date.localeCompare(a.date));
};

export const createDonation = async (input: Omit<Donation, 'id'>, actor: User): Promise<Donation> => {
    await delay(800);
    const newDonation: Donation = { ...input, id: `don-${Date.now()}` };
    MOCK_DONATIONS.push(newDonation);
    logAuditEvent({ actorId: actor.id, actorName: actor.name, action: 'CREATE', module: 'ALUMNI', entityType: 'Donation', entityId: newDonation.id, entityDisplay: `£${newDonation.amount}`, after: newDonation });
    return newDonation;
};
