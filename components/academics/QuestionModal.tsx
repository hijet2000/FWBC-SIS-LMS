import React, { useState, useEffect } from 'react';
import type { Question, User, ExamQuestionType, Subject } from '../../types';
// FIX: Imported `saveQuestionToBank` as this modal is for managing questions in the central bank.
import { saveQuestionToBank } from '../../lib/examService';
import Modal from '../ui/Modal';

interface QuestionModalProps {
    isOpen: boolean;
    onClose: () => void;
    onSaveSuccess: () => void;
    initialData: Question | null;
    subjects: Subject[];
    actor: User;
}

const QuestionModal: React.FC<QuestionModalProps> = ({ isOpen, onClose, onSaveSuccess, initialData, subjects, actor }) => {
    const [formData, setFormData] = useState({
        id: initialData?.id || '',
        subjectId: initialData?.subjectId || '',
        questionText: initialData?.questionText || '',
        type: initialData?.type || 'multiple-choice' as ExamQuestionType,
        options: initialData?.options || ['', '', '', ''],
        correctOptionIndex: initialData?.correctOptionIndex ?? -1,
        marks: initialData?.marks || 0,
    });
    const [isSaving, setIsSaving] = useState(false);
    const [error, setError] = useState('');

    useEffect(() => {
        if (isOpen) {
            setFormData({
                id: initialData?.id || '',
                subjectId: initialData?.subjectId || '',
                questionText: initialData?.questionText || '',
                type: initialData?.type || 'multiple-choice',
                options: initialData?.type === 'true-false' ? ['True', 'False'] : initialData?.options || ['', '', '', ''],
                correctOptionIndex: initialData?.correctOptionIndex ?? -1,
                marks: initialData?.marks || 0,
            });
            setError('');
        }
    }, [isOpen, initialData]);
    
    const handleTypeChange = (type: ExamQuestionType) => {
        if (type === 'true-false') {
            setFormData(prev => ({ ...prev, type, options: ['True', 'False'], correctOptionIndex: -1 }));
        } else {
            setFormData(prev => ({ ...prev, type, options: ['', '', '', ''], correctOptionIndex: -1 }));
        }
    };

    const handleOptionChange = (index: number, value: string) => {
        const newOptions = [...formData.options];
        newOptions[index] = value;
        setFormData({ ...formData, options: newOptions });
    };

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        if (formData.correctOptionIndex < 0) {
            setError('Please select a correct answer.');
            return;
        }
        setIsSaving(true);
        try {
            // FIX: Called `saveQuestionToBank` as this modal manages the central bank of questions.
            await saveQuestionToBank({ ...formData, marks: Number(formData.marks) }, actor);
            onSaveSuccess();
        } catch {
            setError('Failed to save question.');
        } finally {
            setIsSaving(false);
        }
    };

    return (
        <Modal isOpen={isOpen} onClose={onClose} title={initialData ? 'Edit Question' : 'Add New Question'}>
            <form onSubmit={handleSubmit}>
                <div className="p-6 space-y-4">
                    {error && <p className="text-red-600 text-sm">{error}</p>}
                    <select value={formData.subjectId} onChange={e => setFormData({ ...formData, subjectId: e.target.value })} className="w-full rounded-md" required>
                        <option value="">-- Select Subject --</option>
                        {subjects.map(s => <option key={s.id} value={s.id}>{s.name}</option>)}
                    </select>

                    <textarea value={formData.questionText} onChange={e => setFormData({ ...formData, questionText: e.target.value })} placeholder="Question Text" className="w-full rounded-md" rows={3} required />
                    
                    <select value={formData.type} onChange={e => handleTypeChange(e.target.value as ExamQuestionType)} className="w-full rounded-md">
                        <option value="multiple-choice">Multiple Choice</option>
                        <option value="true-false">True / False</option>
                    </select>

                    <div>
                        <h4 className="text-sm font-medium mb-2">Options & Correct Answer</h4>
                        <div className="space-y-2">
                            {formData.options.map((opt, i) => (
                                <div key={i} className="flex items-center gap-2">
                                    <input type="radio" name="correctOption" checked={formData.correctOptionIndex === i} onChange={() => setFormData({ ...formData, correctOptionIndex: i })} />
                                    <input value={opt} onChange={e => handleOptionChange(i, e.target.value)} placeholder={`Option ${i + 1}`} className="flex-grow rounded-md" required disabled={formData.type === 'true-false'} />
                                </div>
                            ))}
                        </div>
                    </div>
                    
                    <input type="number" value={formData.marks} onChange={e => setFormData({ ...formData, marks: Number(e.target.value) })} placeholder="Marks" className="w-full rounded-md" required min="0" />
                </div>
                <div className="bg-gray-50 px-6 py-3 flex justify-end gap-3">
                    <button type="button" onClick={onClose} className="px-4 py-2 border rounded-md">Cancel</button>
                    <button type="submit" disabled={isSaving} className="px-4 py-2 text-white bg-indigo-600 rounded-md disabled:bg-gray-400">
                        {isSaving ? 'Saving...' : 'Save Question'}
                    </button>
                </div>
            </form>
        </Modal>
    );
};

export default QuestionModal;
