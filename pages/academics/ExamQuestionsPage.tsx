import React, { useState, useEffect, useCallback, useMemo } from 'react';
import { useParams, Link } from 'react-router-dom';
import { useAuth } from '../../auth/AuthContext';
import { useToast } from '../../contexts/ToastContext';
import * as examService from '../../lib/examService';
import type { OnlineExam, Question } from '../../types';
import { listSubjects } from '../../lib/academicsService';
import type { Subject } from '../../types';

const ExamQuestionsPage: React.FC = () => {
    const { siteId, examId } = useParams<{ siteId: string; examId: string }>();
    const { user } = useAuth();
    const { addToast } = useToast();

    const [exam, setExam] = useState<OnlineExam | null>(null);
    const [questionBank, setQuestionBank] = useState<Question[]>([]);
    const [examQuestionIds, setExamQuestionIds] = useState<Set<string>>(new Set());
    const [loading, setLoading] = useState(true);
    const [isSaving, setIsSaving] = useState(false);
    const [subjects, setSubjects] = useState<Subject[]>([]);
    const [bankFilter, setBankFilter] = useState('all');

    const fetchData = useCallback(() => {
        if (!examId) return;
        setLoading(true);
        Promise.all([
            examService.getExamDetails(examId),
            examService.listAllQuestionsFromBank(),
            listSubjects()
        ]).then(([examData, bankData, subjectData]) => {
            if (examData) {
                setExam(examData.exam);
                setExamQuestionIds(new Set(examData.exam.config.questionIds));
            } else {
                addToast('Exam not found.', 'error');
            }
            setQuestionBank(bankData);
            setSubjects(subjectData);
        }).finally(() => setLoading(false));
    }, [examId, addToast]);

    useEffect(() => {
        fetchData();
    }, [fetchData]);

    const questionMap = useMemo(() => new Map(questionBank.map(q => [q.id, q])), [questionBank]);

    const { questionsInExam, questionsInBank } = useMemo(() => {
        const inExam: Question[] = [];
        const inBank: Question[] = [];
        const bank = bankFilter === 'all' ? questionBank : questionBank.filter(q => q.subjectId === bankFilter);
        
        bank.forEach(q => {
            if (examQuestionIds.has(q.id)) {
                inExam.push(q);
            } else {
                inBank.push(q);
            }
        });
        return { questionsInExam: inExam, questionsInBank: inBank };
    }, [questionBank, examQuestionIds, bankFilter]);

    const handleAdd = (questionId: string) => {
        setExamQuestionIds(prev => new Set(prev).add(questionId));
    };

    const handleRemove = (questionId: string) => {
        setExamQuestionIds(prev => {
            const newSet = new Set(prev);
            newSet.delete(questionId);
            return newSet;
        });
    };

    const handleSave = async () => {
        if (!exam || !user) return;
        setIsSaving(true);
        try {
            const newQuestionIds = Array.from(examQuestionIds);
            const totalMarks = newQuestionIds.reduce((sum, id) => sum + (questionMap.get(id)?.marks || 0), 0);
            
            const newConfig = { ...exam.config, questionIds: newQuestionIds };
            
            await examService.updateExam(exam.id, { config: newConfig, totalMarks }, user);
            addToast('Exam questions updated successfully!', 'success');
            fetchData();
        } catch {
            addToast('Failed to save changes.', 'error');
        } finally {
            setIsSaving(false);
        }
    };

    if (loading) return <div>Loading...</div>;
    if (!exam) return <div>Exam not found.</div>;

    return (
        <div className="space-y-6">
            <Link to={`/school/${siteId}/online-exams`} className="text-sm text-indigo-600">&larr; Back to Exams List</Link>
            <div className="flex justify-between items-center">
                <div>
                    <h1 className="text-3xl font-bold text-gray-800">Manage Exam Questions</h1>
                    <p className="text-gray-500">{exam.title}</p>
                </div>
                <button onClick={handleSave} disabled={isSaving} className="px-6 py-2 bg-indigo-600 text-white font-semibold rounded-md shadow-sm hover:bg-indigo-700 disabled:bg-gray-400">
                    {isSaving ? 'Saving...' : 'Save Changes'}
                </button>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-6 items-start">
                {/* Available Questions */}
                <div className="bg-white p-4 rounded-lg shadow-sm border space-y-2">
                    <h2 className="text-lg font-semibold">Available Questions from Bank</h2>
                    <select value={bankFilter} onChange={e => setBankFilter(e.target.value)} className="w-full rounded-md text-sm">
                        <option value="all">Filter by Subject...</option>
                        {subjects.map(s => <option key={s.id} value={s.id}>{s.name}</option>)}
                    </select>
                     <div className="max-h-96 overflow-y-auto space-y-2 pr-2">
                        {questionsInBank.map(q => (
                            <div key={q.id} className="p-2 border rounded flex justify-between items-center">
                                <p className="text-sm">{q.questionText}</p>
                                <button onClick={() => handleAdd(q.id)} className="text-green-600 font-bold text-lg leading-none p-1">+</button>
                            </div>
                        ))}
                    </div>
                </div>
                 {/* Questions in Exam */}
                <div className="bg-white p-4 rounded-lg shadow-sm border space-y-2">
                    <h2 className="text-lg font-semibold">Questions in this Exam</h2>
                    <div className="max-h-96 overflow-y-auto space-y-2 pr-2">
                         {questionsInExam.map(q => (
                            <div key={q.id} className="p-2 border rounded flex justify-between items-center">
                                <p className="text-sm">{q.questionText}</p>
                                <button onClick={() => handleRemove(q.id)} className="text-red-600 font-bold text-lg leading-none p-1">-</button>
                            </div>
                        ))}
                    </div>
                </div>
            </div>
        </div>
    );
};

export default ExamQuestionsPage;
