import type { Task, User } from '../types';
import { logAuditEvent } from './auditService';

const TASKS_STORAGE_KEY = 'fwbc-tasks';

// --- MOCK DATA / DEFAULTS ---
const getISODateDaysFromNow = (days: number): string => {
    const date = new Date();
    date.setDate(date.getDate() + days);
    return date.toISOString().split('T')[0];
};

const getDefaultTasks = (ownerId: string): Task[] => [
    { id: 'task-1', title: 'Prepare Q3 performance report', dueDate: getISODateDaysFromNow(2), completed: false, createdAt: new Date().toISOString(), ownerId },
    { id: 'task-2', title: 'Review new admissions policy', dueDate: getISODateDaysFromNow(5), completed: false, createdAt: new Date().toISOString(), ownerId },
    { id: 'task-3', title: 'Order new textbooks for Form 2', dueDate: getISODateDaysFromNow(-1), completed: true, createdAt: new Date().toISOString(), ownerId },
];

// --- Local Storage Functions ---

const loadTasksFromStorage = (): Task[] => {
    try {
        const storedTasks = localStorage.getItem(TASKS_STORAGE_KEY);
        if (storedTasks) {
            return JSON.parse(storedTasks);
        }
    } catch (error) {
        console.error("Failed to parse tasks from localStorage", error);
    }
    return []; // Return empty array if nothing found or error
};

const saveTasksToStorage = (tasks: Task[]) => {
    try {
        localStorage.setItem(TASKS_STORAGE_KEY, JSON.stringify(tasks));
    } catch (error) {
        console.error("Failed to save tasks to localStorage", error);
    }
};

const delay = (ms: number) => new Promise(res => setTimeout(res, ms));

export const listTasks = async (ownerId: string): Promise<Task[]> => {
    await delay(100); // Shorter delay for local storage access
    let tasks = loadTasksFromStorage();

    // If storage is empty, populate with default tasks for the current user and save it.
    if (tasks.length === 0) {
        tasks = getDefaultTasks(ownerId);
        saveTasksToStorage(tasks);
    }

    // Filter by owner to simulate multi-user environment, though localStorage is shared.
    return tasks.filter(t => t.ownerId === ownerId);
};

export const createTask = async (input: Omit<Task, 'id' | 'createdAt' | 'completed'>, actor: User): Promise<Task> => {
    await delay(150);
    const allTasks = loadTasksFromStorage();
    
    const newTask: Task = {
        ...input,
        id: `task-${Date.now()}`,
        completed: false,
        createdAt: new Date().toISOString(),
    };

    const updatedTasks = [...allTasks, newTask];
    saveTasksToStorage(updatedTasks);

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
    await delay(100);
    const allTasks = loadTasksFromStorage();
    const index = allTasks.findIndex(t => t.id === taskId);
    if (index === -1) throw new Error("Task not found");

    const before = { ...allTasks[index] };
    allTasks[index] = { ...allTasks[index], ...update };
    const after = allTasks[index];

    saveTasksToStorage(allTasks);

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