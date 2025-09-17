import React, { useState } from 'react';
import type { User, SchoolClass, Subject, LiveClassProvider } from '../../types';
import { createSession } from '../../lib/liveClassService';
import Modal from '../ui/Modal';

interface LiveClassSessionModalProps {
    isOpen: boolean;
    onClose: () => void;
    onSaveSuccess: () => void;
    actor: User;
    classes: SchoolClass[];
    subjects: Subject[];
}

const LiveClassSessionModal: React.FC<LiveClassSessionModalProps> = ({ isOpen, onClose, onSaveSuccess, actor, classes, subjects }) => {
    const [formData, setFormData] = useState({
        title: '',
        classId: '',
        subjectId: '',
        provider: 'Zoom' as LiveClassProvider,
        startTime: '',
        endTime: '',
    });
    const [isSaving, setIsSaving] = useState(false);

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        setIsSaving(true);
        try {
            await createSession({
                ...formData,
                teacherId: actor.id,
                joinUrl: '#', // Mock URL
            }, actor);
            onSaveSuccess();
        } catch {
            // Handle error
        } finally {
            setIsSaving(false);
        }
    };

    return (
        <Modal isOpen={isOpen} onClose={onClose} title="Schedule New Live Session">
            <form onSubmit={handleSubmit}>
                <div className="p-6 space-y-4">
                    <input value={formData.title} onChange={e => setFormData({ ...formData, title: e.target.value })} placeholder="Session Title" className="w-full rounded-md" required />
                    <select value={formData.classId} onChange={e => setFormData({ ...formData, classId: e.target.value })} className="w-full rounded-md" required><option value="">Select Class</option>{classes.map(c => <option key={c.id} value={c.id}>{c.name}</option>)}</select>
                    <select value={formData.subjectId} onChange={e => setFormData({ ...formData, subjectId: e.target.value })} className="w-full rounded-md" required><option value="">Select Subject</option>{subjects.map(s => <option key={s.id} value={s.id}>{s.name}</option>)}</select>
                    <select value={formData.provider} onChange={e => setFormData({ ...formData, provider: e.target.value as LiveClassProvider })} className="w-full rounded-md" required><option>Zoom</option><option>Google Meet</option><option>Self-hosted</option></select>
                    <div className="grid grid-cols-2 gap-4">
                        <input type="datetime-local" value={formData.startTime} onChange={e => setFormData({ ...formData, startTime: new Date(e.target.value).toISOString() })} className="w-full rounded-md" required title="Start Time"/>
                        <input type="datetime-local" value={formData.endTime} onChange={e => setFormData({ ...formData, endTime: new Date(e.target.value).toISOString() })} className="w-full rounded-md" required title="End Time"/>
                    </div>
                </div>
                <div className="bg-gray-50 px-6 py-3 flex justify-end">
                    <button type="submit" disabled={isSaving} className="px-4 py-2 bg-indigo-600 text-white rounded-md">{isSaving ? 'Saving...' : 'Schedule Session'}</button>
                </div>
            </form>
        </Modal>
    );
};

export default LiveClassSessionModal;