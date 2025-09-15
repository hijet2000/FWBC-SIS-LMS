import type { Course } from '../types';

const COURSES: Course[] = [
    { id: 'lms-c1', name: 'Introduction to Physics', status: 'Open' },
    { id: 'lms-c2', name: 'British Literature 101', status: 'Open' },
    { id: 'lms-c3', name: 'Calculus I', status: 'Closed' },
    { id: 'lms-c4', name: 'World History: 1900-Present', status: 'Open' },
    { id: 'lms-c5', name: 'Digital Art & Design', status: 'Open' },
];

const delay = (ms: number) => new Promise(res => setTimeout(res, ms));

export const listCourses = async (): Promise<Course[]> => {
    await delay(300);
    return Promise.resolve([...COURSES]);
};
