import React from 'react';
import type { TimetableEntry, DayOfWeek } from '../../types';

interface TimetableGridProps {
    entries: TimetableEntry[];
    conflicts: Map<string, string[]>;
    meta: {
        subjects: Map<string, { name: string }>;
        teachers: Map<string, { name: string }>;
        classes: Map<string, { name: string }>;
    };
    viewType: 'class' | 'teacher';
}

const TIME_SLOTS = [
    "09:00-10:00",
    "10:00-11:00",
    "11:00-12:00",
    "12:00-13:00",
    "13:00-14:00",
    "14:00-15:00",
    "15:00-16:00",
];

const DAYS: DayOfWeek[] = ['MON', 'TUE', 'WED', 'THU', 'FRI'];

const TimetableGrid: React.FC<TimetableGridProps> = ({ entries, conflicts, meta, viewType }) => {

    const entryMap = new Map<string, TimetableEntry>();
    entries.forEach(entry => {
        entryMap.set(`${entry.day}-${entry.timeSlot}`, entry);
    });

    return (
        <div className="overflow-x-auto shadow ring-1 ring-black ring-opacity-5 sm:rounded-lg">
            <table className="min-w-full divide-y divide-gray-300">
                <thead className="bg-gray-50">
                    <tr>
                        <th className="px-3 py-3.5 text-left text-sm font-semibold text-gray-900 w-28">Time</th>
                        {DAYS.map(day => (
                            <th key={day} className="px-3 py-3.5 text-center text-sm font-semibold text-gray-900">{day}</th>
                        ))}
                    </tr>
                </thead>
                <tbody className="bg-white divide-y divide-gray-200">
                    {TIME_SLOTS.map(slot => (
                        <tr key={slot}>
                            <td className="whitespace-nowrap px-3 py-4 text-sm font-medium text-gray-500">{slot}</td>
                            {DAYS.map(day => {
                                const entry = entryMap.get(`${day}-${slot}`);
                                const conflictReasons = entry ? conflicts.get(entry.id) : undefined;
                                const cellClasses = `p-2 border-l ${conflictReasons ? 'border-2 border-red-500' : 'border-gray-200'}`;

                                return (
                                    <td key={day} className={cellClasses} title={conflictReasons?.join('\n') ?? ''}>
                                        {entry && (
                                            <div className="bg-indigo-50 p-2 rounded-md text-xs">
                                                <p className="font-bold text-indigo-800">{meta.subjects.get(entry.subjectId)?.name}</p>
                                                {viewType === 'class' && <p className="text-indigo-700">Teacher: {meta.teachers.get(entry.teacherId)?.name}</p>}
                                                {viewType === 'teacher' && <p className="text-indigo-700">Class: {meta.classes.get(entry.classId)?.name}</p>}
                                            </div>
                                        )}
                                    </td>
                                );
                            })}
                        </tr>
                    ))}
                </tbody>
            </table>
        </div>
    );
};

export default TimetableGrid;
