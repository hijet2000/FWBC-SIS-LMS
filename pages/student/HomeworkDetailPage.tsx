import React, { useState, useEffect, useCallback } from 'react';
import { useParams, Link } from 'react-router-dom';
import { useAuth } from '../../auth/AuthContext';
import { useToast } from '../../contexts/ToastContext';
import * as homeworkService from '../../lib/homeworkService';
import type { Homework, Submission, Feedback } from '../../types';

const DetailCard: React.FC<{ title: string; children: React.ReactNode; }> = ({ title, children }) => (
    <div className="bg-white p-6 rounded-lg shadow-sm border">
        <h3 className="text-lg font-semibold text-gray-700 border-b pb-2 mb-4">{title}</h3>
        {children}
    </div>
);

const StudentHomeworkDetailPage: React.FC = () => {
    const { siteId, homeworkId } = useParams<{ siteId: string; homeworkId: string }>();
    const { user } = useAuth();
    const { addToast } = useToast();
    // HACK: For demo, using a fixed student ID.
    const studentId = 's01';

    const [homework, setHomework] = useState<Homework | null>(null);
    const [submission, setSubmission] = useState<(Submission & { feedback?: Feedback }) | null>(null);
    const [loading, setLoading] = useState(true);

    // Form state for new submission
    const [text, setText] = useState('');
    const [files, setFiles] = useState<{ name: string; url: string }[]>([]);
    const [isSubmitting, setIsSubmitting] = useState(false);

    const fetchData = useCallback(() => {
        if (!homeworkId || !studentId) return;
        setLoading(true);
        Promise.all([
            homeworkService.getHomework(homeworkId),
            homeworkService.getSubmissionForStudent(homeworkId, studentId)
        ]).then(([hwData, subData]) => {
            setHomework(hwData);
            setSubmission(subData);
            if (subData) {
                setText(subData.text || '');
                setFiles(subData.files || []);
            }
        }).catch(() => {
            addToast('Failed to load homework details.', 'error');
        }).finally(() => {
            setLoading(false);
        });
    }, [homeworkId, studentId, addToast]);

    useEffect(() => {
        fetchData();
    }, [fetchData]);

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!homeworkId || !studentId || !user) return;
        setIsSubmitting(true);
        try {
            await homeworkService.submitHomework({ homeworkId, studentId, text, files }, user);
            addToast('Homework submitted successfully!', 'success');
            fetchData(); // Refresh to show updated status
        } catch {
            addToast('Failed to submit homework.', 'error');
        } finally {
            setIsSubmitting(false);
        }
    };

    if (loading) return <div className="text-center p-8">Loading...</div>;
    if (!homework) return <div className="text-center p-8 text-red-500">Homework not found.</div>;

    const isSubmitted = submission?.status !== 'Not Submitted';
    const hasFeedback = !!submission?.feedback;

    return (
        <div className="space-y-6">
            <Link to={`/school/${siteId}/student/homework`} className="text-sm text-indigo-600">&larr; Back to My Homework</Link>
            <h1 className="text-3xl font-bold">{homework.title}</h1>
            
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                <div className="lg:col-span-2 space-y-6">
                    <DetailCard title="Instructions">
                        <p className="whitespace-pre-wrap text-gray-700">{homework.instructions}</p>
                    </DetailCard>
                    
                    {hasFeedback && submission?.feedback && (
                         <DetailCard title="Feedback from Teacher">
                             <div className="p-4 bg-indigo-50 border border-indigo-200 rounded-lg">
                                {submission.feedback.score && <p className="text-2xl font-bold">Score: {submission.feedback.score}/100</p>}
                                <p className="mt-2 text-gray-800">{submission.feedback.comments}</p>
                                <p className="text-xs text-gray-500 mt-4">Returned on: {new Date(submission.feedback.returnedAt).toLocaleDateString()}</p>
                             </div>
                        </DetailCard>
                    )}
                </div>

                <div className="lg:col-span-1 space-y-6">
                    <DetailCard title="Your Submission">
                        <form onSubmit={handleSubmit} className="space-y-4">
                            <div>
                                <label htmlFor="text-submission" className="block text-sm font-medium text-gray-700">Your Answer</label>
                                <textarea
                                    id="text-submission"
                                    rows={8}
                                    value={text}
                                    onChange={(e) => setText(e.target.value)}
                                    className="w-full mt-1 rounded-md border-gray-300"
                                    placeholder="Type your response here..."
                                    disabled={hasFeedback}
                                />
                            </div>
                            <div>
                                <label className="block text-sm font-medium text-gray-700">Attachments</label>
                                <div className="mt-1 p-4 border-2 border-dashed rounded-md text-center">
                                    <button type="button" onClick={() => setFiles([...files, {name: `file-${files.length + 1}.pdf`, url: '#'}])} disabled={hasFeedback} className="text-sm text-indigo-600">
                                        + Add File (Mock)
                                    </button>
                                </div>
                                {files.length > 0 && <ul className="text-sm list-disc list-inside mt-2">
                                    {files.map(f => <li key={f.name}>{f.name}</li>)}
                                </ul>}
                            </div>
                            <button type="submit" disabled={isSubmitting || hasFeedback} className="w-full py-2 bg-indigo-600 text-white rounded-md disabled:bg-gray-400">
                                {isSubmitting ? 'Submitting...' : isSubmitted ? 'Resubmit' : 'Submit'}
                            </button>
                        </form>
                         {submission && (
                            <div className="mt-4 text-sm text-center">
                                <p>Status: <span className="font-bold">{submission.status}</span></p>
                                {submission.submittedAt && <p>Submitted on: {new Date(submission.submittedAt).toLocaleString()}</p>}
                            </div>
                         )}
                    </DetailCard>
                </div>
            </div>
        </div>
    );
};

export default StudentHomeworkDetailPage;