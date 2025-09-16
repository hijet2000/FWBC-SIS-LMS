import React, { useState } from 'react';
import type { SchoolClass, Subject, User, Homework } from '../../types';
import { createHomework } from '../../lib/homeworkService';
import Modal from '../ui/Modal';

interface AssignHomeworkModalProps {
    isOpen: boolean;
    onClose: () => void;
    onSaveSuccess: (message: string) => void;
    classes: SchoolClass[];
    subjects: Subject[];
    actor: User;
}

const AssignHomeworkModal: React.FC<AssignHomeworkModalProps> = ({ isOpen, onClose, onSaveSuccess, classes, subjects, actor }) => {
    const [formData, setFormData] = useState<Omit<Homework, 'id' | 'assignedAt' | 'stats'>>({
        title: '',
        instructions: '',
        classId: '',
        subjectId: '',
        dueDate: '',
        visibility: 'Published',
        allowLateSubmissions: true,
        allowResubmission: false,
        maxAttachments: 5,
        allowedFileTypes: ['.pdf', '.docx', '.jpg'],
        maxFileSizeMB: 10,
        maxAttempts: 1,
    });
    const [attachments, setAttachments] = useState<{ name: string; url: string }[]>([]);
    const [errors, setErrors] = useState<Record<string, string>>({});
    const [isSaving, setIsSaving] = useState(false);
    const [dueDateWarning, setDueDateWarning] = useState('');

    const handleDateChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        const newDate = e.target.value;
        setFormData({ ...formData, dueDate: newDate });
        setErrors(prev => ({...prev, dueDate: ''}));
        setDueDateWarning('');
        
        if (newDate) {
            const today = new Date();
            today.setHours(0,0,0,0);
            const selectedDate = new Date(newDate);
             selectedDate.setMinutes(selectedDate.getMinutes() + selectedDate.getTimezoneOffset());

            if (selectedDate < today) {
                setErrors(prev => ({...prev, dueDate: 'Due date cannot be in the past.'}));
            } else if (selectedDate.getTime() - today.getTime() < 24 * 60 * 60 * 1000) {
                setDueDateWarning('Warning: Due date is less than 24 hours away.');
            }
        }
    };

    const validate = () => {
        const newErrors: Record<string, string> = {};
        if (!formData.title.trim()) newErrors.title = 'Title is required.';
        if (!formData.classId) newErrors.classId = 'Class is required.';
        if (!formData.subjectId) newErrors.subjectId = 'Subject is required.';
        if (!formData.dueDate) newErrors.dueDate = 'Due date is required.';
        if (errors.dueDate) newErrors.dueDate = errors.dueDate; // Preserve date error
        setErrors(newErrors);
        return Object.keys(newErrors).length === 0;
    };

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!validate()) return;
        setIsSaving(true);
        try {
            await createHomework({ ...formData, attachments }, actor);
            onSaveSuccess("Homework published. Students will be notified.");
        } catch {
            setErrors({ form: 'An error occurred while saving.' });
        } finally {
            setIsSaving(false);
        }
    };

    return (
        <Modal isOpen={isOpen} onClose={onClose} title="Assign New Homework">
            <form onSubmit={handleSubmit}>
                <div className="p-6 space-y-4 max-h-[80vh] overflow-y-auto">
                    {errors.form && <p className="text-sm text-red-600">{errors.form}</p>}
                    {/* Core Details */}
                    <input value={formData.title} onChange={e => setFormData({ ...formData, title: e.target.value })} placeholder="Title" className="w-full rounded-md border-gray-300" />
                    {errors.title && <p className="text-sm text-red-600">{errors.title}</p>}
                    <textarea value={formData.instructions} onChange={e => setFormData({ ...formData, instructions: e.target.value })} placeholder="Instructions" className="w-full rounded-md border-gray-300" rows={4} />
                    <div className="grid grid-cols-2 gap-4">
                        <select value={formData.classId} onChange={e => setFormData({ ...formData, classId: e.target.value })} className="w-full rounded-md border-gray-300"><option value="">Select Class</option>{classes.map(c => <option key={c.id} value={c.id}>{c.name}</option>)}</select>
                        <select value={formData.subjectId} onChange={e => setFormData({ ...formData, subjectId: e.target.value })} className="w-full rounded-md border-gray-300"><option value="">Select Subject</option>{subjects.map(s => <option key={s.id} value={s.id}>{s.name}</option>)}</select>
                    </div>
                     {errors.classId && <p className="text-sm text-red-600">{errors.classId}</p>}
                     {errors.subjectId && <p className="text-sm text-red-600">{errors.subjectId}</p>}
                    <input type="date" value={formData.dueDate} onChange={handleDateChange} className="w-full rounded-md border-gray-300" />
                    {errors.dueDate && <p className="text-sm text-red-600">{errors.dueDate}</p>}
                    {dueDateWarning && <p className="text-sm text-yellow-600">{dueDateWarning}</p>}

                    {/* Attachments */}
                    <div className="p-4 border-2 border-dashed rounded-md text-center"> <button type="button" onClick={() => setAttachments([...attachments, {name: `resource_${attachments.length + 1}.pdf`, url: '#'}])} className="text-sm text-indigo-600"> + Add File (Mock) </button> </div>
                    {attachments.length > 0 && <ul className="text-sm list-disc list-inside mt-2">{attachments.map(f => <li key={f.name}>{f.name}</li>)}</ul>}
                    
                    {/* Policies */}
                    <fieldset className="border p-4 rounded-md space-y-3">
                        <legend className="text-sm font-medium px-2">Policies</legend>
                        <select value={formData.visibility} onChange={e => setFormData({ ...formData, visibility: e.target.value as any })} className="w-full rounded-md border-gray-300 text-sm"><option value="Published">Published (Visible to students)</option><option value="Draft">Draft (Hidden from students)</option></select>
                        <div className="flex items-center"><input type="checkbox" id="late" checked={formData.allowLateSubmissions} onChange={e => setFormData({...formData, allowLateSubmissions: e.target.checked})} className="h-4 w-4 rounded" /><label htmlFor="late" className="ml-2 text-sm">Allow late submissions</label></div>
                        <div className="flex items-center"><input type="checkbox" id="resubmit" checked={formData.allowResubmission} onChange={e => setFormData({...formData, allowResubmission: e.target.checked})} className="h-4 w-4 rounded" /><label htmlFor="resubmit" className="ml-2 text-sm">Allow resubmission after marking</label></div>
                        <div className="grid grid-cols-2 gap-4">
                            <div><label className="text-xs">Max Attempts</label><input type="number" value={formData.maxAttempts} onChange={e => setFormData({...formData, maxAttempts: Number(e.target.value)})} min="1" className="w-full text-sm rounded-md"/></div>
                            <div><label className="text-xs">Max Attachments</label><input type="number" value={formData.maxAttachments} onChange={e => setFormData({...formData, maxAttachments: Number(e.target.value)})} min="1" className="w-full text-sm rounded-md"/></div>
                        </div>
                    </fieldset>

                </div>
                <div className="bg-gray-50 px-6 py-3 flex justify-end gap-3">
                    <button type="button" onClick={onClose} className="px-4 py-2 border rounded-md">Cancel</button>
                    <button type="submit" disabled={isSaving} className="px-4 py-2 text-white bg-indigo-600 rounded-md disabled:bg-gray-400"> {isSaving ? 'Saving...' : 'Assign Homework'} </button>
                </div>
            </form>
        </Modal>
    );
};

export default AssignHomeworkModal;