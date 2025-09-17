import type { CatchupItem, WatchProgress, CatchupPolicy, QuizQuestion, QuizAnswer } from '../types';
import { listSubjects } from './academicsService';

// --- MOCK DATA STORE ---
const getISODateDaysAgo = (days: number): string => {
    const date = new Date();
    date.setDate(date.getDate() - days);
    return date.toISOString().split('T')[0];
};

let MOCK_CATCHUP_ITEMS: CatchupItem[] = [
  { id: 'cu-1', title: 'Lesson 3.1: Kinematics', subjectId: 'subj-2', classId: 'c2', kind: 'VIDEO', url: 'https://test-streams.mux.dev/x36xhzz/x36xhzz.m3u8', durationSec: 900, teacherId: 't-2', publishedAt: getISODateDaysAgo(5) },
  { id: 'cu-2', title: 'Chapter 5: The Romantic Period', subjectId: 'subj-4', classId: 'c1', kind: 'VIDEO', url: 'https://test-streams.mux.dev/x36xhzz/x36xhzz.m3u8', durationSec: 1200, teacherId: 't-4', publishedAt: getISODateDaysAgo(4) },
  { id: 'cu-3', title: 'Lesson 8.2: Chemical Bonds', subjectId: 'subj-8', classId: 'c4', kind: 'VIDEO', url: 'https://test-streams.mux.dev/x36xhzz/x36xhzz.m3u8', durationSec: 1500, teacherId: 't-6', publishedAt: getISODateDaysAgo(3) },
  { id: 'cu-4', title: 'Topic 2: Quadratic Equations', subjectId: 'subj-1', classId: 'c1', kind: 'VIDEO', url: 'https://test-streams.mux.dev/x36xhzz/x36xhzz.m3u8', durationSec: 1800, teacherId: 't-3', publishedAt: getISODateDaysAgo(2) },
  { id: 'cu-5', title: 'Lab Recap: Titration Basics', subjectId: 'subj-8', classId: 'c4', kind: 'VIDEO', url: 'https://test-streams.mux.dev/x36xhzz/x36xhzz.m3u8', durationSec: 600, teacherId: 't-6', publishedAt: getISODateDaysAgo(1) },
];

let MOCK_WATCH_PROGRESS: Record<string, WatchProgress> = {
    // studentId-contentId
    's01-cu-2': { secondsWatched: 300, lastSecond: 305, completed: false, lastUpdatedISO: new Date().toISOString() },
    's02-cu-4': { secondsWatched: 1800, lastSecond: 1800, completed: true, lastUpdatedISO: new Date().toISOString() },
};

const MOCK_QUIZZES: Record<string, { questions: QuizQuestion[] }> = {
    'cu-1': { questions: [
        { id: 'q1', type: 'single', prompt: 'What is velocity?', choices: ['Speed in a direction', 'Rate of acceleration', 'Total distance'], correct: [0] }
    ]},
    'cu-2': { questions: [
        { id: 'q1', type: 'single', prompt: 'Who wrote "Lyrical Ballads"?', choices: ['Keats', 'Wordsworth', 'Shelley'], correct: [1] },
        { id: 'q2', type: 'single', prompt: 'What is a key theme of Romanticism?', choices: ['Industrialization', 'Logic and Reason', 'Nature and Emotion'], correct: [2] }
    ]},
    'cu-3': { questions: [
        { id: 'q1', type: 'single', prompt: 'A covalent bond involves...', choices: ['Transferring electrons', 'Sharing electrons', 'Donating protons'], correct: [1] },
        { id: 'q2', type: 'single', prompt: 'Which is the strongest bond?', choices: ['Single', 'Double', 'Triple'], correct: [2] },
        { id: 'q3', type: 'single', prompt: 'What does "polar" mean in chemistry?', choices: ['Equal sharing', 'Unequal sharing', 'No sharing'], correct: [1] }
    ]},
    'cu-4': { questions: [
        { id: 'q1', type: 'single', prompt: 'The quadratic formula solves for...', choices: ['y', 'm', 'x'], correct: [2] }
    ]},
    'cu-5': { questions: [
        { id: 'q1', type: 'single', prompt: 'What is an indicator?', choices: ['A type of acid', 'Changes color at a pH', 'A strong base'], correct: [1] }
    ]},
};

const MOCK_POLICY: CatchupPolicy = {
    requiredWatchPct: 80,
    minimumQuizScorePct: 60,
};

// --- MOCK API ---
const delay = (ms: number) => new Promise(res => setTimeout(res, ms));

export const listCatchup = async (siteId: string, params?: { subjectId?: string; classId?: string; q?: string }): Promise<CatchupItem[]> => {
    await delay(400);
    let results = [...MOCK_CATCHUP_ITEMS];
    if (params?.subjectId) results = results.filter(c => c.subjectId === params.subjectId);
    if (params?.classId) results = results.filter(c => c.classId === params.classId);
    if (params?.q) results = results.filter(c => c.title.toLowerCase().includes(params.q!.toLowerCase()));
    return results.sort((a,b) => b.publishedAt.localeCompare(a.publishedAt));
};

export const getCatchup = async (siteId: string, contentId: string): Promise<CatchupItem | null> => {
    await delay(200);
    return MOCK_CATCHUP_ITEMS.find(c => c.id === contentId) || null;
};

export const listWatchProgressForStudent = async (siteId: string, studentId: string): Promise<Record<string, WatchProgress>> => {
    await delay(300);
    const studentProgress: Record<string, WatchProgress> = {};
    for (const key in MOCK_WATCH_PROGRESS) {
        if (key.startsWith(`${studentId}-`)) {
            const contentId = key.split('-')[1];
            studentProgress[contentId] = MOCK_WATCH_PROGRESS[key];
        }
    }
    return studentProgress;
}

export const getWatchProgress = async (siteId: string, contentId: string, studentId: string): Promise<WatchProgress | null> => {
    await delay(150);
    return MOCK_WATCH_PROGRESS[`${studentId}-${contentId}`] || null;
};

export const saveWatchProgress = async (siteId: string, contentId: string, studentId: string, input: Omit<WatchProgress, 'lastUpdatedISO'>): Promise<void> => {
    await delay(500);
    const key = `${studentId}-${contentId}`;
    MOCK_WATCH_PROGRESS[key] = { ...input, lastUpdatedISO: new Date().toISOString() };
    console.log(`[Mock Save] Progress for ${key}:`, MOCK_WATCH_PROGRESS[key]);
    return;
};

export const getCatchupPolicy = async (siteId: string): Promise<CatchupPolicy> => {
    await delay(100);
    return MOCK_POLICY;
};

export const getQuiz = async (siteId: string, contentId: string): Promise<{ questions: QuizQuestion[] } | null> => {
    await delay(300);
    return MOCK_QUIZZES[contentId] || null;
};

export const submitQuiz = async (siteId: string, contentId: string, studentId: string, answers: QuizAnswer[]): Promise<{ scorePct: number; passed: boolean }> => {
    await delay(800);
    const quiz = MOCK_QUIZZES[contentId];
    if (!quiz) return Promise.reject("Quiz not found");

    let correctCount = 0;
    quiz.questions.forEach(q => {
        const studentAnswer = answers.find(a => a.questionId === q.id);
        if (!studentAnswer) return;
        const isCorrect = q.correct.length === studentAnswer.selected.length && q.correct.every(val => studentAnswer.selected.includes(val));
        if (isCorrect) correctCount++;
    });

    const scorePct = (correctCount / quiz.questions.length) * 100;
    const passed = scorePct >= MOCK_POLICY.minimumQuizScorePct;

    return { scorePct, passed };
};

export const saveCatchupAttendance = async (siteId: string, contentId: string, studentId: string, details: { dateISO: string; watchPct: number; quizScorePct: number; passed: boolean }): Promise<void> => {
    await delay(400);
    console.log(`%c[Mock Attendance] Catch-up for ${studentId} on ${contentId} marked as complete.`, "color: green; font-weight: bold;", details);
    return;
};