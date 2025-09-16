import React, { useState, useEffect, useMemo } from 'react';
import { useSearchParams } from 'react-router-dom';
import { getTimetable, listSubjects, listTeachers } from '../../lib/academicsService';
import { getClasses } from '../../lib/schoolService';
import { detectConflicts } from '../../lib/conflictDetector';
import type { TimetableEntry, Subject, Teacher, SchoolClass } from '../../types';
import TimetableGrid from '../../components/academics/TimetableGrid';

const ClassTimetablePage: React.FC = () => {
    const [searchParams, setSearchParams] = useSearchParams();
    const classId = searchParams.get('classId') || '';

    const [entries, setEntries] = useState<TimetableEntry[]>([]);
    const [conflicts, setConflicts] = useState<Map<string, string[]>>(new Map());
    const [meta, setMeta] = useState<{ subjects: Subject[], teachers: Teacher[], classes: SchoolClass[] }>({ subjects: [], teachers: [], classes: [] });
    const [loading, setLoading] = useState(false);

    useEffect(() => {
        // Fetch meta data once on mount
        Promise.all([listSubjects(), listTeachers(), getClasses()]).then(([subjects, teachers, classes]) => {
            setMeta({ subjects, teachers, classes });
            if (!classId && classes.length > 0) {
                 setSearchParams({ classId: classes[0].id });
            }
        });
    }, []); // eslint-disable-line react-hooks/exhaustive-deps

    useEffect(() => {
        if (!classId) return;
        setLoading(true);
        getTimetable({ classId })
            .then(data => {
                setEntries(data);
                // Also detect conflicts across the whole school schedule for context
                getTimetable({}).then(allEntries => {
                    setConflicts(detectConflicts(allEntries));
                });
            })
            .finally(() => setLoading(false));
    }, [classId]);
    
    const handleClassChange = (e: React.ChangeEvent<HTMLSelectElement>) => {
        setSearchParams({ classId: e.target.value });
    };

    const metaMaps = useMemo(() => ({
        subjects: new Map(meta.subjects.map(s => [s.id, s])),
        teachers: new Map(meta.teachers.map(t => [t.id, t])),
        classes: new Map(meta.classes.map(c => [c.id, c])),
    }), [meta]);

    return (
        <div className="space-y-6">
            <div>
                <h1 className="text-3xl font-bold text-gray-800">Class Timetables</h1>
                <p className="mt-1 text-sm text-gray-500">View the weekly schedule for a specific class.</p>
            </div>

            <div className="bg-white p-4 rounded-lg shadow-sm border max-w-sm">
                <label htmlFor="class-select" className="block text-sm font-medium text-gray-700">Select Class</label>
                <select id="class-select" value={classId} onChange={handleClassChange} className="mt-1 block w-full rounded-md border-gray-300">
                    {meta.classes.map(c => <option key={c.id} value={c.id}>{c.name}</option>)}
                </select>
            </div>
            
            {loading ? <p>Loading timetable...</p> : 
                <TimetableGrid 
                    entries={entries} 
                    conflicts={conflicts} 
                    meta={metaMaps}
                    viewType="class"
                />
            }
        </div>
    );
};

export default ClassTimetablePage;
