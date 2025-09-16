import type { Homework, Submission, Feedback, User, HomeworkStats, HomeworkDashboardStats, EnrichedSubmission, HomeworkAnalytics, EnrichedHomeworkForStudent, StudentWatchlistItem } from '../types';
import { getStudentsByClass, getStudent, getStudents } from './schoolService';
import { logAuditEvent } from './auditService';

// --- MOCK DATA STORE ---
const getISODateDaysFromNow = (days: number): string => {
    const date = new Date();
    date.setDate(date.getDate() + days);
    return date.toISOString().split('T')[0];
};

let MOCK_HOMEWORK: Homework[] = [
    { id: 'hw-1', classId: 'c1', subjectId: 'subj-1', title: 'Algebra Worksheet 1', instructions: 'Complete all odd-numbered problems.', dueDate: getISODateDaysFromNow(5), assignedAt: new Date().toISOString(), attachments: [{ name: 'worksheet_1.pdf', url: '#' }], visibility: 'Published', allowLateSubmissions: true, allowResubmission: true, maxAttachments: 3, allowedFileTypes: ['.pdf', '.docx'], maxFileSizeMB: 10, maxAttempts: 3 },
    { id: 'hw-2', classId: 'c2', subjectId: 'subj-2', title: 'Newton\'s Laws Essay', instructions: 'Write a 500-word essay on the First Law of Motion.', dueDate: getISODateDaysFromNow(10), assignedAt: new Date().toISOString(), visibility: 'Published', allowLateSubmissions: true, allowResubmission: false, maxAttachments: 1, allowedFileTypes: ['.docx'] },
    { id: 'hw-3', classId: 'c1', subjectId: 'subj-4', title: 'Poem Analysis', instructions: 'Analyze "The Road Not Taken".', dueDate: getISODateDaysFromNow(-2), assignedAt: new Date(Date.now() - 7 * 24 * 60 * 60 * 1000).toISOString(), attachments: [{ name: 'the_road_not_taken.txt', url: '#' }], visibility: 'Published', allowLateSubmissions: false, allowResubmission: false },
    { id: 'hw-4', classId: 'c1', subjectId: 'subj-1', title: 'Geometry Problems (Draft)', instructions: 'Draft instructions.', dueDate: getISODateDaysFromNow(15), assignedAt: new Date().toISOString(), visibility: 'Draft', allowLateSubmissions: true, allowResubmission: true },

];

let MOCK_SUBMISSIONS: Submission[] = [
    // For hw-3 (in the past)
    { id: 'sub-1', homeworkId: 'hw-3', studentId: 's01', status: 'On-time', submittedAt: new Date(Date.now() - 3 * 24 * 60 * 60 * 1000).toISOString(), text: 'Here is my analysis of the poem.', files: [], attemptNumber: 1 },
    { id: 'sub-2', homeworkId: 'hw-3', studentId: 's02', status: 'Late', submittedAt: new Date(Date.now() - 1 * 24 * 60 * 60 * 1000).toISOString(), text: 'Sorry this is late.', files: [], attemptNumber: 1, latePenaltyWaived: false },
    { id: 'sub-3', homeworkId: 'hw-3', studentId: 's03', status: 'Not Submitted' },
     // For hw-1 (in the future)
    { id: 'sub-4', homeworkId: 'hw-1', studentId: 's02', status: 'On-time', submittedAt: new Date().toISOString(), text: 'Completed the worksheet.', files: [], attemptNumber: 1 },
];

let MOCK_FEEDBACK: Feedback[] = [
    { id: 'fb-1', submissionId: 'sub-1', score: 95, comments: 'Excellent work!', returnedAt: new Date().toISOString() },
];

// --- MOCK API FUNCTIONS ---
const delay = (ms: number) => new Promise(res => setTimeout(res, ms));

export const listHomework = async (params: { classId?: string; subjectId?: string; from?: string; to?: string }): Promise<Homework[]> => {
    await delay(400);
    let results = MOCK_HOMEWORK.filter(h => h.visibility !== 'Draft');
    if (params.classId) results = results.filter(h => h.classId === params.classId);
    if (params.subjectId) results = results.filter(h => h.subjectId === params.subjectId);
    if (params.from) results = results.filter(h => h.dueDate >= params.from!);
    if (params.to) results = results.filter(h => h.dueDate <= params.to!);
    return results.sort((a, b) => b.assignedAt.localeCompare(a.assignedAt));
};

export const listHomeworkForStudent = async (studentId: string): Promise<EnrichedHomeworkForStudent[]> => {
    await delay(500);
    const student = await getStudent(studentId);
    if (!student) return [];
    
    const allHomework = MOCK_HOMEWORK.filter(h => h.classId === student.classId && h.visibility === 'Published');
    
    const enrichedHomework: EnrichedHomeworkForStudent[] = [];
    for (const hw of allHomework) {
        const submission = await getSubmissionForStudent(hw.id, studentId);
        enrichedHomework.push({ ...hw, submission: submission || undefined });
    }
    
    return enrichedHomework.sort((a, b) => new Date(a.dueDate).getTime() - new Date(b.dueDate).getTime());
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

export const getSubmissionsWithDetails = async (homeworkId: string): Promise<EnrichedSubmission[]> => {
    await delay(600);
    const homework = MOCK_HOMEWORK.find(h => h.id === homeworkId);
    if (!homework) return [];
    const students = await getStudentsByClass(homework.classId);
    const submissions = MOCK_SUBMISSIONS.filter(s => s.homeworkId === homeworkId);
    const feedback = MOCK_FEEDBACK.filter(f => submissions.some(s => s.id === f.submissionId));
    
    const subMap = new Map(submissions.map(s => [s.studentId, s]));
    const feedbackMap = new Map(feedback.map(f => [f.submissionId, f]));

    return students.map(student => {
        const submission = subMap.get(student.id);
        const base: EnrichedSubmission = {
            id: submission?.id || `placeholder-${student.id}`,
            homeworkId,
            studentId: student.id,
            status: submission?.status || 'Not Submitted',
            studentName: student.name,
            submittedAt: submission?.submittedAt,
            attemptNumber: submission?.attemptNumber,
            latePenaltyWaived: submission?.latePenaltyWaived,
        };
        if (submission) {
            return { ...base, feedback: feedbackMap.get(submission.id) };
        }
        return base;
    });
};


export const getSubmissionForStudent = async (homeworkId: string, studentId: string): Promise<(Submission & { feedback?: Feedback }) | null> => {
    await delay(300);
    const submission = MOCK_SUBMISSIONS.find(s => s.homeworkId === homeworkId && s.studentId === studentId);
    if (!submission) return null;
    const feedback = MOCK_FEEDBACK.find(f => f.submissionId === submission.id);
    return { ...submission, feedback };
};

export const getSubmission = async (id: string): Promise<(Submission & { feedback?: Feedback }) | null> => {
    await delay(300);
    const submission = MOCK_SUBMISSIONS.find(s => s.id === id);
    if (!submission) return null;
    const feedback = MOCK_FEEDBACK.find(f => f.submissionId === id);
    return { ...submission, feedback };
};

export const submitHomework = async (
    payload: { homeworkId: string; studentId: string; text?: string; files?: { name: string; url: string }[] },
    actor: User
): Promise<Submission> => {
    await delay(800);
    const homework = MOCK_HOMEWORK.find(h => h.id === payload.homeworkId);
    if (!homework) throw new Error("Homework not found");

    const dueDate = new Date(homework.dueDate);
    dueDate.setHours(23, 59, 59, 999); // Due at end of day
    const submittedAt = new Date();
    const status = submittedAt > dueDate ? 'Late' : 'On-time';

    let submission = MOCK_SUBMISSIONS.find(s => s.homeworkId === payload.homeworkId && s.studentId === payload.studentId);

    if (submission && submission.id.startsWith('sub-placeholder-')) {
        submission = undefined;
    }
    
    if (submission) { // Update existing submission
        const existingFeedback = MOCK_FEEDBACK.find(f => f.submissionId === submission.id);
        if (!homework.allowResubmission && existingFeedback) {
            throw new Error("Resubmission not allowed after feedback has been given.");
        }
        if (homework.maxAttempts && (submission.attemptNumber || 0) >= homework.maxAttempts) {
             throw new Error(`Maximum number of attempts (${homework.maxAttempts}) reached.`);
        }

        submission.status = status;
        submission.submittedAt = submittedAt.toISOString();
        submission.text = payload.text;
        submission.files = payload.files;
        submission.attemptNumber = (submission.attemptNumber || 0) + 1;
    } else { // Create new submission
        submission = {
            ...payload,
            id: `sub-${Date.now()}`,
            status,
            submittedAt: submittedAt.toISOString(),
            attemptNumber: 1,
        };
        MOCK_SUBMISSIONS.push(submission);
    }
    
    logAuditEvent({
        actorId: actor.id,
        actorName: actor.name,
        action: 'UPDATE', 
        module: 'HOMEWORK',
        entityType: 'Submission',
        entityId: submission.id,
        entityDisplay: `Submission for ${homework.title}`,
        meta: { studentId: payload.studentId, status, attempt: submission.attemptNumber }
    });

    return submission;
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
    
    MOCK_FEEDBACK = MOCK_FEEDBACK.filter(f => f.submissionId !== submissionId);
    MOCK_FEEDBACK.push(newFeedback);
    
    logAuditEvent({ actorId: actor.id, actorName: actor.name, action: 'GRADE', module: 'HOMEWORK', entityType: 'Submission', entityId: submission.id, entityDisplay: `Submission for HW ${submission.homeworkId}`, after: { score: newFeedback.score, comments: newFeedback.comments } });

    return newFeedback;
};

export const waiveLatePenalty = async (submissionId: string, actor: User): Promise<void> => {
    await delay(400);
    const submission = MOCK_SUBMISSIONS.find(s => s.id === submissionId);
    if (!submission) throw new Error("Submission not found");

    submission.latePenaltyWaived = true;
    
    logAuditEvent({
        actorId: actor.id,
        actorName: actor.name,
        action: 'UPDATE',
        module: 'HOMEWORK',
        entityType: 'Submission',
        entityId: submissionId,
        entityDisplay: `Submission for HW ${submission.homeworkId}`,
        meta: { action: 'WaiveLatePenalty' }
    });
};

export const getStudentWatchlist = async (): Promise<StudentWatchlistItem[]> => {
    await delay(800);
    const { students } = await getStudents({ limit: 1000 });
    const studentMap = new Map(students.map(s => [s.id, { studentId: s.id, studentName: s.name, lateCount: 0, missedCount: 0, lastIncidentDate: '' }]));

    for (const hw of MOCK_HOMEWORK) {
        if (hw.visibility !== 'Published') continue;
        
        const submissions = MOCK_SUBMISSIONS.filter(s => s.homeworkId === hw.id);
        const submittedIds = new Set(submissions.map(s => s.studentId));
        const classStudents = students.filter(s => s.classId === hw.classId);

        // Check for missed
        if (new Date(hw.dueDate) < new Date()) {
            for (const student of classStudents) {
                if (!submittedIds.has(student.id)) {
                    const record = studentMap.get(student.id)!;
                    record.missedCount++;
                    if (!record.lastIncidentDate || hw.dueDate > record.lastIncidentDate) {
                        record.lastIncidentDate = hw.dueDate;
                    }
                }
            }
        }
        
        // Check for late
        for (const sub of submissions) {
            if (sub.status === 'Late') {
                const record = studentMap.get(sub.studentId)!;
                record.lateCount++;
                 if (!record.lastIncidentDate || hw.dueDate > record.lastIncidentDate) {
                    record.lastIncidentDate = hw.dueDate;
                }
            }
        }
    }
    
    const watchlist = Array.from(studentMap.values())
        .filter(s => s.lateCount > 2 || s.missedCount > 1)
        .sort((a, b) => (b.lateCount + b.missedCount) - (a.lateCount + a.missedCount));

    return watchlist;
};

// New function for reports
export const getHomeworkWithStats = async (params: { classId?: string; subjectId?: string }): Promise<Homework[]> => {
    await delay(1200);
    const allHomework = await listHomework(params);
    
    const homeworkWithStats: Homework[] = [];

    for (const hw of allHomework) {
        const submissions = await listSubmissionsForHomework(hw.id);
        const totalStudents = submissions.length;
        if (totalStudents === 0) {
            homeworkWithStats.push(hw);
            continue;
        }

        const onTime = submissions.filter(s => s.status === 'On-time').length;
        const late = submissions.filter(s => s.status === 'Late').length;
        const submitted = onTime + late;
        const notSubmitted = totalStudents - submitted;
        const submissionRate = (submitted / totalStudents) * 100;

        const stats: HomeworkStats = {
            totalStudents,
            submitted,
            onTime,
            late,
            notSubmitted,
            submissionRate,
        };

        homeworkWithStats.push({ ...hw, stats });
    }

    return homeworkWithStats;
};


export const getHomeworkDashboardStats = async (): Promise<HomeworkDashboardStats> => {
    await delay(500);
    const today = new Date().toISOString().split('T')[0];
    let dueToday = 0;
    let overdueSubmissions = 0;
    let needsMarking = 0;

    for (const hw of MOCK_HOMEWORK.filter(h => h.visibility === 'Published')) {
        if (hw.dueDate === today) {
            dueToday++;
        }
        const submissions = MOCK_SUBMISSIONS.filter(s => s.homeworkId === hw.id);
        const feedbackIds = new Set(MOCK_FEEDBACK.map(f => f.submissionId));
        
        for (const sub of submissions) {
            if (sub.status !== 'Not Submitted' && !feedbackIds.has(sub.id)) {
                needsMarking++;
            }
        }

        if (new Date(hw.dueDate) < new Date()) {
             const allClassStudents = await getStudentsByClass(hw.classId);
             const submittedStudentIds = new Set(submissions.map(s => s.studentId));
             overdueSubmissions += allClassStudents.filter(s => !submittedStudentIds.has(s.id)).length;
        }
    }
    return { dueToday, overdueSubmissions, needsMarking };
};

export const getHomeworkAnalytics = async (homeworkId: string): Promise<HomeworkAnalytics> => {
    await delay(700);
    const homework = MOCK_HOMEWORK.find(h => h.id === homeworkId);
    if (!homework) throw new Error("Homework not found");

    const submissions = await getSubmissionsWithDetails(homeworkId);
    const totalSubmissions = submissions.filter(s => s.status !== 'Not Submitted').length;
    const onTimeCount = submissions.filter(s => s.status === 'On-time').length;
    const lateCount = submissions.filter(s => s.status === 'Late').length;
    const markedSubmissions = submissions.filter(s => s.feedback && s.feedback.score !== undefined);
    
    const totalScore = markedSubmissions.reduce((acc, sub) => acc + (sub.feedback?.score || 0), 0);
    const averageScore = markedSubmissions.length > 0 ? totalScore / markedSubmissions.length : null;

    const lateDistributionMap = new Map<number, number>();
    submissions.filter(s => s.status === 'Late' && s.submittedAt).forEach(s => {
        const dueDate = new Date(homework.dueDate);
        const submittedDate = new Date(s.submittedAt!);
        const diffTime = submittedDate.getTime() - dueDate.getTime();
        const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
        const daysLate = Math.max(1, diffDays); // At least 1 day late
        lateDistributionMap.set(daysLate, (lateDistributionMap.get(daysLate) || 0) + 1);
    });

    return {
        submissionRate: (totalSubmissions / submissions.length) * 100,
        onTimeRate: totalSubmissions > 0 ? (onTimeCount / totalSubmissions) * 100 : 0,
        lateRate: totalSubmissions > 0 ? (lateCount / totalSubmissions) * 100 : 0,
        averageScore,
        lateDistribution: Array.from(lateDistributionMap.entries()).map(([daysLate, count]) => ({ daysLate, count })),
        totalSubmissions,
        markedCount: markedSubmissions.length,
    };
};

export const bulkMarkSubmissions = async (homeworkId: string, studentIds: string[], score: number, comments: string, actor: User): Promise<void> => {
    await delay(1000);
    const submissions = await listSubmissionsForHomework(homeworkId);
    for (const studentId of studentIds) {
        let submission = submissions.find(s => s.studentId === studentId);
        if (!submission || submission.id.startsWith('placeholder')) {
             submission = {
                id: `sub-${Date.now()}-${Math.random()}`,
                homeworkId,
                studentId,
                status: 'Not Submitted',
            };
            MOCK_SUBMISSIONS.push(submission);
        }
        await saveFeedback(submission.id, { score, comments }, actor);
    }
};