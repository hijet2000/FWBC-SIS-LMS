import type { TimetableEntry } from '../types';

/**
 * Detects scheduling conflicts for teachers and classes in a list of timetable entries.
 * @param entries An array of TimetableEntry objects.
 * @returns A Map where the key is the ID of a conflicting entry and the value is an array of conflict reason strings.
 */
export const detectConflicts = (entries: TimetableEntry[]): Map<string, string[]> => {
    const conflicts = new Map<string, string[]>();
    const teacherSchedule = new Map<string, TimetableEntry>(); // Key: "day-timeSlot", Value: Entry
    const classSchedule = new Map<string, TimetableEntry>(); // Key: "day-timeSlot", Value: Entry

    const addConflict = (entry: TimetableEntry, reason: string) => {
        if (!conflicts.has(entry.id)) {
            conflicts.set(entry.id, []);
        }
        conflicts.get(entry.id)!.push(reason);
    };

    for (const entry of entries) {
        const timeKey = `${entry.day}-${entry.timeSlot}`;

        // Check for teacher conflicts
        const teacherClash = teacherSchedule.get(timeKey);
        if (teacherClash) {
            const reason = `Teacher Conflict: Dr. ${teacherClash.teacherId.split('-')[1]} is double-booked.`;
            addConflict(entry, reason);
            addConflict(teacherClash, reason);
        } else {
            teacherSchedule.set(timeKey, entry);
        }

        // Check for class conflicts
        const classClash = classSchedule.get(timeKey);
        if (classClash) {
            const reason = `Class Conflict: ${classClash.classId} is scheduled for two lessons at once.`;
            addConflict(entry, reason);
            addConflict(classClash, reason);
        } else {
            classSchedule.set(timeKey, entry);
        }
    }

    return conflicts;
};
