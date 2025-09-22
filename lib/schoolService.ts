import type { SchoolClass, Student, Application } from '../types';
import { logAuditEvent } from './auditService';

// MOCK DATA
let MOCK_CLASSES: SchoolClass[] = [
  { id: 'c1', name: 'Form 1', teacherId: 't-1' },
  { id: 'c2', name: 'Form 2', teacherId: 't-2' },
  { id: 'c3', name: 'A-Level Arts', teacherId: 't-4' },
  { id: 'c4', name: 'A-Level Sciences', teacherId: 't-6' },
];

let MOCK_STUDENTS: Student[] = [
  // Class 1
  { id: 's01', name: 'Alice Johnson', admissionNo: 'ADM-2025-001', classId: 'c1', roll: '1', gender: 'Female', contact: { email: 'alice.j@example.com', phone: '555-0101' }, address: { line1: '123 Maple St', city: 'Springfield', postcode: '12345' }, photoUrl: `https://i.pravatar.cc/150?u=s01` },
  { id: 's02', name: 'Bob Williams', admissionNo: 'ADM-2025-002', classId: 'c1', roll: '2', gender: 'Male', contact: { email: 'bob.w@example.com', phone: '555-0102' }, address: { line1: '456 Oak Ave', city: 'Springfield', postcode: '12345' }, photoUrl: `https://i.pravatar.cc/150?u=s02` },
  { id: 's03', name: 'Charlie Brown', admissionNo: 'ADM-2025-003', classId: 'c1', roll: '3', gender: 'Male', contact: { email: 'charlie.b@example.com', phone: '555-0103' }, address: { line1: '789 Pine Ln', city: 'Springfield', postcode: '12345' } },
  { id: 's04', name: 'Diana Miller', admissionNo: 'ADM-2025-004', classId: 'c1', roll: '4', gender: 'Female', contact: { email: 'diana.m@example.com', phone: '555-0104' }, address: { line1: '101 Elm Ct', city: 'Springfield', postcode: '12345' }, photoUrl: `https://i.pravatar.cc/150?u=s04` },
  { id: 's05', name: 'Ethan Davis', admissionNo: 'ADM-2025-005', classId: 'c1', roll: '5', gender: 'Male', contact: { email: 'ethan.d@example.com', phone: '555-0105' }, address: { line1: '212 Birch Rd', city: 'Springfield', postcode: '12345' } },
  // Class 2
  { id: 's06', name: 'Fiona Garcia', admissionNo: 'ADM-2025-006', classId: 'c2', roll: '1', gender: 'Female', contact: { email: 'fiona.g@example.com', phone: '555-0106' }, address: { line1: '323 Cedar Blvd', city: 'Shelbyville', postcode: '54321' }, photoUrl: `https://i.pravatar.cc/150?u=s06` },
  { id: 's07', name: 'George Rodriguez', admissionNo: 'ADM-2025-007', classId: 'c2', roll: '2', gender: 'Male', contact: { email: 'george.r@example.com', phone: '555-0107' }, address: { line1: '434 Spruce Dr', city: 'Shelbyville', postcode: '54321' } },
  { id: 's08', name: 'Hannah Martinez', admissionNo: 'ADM-2025-008', classId: 'c2', roll: '3', gender: 'Female', contact: { email: 'hannah.m@example.com', phone: '555-0108' }, address: { line1: '545 Redwood Pkwy', city: 'Shelbyville', postcode: '54321' }, photoUrl: `https://i.pravatar.cc/150?u=s08` },
  { id: 's09', name: 'Ian Hernandez', admissionNo: 'ADM-2025-009', classId: 'c2', roll: '4', gender: 'Male', contact: { email: 'ian.h@example.com', phone: '555-0109' }, address: { line1: '656 Aspen Way', city: 'Shelbyville', postcode: '54321' } },
  { id: 's10', name: 'Jane Lopez', admissionNo: 'ADM-2025-010', classId: 'c2', roll: '5', gender: 'Female', contact: { email: 'jane.l@example.com', phone: '555-0110' }, address: { line1: '767 Sequoia St', city: 'Shelbyville', postcode: '54321' } },
];


// MOCK API
const delay = (ms: number) => new Promise(res => setTimeout(res, ms));

export const getClasses = async (): Promise<SchoolClass[]> => {
  await delay(150);
  return Promise.resolve([...MOCK_CLASSES]);
};

export const getStudentsCount = async (): Promise<number> => {
    await delay(200);
    return Promise.resolve(MOCK_STUDENTS.length);
};

interface StudentFilters {
    classId?: string;
    q?: string;
    page?: number;
    limit?: number;
}
export const getStudents = async (filters: StudentFilters = {}): Promise<{ students: Student[], total: number }> => {
    await delay(400);
    let filtered = [...MOCK_STUDENTS];

    if (filters.classId) {
        filtered = filtered.filter(s => s.classId === filters.classId);
    }
    if (filters.q) {
        const query = filters.q.toLowerCase();
        filtered = filtered.filter(s => s.name.toLowerCase().includes(query) || s.admissionNo.toLowerCase().includes(query));
    }
    
    const total = filtered.length;
    
    if (filters.page && filters.limit) {
        const start = (filters.page - 1) * filters.limit;
        const end = start + filters.limit;
        filtered = filtered.slice(start, end);
    }

    return Promise.resolve({ students: filtered, total });
};

export const getStudent = async (id: string): Promise<Student | null> => {
    await delay(300);
    const student = MOCK_STUDENTS.find(s => s.id === id);
    return Promise.resolve(student || null);
};

export const getStudentsByClass = async (classId: string): Promise<Student[]> => {
    await delay(250);
    const students = MOCK_STUDENTS.filter(s => s.classId === classId);
    return Promise.resolve(students);
};

export const createStudentFromApplication = (app: Application): Student => {
    const year = new Date().getFullYear();
    const nextId = MOCK_STUDENTS.length + 1;
    const admissionNo = `ADM-${year}-${nextId.toString().padStart(3, '0')}`;

    const newStudent: Student = {
        id: `s-${nextId}`,
        name: app.applicantDetails.fullName || app.applicantName,
        admissionNo,
        classId: app.desiredClassId,
        gender: app.applicantDetails.gender,
        contact: {
            email: app.guardians[0]?.email || '',
            phone: app.guardians[0]?.phone || '',
        },
        address: {
            line1: app.guardians[0]?.address || '',
            city: '',
            postcode: '',
        }
    };
    
    MOCK_STUDENTS.push(newStudent);
    
    logAuditEvent({
        actorId: 'system', // Or pass actor in
        actorName: 'System',
        action: 'CREATE',
        module: 'STUDENTS',
        entityType: 'Student',
        entityId: newStudent.id,
        entityDisplay: newStudent.name,
        meta: { source: 'Application', applicationId: app.id }
    });
    
    return newStudent;
};