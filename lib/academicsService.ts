

import type { Subject, Teacher, Mapping, Exam, TimetableEntry } from '../types';

// --- MOCK DATA ---
const SUBJECTS: Subject[] = [
  { id: 'subj-1', name: 'Mathematics', code: 'MATH-101', level: 'O' },
  { id: 'subj-2', name: 'Physics', code: 'PHY-101', level: 'O' },
  { id: 'subj-3', name: 'History', code: 'HIST-101', level: 'O' },
  { id: 'subj-4', name: 'English Literature', code: 'ENG-101', level: 'O' },
  { id: 'subj-5', name: 'Art', code: 'ART-101', level: 'Other' },
  { id: 'subj-6', name: 'Advanced Physics', code: 'PHY-201', level: 'A' },
  { id: 'subj-7', name: 'Advanced History', code: 'HIST-201', level: 'A' },
  { id: 'subj-8', name: 'Chemistry', code: 'CHEM-101', level: 'O' },
];

const TEACHERS: Teacher[] = [
  { id: 't-1', name: 'Mr. Alan Turing', email: 'a.turing@fwbc.edu' },
  { id: 't-2', name: 'Ms. Marie Curie', email: 'm.curie@fwbc.edu' },
  { id: 't-3', name: 'Dr. Ada Lovelace', email: 'a.lovelace@fwbc.edu' },
  { id: 't-4', name: 'Mr. William Shakespeare', email: 'w.shakespeare@fwbc.edu' },
  { id: 't-5', name: 'Ms. Frida Kahlo', email: 'f.kahlo@fwbc.edu' },
  { id: 't-6', name: 'Ms. Rosalind Franklin', email: 'r.franklin@fwbc.edu' },
];

let MAPPINGS: Mapping[] = [
  { id: 'map-1', subjectId: 'subj-1', teacherId: 't-3', classIds: ['c1', 'c2'] },
  { id: 'map-2', subjectId: 'subj-2', teacherId: 't-2', classIds: ['c2'], notes: 'Lab sessions on Fridays.' },
  { id: 'map-3', subjectId: 'subj-6', teacherId: 't-2', classIds: ['c4'], notes: 'Advanced group.' },
  { id: 'map-4', subjectId: 'subj-4', teacherId: 't-4', classIds: ['c1', 'c2', 'c3'] },
  { id: 'map-5', subjectId: 'subj-7', teacherId: 't-3', classIds: ['c3'] },
  { id: 'map-6', subjectId: 'subj-8', teacherId: 't-6', classIds: ['c4'] },
];

function getISODateDaysFromNow(days: number): string {
    const date = new Date();
    date.setDate(date.getDate() + days);
    return date.toISOString().split('T')[0];
}

const EXAMS: Exam[] = [
    { id: 'exam-1', subjectName: 'Mathematics', className: 'Form 1', date: getISODateDaysFromNow(5) },
    { id: 'exam-2', subjectName: 'Physics', className: 'Form 2', date: getISODateDaysFromNow(8) },
    { id: 'exam-3', subjectName: 'Advanced History', className: 'A-Level Arts', date: getISODateDaysFromNow(12) },
    { id: 'exam-4', subjectName: 'English Literature', className: 'Form 1', date: getISODateDaysFromNow(20) },
    { id: 'exam-5', subjectName: 'Chemistry', className: 'A-Level Sciences', date: getISODateDaysFromNow(25) },
];

let MOCK_TIMETABLE: TimetableEntry[] = [
    { id: 'tt-1', subjectId: 'subj-1', teacherId: 't-3', classId: 'c1', day: 'MON', timeSlot: '09:00-10:00' },
    { id: 'tt-2', subjectId: 'subj-4', teacherId: 't-4', classId: 'c1', day: 'MON', timeSlot: '10:00-11:00' },
    { id: 'tt-3', subjectId: 'subj-2', teacherId: 't-2', classId: 'c2', day: 'MON', timeSlot: '09:00-10:00' },
    // Teacher Conflict: Ms. Curie (t-2) is booked for c4 and c3 at the same time
    { id: 'tt-4', subjectId: 'subj-6', teacherId: 't-2', classId: 'c4', day: 'TUE', timeSlot: '11:00-12:00' },
    { id: 'tt-5', subjectId: 'subj-7', teacherId: 't-2', classId: 'c3', day: 'TUE', timeSlot: '11:00-12:00' },
    // Class Conflict: Class c1 is booked for Art and Physics at the same time
    { id: 'tt-6', subjectId: 'subj-5', teacherId: 't-5', classId: 'c1', day: 'WED', timeSlot: '14:00-15:00' },
    { id: 'tt-7', subjectId: 'subj-2', teacherId: 't-2', classId: 'c1', day: 'WED', timeSlot: '14:00-15:00' },
    { id: 'tt-8', subjectId: 'subj-8', teacherId: 't-6', classId: 'c4', day: 'FRI', timeSlot: '10:00-11:00' },
];

// --- MOCK API FUNCTIONS ---

const delay = (ms: number) => new Promise(res => setTimeout(res, ms));

export const listSubjects = async (): Promise<Subject[]> => {
  await delay(200);
  return Promise.resolve([...SUBJECTS]);
};

export const listTeachers = async (): Promise<Teacher[]> => {
  await delay(250);
  return Promise.resolve([...TEACHERS]);
};

export const listMappings = async (): Promise<Mapping[]> => {
  await delay(400);
  return Promise.resolve([...MAPPINGS]);
};

type CreateMappingInput = Omit<Mapping, 'id'>;
export const createMapping = async (input: CreateMappingInput): Promise<Mapping> => {
  await delay(500);
  const newMapping: Mapping = { ...input, id: `map-${Date.now()}` };
  MAPPINGS.push(newMapping);
  return Promise.resolve(newMapping);
};

type UpdateMappingInput = Omit<Mapping, 'id'>;
export const updateMapping = async (id: string, input: UpdateMappingInput): Promise<Mapping> => {
  await delay(500);
  const index = MAPPINGS.findIndex(m => m.id === id);
  if (index === -1) return Promise.reject(new Error('Mapping not found'));
  MAPPINGS[index] = { ...input, id };
  return Promise.resolve(MAPPINGS[index]);
};

export const deleteMapping = async (id: string): Promise<void> => {
  await delay(600);
  const initialLength = MAPPINGS.length;
  MAPPINGS = MAPPINGS.filter(m => m.id !== id);
  if (MAPPINGS.length === initialLength) {
    return Promise.reject(new Error('Mapping not found'));
  }
  return Promise.resolve();
};

export const getUpcomingExamsCount = async (): Promise<number> => {
    await delay(450);
    const today = new Date();
    // Set time to 0 to include today fully
    today.setHours(0, 0, 0, 0);

    const twoWeeksFromNow = new Date();
    twoWeeksFromNow.setDate(today.getDate() + 14);
    twoWeeksFromNow.setHours(23, 59, 59, 999);


    const upcoming = EXAMS.filter(exam => {
        const examDate = new Date(exam.date);
        return examDate >= today && examDate <= twoWeeksFromNow;
    });

    return Promise.resolve(upcoming.length);
};

export const getTimetable = async (params: { classId?: string; teacherId?: string }): Promise<TimetableEntry[]> => {
    await delay(400);
    let results = [...MOCK_TIMETABLE];
    if (params.classId) {
        results = results.filter(e => e.classId === params.classId);
    }
    if (params.teacherId) {
        results = results.filter(e => e.teacherId === params.teacherId);
    }
    return Promise.resolve(results);
};

export const saveTimetableEntry = async (entry: Omit<TimetableEntry, 'id'>): Promise<TimetableEntry> => {
    await delay(300);
    const newEntry = { ...entry, id: `tt-${Date.now()}` };
    MOCK_TIMETABLE.push(newEntry);
    return newEntry;
}
