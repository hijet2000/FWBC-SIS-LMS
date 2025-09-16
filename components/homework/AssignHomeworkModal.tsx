import React, { useState } from 'react';
import type { SchoolClass, Subject, User } from '../../types';
import { createHomework } from '../../lib/homeworkService';
import Modal from '../ui/Modal';

interface AssignHomeworkModalProps {
    isOpen: boolean;
    onClose: () => void;
    onSaveSuccess: () => void;
    classes: SchoolClass[];
    subjects: Subject[];
    actor: User;
}

const AssignHomeworkModal: React.FC<AssignHomeworkModalProps> = ({ isOpen, onClose, onSaveSuccess, classes, subjects, actor }) => {
    const [formData, setFormData] = useState({
        title: '',
        instructions: '',
        classId: '',
        subjectId: '',
        dueDate: '',
        visibility: 'Published' as 'Draft' | 'Published',
        allowLateSubmissions: true,
        allowResubmission: false,
    });
    const [attachments, setAttachments] = useState<{ name: string; url: string }[]>([]);
    const [errors, setErrors] = useState<Record<string, string>>({});
    const [isSaving, setIsSaving] = useState(false);

    const validate = () => {
        const newErrors: Record<string, string> = {};
        if (!formData.title.trim()) newErrors.title = 'Title is required.';
        if (!formData.classId) newErrors.classId = 'Class is required.';
        if (!formData.subjectId) newErrors.subjectId = 'Subject is required.';
        if (!formData.dueDate) newErrors.dueDate = 'Due date is required.';
        setErrors(newErrors);
        return Object.keys(newErrors).length === 0;
    };

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!validate()) return;
        setIsSaving(true);
        try {
            await createHomework({ ...formData, attachments }, actor);
            onSaveSuccess();
        } catch {
            setErrors({ form: 'An error occurred while saving.' });
        } finally {
            setIsSaving(false);
        }
    };

    return (
        <Modal isOpen={isOpen} onClose={onClose} title="Assign New Homework">
            <form onSubmit={handleSubmit}>
                <div className="p-6 space-y-4">
                    {errors.form && <p className="text-sm text-red-600">{errors.form}</p>}
                    <div>
                        <label>Title</label>
                        <input value={formData.title} onChange={e => setFormData({ ...formData, title: e.target.value })} className="w-full rounded-md border-gray-300" />
                        {errors.title && <p className="text-sm text-red-600">{errors.title}</p>}
                    </div>
                    <div>
                        <label>Instructions</label>
                        <textarea value={formData.instructions} onChange={e => setFormData({ ...formData, instructions: e.target.value })} className="w-full rounded-md border-gray-300" rows={4} />
                    </div>
                    <div className="grid grid-cols-2 gap-4">
                        <div>
                            <label>Class</label>
                            <select value={formData.classId} onChange={e => setFormData({ ...formData, classId: e.target.value })} className="w-full rounded-md border-gray-300">
                                <option value="">Select Class</option>
                                {classes.map(c => <option key={c.id} value={c.id}>{c.name}</option>)}
                            </select>
                            {errors.classId && <p className="text-sm text-red-600">{errors.classId}</p>}
                        </div>
                        <div>
                            <label>Subject</label>
                            <select value={formData.subjectId} onChange={e => setFormData({ ...formData, subjectId: e.target.value })} className="w-full rounded-md border-gray-300">
                                <option value="">Select Subject</option>
                                {subjects.map(s => <option key={s.id} value={s.id}>{s.name}</option>)}
                            </select>
                            {errors.subjectId && <p className="text-sm text-red-600">{errors.subjectId}</p>}
                        </div>
                    </div>
                     <div>
                        <label>Due Date</label>
                        <input type="date" value={formData.dueDate} onChange={e => setFormData({ ...formData, dueDate: e.target.value })} className="w-full rounded-md border-gray-300" />
                        {errors.dueDate && <p className="text-sm text-red-600">{errors.dueDate}</p>}
                    </div>
                     <div>
                        <label className="block text-sm font-medium text-gray-700">Attachments</label>
                        <div className="mt-1 p-4 border-2 border-dashed rounded-md text-center">
                            <button type="button" onClick={() => setAttachments([...attachments, {name: `resource_${attachments.length + 1}.pdf`, url: '#'}])} className="text-sm text-indigo-600">
                                + Add File (Mock)
                            </button>
                        </div>
                        {attachments.length > 0 && <ul className="text-sm list-disc list-inside mt-2">
                            {attachments.map(f => <li key={f.name}>{f.name}</li>)}
                        </ul>}
                    </div>
                    <div>
                        <label className="block text-sm font-medium text-gray-700">Policies</label>
                        <div className="mt-2 space-y-2">
                             <select value={formData.visibility} onChange={e => setFormData({ ...formData, visibility: e.target.value as any })} className="w-full rounded-md border-gray-300 text-sm">
                                <option value="Published">Published (Visible to students)</option>
                                <option value="Draft">Draft (Hidden from students)</option>
                            </select>
                            <div className="flex items-center"><input type="checkbox" id="late" checked={formData.allowLateSubmissions} onChange={e => setFormData({...formData, allowLateSubmissions: e.target.checked})} className="h-4 w-4 rounded" /><label htmlFor="late" className="ml-2 text-sm">Allow late submissions</label></div>
                            <div className="flex items-center"><input type="checkbox" id="resubmit" checked={formData.allowResubmission} onChange={e => setFormData({...formData, allowResubmission: e.target.checked})} className="h-4 w-4 rounded" /><label htmlFor="resubmit" className="ml-2 text-sm">Allow resubmission after marking</label></div>
                        </div>
                    </div>
                </div>
                <div className="bg-gray-50 px-6 py-3 flex justify-end gap-3">
                    <button type="button" onClick={onClose} className="px-4 py-2 border rounded-md">Cancel</button>
                    <button type="submit" disabled={isSaving} className="px-4 py-2 text-white bg-indigo-600 rounded-md disabled:bg-gray-400">
                        {isSaving ? 'Saving...' : 'Assign Homework'}
                    </button>
                </div>
            </form>
        </Modal>
    );
};

export default AssignHomeworkModal;
