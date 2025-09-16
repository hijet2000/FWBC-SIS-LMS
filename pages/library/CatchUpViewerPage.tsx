import React, { useState, useEffect, useRef, useMemo } from 'react';
import { useParams, Link, useLocation } from 'react-router-dom';
import { useAuth } from '../../auth/AuthContext';
import * as catchupService from '../../lib/catchupService';
import type { CatchupItem, WatchProgress, CatchupPolicy, QuizQuestion, QuizAnswer, Student } from '../../types';
import { getStudent } from '../../lib/schoolService';
import { useSignedMedia } from '../../hooks/useSignedMedia';
import useWatchTracker from '../../hooks/useWatchTracker';

import SecurePlayer from '../../components/digital/SecurePlayer';
import DynamicWatermark from '../../components/digital/DynamicWatermark';
import QuizModal from '../../components/library/QuizModal';
import Toast from '../../components/ui/Toast';
import Spinner from '../../components/ui/Spinner';

const getTodayDateString = () => new Date().toISOString().split('T')[0];

const ErrorBanner: React.FC<{ error: any; onRetry: () => void; backLink: string }> = ({ error, onRetry, backLink }) => (
    <div className="bg-red-50 border-l-4 border-red-400 p-4 rounded-r-lg" role="alert">
        <div className="flex">
            <div>
                <p className="font-bold text-red-800">Playback Error: {error.code}</p>
                <p className="text-sm text-red-700">{error.message}</p>
                <div className="mt-4 space-x-4">
                    <button onClick={onRetry} className="px-4 py-2 text-sm font-medium text-white bg-red-600 rounded-md hover:bg-red-700">Re-validate Session</button>
                    <Link to={backLink} className="text-sm text-gray-600 hover:underline">Back to List</Link>
                </div>
            </div>
        </div>
    </div>
);


const CatchUpViewerPage: React.FC = () => {
    const { siteId, contentId } = useParams<{ siteId: string; contentId: string }>();
    const location = useLocation();
    const { user } = useAuth();
    // HACK: For demo purposes, we'll use a fixed student ID if the user is a student.
    const studentId = useMemo(() => (user?.scopes.includes('student') ? 's01' : null), [user]);

    const [item, setItem] = useState<CatchupItem | null>(null);
    const [student, setStudent] = useState<Student | null>(null);
    const [initialProgress, setInitialProgress] = useState<WatchProgress | null>(null);
    const [policy, setPolicy] = useState<CatchupPolicy | null>(null);
    const [quiz, setQuiz] = useState<{ questions: QuizQuestion[] } | null>(null);
    
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);
    const [toast, setToast] = useState<{ message: string, type: 'success' | 'error' } | null>(null);
    const [isQuizOpen, setIsQuizOpen] = useState(false);
    
    const videoRef = useRef<HTMLVideoElement>(null);
    const backLink = `/school/${siteId}/library/catchup${location.search}`;

    const { signedUrl, tokenId, loading: urlLoading, error: urlError, retry } = useSignedMedia({
        contentId,
        rawUrl: item?.url || null,
        kind: 'VIDEO',
        ttlSec: 600, // 10 minute TTL for longer videos
    });

    const { totalSecondsWatched } = useWatchTracker(videoRef, {
        contentId: contentId!,
        studentId: studentId!,
        initialProgress,
    });
    
    useEffect(() => {
        if (!contentId || !studentId) {
            setError('Missing required information.');
            setLoading(false);
            return;
        }

        const fetchData = async () => {
            setLoading(true);
            setError(null);
            try {
                const [itemData, studentData, progressData, policyData, quizData] = await Promise.all([
                    catchupService.getCatchup('site_123', contentId),
                    getStudent(studentId),
                    catchupService.getWatchProgress('site_123', contentId, studentId),
                    catchupService.getCatchupPolicy('site_123'),
                    catchupService.getQuiz('site_123', contentId),
                ]);

                if (!itemData) {
                    setError('Lesson not found.');
                    return;
                }
                setItem(itemData);
                setStudent(studentData);
                setInitialProgress(progressData);
                setPolicy(policyData);
                setQuiz(quizData);

            } catch {
                setError('Failed to load lesson details.');
            } finally {
                setLoading(false);
            }
        };
        fetchData();
    }, [contentId, studentId]);

    const watchPercentage = useMemo(() => {
        if (!item || totalSecondsWatched === 0) return 0;
        return (totalSecondsWatched / item.durationSec) * 100;
    }, [item, totalSecondsWatched]);
    
    const isWatchRequirementMet = useMemo(() => {
        return policy ? watchPercentage >= policy.requiredWatchPct : false;
    }, [watchPercentage, policy]);

    const handleQuizSubmit = async (answers: QuizAnswer[]) => {
        if (!contentId || !studentId || !policy || !item) {
            setToast({ message: 'Cannot submit quiz, missing data.', type: 'error' });
            return { scorePct: 0, passed: false };
        }
        
        const result = await catchupService.submitQuiz('site_123', contentId, studentId, answers);

        if (result.passed && isWatchRequirementMet) {
            const finalProgress: Omit<WatchProgress, 'lastUpdatedISO'> = {
                secondsWatched: item.durationSec,
                lastSecond: item.durationSec,
                completed: true,
            };
            await catchupService.saveWatchProgress('site_123', contentId, studentId, finalProgress);
            await catchupService.saveCatchupAttendance('site_123', contentId, studentId, {
                dateISO: getTodayDateString(),
                watchPct: watchPercentage,
                quizScorePct: result.scorePct,
                passed: true,
            });
            setToast({ message: 'Lesson complete! Attendance marked.', type: 'success' });
            setInitialProgress({...finalProgress, lastUpdatedISO: new Date().toISOString() });
        }
        
        return result;
    };

    const renderPlayer = () => {
        if (urlLoading || !signedUrl) {
            return (
                <div className="w-full aspect-video bg-gray-200 flex items-center justify-center rounded-lg">
                    <Spinner />
                </div>
            );
        }
        if (urlError) {
             return <ErrorBanner error={urlError} onRetry={retry} backLink={backLink} />;
        }
        return <SecurePlayer ref={videoRef} src={signedUrl} />;
    };

    if (loading) return <div className="text-center p-8"><Spinner /></div>;
    if (error) return <div className="text-center p-8 text-red-600 bg-red-50">{error}</div>;
    if (!item) return <div className="text-center p-8">Lesson content is not available.</div>;

    return (
        <div className="space-y-6 max-w-4xl mx-auto">
            {toast && <Toast {...toast} onClose={() => setToast(null)} />}
            <div>
                 <Link to={backLink} className="text-sm text-indigo-600 hover:text-indigo-800">
                     &larr; Back to List
                </Link>
                <h1 className="text-3xl font-bold text-gray-800 mt-2">{item.title}</h1>
            </div>

            <div className="bg-white p-4 rounded-lg shadow-sm border">
                <DynamicWatermark
                    userName={user?.name}
                    admissionNo={student?.admissionNo}
                    siteId={siteId}
                    tokenId={tokenId}
                >
                    {renderPlayer()}
                </DynamicWatermark>

                <div className="mt-4 space-y-2">
                    <p className="font-medium">Progress</p>
                    <div className="w-full bg-gray-200 rounded-full h-2.5">
                        <div className="bg-blue-600 h-2.5 rounded-full" style={{ width: `${Math.min(watchPercentage, 100)}%` }}></div>
                    </div>
                    <div className="text-sm text-gray-600 flex justify-between">
                        <span>{watchPercentage.toFixed(1)}% Watched</span>
                        {policy && <span>Required: {policy.requiredWatchPct}%</span>}
                    </div>
                </div>
            </div>

            <div className="bg-white p-4 rounded-lg shadow-sm border text-center">
                 <h2 className="text-lg font-semibold">Lesson Completion</h2>
                 <p className="text-sm text-gray-500 mt-1">You must watch at least {policy?.requiredWatchPct}% of the video and then pass a short quiz.</p>
                 <button
                    onClick={() => setIsQuizOpen(true)}
                    disabled={!isWatchRequirementMet || !quiz || !!urlError}
                    className="mt-4 px-6 py-3 bg-indigo-600 text-white font-bold rounded-lg shadow-sm hover:bg-indigo-700 disabled:bg-gray-400 disabled:cursor-not-allowed"
                >
                    {initialProgress?.completed ? 'Review Quiz' : 'Take Quiz'}
                 </button>
                 {!isWatchRequirementMet && <p className="text-xs text-red-600 mt-2">Watch requirement not met.</p>}
                 {!quiz && <p className="text-xs text-gray-400 mt-2">This lesson does not have a quiz.</p>}
            </div>

            {isQuizOpen && quiz && policy && (
                <QuizModal 
                    isOpen={isQuizOpen}
                    onClose={() => setIsQuizOpen(false)}
                    quiz={quiz}
                    policy={policy}
                    onSubmit={handleQuizSubmit}
                />
            )}
        </div>
    );
};

export default CatchUpViewerPage;
