
import type { OnlineExam, Question, StudentExamSubmission, User, OnlineExamStatus } from '../types';
import { logAuditEvent } from './auditService';

// --- MOCK DATA STORE ---
const getISODateHoursFromNow = (hours: number): string => {
    const date = new Date();
    date.setHours(date.getHours() + hours);
    return date.toISOString();
};

// FIX: Use the correct `Question` type from `types.ts` and create a local extended type for mock data.
let MOCK_QUESTIONS: (Question & { examId: string })[] = [
    // Exam 1
    // FIX: Added missing subjectId property to match Question type.
    { id: 'q-1-1', examId: 'exam-1', subjectId: 'subj-1', questionText: 'What is 2 + 2?', type: 'multiple-choice', options: ['3', '4', '5', '6'], correctOptionIndex: 1, marks: 5 },
    // FIX: Added missing subjectId property to match Question type.
    { id: 'q-1-2', examId: 'exam-1', subjectId: 'subj-1', questionText: 'What is the square root of 9?', type: 'multiple-choice', options: ['2', '3', '4', '81'], correctOptionIndex: 1, marks: 5 },
    // Exam 3
    // FIX: Added missing subjectId property to match Question type.
    { id: 'q-3-1', examId: 'exam-3', subjectId: 'subj-4', questionText: 'Who wrote "The Road Not Taken"?', type: 'multiple-choice', options: ['Robert Frost', 'Emily Dickinson', 'Walt Whitman'], correctOptionIndex: 0, marks: 15 },
];


let MOCK_EXAMS: OnlineExam[] = [
    // FIX: Changed `enabledQuestionIds` to `questionIds` to match the `OnlineExamConfig` type.
    { id: 'exam-1', title: 'Mathematics Mid-Term', subjectId: 'subj-1', classId: 'c1', instructions: 'You have 45 minutes to complete this exam. All questions are multiple choice.', durationMinutes: 45, startTime: getISODateHoursFromNow(-2), endTime: getISODateHoursFromNow(2), status: 'Published', totalMarks: 10, config: { lockdownMode: true, questionIds: ['q-1-1', 'q-1-2'] }, resultsPublishedAt: null },
    // FIX: Added missing `config` property to satisfy the `OnlineExam` type.
    { id: 'exam-2', title: 'Physics Pop Quiz', subjectId: 'subj-2', classId: 'c2', instructions: 'Quick quiz on Newton\'s Laws.', durationMinutes: 10, startTime: getISODateHoursFromNow(24), endTime: getISODateHoursFromNow(25), status: 'Published', totalMarks: 5, config: { lockdownMode: false, questionIds: [] }, resultsPublishedAt: null },
    // FIX: Added missing `config` property to satisfy the `OnlineExam` type.
    { id: 'exam-3', title: 'Poetry Analysis (Practice)', subjectId: 'subj-4', classId: 'c1', instructions: 'This is a practice exam.', durationMinutes: 60, startTime: getISODateHoursFromNow(-48), endTime: getISODateHoursFromNow(-46), status: 'Archived', totalMarks: 15, config: { lockdownMode: false, questionIds: ['q-3-1'] }, resultsPublishedAt: getISODateHoursFromNow(-46) },
    // FIX: Added missing `config` property to satisfy the `OnlineExam` type.
    { id: 'exam-4', title: 'Chemistry Fundamentals - Draft', subjectId: 'subj-8', classId: 'c4', instructions: 'Review of basic concepts.', durationMinutes: 30, startTime: getISODateHoursFromNow(72), endTime: getISODateHoursFromNow(74), status: 'Draft', totalMarks: 0, config: { lockdownMode: false, questionIds: [] }, resultsPublishedAt: null },
];

let MOCK_SUBMISSIONS: StudentExamSubmission[] = [
    { id: 'sub-exam-3-s01', examId: 'exam-3', studentId: 's01', startedAt: getISODateHoursFromNow(-47), submittedAt: getISODateHoursFromNow(-46.9), answers: new Map([['q-3-1', 0]]), score: 15, status: 'Submitted' }
];

// --- MOCK API ---
const delay = (ms: number) => new Promise(res => setTimeout(res, ms));

// --- Student-facing functions ---

export const listExamsForStudent = async (studentId: string, classId: string): Promise<{exam: OnlineExam, submission?: StudentExamSubmission}[]> => {
    await delay(400);
    const publishedExams = MOCK_EXAMS.filter(e => (e.status === 'Published' || e.status === 'Archived') && e.classId === classId);
    return publishedExams.map(exam => {
        const submission = MOCK_SUBMISSIONS.find(s => s.examId === exam.id && s.studentId === studentId);
        return { exam, submission };
    });
};

export const getExamDetails = async (examId: string): Promise<{ exam: OnlineExam, questions: Question[] } | null> => {
    await delay(300);
    const exam = MOCK_EXAMS.find(e => e.id === examId);
    if (!exam) return null;
    const questions = MOCK_QUESTIONS.filter(q => q.examId === examId);
    return { exam, questions };
};

export const getStudentSubmission = async (examId: string, studentId: string): Promise<StudentExamSubmission | null> => {
    await delay(200);
    const sub = MOCK_SUBMISSIONS.find(s => s.examId === examId && s.studentId === studentId);
    // Serialize Map to object for transport, then back to Map on client
    return sub ? JSON.parse(JSON.stringify(sub, (k, v) => v instanceof Map ? Object.fromEntries(v) : v)) : null;
};

export const startExam = async (examId: string, studentId: string): Promise<StudentExamSubmission> => {
    await delay(200);
    const existing = MOCK_SUBMISSIONS.find(s => s.examId === examId && s.studentId === studentId);
    if (existing) return existing;

    const newSubmission: StudentExamSubmission = {
        id: `sub-${examId}-${studentId}`,
        examId,
        studentId,
        startedAt: new Date().toISOString(),
        answers: new Map(),
        status: 'InProgress'
    };
    MOCK_SUBMISSIONS.push(newSubmission);
    logAuditEvent({ actorId: studentId, actorName: `Student ${studentId}`, action: 'START_EXAM', module: 'ONLINE_EXAMS', entityId: examId });
    return newSubmission;
};

export const submitExam = async (submissionId: string, answers: Map<string, number>): Promise<StudentExamSubmission> => {
    await delay(500);
    const index = MOCK_SUBMISSIONS.findIndex(s => s.id === submissionId);
    if (index === -1) throw new Error("Submission not found");
    
    const submission = MOCK_SUBMISSIONS[index];
    const exam = MOCK_EXAMS.find(e => e.id === submission.examId);
    const allQuestions = MOCK_QUESTIONS.filter(q => q.examId === submission.examId);
    if (!exam) throw new Error("Exam not found");

    // Grade only enabled questions
    // FIX: Renamed `enabledQuestionIds` to `questionIds` to match the `OnlineExamConfig` type.
    const questionIdsInExam = exam.config?.questionIds ?? allQuestions.map(q => q.id);
    const questions = allQuestions.filter(q => questionIdsInExam.includes(q.id));

    // Auto-grade
    let score = 0;
    answers.forEach((selectedOptionIndex, questionId) => {
        const question = questions.find(q => q.id === questionId);
        if (question && question.correctOptionIndex === selectedOptionIndex) {
            score += question.marks;
        }
    });
    
    submission.submittedAt = new Date().toISOString();
    submission.answers = answers;
    submission.score = score;
    submission.status = 'Submitted';
    
    MOCK_SUBMISSIONS[index] = submission;

    logAuditEvent({ actorId: submission.studentId, actorName: `Student ${submission.studentId}`, action: 'SUBMIT_EXAM', module: 'ONLINE_EXAMS', entityId: submission.examId, meta: { score } });
    
    return submission;
};

// --- Teacher-facing functions ---

export const listAllExams = async (): Promise<OnlineExam[]> => {
    await delay(400);
    return JSON.parse(JSON.stringify(MOCK_EXAMS.sort((a,b) => new Date(b.startTime).getTime() - new Date(a.startTime).getTime())));
};

export const createExam = async (input: Omit<OnlineExam, 'id' | 'status' | 'totalMarks'>, actor: User): Promise<OnlineExam> => {
    await delay(500);
    const newExam: OnlineExam = {
        ...input,
        id: `exam-${Date.now()}`,
        status: 'Draft',
        totalMarks: 0,
        resultsPublishedAt: null,
    };
    MOCK_EXAMS.push(newExam);
    logAuditEvent({ actorId: actor.id, actorName: actor.name, action: 'CREATE', module: 'ONLINE_EXAMS', entityType: 'Exam', entityId: newExam.id, entityDisplay: newExam.title });
    return newExam;
};

// FIX: Corrected the Omit type to allow `totalMarks` to be updated.
export const updateExam = async (id: string, update: Partial<Omit<OnlineExam, 'id'>>, actor: User): Promise<OnlineExam> => {
    await delay(500);
    const index = MOCK_EXAMS.findIndex(e => e.id === id);
    if (index === -1) throw new Error("Exam not found");

    const before = { ...MOCK_EXAMS[index] };
    MOCK_EXAMS[index] = { ...MOCK_EXAMS[index], ...update };
    const after = MOCK_EXAMS[index];

    logAuditEvent({ actorId: actor.id, actorName: actor.name, action: 'UPDATE', module: 'ONLINE_EXAMS', entityType: 'Exam', entityId: id, entityDisplay: after.title, before, after });
    return after;
};

export const publishExamResults = async (examId: string, actor: User): Promise<OnlineExam> => {
    await delay(500);
    const index = MOCK_EXAMS.findIndex(e => e.id === examId);
    if (index === -1) throw new Error("Exam not found");

    const before = { ...MOCK_EXAMS[index] };
    MOCK_EXAMS[index].resultsPublishedAt = new Date().toISOString();
    const after = MOCK_EXAMS[index];

    logAuditEvent({ actorId: actor.id, actorName: actor.name, action: 'PUBLISH', module: 'ONLINE_EXAMS', entityType: 'ExamResults', entityId: examId, entityDisplay: after.title, before, after });
    
    return after;
};

export const saveQuestion = async (examId: string, questionData: Omit<Question, 'id'> & { id?: string }, actor: User): Promise<Question> => {
    await delay(500);
    
    let savedQuestion: (Question & { examId: string });
    if (questionData.id) { // Update existing
        const index = MOCK_QUESTIONS.findIndex(q => q.id === questionData.id);
        if (index === -1) throw new Error("Question not found");
        savedQuestion = { ...MOCK_QUESTIONS[index], ...questionData, examId };
        MOCK_QUESTIONS[index] = savedQuestion;
    } else { // Create new
        savedQuestion = {
            ...questionData,
            id: `q-${examId}-${Date.now()}`,
            examId,
            type: 'multiple-choice',
        };
        MOCK_QUESTIONS.push(savedQuestion);
    }
    
    // Recalculate total marks for the exam
    const examIndex = MOCK_EXAMS.findIndex(e => e.id === examId);
    if (examIndex > -1) {
        const examQuestions = MOCK_QUESTIONS.filter(q => MOCK_EXAMS[examIndex].config.questionIds.includes(q.id));
        MOCK_EXAMS[examIndex].totalMarks = examQuestions.reduce((sum, q) => sum + q.marks, 0);
    }
    
    logAuditEvent({ actorId: actor.id, actorName: actor.name, action: 'UPDATE', module: 'ONLINE_EXAMS', entityType: 'Question', entityId: savedQuestion.id, entityDisplay: `Question for Exam ${examId}` });

    // FIX: Return a plain Question object without the internal `examId`.
    const { examId: _, ...questionToReturn } = savedQuestion;
    return questionToReturn;
};

export const deleteQuestion = async (questionId: string, actor: User): Promise<void> => {
    await delay(400);
    MOCK_QUESTIONS = MOCK_QUESTIONS.filter(q => q.id !== questionId);
    // In a real app, you would also need to recalculate total marks here.
    // For simplicity, we do it in saveQuestion.
    logAuditEvent({ actorId: actor.id, actorName: actor.name, action: 'DELETE', module: 'ONLINE_EXAMS', entityType: 'Question', entityId: questionId });
};

// FIX: Added missing functions for the Question Bank feature.
export const listAllQuestionsFromBank = async (): Promise<Question[]> => {
    await delay(300);
    // We return without examId to match the Question type
    return JSON.parse(JSON.stringify(MOCK_QUESTIONS.map(({ examId, ...rest }) => rest)));
};

export const saveQuestionToBank = async (questionData: Omit<Question, 'id'> & { id?: string }, actor: User): Promise<Question> => {
    await delay(500);

    let savedQuestion: (Question & { examId: string });

    if (questionData.id) { // Update existing
        const index = MOCK_QUESTIONS.findIndex(q => q.id === questionData.id);
        if (index === -1) throw new Error("Question not found");
        // retain original examId if it exists, otherwise it's a bank-only question
        const examId = MOCK_QUESTIONS[index].examId || 'bank';
        savedQuestion = { ...MOCK_QUESTIONS[index], ...questionData, examId };
        MOCK_QUESTIONS[index] = savedQuestion;
    } else { // Create new
        savedQuestion = {
            ...(questionData as Question),
            id: `q-bank-${Date.now()}`,
            examId: 'bank', // Belongs to bank, not a specific exam
        };
        MOCK_QUESTIONS.push(savedQuestion);
    }
    
    logAuditEvent({ actorId: actor.id, actorName: actor.name, action: 'UPDATE', module: 'ONLINE_EXAMS', entityType: 'QuestionBank', entityId: savedQuestion.id, entityDisplay: `Question for Bank` });

    const { examId, ...questionToReturn } = savedQuestion;
    return questionToReturn;
};

export const deleteQuestionFromBank = async (questionId: string, actor: User): Promise<void> => {
    await delay(400);
    // Also remove from any exams that use it
    MOCK_EXAMS.forEach(exam => {
        if (exam.config.questionIds) {
            exam.config.questionIds = exam.config.questionIds.filter(id => id !== questionId);
        }
    });
    const questionIndex = MOCK_QUESTIONS.findIndex(q => q.id === questionId);
    if(questionIndex > -1) {
        MOCK_QUESTIONS.splice(questionIndex, 1);
    } else {
        throw new Error("Question not found");
    }
    logAuditEvent({ actorId: actor.id, actorName: actor.name, action: 'DELETE', module: 'ONLINE_EXAMS', entityType: 'QuestionBank', entityId: questionId });
};
