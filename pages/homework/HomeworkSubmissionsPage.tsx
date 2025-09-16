import React, { useState, useEffect, useMemo } from 'react';
import { useParams, Link } from 'react-router-dom';
import { useAuth } from '../../auth/AuthContext';
import { useToast } from '../../contexts/ToastContext';
import * as homeworkService from '../../lib/homeworkService';
import type { Homework, EnrichedSubmission, SubmissionStatus, HomeworkAnalytics } from '../../types';
import FeedbackModal from '../../components/homework/FeedbackModal';

const statusStyles: Record<SubmissionStatus, string> = {
    'On-time': 'bg-green-100 text-green-800',
    'Late': 'bg-yellow-100 text-yellow-800',
    'Not Submitted': 'bg-gray-100 text-gray-800',
};

const HomeworkSubmissionsPage: React.FC = () => {
    const { siteId, homeworkId } = useParams<{ siteId: string, homeworkId: string }>();
    const { user } = useAuth();
    const { addToast } = useToast();

    const [homework, setHomework] = useState<Homework | null>(null);
    const [submissions, setSubmissions] = useState<EnrichedSubmission[]>([]);
    const [analytics, setAnalytics] = useState<HomeworkAnalytics | null>(null);
    const [loading, setLoading] = useState({ details: true, analytics: true });
    const [selectedSubmission, setSelectedSubmission] = useState<EnrichedSubmission | null>(null);
    const [activeTab, setActiveTab] = useState<'overview' | 'submissions' | 'analytics'>('overview');
    const [submissionFilter, setSubmissionFilter] = useState<'all' | SubmissionStatus>('all');

    const fetchData = () => {
        if (!homeworkId) return;
        setLoading(p => ({ ...p, details: true }));
        Promise.all([
            homeworkService.getHomework(homeworkId),
            homeworkService.getSubmissionsWithDetails(homeworkId)
        ]).then(([hwData, subData]) => {
            setHomework(hwData);
            setSubmissions(subData);
        }).catch(() => {
            addToast('Failed to load submission data.', 'error');
        }).finally(() => {
            setLoading(p => ({ ...p, details: false }));
        });
    };

    useEffect(() => {
        fetchData();
    }, [homeworkId, addToast]);

    useEffect(() => {
        if (activeTab === 'analytics' && homeworkId && !analytics) {
            setLoading(p => ({ ...p, analytics: true }));
            homeworkService.getHomeworkAnalytics(homeworkId)
                .then(setAnalytics)
                .catch(() => addToast('Failed to load analytics.', 'error'))
                .finally(() => setLoading(p => ({ ...p, analytics: false })));
        }
    }, [activeTab, homeworkId, analytics, addToast]);


    const handleFeedbackSuccess = () => {
        setSelectedSubmission(null);
        addToast('Feedback saved successfully!', 'success');
        fetchData(); // Refresh data to show feedback status
    };
    
    const handleBulkMark = async () => {
        if (!homeworkId || !user) return;
        const notSubmittedIds = submissions.filter(s => s.status === 'Not Submitted').map(s => s.studentId);
        if (notSubmittedIds.length === 0) {
            addToast('No missing submissions to mark.', 'info');
            return;
        }
        await homeworkService.bulkMarkSubmissions(homeworkId, notSubmittedIds, 0, 'No submission received.', user);
        addToast(`Marked ${notSubmittedIds.length} missing submissions.`, 'success');
        fetchData();
    };

    const filteredSubmissions = useMemo(() => {
        if (submissionFilter === 'all') return submissions;
        return submissions.filter(s => s.status === submissionFilter);
    }, [submissions, submissionFilter]);

    if (loading.details) return <div className="p-8 text-center">Loading submissions...</div>;
    if (!homework) return <div className="p-8 text-center text-red-500">Homework not found.</div>;

    return (
        <div className="space-y-6">
            <div>
                <Link to={`/school/${siteId}/homework`} className="text-sm text-indigo-600 hover:text-indigo-800">&larr; Back to Homework List</Link>
                <h1 className="text-3xl font-bold text-gray-800">{homework.title}</h1>
                <p className="mt-1 text-sm text-gray-500">Due: {homework.dueDate}</p>
            </div>

            <div className="border-b border-gray-200">
                <nav className="-mb-px flex space-x-8" aria-label="Tabs">
                    {(['overview', 'submissions', 'analytics'] as const).map(tab => (
                        <button key={tab} onClick={() => setActiveTab(tab)} className={`capitalize whitespace-nowrap py-4 px-1 border-b-2 font-medium text-sm ${activeTab === tab ? 'border-indigo-500 text-indigo-600' : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'}`}>{tab}</button>
                    ))}
                </nav>
            </div>

            {activeTab === 'overview' && (
                <div className="bg-white p-4 rounded-lg shadow-sm border">
                    <h2 className="text-xl font-semibold mb-4">Submissions Overview</h2>
                     <ul className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
                        {submissions.map(sub => {
                            const isMarked = !!sub.feedback;
                            return (<li key={sub.studentId} className="p-3 border rounded-md">
                                <p className="font-medium">{sub.studentName}</p>
                                <div className="flex justify-between items-center text-xs mt-1">
                                    <span className={`px-2 py-0.5 rounded-full ${statusStyles[sub.status]}`}>{sub.status}</span>
                                    {isMarked && <span className="text-green-600 font-bold">Marked ✓</span>}
                                </div>
                            </li>)
                        })}
                    </ul>
                </div>
            )}
            
            {activeTab === 'submissions' && (
                <div>
                     <div className="bg-white p-4 rounded-lg shadow-sm border mb-6 flex justify-between items-center">
                        <div>
                            {(['all', 'On-time', 'Late', 'Not Submitted'] as const).map(status => (
                                <button key={status} onClick={() => setSubmissionFilter(status)} className={`px-3 py-1 text-sm rounded-full mr-2 ${submissionFilter === status ? 'bg-indigo-600 text-white' : 'bg-gray-200'}`}>{status}</button>
                            ))}
                        </div>
                        <button onClick={handleBulkMark} className="px-3 py-1 text-sm bg-red-100 text-red-800 rounded-md">Mark all missing as 0</button>
                    </div>
                    <div className="overflow-x-auto shadow ring-1 ring-black ring-opacity-5 sm:rounded-lg">
                        <table className="min-w-full divide-y divide-gray-300">
                            <thead className="bg-gray-50"><tr>
                                <th className="px-4 py-3 text-left text-xs uppercase">Student</th>
                                <th className="px-4 py-3 text-left text-xs uppercase">Status</th>
                                <th className="px-4 py-3 text-left text-xs uppercase">Submitted</th>
                                <th className="px-4 py-3 text-left text-xs uppercase">Score</th>
                                <th className="px-4 py-3 text-right text-xs uppercase">Actions</th>
                            </tr></thead>
                            <tbody className="bg-white divide-y divide-gray-200">
                                {filteredSubmissions.map(sub => (
                                    <tr key={sub.studentId}>
                                        <td className="px-4 py-4 text-sm font-medium">{sub.studentName}</td>
                                        <td className="px-4 py-4 text-sm"><span className={`px-2 py-1 text-xs rounded-full ${statusStyles[sub.status]}`}>{sub.status}</span></td>
                                        <td className="px-4 py-4 text-sm">{sub.submittedAt ? new Date(sub.submittedAt).toLocaleString() : 'N/A'}</td>
                                        <td className="px-4 py-4 text-sm">{sub.feedback?.score ?? 'N/A'}</td>
                                        <td className="px-4 py-4 text-right text-sm font-medium">
                                            {sub.status !== 'Not Submitted' && (
                                                <button onClick={() => setSelectedSubmission(sub)} className="text-indigo-600 hover:text-indigo-900">
                                                    {sub.feedback ? 'Edit Feedback' : 'Give Feedback'}
                                                </button>
                                            )}
                                        </td>
                                    </tr>
                                ))}
                            </tbody>
                        </table>
                    </div>
                </div>
            )}
            
            {activeTab === 'analytics' && (
                loading.analytics ? <p>Loading analytics...</p> : analytics &&
                <div className="space-y-6">
                    <div className="grid grid-cols-2 md:grid-cols-4 gap-6">
                        <div className="bg-white p-4 rounded-lg shadow-sm border text-center"><h4 className="text-sm text-gray-500">Submission Rate</h4><p className="text-2xl font-bold">{analytics.submissionRate.toFixed(1)}%</p></div>
                        <div className="bg-white p-4 rounded-lg shadow-sm border text-center"><h4 className="text-sm text-gray-500">On-Time Rate</h4><p className="text-2xl font-bold">{analytics.onTimeRate.toFixed(1)}%</p></div>
                        <div className="bg-white p-4 rounded-lg shadow-sm border text-center"><h4 className="text-sm text-gray-500">Average Score</h4><p className="text-2xl font-bold">{analytics.averageScore?.toFixed(1) || 'N/A'}</p></div>
                        <div className="bg-white p-4 rounded-lg shadow-sm border text-center"><h4 className="text-sm text-gray-500">Marked</h4><p className="text-2xl font-bold">{analytics.markedCount}/{analytics.totalSubmissions}</p></div>
                    </div>
                    <div className="bg-white p-4 rounded-lg shadow-sm border">
                        <h3 className="font-semibold mb-4">Late Submission Distribution</h3>
                        <div className="flex items-end gap-2 h-40">
                            {analytics.lateDistribution.length > 0 ? analytics.lateDistribution.map(item => (
                                <div key={item.daysLate} className="flex-1 flex flex-col items-center justify-end">
                                    <div className="bg-yellow-400 w-full rounded-t-md text-center text-xs text-yellow-800 font-bold" style={{ height: `${item.count * 30}px` }}>{item.count}</div>
                                    <div className="text-xs mt-1">{item.daysLate}d late</div>
                                </div>
                            )) : <p className="text-sm text-gray-500">No late submissions.</p>}
                        </div>
                    </div>
                </div>
            )}

            {selectedSubmission && user && (
                <FeedbackModal
                    isOpen={!!selectedSubmission}
                    onClose={() => setSelectedSubmission(null)}
                    onSaveSuccess={handleFeedbackSuccess}
                    submission={selectedSubmission}
                    studentName={selectedSubmission.studentName}
                    actor={user}
                />
            )}
        </div>
    );
};

export default HomeworkSubmissionsPage;
