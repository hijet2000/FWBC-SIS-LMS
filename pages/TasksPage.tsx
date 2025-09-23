import React, { useState, useEffect, useMemo, useCallback } from 'react';
import { useAuth } from '../auth/AuthContext';
import { useToast } from '../contexts/ToastContext';
import * as taskService from '../lib/taskService';
import type { Task } from '../types';

const getTodayDateString = () => new Date().toISOString().split('T')[0];

const TasksPage: React.FC = () => {
    const { user } = useAuth();
    const { addToast } = useToast();
    const [tasks, setTasks] = useState<Task[]>([]);
    const [loading, setLoading] = useState(true);

    // Form state
    const [newTitle, setNewTitle] = useState('');
    const [newDueDate, setNewDueDate] = useState(getTodayDateString());
    const [isAdding, setIsAdding] = useState(false);

    const fetchData = useCallback(() => {
        if (!user) return;
        setLoading(true);
        taskService.listTasks(user.id)
            .then(data => {
                // Sort tasks: incomplete first, then by due date
                data.sort((a, b) => {
                    if (a.completed !== b.completed) {
                        return a.completed ? 1 : -1;
                    }
                    return new Date(a.dueDate).getTime() - new Date(b.dueDate).getTime();
                });
                setTasks(data);
            })
            .catch(() => addToast('Failed to load tasks.', 'error'))
            .finally(() => setLoading(false));
    }, [user, addToast]);

    useEffect(() => {
        fetchData();
    }, [fetchData]);

    const handleAddTask = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!newTitle.trim() || !newDueDate || !user) {
            addToast('Please provide a title and due date.', 'warning');
            return;
        }

        setIsAdding(true);
        try {
            await taskService.createTask({
                title: newTitle,
                dueDate: newDueDate,
                ownerId: user.id,
            }, user);
            addToast('Task added successfully!', 'success');
            setNewTitle('');
            setNewDueDate(getTodayDateString());
            fetchData();
        } catch {
            addToast('Failed to add task.', 'error');
        } finally {
            setIsAdding(false);
        }
    };
    
    const handleToggleComplete = async (task: Task) => {
        if (!user) return;
        
        // Optimistic UI update
        const originalTasks = [...tasks];
        setTasks(prevTasks => prevTasks.map(t => 
            t.id === task.id ? { ...t, completed: !t.completed } : t
        ));

        try {
            await taskService.updateTask(task.id, { completed: !task.completed }, user);
        } catch {
            addToast('Failed to update task. Reverting.', 'error');
            // Revert on failure
            setTasks(originalTasks);
        }
    };

    const { activeTasks, completedTasks } = useMemo(() => {
        return {
            activeTasks: tasks.filter(t => !t.completed),
            completedTasks: tasks.filter(t => t.completed),
        };
    }, [tasks]);

    return (
        <div className="space-y-6">
            <h1 className="text-3xl font-bold text-gray-800">My Tasks</h1>

            <div className="bg-white p-4 rounded-lg shadow-sm border">
                <form onSubmit={handleAddTask} className="flex flex-col sm:flex-row gap-4">
                    <input 
                        type="text"
                        value={newTitle}
                        onChange={e => setNewTitle(e.target.value)}
                        placeholder="What needs to be done?"
                        className="flex-grow p-2 border rounded-md"
                        required
                    />
                    <input 
                        type="date"
                        value={newDueDate}
                        onChange={e => setNewDueDate(e.target.value)}
                        className="p-2 border rounded-md"
                        required
                    />
                    <button type="submit" disabled={isAdding} className="px-6 py-2 bg-indigo-600 text-white font-semibold rounded-md shadow-sm hover:bg-indigo-700 disabled:bg-gray-400">
                        {isAdding ? 'Adding...' : 'Add Task'}
                    </button>
                </form>
            </div>

            {loading ? <p>Loading tasks...</p> : (
                <div className="space-y-6">
                    <div>
                        <h2 className="text-xl font-semibold mb-2">Active Tasks ({activeTasks.length})</h2>
                        <ul className="space-y-2">
                            {activeTasks.map(task => (
                                <li key={task.id} className="bg-white p-3 rounded-md border flex items-center gap-4 transition-all duration-300">
                                    <div className="relative flex items-center justify-center w-5 h-5">
                                        <input 
                                            type="checkbox" 
                                            id={`task-${task.id}`}
                                            checked={task.completed} 
                                            onChange={() => handleToggleComplete(task)}
                                            className="peer h-5 w-5 shrink-0 appearance-none rounded border-2 border-gray-300 checked:border-indigo-600 checked:bg-indigo-600 focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:ring-offset-2 cursor-pointer transition"
                                        />
                                        <svg
                                            className="pointer-events-none absolute h-4 w-4 text-white transform scale-0 peer-checked:scale-100 transition-transform duration-200 ease-in-out"
                                            xmlns="http://www.w3.org/2000/svg"
                                            viewBox="0 0 24 24"
                                            fill="none"
                                            stroke="currentColor"
                                            strokeWidth="4"
                                            strokeLinecap="round"
                                            strokeLinejoin="round"
                                        >
                                            <polyline points="20 6 9 17 4 12"></polyline>
                                        </svg>
                                    </div>
                                    <div className="flex-grow">
                                        <label htmlFor={`task-${task.id}`} className="font-medium text-gray-800 transition-colors duration-300 cursor-pointer">{task.title}</label>
                                        <p className="text-sm text-gray-500 transition-colors duration-300">Due: {task.dueDate}</p>
                                    </div>
                                </li>
                            ))}
                        </ul>
                         {activeTasks.length === 0 && <p className="text-gray-500 text-sm p-4 text-center bg-gray-50 rounded-md">No active tasks. Well done!</p>}
                    </div>
                     <div>
                        <h2 className="text-xl font-semibold mb-2">Completed Tasks ({completedTasks.length})</h2>
                        <ul className="space-y-2">
                            {completedTasks.map(task => (
                                <li key={task.id} className="bg-gray-50 p-3 rounded-md border flex items-center gap-4 opacity-70 transition-all duration-300">
                                    <div className="relative flex items-center justify-center w-5 h-5">
                                        <input 
                                            type="checkbox" 
                                            id={`task-${task.id}`}
                                            checked={task.completed} 
                                            onChange={() => handleToggleComplete(task)}
                                            className="peer h-5 w-5 shrink-0 appearance-none rounded border-2 border-gray-300 checked:border-indigo-600 checked:bg-indigo-600 focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:ring-offset-2 cursor-pointer transition"
                                        />
                                        <svg
                                            className="pointer-events-none absolute h-4 w-4 text-white transform scale-0 peer-checked:scale-100 transition-transform duration-200 ease-in-out"
                                            xmlns="http://www.w3.org/2000/svg"
                                            viewBox="0 0 24 24"
                                            fill="none"
                                            stroke="currentColor"
                                            strokeWidth="4"
                                            strokeLinecap="round"
                                            strokeLinejoin="round"
                                        >
                                            <polyline points="20 6 9 17 4 12"></polyline>
                                        </svg>
                                    </div>
                                    <div className="flex-grow">
                                        <label htmlFor={`task-${task.id}`} className="font-medium text-gray-600 line-through transition-colors duration-300 cursor-pointer">{task.title}</label>
                                        <p className="text-sm text-gray-400 line-through transition-colors duration-300">Due: {task.dueDate}</p>
                                    </div>
                                </li>
                            ))}
                        </ul>
                         {completedTasks.length === 0 && <p className="text-gray-500 text-sm p-4 text-center bg-gray-50 rounded-md">No tasks completed yet.</p>}
                    </div>
                </div>
            )}
        </div>
    );
};

export default TasksPage;