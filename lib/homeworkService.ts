import type { Homework, Submission, Feedback, User, SubmissionStatus, HomeworkPolicy, HomeworkNotificationSettings, HomeworkAttachment } from '../types';
import { getStudentsByClass } from './schoolService';
import { logAuditEvent } from './auditService';

// --- MOCK DATA STORE ---
const getISODateDaysFromNow = (days: number): string => {
    const date = new Date();
    date.setDate(date.getDate() + days);
    return date.toISOString().split('T')[0];
};

const DEFAULT_POLICY: HomeworkPolicy = {
    lateGraceMinutes: 60, // 1 hour grace period
    latePenaltyPct: 0, // No penalty by default
    maxSubmissions: 3,
};

const STRICT_POLICY: HomeworkPolicy = {
    lateGraceMinutes: 0,
    latePenaltyPct: 25, // 25% penalty for being late
    maxSubmissions: 1,
};


let MOCK_HOMEWORK: Homework[] = [
    { id: 'hw-1', classId: 'c1', subjectId: 'subj-1', title: 'Algebra Worksheet 1', instructions: 'Complete all odd-numbered problems.', dueDate: getISODateDaysFromNow(5), assignedAt: new Date().toISOString(), policy: DEFAULT_POLICY, status: 'Published', attachments: [{id: 'att-1', fileName: 'worksheet.pdf', resourceId: 'res-alg-ws-1'}] },
    { id: 'hw-2', classId: 'c2', subjectId: 'subj-2', title: 'Newton\'s Laws Essay', instructions: 'Write a 500-word essay on the First Law of Motion.', dueDate: getISODateDaysFromNow(10), assignedAt: new Date().toISOString(), policy: DEFAULT_POLICY, status: 'Published', attachments: [] },
    { id: 'hw-3', classId: 'c1', subjectId: 'subj-4', title: 'Poem Analysis', instructions: 'Analyze "The Road Not Taken".', dueDate: getISODateDaysFromNow(-2), assignedAt: new Date(Date.now() - 7 * 24 * 60 * 60 * 1000).toISOString(), policy: STRICT_POLICY, status: 'Published', attachments: [] },
    { id: 'hw-4', classId: 'c2', subjectId: 'subj-2', title: 'Lab Report: Gravity', instructions: 'Submit your findings from the gravity experiment.', dueDate: getISODateDaysFromNow(-5), assignedAt: new Date(Date.now() - 10 * 24 * 60 * 60 * 1000).toISOString(), policy: STRICT_POLICY, status: 'Archived', attachments: [] },
];

let MOCK_SUBMISSIONS: Submission[] = [
    // For hw-3 (in the past)
    { id: 'sub-1', homeworkId: 'hw-3', studentId: 's01', status: 'On-time', submittedAt: new Date(Date.now() - 3 * 24 * 60 * 60 * 1000).toISOString(), submissionText: 'Here is my analysis of the poem. The two roads symbolize the choices we make in life...', submissionCount: 1, attachments: [] },
    { id: 'sub-2', homeworkId: 'hw-3', studentId: 's02', status: 'Late', submittedAt: new Date(Date.now() - 1 * 24 * 60 * 60 * 1000).toISOString(), submissionText: 'Sorry for the late submission.', submissionCount: 1, attachments: [] },
    { id: 'sub-3', homeworkId: 'hw-3', studentId: 's03', status: 'Not Submitted', submissionCount: 0, attachments: [] },
     // For hw-4
    { id: 'sub-4', homeworkId: 'hw-4', studentId: 's06', status: 'On-time', submittedAt: new Date(Date.now() - 6 * 24 * 60 * 60 * 1000).toISOString(), submissionText: 'Lab report attached.', submissionCount: 1, attachments: [] },
    { id: 'sub-5', homeworkId: 'hw-4', studentId: 's07', status: 'On-time', submittedAt: new Date(Date.now() - 5 * 24 * 60 * 60 * 1000).toISOString(), submissionText: 'Please see my findings.', submissionCount: 1, attachments: [{id: 'att-s-1', fileName: 'my_report.pdf', resourceId: 'res-stu-rep-1'}] },
];

let MOCK_FEEDBACK: Feedback[] = [
    { id: 'fb-1', submissionId: 'sub-1', score: 95, comments: 'Excellent work! A very thoughtful analysis.', returnedAt: new Date().toISOString() },
    // Note: Feedback for sub-2 will demonstrate the penalty. Original score 80, penalty 25% -> final score 60.
    { id: 'fb-2', submissionId: 'sub-2', score: 60, comments: 'Good points, but please be mindful of deadlines. A 25% late penalty was applied.', returnedAt: new Date().toISOString(), meta: { originalScore: 80, penaltyPctApplied: 25 } },
    { id: 'fb-4', submissionId: 'sub-4', score: 88, comments: 'Well-structured report.', returnedAt: new Date().toISOString() },
    { id: 'fb-5', submissionId: 'sub-5', score: 72, comments: 'Good data, but the conclusion could be stronger.', returnedAt: new Date().toISOString() },
];

let MOCK_NOTIFICATION_SETTINGS: HomeworkNotificationSettings = {
    enabled: true,
    triggers: {
        onPublish: true,
        preDueReminder: true,
        onOverdue: true,
        onFeedback: true,
    },
    reminderDaysBefore: 2,
    quietHours: {
        start: 22,
        end: 8,
    },
    throttling: {
        maxPerHour: 100,
    },
};

// --- HELPERS ---
const isQuietHours = (settings: HomeworkNotificationSettings): boolean => {
    const nowHour = new Date().getUTCHours();
    const { start, end } = settings.quietHours;
    if (start > end) { // Overnight case, e.g., 22:00-08:00
        return nowHour >= start || nowHour < end;
    }
    return nowHour >= start && nowHour < end;
};

const sendNotification = (type: string, homework: Homework, meta?: any) => {
    if (!MOCK_NOTIFICATION_SETTINGS.enabled) return;

    const queued = isQuietHours(MOCK_NOTIFICATION_SETTINGS);
    
    logAuditEvent({
        actorId: 'system',
        actorName: 'Smart Notifications',
        action: 'NOTIFY',
        module: 'HOMEWORK',
        entityType: 'Homework',
        entityId: homework.id,
        entityDisplay: homework.title,
        meta: {
            notificationType: type,
            classId: homework.classId,
            queuedForQuietHours: queued,
            ...meta
        }
    });
};


// --- MOCK API FUNCTIONS ---
const delay = (ms: number) => new Promise(res => setTimeout(res, ms));

export const listHomework = async (params: { classId?: string; subjectId?: string } = {}): Promise<Homework[]> => {
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

export const createHomework = async (input: Omit<Homework, 'id' | 'assignedAt' | 'status'>, actor: User): Promise<Homework> => {
    await delay(600);
    const newHomework: Homework = {
        ...input,
        id: `hw-${Date.now()}`,
        assignedAt: new Date().toISOString(),
        status: 'Published',
    };
    MOCK_HOMEWORK.unshift(newHomework);
    logAuditEvent({ actorId: actor.id, actorName: actor.name, action: 'CREATE', module: 'HOMEWORK', entityType: 'Homework', entityId: newHomework.id, entityDisplay: newHomework.title, after: newHomework });
    
    // Trigger notification
    if (MOCK_NOTIFICATION_SETTINGS.triggers.onPublish) {
        sendNotification('OnPublish', newHomework);
    }

    return newHomework;
};

export const updateHomework = async (id: string, input: Partial<Omit<Homework, 'id' | 'assignedAt' | 'status'>>, actor: User): Promise<Homework> => {
    await delay(600);
    const index = MOCK_HOMEWORK.findIndex(h => h.id === id);
    if (index === -1) throw new Error("Homework not found");

    const before = { ...MOCK_HOMEWORK[index] };
    MOCK_HOMEWORK[index] = { ...MOCK_HOMEWORK[index], ...input };
    const after = MOCK_HOMEWORK[index];

    logAuditEvent({ actorId: actor.id, actorName: actor.name, action: 'UPDATE', module: 'HOMEWORK', entityType: 'Homework', entityId: id, entityDisplay: after.title, before, after });
    
    return after;
};

export const archiveHomework = async (id: string, actor: User): Promise<void> => {
    await delay(500);
    const index = MOCK_HOMEWORK.findIndex(h => h.id === id);
    if (index === -1) throw new Error("Homework not found");
    
    const before = { ...MOCK_HOMEWORK[index] };
    MOCK_HOMEWORK[index].status = 'Archived';
    const after = MOCK_HOMEWORK[index];

    logAuditEvent({ actorId: actor.id, actorName: actor.name, action: 'ARCHIVE', module: 'HOMEWORK', entityType: 'Homework', entityId: id, entityDisplay: after.title, before, after });
};

export const getSignedAttachmentUrl = async (resourceId: string, actor: User): Promise<string> => {
    await delay(100);
    // This is a mock. A real service would generate a temporary, signed URL from a cloud provider.
    const token = btoa(`${actor.id}-${resourceId}-${Date.now() + 60000}`); // 1-minute expiry
    console.log(`[Security] Generated signed URL for resource ${resourceId} for user ${actor.id}`);
    return `/secure-assets/${resourceId}?token=${token}`;
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
            submissionCount: 0,
            attachments: [],
        };
    });

    return fullSubmissionList;
};

export const listAllSubmissionsWithFeedback = async (): Promise<(Submission & { feedback?: Feedback })[]> => {
    await delay(500);
    const feedbackMap = new Map(MOCK_FEEDBACK.map(f => [f.submissionId, f]));
    return MOCK_SUBMISSIONS.map(sub => ({
        ...sub,
        feedback: feedbackMap.get(sub.id),
    }));
};

export const getSubmission = async (id: string): Promise<(Submission & { feedback?: Feedback }) | null> => {
    await delay(300);
    const submission = MOCK_SUBMISSIONS.find(s => s.id === id);
    if (!submission) return null;
    const feedback = MOCK_FEEDBACK.find(f => f.submissionId === id);
    return { ...submission, feedback };
};

export const getSubmissionsForStudent = async (studentId: string): Promise<(Submission & { feedback?: Feedback })[]> => {
    await delay(300);
    const submissions = MOCK_SUBMISSIONS.filter(s => s.studentId === studentId);
    return submissions.map(sub => {
        const feedback = MOCK_FEEDBACK.find(f => f.submissionId === sub.id);
        return { ...sub, feedback };
    });
};

export const submitWork = async (homeworkId: string, studentId: string, submissionText: string, attachments: HomeworkAttachment[], actor: User): Promise<Submission> => {
    await delay(700);
    const homework = MOCK_HOMEWORK.find(h => h.id === homeworkId);
    if (!homework) throw new Error("Homework not found");
    
    const policy = homework.policy || DEFAULT_POLICY;
    const existingSubmission = MOCK_SUBMISSIONS.find(s => s.homeworkId === homeworkId && s.studentId === studentId);

    // --- POLICY VALIDATION ---
    if (existingSubmission && existingSubmission.submissionCount >= policy.maxSubmissions) {
        throw new Error(`Maximum number of submissions (${policy.maxSubmissions}) reached.`);
    }

    const now = new Date();
    const dueDate = new Date(homework.dueDate);
    dueDate.setHours(23, 59, 59, 999); // Due at end of day
    
    const dueDateWithGrace = new Date(dueDate.getTime() + (policy.lateGraceMinutes || 0) * 60000);

    const status: SubmissionStatus = now > dueDateWithGrace ? 'Late' : 'On-time';

    const submissionCount = (existingSubmission?.submissionCount || 0) + 1;

    const newSubmissionData: Submission = {
        id: existingSubmission?.id || `sub-${Date.now()}`,
        homeworkId,
        studentId,
        status,
        submittedAt: now.toISOString(),
        submissionText,
        attachments,
        submissionCount,
    };
    
    if (existingSubmission) {
        const index = MOCK_SUBMISSIONS.indexOf(existingSubmission);
        MOCK_SUBMISSIONS[index] = newSubmissionData;
    } else {
        MOCK_SUBMISSIONS.push(newSubmissionData);
    }
    
    logAuditEvent({
        actorId: actor.id,
        actorName: actor.name,
        action: 'UPDATE', // Using UPDATE for both submit and resubmit
        module: 'HOMEWORK',
        entityType: 'Submission',
        entityId: newSubmissionData.id,
        entityDisplay: `Submission for ${homework.title}`,
        meta: { status: newSubmissionData.status, attempt: submissionCount }
    });
    
    return newSubmissionData;
};


export const saveFeedback = async (submissionId: string, input: Omit<Feedback, 'id' | 'submissionId' | 'returnedAt' | 'meta'>, actor: User): Promise<Feedback> => {
    await delay(700);
    const submission = MOCK_SUBMISSIONS.find(s => s.id === submissionId);
    if (!submission) throw new Error("Submission not found");
    
    const homework = MOCK_HOMEWORK.find(h => h.id === submission.homeworkId);
    if (!homework) throw new Error("Associated homework not found");
    const policy = homework.policy || DEFAULT_POLICY;
    
    const existingFeedback = MOCK_FEEDBACK.find(f => f.submissionId === submissionId);

    let finalScore = input.score;
    let feedbackMeta: Feedback['meta'];
    
    // Apply late penalty if applicable
    if (submission.status === 'Late' && policy.latePenaltyPct > 0 && typeof input.score === 'number') {
        const penalty = input.score * (policy.latePenaltyPct / 100);
        finalScore = Math.round(input.score - penalty);
        feedbackMeta = {
            originalScore: input.score,
            penaltyPctApplied: policy.latePenaltyPct
        };
    }

    const newFeedback: Feedback = {
        ...input,
        id: existingFeedback?.id || `fb-${Date.now()}`,
        submissionId,
        returnedAt: new Date().toISOString(),
        score: finalScore,
        meta: feedbackMeta
    };
    
    if (existingFeedback) {
        const index = MOCK_FEEDBACK.indexOf(existingFeedback);
        const before = { ...MOCK_FEEDBACK[index] };
        MOCK_FEEDBACK[index] = newFeedback;
        logAuditEvent({ actorId: actor.id, actorName: actor.name, action: 'UPDATE', module: 'HOMEWORK', entityType: 'Feedback', entityId: newFeedback.id, entityDisplay: `Feedback for ${submissionId}`, before, after: newFeedback });
    } else {
        MOCK_FEEDBACK.push(newFeedback);
        logAuditEvent({ actorId: actor.id, actorName: actor.name, action: 'GRADE', module: 'HOMEWORK', entityType: 'Submission', entityId: submission.id, entityDisplay: `Submission for HW ${submission.homeworkId}`, after: newFeedback });
    }

    // Trigger notification
    if (MOCK_NOTIFICATION_SETTINGS.triggers.onFeedback) {
        sendNotification('OnFeedback', homework, { studentId: submission.studentId, score: newFeedback.score });
    }

    return newFeedback;
};

// --- Notification Settings ---
export const getNotificationSettings = async (): Promise<HomeworkNotificationSettings> => {
    await delay(300);
    return JSON.parse(JSON.stringify(MOCK_NOTIFICATION_SETTINGS)); // Deep copy
};

export const updateNotificationSettings = async (settings: HomeworkNotificationSettings, actor: User): Promise<HomeworkNotificationSettings> => {
    await delay(500);
    const before = { ...MOCK_NOTIFICATION_SETTINGS };
    MOCK_NOTIFICATION_SETTINGS = settings;
    logAuditEvent({ actorId: actor.id, actorName: actor.name, action: 'UPDATE', module: 'HOMEWORK', entityType: 'Settings', entityId: 'HomeworkNotifications', entityDisplay: 'Homework Notification Settings', before, after: settings });
    return JSON.parse(JSON.stringify(MOCK_NOTIFICATION_SETTINGS));
};

// --- Mock Cron Job Simulation ---
export const simulateCronJob = async (): Promise<string[]> => {
    await delay(1000);
    const logs: string[] = [];
    const now = new Date();
    const yesterday = getISODateDaysFromNow(-1);

    logs.push(`[CRON] Running simulation at ${now.toISOString()}`);
    
    // Pre-due Reminders
    if (MOCK_NOTIFICATION_SETTINGS.enabled && MOCK_NOTIFICATION_SETTINGS.triggers.preDueReminder) {
        const reminderDate = getISODateDaysFromNow(MOCK_NOTIFICATION_SETTINGS.reminderDaysBefore);
        const dueForReminder = MOCK_HOMEWORK.filter(hw => hw.dueDate === reminderDate && hw.status === 'Published');
        logs.push(`[CRON] Found ${dueForReminder.length} assignments due for a reminder.`);
        dueForReminder.forEach(hw => {
            sendNotification('PreDueReminder', hw);
            logs.push(` -> Sent 'PreDueReminder' for "${hw.title}"`);
        });
    }

    // Overdue Alerts
    if (MOCK_NOTIFICATION_SETTINGS.enabled && MOCK_NOTIFICATION_SETTINGS.triggers.onOverdue) {
        const overdueHomework = MOCK_HOMEWORK.filter(hw => hw.dueDate === yesterday && hw.status === 'Published');
        logs.push(`[CRON] Found ${overdueHomework.length} assignments that became overdue.`);
        // In a real app, we'd check which students haven't submitted
        overdueHomework.forEach(hw => {
             sendNotification('OnOverdue', hw);
             logs.push(` -> Sent 'OnOverdue' for "${hw.title}"`);
        });
    }
    
    logs.push('[CRON] Simulation finished.');
    return logs;
};