import React, { useState, useEffect } from 'react';
import type { Submission, Feedback, User } from '../../types';
import { saveFeedback, getSubmission } from '../../lib/homeworkService';
import Modal from '../ui/Modal';

interface FeedbackModalProps {
    isOpen: boolean;
    onClose: () => void;
    onSaveSuccess: () => void;
    submission: Submission;
    studentName: string;
    actor: User;
}

const FeedbackModal: React.FC<FeedbackModalProps> = ({ isOpen, onClose, onSaveSuccess, submission, studentName, actor }) => {
    const [fullSubmission, setFullSubmission] = useState<(Submission & { feedback?: Feedback }) | null>(null);
    const [formData, setFormData] = useState({ score: '', comments: '' });
    const [loading, setLoading] = useState(true);
    const [isSaving, setIsSaving] = useState(false);
    const [error, setError] = useState('');

    useEffect(() => {
        if (isOpen && submission.id) {
            setLoading(true);
            getSubmission(submission.id).then(data => {
                setFullSubmission(data);
                setFormData({
                    score: data?.feedback?.score?.toString() || '',
                    comments: data?.feedback?.comments || '',
                });
                setLoading(false);
            });
        }
    }, [isOpen, submission.id]);
    
    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        setIsSaving(true);
        setError('');
        try {
            const payload = {
                score: formData.score ? Number(formData.score) : undefined,
                comments: formData.comments,
            };
            await saveFeedback(submission.id, payload, actor);
            onSaveSuccess();
        } catch {
            setError('Failed to save feedback.');
        } finally {
            setIsSaving(false);
        }
    };

    return (
        <Modal isOpen={isOpen} onClose={onClose} title={`Feedback for ${studentName}`}>
            {loading ? <div className="p-6">Loading submission...</div> : (
                <form onSubmit={handleSubmit}>
                    <div className="p-6 space-y-4">
                         <div className="p-3 bg-gray-50 border rounded-md">
                            <h4 className="font-semibold text-sm">Submission Details</h4>
                            <p className="text-xs text-gray-600">Status: {submission.status}</p>
                            {submission.submittedAt && <p className="text-xs text-gray-600">Time: {new Date(submission.submittedAt).toLocaleString()}</p>}
                        </div>
                        {error && <p className="text-sm text-red-600">{error}</p>}
                        <div>
                            <label>Score (optional)</label>
                            <input type="number" value={formData.score} onChange={e => setFormData({ ...formData, score: e.target.value })} className="w-full rounded-md border-gray-300" />
                        </div>
                        <div>
                            <label>Comments</label>
                            <textarea value={formData.comments} onChange={e => setFormData({ ...formData, comments: e.target.value })} className="w-full rounded-md border-gray-300" rows={5} required />
                        </div>
                    </div>
                    <div className="bg-gray-50 px-6 py-3 flex justify-end gap-3">
                        <button type="button" onClick={onClose} className="px-4 py-2 border rounded-md">Cancel</button>
                        <button type="submit" disabled={isSaving} className="px-4 py-2 text-white bg-indigo-600 rounded-md disabled:bg-gray-400">
                            {isSaving ? 'Saving...' : 'Save Feedback'}
                        </button>
                    </div>
                </form>
            )}
        </Modal>
    );
};

export default FeedbackModal;
