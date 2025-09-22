import React, { useState, useEffect, useCallback } from 'react';
import { useParams, Link } from 'react-router-dom';
import { useAuth } from '../../auth/AuthContext';
import { useToast } from '../../contexts/ToastContext';
import * as homeworkService from '../../lib/homeworkService';
import type { Homework, Submission, Feedback, HomeworkAttachment } from '../../types';

type SubmissionWithFeedback = Submission & { feedback?: Feedback };

const useSignedAttachmentUrl = (resourceId: string | null) => {
    const { user } = useAuth();
    const [url, setUrl] = useState<string | null>(null);

    useEffect(() => {
        if (resourceId && user) {
            homeworkService.getSignedAttachmentUrl(resourceId, user).then(setUrl);
        }
    }, [resourceId, user]);

    return url;
};

const AttachmentLink: React.FC<{ attachment: HomeworkAttachment }> = ({ attachment }) => {
    const signedUrl = useSignedAttachmentUrl(attachment.resourceId);
    return (
        <li>
            {signedUrl ? (
                <a href={signedUrl} target="_blank" rel="noopener noreferrer" className="text-indigo-600 hover:underline">{attachment.fileName}</a>
            ) : (
                <span className="text-gray-500">{attachment.fileName} (generating link...)</span>
            )}
        </li>
    );
};

const StudentSubmissionPage: React.FC = () => {
    const { siteId, homeworkId } = useParams<{ siteId: string, homeworkId: string }>();
    const { user } = useAuth();
    const { addToast } = useToast();
    const studentId = 's01'; // HACK: Hardcoded for demo

    const [homework, setHomework] = useState<Homework | null>(null);
    const [submission, setSubmission] = useState<SubmissionWithFeedback | null>(null);
    const [submissionText, setSubmissionText] = useState('');
    const [attachments, setAttachments] = useState<HomeworkAttachment[]>([]);
    const [loading, setLoading] = useState(true);
    const [isSubmitting, setIsSubmitting] = useState(false);

    const fetchData = useCallback(async () => {
        if (!homeworkId || !studentId) return;
        setLoading(true);
        try {
            const [hwData, subData] = await Promise.all([
                homeworkService.getHomework(homeworkId),
                homeworkService.getSubmissionsForStudent(studentId),
            ]);
            setHomework(hwData);
            const currentSubmission = subData.find(s => s.homeworkId === homeworkId) || null;
            setSubmission(currentSubmission);
            setSubmissionText(currentSubmission?.submissionText || '');
            setAttachments(currentSubmission?.attachments || []);
        } catch {
            addToast('Failed to load assignment data.', 'error');
        } finally {
            setLoading(false);
        }
    }, [homeworkId, studentId, addToast]);

    useEffect(() => {
        fetchData();
    }, [fetchData]);

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!homeworkId || !user || !submissionText.trim()) {
            addToast('Please enter your submission text.', 'warning');
            return;
        }
        setIsSubmitting(true);
        try {
            await homeworkService.submitWork(homeworkId, studentId, submissionText, attachments, user);
            addToast('Submission successful!', 'success');
            fetchData(); // Refresh data
        } catch (err: any) {
            addToast(err.message || 'Failed to submit. Please try again.', 'error');
        } finally {
            setIsSubmitting(false);
        }
    };
    
    const handleAddAttachment = () => {
        const newAttachment: HomeworkAttachment = {
            id: `att-stu-${Date.now()}`,
            fileName: `student_upload_${attachments.length + 1}.docx`,
            resourceId: `res-stu-${Date.now()}`
        };
        setAttachments(prev => [...prev, newAttachment]);
    };

    if (loading) return <div className="text-center p-8">Loading...</div>;
    if (!homework) return <div className="text-center p-8 text-red-500">Homework not found.</div>;
    
    const isGraded = !!submission?.feedback;
    const submissionCount = submission?.submissionCount || 0;
    const maxSubmissions = homework.policy.maxSubmissions;
    const canSubmit = !isGraded && submissionCount < maxSubmissions;
    const remainingSubmissions = maxSubmissions - submissionCount;

    const getSubmissionPolicyMessage = () => {
        if (isGraded) return "This assignment has been graded and can no longer be edited.";
        if (submissionCount >= maxSubmissions) return `You have reached the maximum of ${maxSubmissions} submissions.`;
        return `You have ${remainingSubmissions} submission(s) remaining.`;
    };

    return (
        <div className="space-y-6">
            <div>
                <Link to={`/school/${siteId}/student/homework`} className="text-sm text-indigo-600 hover:text-indigo-800">&larr; Back to My Homework</Link>
                <h1 className="text-3xl font-bold text-gray-800 mt-2">{homework.title}</h1>
                <p className="mt-1 text-sm text-gray-500">Due: {homework.dueDate}</p>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                <div className="md:col-span-2 space-y-6">
                    <div className="bg-white p-6 rounded-lg shadow-sm border">
                        <h2 className="text-lg font-semibold text-gray-700 border-b pb-2 mb-4">Instructions & Attachments</h2>
                        <p className="text-gray-600 whitespace-pre-wrap">{homework.instructions}</p>
                        {homework.attachments.length > 0 && (
                            <div className="mt-4 pt-4 border-t">
                                <h3 className="font-medium text-sm">Teacher Attachments:</h3>
                                <ul className="list-disc list-inside mt-2">
                                    {homework.attachments.map(att => <AttachmentLink key={att.id} attachment={att} />)}
                                </ul>
                            </div>
                        )}
                    </div>

                    <div className="bg-white p-6 rounded-lg shadow-sm border">
                        <h2 className="text-lg font-semibold text-gray-700 border-b pb-2 mb-4">Your Submission</h2>
                        <form onSubmit={handleSubmit} className="space-y-4">
                            <textarea value={submissionText} onChange={e => setSubmissionText(e.target.value)} placeholder="Type your answer here..." className="w-full h-48 p-2 border rounded-md" required disabled={!canSubmit || isSubmitting} />
                             <div>
                                <h3 className="font-medium text-sm">Your Attachments:</h3>
                                <ul className="text-sm list-disc list-inside">
                                    {attachments.map(att => <li key={att.id}>{att.fileName}</li>)}
                                </ul>
                                <button type="button" onClick={handleAddAttachment} disabled={!canSubmit || isSubmitting} className="text-sm text-indigo-600 mt-2 disabled:text-gray-400">+ Add Attachment (Mock)</button>
                             </div>
                             <div className="flex items-center justify-between">
                                <button type="submit" disabled={!canSubmit || isSubmitting} className="px-4 py-2 bg-indigo-600 text-white rounded-md disabled:bg-gray-400">
                                    {isSubmitting ? 'Submitting...' : submission?.submittedAt ? 'Resubmit' : 'Submit'}
                                </button>
                                <p className="text-sm text-gray-500">{getSubmissionPolicyMessage()}</p>
                            </div>
                        </form>
                    </div>
                </div>

                <div className="md:col-span-1 space-y-6">
                    <div className="bg-white p-6 rounded-lg shadow-sm border">
                         <h2 className="text-lg font-semibold text-gray-700 border-b pb-2 mb-4">Status & Feedback</h2>
                         {submission ? (
                            <div className="space-y-4">
                                <div><p className="text-sm font-medium text-gray-500">Status</p><p className="font-semibold">{submission.status}</p></div>
                                {submission.submittedAt && <div><p className="text-sm font-medium">Submitted</p><p>{new Date(submission.submittedAt).toLocaleString()} (Attempt {submission.submissionCount})</p></div>}
                                {submission.feedback && (
                                    <div className="pt-4 border-t">
                                        <div className="flex justify-between items-baseline"><p className="text-sm font-medium">Score</p><p className="text-2xl font-bold">{submission.feedback.score}/100</p></div>
                                         <div><p className="text-sm font-medium mt-2">Comments</p><p className="bg-gray-50 p-2 rounded mt-1">{submission.feedback.comments}</p></div>
                                    </div>
                                )}
                            </div>
                         ) : (
                            <p className="text-gray-500">Not yet submitted.</p>
                         )}
                    </div>
                </div>
            </div>
        </div>
    );
};

export default StudentSubmissionPage;