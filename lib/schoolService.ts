import type { SchoolClass, Student, AttendanceEntry } from '../types';

// --- MOCK DATA STORE ---

const CLASSES: SchoolClass[] = [
  { id: 'c1', name: 'Form 1', teacherId: 't-4' },
  { id: 'c2', name: 'Form 2', teacherId: 't-2' },
  { id: 'c3', name: 'A-Level Arts', teacherId: 't-3' },
  { id: 'c4', name: 'A-Level Sciences', teacherId: 't-6' },
];

const STUDENTS: Student[] = [
  // Class c1
  { id: 's01', name: 'Alice Johnson', admissionNo: 'FWBC001', classId: 'c1', roll: '1', contact: { email: 'a.j@example.com', phone: '555-0101' }, address: { line1: '123 Oak St', city: 'Mapleton', postcode: '12345' }, photoUrl: `https://i.pravatar.cc/150?u=s01` },
  { id: 's02', name: 'Bob Williams', admissionNo: 'FWBC002', classId: 'c1', roll: '2', contact: { email: 'b.w@example.com', phone: '555-0102' }, address: { line1: '456 Pine Ave', city: 'Mapleton', postcode: '12345' }, photoUrl: `https://i.pravatar.cc/150?u=s02` },
  { id: 's03', name: 'Charlie Brown', admissionNo: 'FWBC003', classId: 'c1', roll: '3', contact: { email: 'c.b@example.com', phone: '555-0103' }, address: { line1: '789 Birch Rd', city: 'Mapleton', postcode: '12345' }, photoUrl: `https://i.pravatar.cc/150?u=s03` },
  { id: 's04', name: 'Diana Miller', admissionNo: 'FWBC004', classId: 'c1', roll: '4', contact: { email: 'd.m@example.com', phone: '555-0104' }, address: { line1: '101 Elm Ct', city: 'Mapleton', postcode: '12345' }, photoUrl: `https://i.pravatar.cc/150?u=s04` },
  { id: 's05', name: 'Ethan Davis', admissionNo: 'FWBC005', classId: 'c1', roll: '5', contact: { email: 'e.d@example.com', phone: '555-0105' }, address: { line1: '212 Maple Ln', city: 'Mapleton', postcode: '12345' }, photoUrl: `https://i.pravatar.cc/150?u=s05` },
  // Class c2
  { id: 's06', name: 'Fiona Garcia', admissionNo: 'FWBC006', classId: 'c2', roll: '1', contact: { email: 'f.g@example.com', phone: '555-0106' }, address: { line1: '333 Oak St', city: 'Mapleton', postcode: '12345' }, photoUrl: `https://i.pravatar.cc/150?u=s06` },
  { id: 's07', name: 'George Harris', admissionNo: 'FWBC007', classId: 'c2', roll: '2', contact: { email: 'g.h@example.com', phone: '555-0107' }, address: { line1: '444 Pine Ave', city: 'Mapleton', postcode: '12345' }, photoUrl: `https://i.pravatar.cc/150?u=s07` },
  { id: 's08', name: 'Hannah Clark', admissionNo: 'FWBC008', classId: 'c2', roll: '3', contact: { email: 'h.c@example.com', phone: '555-0108' }, address: { line1: '555 Birch Rd', city: 'Mapleton', postcode: '12345' }, photoUrl: `https://i.pravatar.cc/150?u=s08` },
  { id: 's09', name: 'Ian Lewis', admissionNo: 'FWBC009', classId: 'c2', roll: '4', contact: { email: 'i.l@example.com', phone: '555-0109' }, address: { line1: '666 Elm Ct', city: 'Mapleton', postcode: '12345' }, photoUrl: `https://i.pravatar.cc/150?u=s09` },
  { id: 's10', name: 'Jane Walker', admissionNo: 'FWBC010', classId: 'c2', roll: '5', contact: { email: 'j.w@example.com', phone: '555-0110' }, address: { line1: '777 Maple Ln', city: 'Mapleton', postcode: '12345' }, photoUrl: `https://i.pravatar.cc/150?u=s10` },
  // Class c3
  { id: 's11', name: 'Kyle Allen', admissionNo: 'FWBC011', classId: 'c3', roll: '1', contact: { email: 'k.a@example.com', phone: '555-0111' }, address: { line1: '888 Oak St', city: 'Mapleton', postcode: '12345' }, photoUrl: `https://i.pravatar.cc/150?u=s11` },
  { id: 's12', name: 'Laura Wright', admissionNo: 'FWBC012', classId: 'c3', roll: '2', contact: { email: 'l.w@example.com', phone: '555-0112' }, address: { line1: '999 Pine Ave', city: 'Mapleton', postcode: '12345' }, photoUrl: `https://i.pravatar.cc/150?u=s12` },
  // Class c4
  { id: 's15', name: 'Oliver Scott', admissionNo: 'FWBC015', classId: 'c4', roll: '1', contact: { email: 'o.s@example.com', phone: '555-0115' }, address: { line1: '321 Oak St', city: 'Mapleton', postcode: '12345' }, photoUrl: `https://i.pravatar.cc/150?u=s15` },
  { id: 's16', name: 'Penelope Green', admissionNo: 'FWBC016', classId: 'c4', roll: '2', contact: { email: 'p.g@example.com', phone: '555-0116' }, address: { line1: '654 Pine Ave', city: 'Mapleton', postcode: '12345' }, photoUrl: `https://i.pravatar.cc/150?u=s16` },
];


// --- MOCK API FUNCTIONS ---
const delay = (ms: number) => new Promise(res => setTimeout(res, ms));

export const getClasses = async (): Promise<SchoolClass[]> => {
  await delay(150);
  return Promise.resolve([...CLASSES]);
};

interface GetStudentsParams {
  classId?: string;
  q?: string;
  page?: number;
  limit?: number;
}

export const getStudents = async (params: GetStudentsParams = {}): Promise<{ students: Student[], total: number }> => {
  await delay(400);
  let filteredStudents = [...STUDENTS];

  if (params.classId) {
    filteredStudents = filteredStudents.filter(s => s.classId === params.classId);
  }

  if (params.q) {
    const query = params.q.toLowerCase();
    filteredStudents = filteredStudents.filter(
      s => s.name.toLowerCase().includes(query) || s.admissionNo.toLowerCase().includes(query)
    );
  }

  const total = filteredStudents.length;

  if (params.page && params.limit) {
    const start = (params.page - 1) * params.limit;
    const end = start + params.limit;
    filteredStudents = filteredStudents.slice(start, end);
  }

  return Promise.resolve({ students: filteredStudents, total });
};

export const getStudent = async (studentId: string): Promise<Student | null> => {
    await delay(300);
    const student = STUDENTS.find(s => s.id === studentId);
    return Promise.resolve(student || null);
};

export const getStudentsByClass = async (classId: string): Promise<Student[]> => {
    await delay(350);
    return Promise.resolve(STUDENTS.filter(s => s.classId === classId));
};

export const getStudentsCount = async (): Promise<number> => {
    await delay(200);
    return Promise.resolve(STUDENTS.length);
};

interface SaveAttendancePayload {
    siteId: string;
    classId: string;
    date: string; // YYYY-MM-DD
    entries: AttendanceEntry[];
}

export const saveAttendance = async (payload: SaveAttendancePayload): Promise<{ success: true }> => {
    await delay(800);
    console.log('Saving attendance:', payload);
    // In a real app, this would persist to a database.
    // For testing error state:
    // return Promise.reject(new Error("Failed to save."));
    return Promise.resolve({ success: true });
};
