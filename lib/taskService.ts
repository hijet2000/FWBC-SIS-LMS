import type { Task, User } from '../types';
import { logAuditEvent } from './auditService';

// --- MOCK DATA ---
const getISODateDaysFromNow = (days: number): string => {
    const date = new Date();
    date.setDate(date.getDate() + days);
    return date.toISOString().split('T')[0];
};

let MOCK_TASKS: Task[] = [
    { id: 'task-1', title: 'Prepare Q3 performance report', dueDate: getISODateDaysFromNow(2), completed: false, createdAt: new Date().toISOString(), ownerId: 'user-evelyn-reed' },
    { id: 'task-2', title: 'Review new admissions policy', dueDate: getISODateDaysFromNow(5), completed: false, createdAt: new Date().toISOString(), ownerId: 'user-evelyn-reed' },
    { id: 'task-3', title: 'Order new textbooks for Form 2', dueDate: getISODateDaysFromNow(-1), completed: true, createdAt: new Date().toISOString(), ownerId: 'user-evelyn-reed' },
    { id: 'task-4', title: 'Finalize budget for science fair', dueDate: getISODateDaysFromNow(-5), completed: true, createdAt: new Date().toISOString(), ownerId: 'user-evelyn-reed' },
];

const delay = (ms: number) => new Promise(res => setTimeout(res, ms));

export const listTasks = async (ownerId: string): Promise<Task[]> => {
    await delay(300);
    return JSON.parse(JSON.stringify(MOCK_TASKS.filter(t => t.ownerId === ownerId)));
};

export const createTask = async (input: Omit<Task, 'id' | 'createdAt' | 'completed'>, actor: User): Promise<Task> => {
    await delay(400);
    const newTask: Task = {
        ...input,
        id: `task-${Date.now()}`,
        completed: false,
        createdAt: new Date().toISOString(),
    };
    MOCK_TASKS.push(newTask);
    logAuditEvent({
        actorId: actor.id,
        actorName: actor.name,
        action: 'CREATE',
        module: 'TASKS',
        entityType: 'Task',
        entityId: newTask.id,
        entityDisplay: newTask.title,
    });
    return newTask;
};

export const updateTask = async (taskId: string, update: Partial<Omit<Task, 'id'>>, actor: User): Promise<Task> => {
    await delay(200);
    const index = MOCK_TASKS.findIndex(t => t.id === taskId);
    if (index === -1) throw new Error("Task not found");

    const before = { ...MOCK_TASKS[index] };
    MOCK_TASKS[index] = { ...MOCK_TASKS[index], ...update };
    const after = MOCK_TASKS[index];

    logAuditEvent({
        actorId: actor.id,
        actorName: actor.name,
        action: 'UPDATE',
        module: 'TASKS',
        entityType: 'Task',
        entityId: taskId,
        entityDisplay: after.title,
        before,
        after,
    });
    return after;
};
