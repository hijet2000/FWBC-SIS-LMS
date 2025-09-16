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

const PolicyItem: React.FC<{ label: string; value: React.ReactNode; }> = ({ label, value }) => (
    <div className="flex justify-between text-xs">
        <span className="text-gray-500">{label}</span>
        <span className="font-medium text-gray-700">{value}</span>
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

    const handleFileAdd = () => {
        if (homework?.maxAttachments && files.length >= homework.maxAttachments) {
            addToast(`You can only attach up to ${homework.maxAttachments} files.`, 'warning');
            return;
        }
        // Mock file selection
        const mockFile = `submission_${Date.now()}.pdf`;
        setFiles([...files, { name: mockFile, url: '#' }]);
    };
    
    const handleAttachmentClick = (fileUrl: string) => {
        addToast("Generating secure download link...", "info");
        // Simulate backend call to get a signed URL
        setTimeout(() => {
            const signedUrl = `${fileUrl}?token=xyz123&expires=${Date.now() + 60000}`;
            window.open(signedUrl, '_blank');
        }, 500);
    };

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!homeworkId || !studentId || !user) return;
        setIsSubmitting(true);
        try {
            await homeworkService.submitHomework({ homeworkId, studentId, text, files }, user);
            addToast('Homework submitted! Your teacher will be notified.', 'success');
            fetchData();
        } catch(e: any) {
            addToast(e.message || 'Failed to submit homework.', 'error');
        } finally {
            setIsSubmitting(false);
        }
    };

    if (loading) return <div className="text-center p-8">Loading...</div>;
    if (!homework) return <div className="text-center p-8 text-red-500">Homework not found.</div>;

    const hasFeedback = !!submission?.feedback;
    const attemptsMade = submission?.attemptNumber || 0;
    const maxAttempts = homework.maxAttempts || 1;
    const canResubmit = !hasFeedback || homework.allowResubmission;
    const canAttempt = attemptsMade < maxAttempts;
    const canSubmit = canResubmit && canAttempt;

    return (
        <div className="space-y-6">
            <Link to={`/school/${siteId}/student/homework`} className="text-sm text-indigo-600">&larr; Back to My Homework</Link>
            <h1 className="text-3xl font-bold">{homework.title}</h1>
            
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                <div className="lg:col-span-2 space-y-6">
                    <DetailCard title="Instructions & Materials">
                        <p className="whitespace-pre-wrap text-gray-700">{homework.instructions}</p>
                         {homework.attachments && homework.attachments.length > 0 && (
                             <div className="mt-4 pt-4 border-t">
                                <h4 className="font-semibold text-sm mb-2">Teacher Attachments</h4>
                                <ul className="list-disc list-inside space-y-1">
                                    {homework.attachments.map((file, index) => (
                                        <li key={index}>
                                            <button onClick={() => handleAttachmentClick(file.url)} className="text-indigo-600 hover:underline">
                                                {file.name}
                                            </button>
                                        </li>
                                    ))}
                                </ul>
                            </div>
                        )}
                    </DetailCard>
                    
                    {hasFeedback && submission?.feedback && (
                         <DetailCard title="Feedback from Teacher">
                             <div className="p-4 bg-indigo-50 border border-indigo-200 rounded-lg">
                                {submission.feedback.score !== undefined && <p className="text-2xl font-bold">Score: {submission.feedback.score}/100</p>}
                                <p className="mt-2 text-gray-800 whitespace-pre-wrap">{submission.feedback.comments}</p>
                                <p className="text-xs text-gray-500 mt-4">Returned on: {new Date(submission.feedback.returnedAt).toLocaleDateString()}</p>
                             </div>
                        </DetailCard>
                    )}
                </div>

                <div className="lg:col-span-1 space-y-6">
                    <DetailCard title="Your Submission">
                        <form onSubmit={handleSubmit} className="space-y-4">
                            <textarea id="text-submission" rows={8} value={text} onChange={(e) => setText(e.target.value)} className="w-full mt-1 rounded-md border-gray-300 disabled:bg-gray-100" placeholder="Type your response here..." disabled={!canSubmit}/>
                            <div>
                                {canSubmit && <div className="mt-1 p-4 border-2 border-dashed rounded-md text-center"> <button type="button" onClick={handleFileAdd} disabled={!canSubmit} className="text-sm text-indigo-600 disabled:text-gray-400"> + Add File </button> </div>}
                                {files.length > 0 && <ul className="text-sm list-disc list-inside mt-2">{files.map(f => <li key={f.name}>{f.name}</li>)}</ul>}
                            </div>
                            <button type="submit" disabled={isSubmitting || !canSubmit} className="w-full py-2 bg-indigo-600 text-white rounded-md disabled:bg-gray-400">{isSubmitting ? 'Submitting...' : submission ? 'Update Submission' : 'Submit'}</button>
                            {!canSubmit && <p className="text-xs text-center text-gray-500">{!canAttempt ? `Maximum attempts (${maxAttempts}) reached.` : 'Feedback has been given.'}</p>}
                        </form>
                         {submission && (<div className="mt-4 text-sm text-center"> <p>Status: <span className="font-bold">{submission.status}</span></p> {submission.submittedAt && <p>Submitted on: {new Date(submission.submittedAt).toLocaleString()}</p>} </div>)}
                    </DetailCard>
                     <div className="bg-gray-50 p-4 rounded-lg border space-y-2">
                         <h4 className="font-semibold text-sm">Policies</h4>
                         <PolicyItem label="Late Submissions" value={homework.allowLateSubmissions ? 'Allowed' : 'Not Allowed'} />
                         <PolicyItem label="Resubmission" value={homework.allowResubmission ? 'Allowed after feedback' : 'Not Allowed'} />
                         <PolicyItem label="Attempts" value={`${attemptsMade} / ${maxAttempts}`} />
                         <PolicyItem label="Max Attachments" value={homework.maxAttachments || 'N/A'} />
                         <PolicyItem label="File Types" value={homework.allowedFileTypes?.join(', ') || 'Any'} />
                     </div>
                </div>
            </div>
        </div>
    );
};

export default StudentHomeworkDetailPage;