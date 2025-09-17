import type { Homework, Submission, Feedback, User } from '../types';
import { getStudentsByClass } from './schoolService';
import { logAuditEvent } from './auditService';

// --- MOCK DATA STORE ---
const getISODateDaysFromNow = (days: number): string => {
    const date = new Date();
    date.setDate(date.getDate() + days);
    return date.toISOString().split('T')[0];
};

let MOCK_HOMEWORK: Homework[] = [
    { id: 'hw-1', classId: 'c1', subjectId: 'subj-1', title: 'Algebra Worksheet 1', instructions: 'Complete all odd-numbered problems.', dueDate: getISODateDaysFromNow(5), assignedAt: new Date().toISOString() },
    { id: 'hw-2', classId: 'c2', subjectId: 'subj-2', title: 'Newton\'s Laws Essay', instructions: 'Write a 500-word essay on the First Law of Motion.', dueDate: getISODateDaysFromNow(10), assignedAt: new Date().toISOString() },
    { id: 'hw-3', classId: 'c1', subjectId: 'subj-4', title: 'Poem Analysis', instructions: 'Analyze "The Road Not Taken".', dueDate: getISODateDaysFromNow(-2), assignedAt: new Date(Date.now() - 7 * 24 * 60 * 60 * 1000).toISOString() },
];

let MOCK_SUBMISSIONS: Submission[] = [
    // For hw-3 (in the past)
    { id: 'sub-1', homeworkId: 'hw-3', studentId: 's01', status: 'On-time', submittedAt: new Date(Date.now() - 3 * 24 * 60 * 60 * 1000).toISOString() },
    { id: 'sub-2', homeworkId: 'hw-3', studentId: 's02', status: 'Late', submittedAt: new Date(Date.now() - 1 * 24 * 60 * 60 * 1000).toISOString() },
    { id: 'sub-3', homeworkId: 'hw-3', studentId: 's03', status: 'Not Submitted' },
];

let MOCK_FEEDBACK: Feedback[] = [
    { id: 'fb-1', submissionId: 'sub-1', score: 95, comments: 'Excellent work!', returnedAt: new Date().toISOString() },
];

// --- MOCK API FUNCTIONS ---
const delay = (ms: number) => new Promise(res => setTimeout(res, ms));

export const listHomework = async (params: { classId?: string; subjectId?: string }): Promise<Homework[]> => {
    await delay(400);
    let results = [...MOCK_HOMEWORK];
    if (params.classId) results = results.filter(h => h.classId === params.classId);
    if (params.subjectId) results = results.filter(h => h.subjectId === params.subjectId);
    return results.sort((a, b) => b.assignedAt.localeCompare(a.assignedAt));
};

export const getHomework = async (id: string): Promise<Homework | null> => {
    await delay(200);
    return MOCK_HOMEWORK.find(h => h.id === id) || null;
};

export const createHomework = async (input: Omit<Homework, 'id' | 'assignedAt'>, actor: User): Promise<Homework> => {
    await delay(600);
    const newHomework: Homework = {
        ...input,
        id: `hw-${Date.now()}`,
        assignedAt: new Date().toISOString(),
    };
    MOCK_HOMEWORK.unshift(newHomework);
    logAuditEvent({ actorId: actor.id, actorName: actor.name, action: 'CREATE', module: 'HOMEWORK', entityType: 'Homework', entityId: newHomework.id, entityDisplay: newHomework.title, after: newHomework });
    return newHomework;
};

export const listSubmissionsForHomework = async (homeworkId: string): Promise<Submission[]> => {
    await delay(500);
    const homework = MOCK_HOMEWORK.find(h => h.id === homeworkId);
    if (!homework) return [];

    const students = await getStudentsByClass(homework.classId);
    const existingSubmissions = MOCK_SUBMISSIONS.filter(s => s.homeworkId === homeworkId);
    const submissionMap = new Map(existingSubmissions.map(s => [s.studentId, s]));

    const fullSubmissionList = students.map(student => {
        if (submissionMap.has(student.id)) {
            return submissionMap.get(student.id)!;
        }
        return {
            id: `sub-placeholder-${homeworkId}-${student.id}`,
            homeworkId,
            studentId: student.id,
            status: 'Not Submitted' as const,
        };
    });

    return fullSubmissionList;
};

export const getSubmission = async (id: string): Promise<(Submission & { feedback?: Feedback }) | null> => {
    await delay(300);
    const submission = MOCK_SUBMISSIONS.find(s => s.id === id);
    if (!submission) return null;
    const feedback = MOCK_FEEDBACK.find(f => f.submissionId === id);
    return { ...submission, feedback };
};

export const saveFeedback = async (submissionId: string, input: Omit<Feedback, 'id' | 'submissionId' | 'returnedAt'>, actor: User): Promise<Feedback> => {
    await delay(700);
    const submission = MOCK_SUBMISSIONS.find(s => s.id === submissionId);
    if (!submission) throw new Error("Submission not found");

    const newFeedback: Feedback = {
        ...input,
        id: `fb-${Date.now()}`,
        submissionId,
        returnedAt: new Date().toISOString(),
    };
    
    // Remove old feedback if it exists and add new one
    MOCK_FEEDBACK = MOCK_FEEDBACK.filter(f => f.submissionId !== submissionId);
    MOCK_FEEDBACK.push(newFeedback);
    
    logAuditEvent({ actorId: actor.id, actorName: actor.name, action: 'GRADE', module: 'HOMEWORK', entityType: 'Submission', entityId: submission.id, entityDisplay: `Submission for HW ${submission.homeworkId}`, after: newFeedback });

    return newFeedback;
};
