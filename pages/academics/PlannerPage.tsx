
import React, { useState, useEffect, useMemo } from 'react';
import { getTimetable, listSubjects, listTeachers, saveTimetableEntry } from '../../lib/academicsService';
import { getClasses } from '../../lib/schoolService';
import { detectConflicts } from '../../lib/conflictDetector';
import type { TimetableEntry, Subject, Teacher, SchoolClass, DayOfWeek, ToastType } from '../../types';
import TimetableGrid from '../../components/academics/TimetableGrid';
import Modal from '../../components/ui/Modal';
import Toast from '../../components/ui/Toast';

const TIME_SLOTS = ["09:00-10:00", "10:00-11:00", "11:00-12:00", "12:00-13:00", "13:00-14:00", "14:00-15:00", "15:00-16:00"];
const DAYS: DayOfWeek[] = ['MON', 'TUE', 'WED', 'THU', 'FRI'];

const PlannerPage: React.FC = () => {
    const [entries, setEntries] = useState<TimetableEntry[]>([]);
    const [conflicts, setConflicts] = useState<Map<string, string[]>>(new Map());
    const [meta, setMeta] = useState<{ subjects: Subject[], teachers: Teacher[], classes: SchoolClass[] }>({ subjects: [], teachers: [], classes: [] });
    const [loading, setLoading] = useState(true);
    const [isModalOpen, setIsModalOpen] = useState(false);
    const [toast, setToast] = useState<{ message: string, type: ToastType } | null>(null);

    const fetchData = async () => {
        setLoading(true);
        try {
            const [entriesData, subjectsData, teachersData, classesData] = await Promise.all([
                getTimetable({}),
                listSubjects(),
                listTeachers(),
                getClasses(),
            ]);
            setEntries(entriesData);
            setMeta({ subjects: subjectsData, teachers: teachersData, classes: classesData });
        } catch {
            setToast({ message: 'Failed to load timetable data.', type: 'error' });
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        fetchData();
    }, []);

    useEffect(() => {
        const detectedConflicts = detectConflicts(entries);
        setConflicts(detectedConflicts);
        if (detectedConflicts.size > 0) {
            setToast({ message: `${detectedConflicts.size / 2} conflict(s) detected.`, type: 'warning' });
        }
    }, [entries]);

    const metaMaps = useMemo(() => ({
        subjects: new Map(meta.subjects.map(s => [s.id, s])),
        teachers: new Map(meta.teachers.map(t => [t.id, t])),
        classes: new Map(meta.classes.map(c => [c.id, c])),
    }), [meta]);
    
    const handleSaveNewEntry = async (newEntryData: Omit<TimetableEntry, 'id'>) => {
        try {
            const savedEntry = await saveTimetableEntry(newEntryData);
            setEntries(prev => [...prev, savedEntry]);
            setToast({ message: 'Lesson scheduled successfully.', type: 'success' });
            setIsModalOpen(false);
        } catch {
            setToast({ message: 'Failed to save new entry.', type: 'error' });
        }
    };

    return (
        <div className="space-y-6">
            {toast && <Toast {...toast} onClose={() => setToast(null)} />}
            <div className="flex justify-between items-center">
                <div>
                    <h1 className="text-3xl font-bold text-gray-800">Timetable Planner</h1>
                    <p className="mt-1 text-sm text-gray-500">View the full school timetable and identify scheduling conflicts.</p>
                </div>
                <button onClick={() => setIsModalOpen(true)} className="px-4 py-2 bg-indigo-600 text-white rounded-md shadow-sm hover:bg-indigo-700">Add Lesson</button>
            </div>

            {loading ? <p>Loading timetable...</p> : 
                <TimetableGrid 
                    entries={entries} 
                    conflicts={conflicts} 
                    meta={metaMaps} 
                    viewType="teacher" // Arbitrary for this full view, could be either
                />
            }
            
            {isModalOpen && 
                <AddEntryModal 
                    isOpen={isModalOpen} 
                    onClose={() => setIsModalOpen(false)} 
                    onSave={handleSaveNewEntry} 
                    meta={meta}
                />
            }
        </div>
    );
};

// --- AddEntryModal Sub-component ---
interface AddEntryModalProps {
    isOpen: boolean;
    onClose: () => void;
    onSave: (entry: Omit<TimetableEntry, 'id'>) => Promise<void>;
    meta: { subjects: Subject[], teachers: Teacher[], classes: SchoolClass[] };
}
const AddEntryModal: React.FC<AddEntryModalProps> = ({ isOpen, onClose, onSave, meta }) => {
    const [formData, setFormData] = useState({ subjectId: '', teacherId: '', classId: '', day: 'MON' as DayOfWeek, timeSlot: TIME_SLOTS[0] });
    const [isSaving, setIsSaving] = useState(false);

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        setIsSaving(true);
        await onSave(formData);
        setIsSaving(false);
    };

    return (
        <Modal isOpen={isOpen} onClose={onClose} title="Add New Lesson">
            <form onSubmit={handleSubmit}>
                <div className="p-6 space-y-4">
                    {/* Select fields for subject, teacher, class, day, time */}
                     <select value={formData.subjectId} onChange={e => setFormData({...formData, subjectId: e.target.value})} required className="w-full rounded-md border-gray-300"><option value="">Select Subject</option>{meta.subjects.map(s => <option key={s.id} value={s.id}>{s.name}</option>)}</select>
                     <select value={formData.teacherId} onChange={e => setFormData({...formData, teacherId: e.target.value})} required className="w-full rounded-md border-gray-300"><option value="">Select Teacher</option>{meta.teachers.map(t => <option key={t.id} value={t.id}>{t.name}</option>)}</select>
                     <select value={formData.classId} onChange={e => setFormData({...formData, classId: e.target.value})} required className="w-full rounded-md border-gray-300"><option value="">Select Class</option>{meta.classes.map(c => <option key={c.id} value={c.id}>{c.name}</option>)}</select>
                     <select value={formData.day} onChange={e => setFormData({...formData, day: e.target.value as DayOfWeek})} required className="w-full rounded-md border-gray-300"><option value="">Select Day</option>{DAYS.map(d => <option key={d} value={d}>{d}</option>)}</select>
                     <select value={formData.timeSlot} onChange={e => setFormData({...formData, timeSlot: e.target.value})} required className="w-full rounded-md border-gray-300"><option value="">Select Time</option>{TIME_SLOTS.map(t => <option key={t} value={t}>{t}</option>)}</select>
                </div>
                <div className="bg-gray-50 px-6 py-3 flex justify-end gap-3">
                    <button type="button" onClick={onClose} className="px-4 py-2 border rounded-md">Cancel</button>
                    <button type="submit" disabled={isSaving} className="px-4 py-2 text-white bg-indigo-600 rounded-md disabled:bg-gray-400">{isSaving ? 'Saving...' : 'Save Lesson'}</button>
                </div>
            </form>
        </Modal>
    );
}

export default PlannerPage;
