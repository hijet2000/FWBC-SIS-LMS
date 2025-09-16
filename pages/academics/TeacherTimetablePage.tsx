import React, { useState, useEffect, useMemo } from 'react';
import { useSearchParams } from 'react-router-dom';
import { getTimetable, listSubjects, listTeachers } from '../../lib/academicsService';
import { getClasses } from '../../lib/schoolService';
import { detectConflicts } from '../../lib/conflictDetector';
import type { TimetableEntry, Subject, Teacher, SchoolClass } from '../../types';
import TimetableGrid from '../../components/academics/TimetableGrid';

const TeacherTimetablePage: React.FC = () => {
    const [searchParams, setSearchParams] = useSearchParams();
    const teacherId = searchParams.get('teacherId') || '';

    const [entries, setEntries] = useState<TimetableEntry[]>([]);
    const [conflicts, setConflicts] = useState<Map<string, string[]>>(new Map());
    const [meta, setMeta] = useState<{ subjects: Subject[], teachers: Teacher[], classes: SchoolClass[] }>({ subjects: [], teachers: [], classes: [] });
    const [loading, setLoading] = useState(false);

    useEffect(() => {
        // Fetch meta data once on mount
        Promise.all([listSubjects(), listTeachers(), getClasses()]).then(([subjects, teachers, classes]) => {
            setMeta({ subjects, teachers, classes });
             if (!teacherId && teachers.length > 0) {
                 setSearchParams({ teacherId: teachers[0].id });
            }
        });
    }, []); // eslint-disable-line react-hooks/exhaustive-deps

    useEffect(() => {
        if (!teacherId) return;
        setLoading(true);
        getTimetable({ teacherId })
            .then(data => {
                setEntries(data);
                // Also detect conflicts across the whole school schedule for context
                getTimetable({}).then(allEntries => {
                    setConflicts(detectConflicts(allEntries));
                });
            })
            .finally(() => setLoading(false));
    }, [teacherId]);
    
    const handleTeacherChange = (e: React.ChangeEvent<HTMLSelectElement>) => {
        setSearchParams({ teacherId: e.target.value });
    };

    const metaMaps = useMemo(() => ({
        subjects: new Map(meta.subjects.map(s => [s.id, s])),
        teachers: new Map(meta.teachers.map(t => [t.id, t])),
        classes: new Map(meta.classes.map(c => [c.id, c])),
    }), [meta]);

    return (
        <div className="space-y-6">
            <div>
                <h1 className="text-3xl font-bold text-gray-800">Teacher Timetables</h1>
                <p className="mt-1 text-sm text-gray-500">View the weekly schedule for a specific teacher.</p>
            </div>

            <div className="bg-white p-4 rounded-lg shadow-sm border max-w-sm">
                <label htmlFor="teacher-select" className="block text-sm font-medium text-gray-700">Select Teacher</label>
                <select id="teacher-select" value={teacherId} onChange={handleTeacherChange} className="mt-1 block w-full rounded-md border-gray-300">
                    {meta.teachers.map(t => <option key={t.id} value={t.id}>{t.name}</option>)}
                </select>
            </div>
            
            {loading ? <p>Loading timetable...</p> : 
                <TimetableGrid 
                    entries={entries} 
                    conflicts={conflicts} 
                    meta={metaMaps}
                    viewType="teacher"
                />
            }
        </div>
    );
};

export default TeacherTimetablePage;
