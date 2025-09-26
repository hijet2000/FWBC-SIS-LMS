import React, { useState, useEffect } from 'react';
import type { User, SchoolClass, Subject, Teacher, LiveClass } from '../../types';
import { createLiveClass } from '../../lib/liveClassService';
import Modal from '../ui/Modal';

interface ScheduleClassModalProps {
    isOpen: boolean;
    onClose: () => void;
    onSaveSuccess: () => void;
    actor: User;
    classes: SchoolClass[];
    subjects: Subject[];
    teachers: Teacher[];
}

const ScheduleClassModal: React.FC<ScheduleClassModalProps> = ({ isOpen, onClose, onSaveSuccess, actor, classes, subjects, teachers }) => {
    const [formData, setFormData] = useState({
        topic: '',
        classId: '',
        subjectId: '',
        teacherId: actor.id,
        startTime: '',
        durationMinutes: 45,
    });
    const [isSaving, setIsSaving] = useState(false);
    const [error, setError] = useState('');

    useEffect(() => {
        if (isOpen) {
            // Reset form
            setFormData({
                topic: '',
                classId: '',
                subjectId: '',
                teacherId: actor.id,
                startTime: '',
                durationMinutes: 45,
            });
            setError('');
        }
    }, [isOpen, actor.id]);

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!formData.topic || !formData.classId || !formData.subjectId || !formData.startTime) {
            setError('Please fill out all required fields.');
            return;
        }
        setIsSaving(true);
        try {
            const payload = {
                ...formData,
                startTime: new Date(formData.startTime).toISOString(),
                durationMinutes: Number(formData.durationMinutes),
            };
            await createLiveClass(payload, actor);
            onSaveSuccess();
        } catch {
            setError('Failed to schedule class.');
        } finally {
            setIsSaving(false);
        }
    };

    return (
        <Modal isOpen={isOpen} onClose={onClose} title="Schedule New Live Class">
            <form onSubmit={handleSubmit}>
                <div className="p-6 space-y-4">
                    {error && <p className="text-red-600 text-sm">{error}</p>}
                    
                    <input value={formData.topic} onChange={e => setFormData({ ...formData, topic: e.target.value })} placeholder="Class Topic" className="w-full rounded-md" required />
                    
                    <div className="grid grid-cols-2 gap-4">
                        <select value={formData.classId} onChange={e => setFormData({ ...formData, classId: e.target.value })} className="w-full rounded-md" required>
                            <option value="">-- Select Class --</option>
                            {classes.map(c => <option key={c.id} value={c.id}>{c.name}</option>)}
                        </select>
                        <select value={formData.subjectId} onChange={e => setFormData({ ...formData, subjectId: e.target.value })} className="w-full rounded-md" required>
                            <option value="">-- Select Subject --</option>
                            {subjects.map(s => <option key={s.id} value={s.id}>{s.name}</option>)}
                        </select>
                    </div>

                    <div>
                        <label className="text-sm">Start Time</label>
                        <input type="datetime-local" value={formData.startTime} onChange={e => setFormData({ ...formData, startTime: e.target.value })} className="w-full rounded-md" required />
                    </div>

                     <div>
                        <label className="text-sm">Duration (minutes)</label>
                        <input type="number" value={formData.durationMinutes} onChange={e => setFormData({ ...formData, durationMinutes: Number(e.target.value) })} className="w-full rounded-md" required min="10" />
                    </div>

                </div>
                <div className="bg-gray-50 px-6 py-3 flex justify-end gap-3">
                    <button type="button" onClick={onClose} className="px-4 py-2 border rounded-md">Cancel</button>
                    <button type="submit" disabled={isSaving} className="px-4 py-2 text-white bg-indigo-600 rounded-md disabled:bg-gray-400">
                        {isSaving ? 'Scheduling...' : 'Schedule Class'}
                    </button>
                </div>
            </form>
        </Modal>
    );
};

export default ScheduleClassModal;
