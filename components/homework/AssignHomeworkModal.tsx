import React, { useState, useEffect } from 'react';
import type { SchoolClass, Subject, User, HomeworkPolicy, Homework, HomeworkAttachment } from '../../types';
import { createHomework, updateHomework } from '../../lib/homeworkService';
import Modal from '../ui/Modal';

interface AssignHomeworkModalProps {
    isOpen: boolean;
    onClose: () => void;
    onSaveSuccess: () => void;
    classes: SchoolClass[];
    subjects: Subject[];
    actor: User;
    initialData: Homework | null;
}

const DEFAULT_POLICY: HomeworkPolicy = {
    lateGraceMinutes: 60,
    latePenaltyPct: 0,
    maxSubmissions: 3,
};

const AssignHomeworkModal: React.FC<AssignHomeworkModalProps> = ({ isOpen, onClose, onSaveSuccess, classes, subjects, actor, initialData }) => {
    const [formData, setFormData] = useState({
        title: '',
        instructions: '',
        classId: '',
        subjectId: '',
        dueDate: '',
    });
    const [policy, setPolicy] = useState<HomeworkPolicy>(DEFAULT_POLICY);
    const [attachments, setAttachments] = useState<HomeworkAttachment[]>([]);
    const [errors, setErrors] = useState<Record<string, string>>({});
    const [isSaving, setIsSaving] = useState(false);
    
    useEffect(() => {
        if (isOpen) {
            setFormData({
                title: initialData?.title || '',
                instructions: initialData?.instructions || '',
                classId: initialData?.classId || '',
                subjectId: initialData?.subjectId || '',
                dueDate: initialData?.dueDate || '',
            });
            setPolicy(initialData?.policy || DEFAULT_POLICY);
            setAttachments(initialData?.attachments || []);
            setErrors({});
        }
    }, [initialData, isOpen]);

    const validate = () => {
        const newErrors: Record<string, string> = {};
        if (!formData.title.trim()) newErrors.title = 'Title is required.';
        if (!formData.classId) newErrors.classId = 'Class is required.';
        if (!formData.subjectId) newErrors.subjectId = 'Subject is required.';
        if (!formData.dueDate) newErrors.dueDate = 'Due date is required.';
        if (policy.lateGraceMinutes < 0) newErrors.lateGraceMinutes = 'Cannot be negative.';
        if (policy.latePenaltyPct < 0 || policy.latePenaltyPct > 100) newErrors.latePenaltyPct = 'Must be 0-100.';
        if (policy.maxSubmissions < 1) newErrors.maxSubmissions = 'Must be at least 1.';
        setErrors(newErrors);
        return Object.keys(newErrors).length === 0;
    };

    const handlePolicyChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        const { name, value } = e.target;
        setPolicy(prev => ({ ...prev, [name]: Number(value) }));
    };
    
    const handleAddAttachment = () => {
        // Mock attachment creation
        const newAttachment: HomeworkAttachment = {
            id: `att-${Date.now()}`,
            fileName: `attachment_${attachments.length + 1}.pdf`,
            resourceId: `res-hw-${Date.now()}`
        };
        setAttachments(prev => [...prev, newAttachment]);
    };

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!validate()) return;
        setIsSaving(true);
        const payload = { ...formData, policy, attachments };
        try {
            if (initialData) {
                await updateHomework(initialData.id, payload, actor);
            } else {
                await createHomework(payload, actor);
            }
            onSaveSuccess();
        } catch {
            setErrors({ form: 'An error occurred while saving.' });
        } finally {
            setIsSaving(false);
        }
    };

    return (
        <Modal isOpen={isOpen} onClose={onClose} title={initialData ? 'Edit Homework' : 'Assign New Homework'}>
            <form onSubmit={handleSubmit}>
                <div className="p-6 space-y-4 max-h-[80vh] overflow-y-auto">
                    {errors.form && <p className="text-sm text-red-600">{errors.form}</p>}
                    <input value={formData.title} onChange={e => setFormData({ ...formData, title: e.target.value })} className="w-full" placeholder="Title" />
                    {errors.title && <p className="text-sm text-red-600">{errors.title}</p>}
                    <textarea value={formData.instructions} onChange={e => setFormData({ ...formData, instructions: e.target.value })} className="w-full" rows={3} placeholder="Instructions" />
                    <div className="grid grid-cols-2 gap-4">
                        <select value={formData.classId} onChange={e => setFormData({ ...formData, classId: e.target.value })} className="w-full"><option value="">Select Class</option>{classes.map(c => <option key={c.id} value={c.id}>{c.name}</option>)}</select>
                        <select value={formData.subjectId} onChange={e => setFormData({ ...formData, subjectId: e.target.value })} className="w-full"><option value="">Select Subject</option>{subjects.map(s => <option key={s.id} value={s.id}>{s.name}</option>)}</select>
                    </div>
                    <div>
                        <label>Due Date</label>
                        <input type="date" value={formData.dueDate} onChange={e => setFormData({ ...formData, dueDate: e.target.value })} className="w-full" />
                        {errors.dueDate && <p className="text-sm text-red-600">{errors.dueDate}</p>}
                    </div>
                    
                    <div className="pt-4 border-t">
                        <h3 className="font-semibold text-lg">Policies</h3>
                        <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mt-2">
                            <div><label className="text-sm">Grace (mins)</label><input type="number" name="lateGraceMinutes" value={policy.lateGraceMinutes} onChange={handlePolicyChange} className="w-full" /></div>
                            <div><label className="text-sm">Penalty (%)</label><input type="number" name="latePenaltyPct" value={policy.latePenaltyPct} onChange={handlePolicyChange} className="w-full" /></div>
                            <div><label className="text-sm">Max Submissions</label><input type="number" name="maxSubmissions" value={policy.maxSubmissions} onChange={handlePolicyChange} className="w-full" /></div>
                        </div>
                    </div>

                    <div className="pt-4 border-t">
                        <h3 className="font-semibold text-lg">Attachments</h3>
                        <ul className="text-sm list-disc list-inside">
                            {attachments.map(att => <li key={att.id}>{att.fileName}</li>)}
                        </ul>
                        <button type="button" onClick={handleAddAttachment} className="text-sm text-indigo-600 mt-2">+ Add Attachment (Mock)</button>
                    </div>

                </div>
                <div className="bg-gray-50 px-6 py-3 flex justify-end gap-3">
                    <button type="button" onClick={onClose} className="px-4 py-2 border rounded-md">Cancel</button>
                    <button type="submit" disabled={isSaving} className="px-4 py-2 text-white bg-indigo-600 rounded-md disabled:bg-gray-400">
                        {isSaving ? 'Saving...' : 'Save Homework'}
                    </button>
                </div>
            </form>
        </Modal>
    );
};

export default AssignHomeworkModal;