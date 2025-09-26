import React, { useState, useEffect, useCallback, useMemo } from 'react';
import { useAuth } from '../../auth/AuthContext';
import { useToast } from '../../contexts/ToastContext';
import * as examService from '../../lib/examService';
import { listSubjects } from '../../lib/academicsService';
import type { Question, Subject } from '../../types';
import QuestionModal from '../../components/academics/QuestionModal';

const QuestionBankPage: React.FC = () => {
    const { user } = useAuth();
    const { addToast } = useToast();

    const [questions, setQuestions] = useState<Question[]>([]);
    const [subjects, setSubjects] = useState<Subject[]>([]);
    const [loading, setLoading] = useState(true);
    
    const [isModalOpen, setIsModalOpen] = useState(false);
    const [editingQuestion, setEditingQuestion] = useState<Question | null>(null);
    const [filterSubject, setFilterSubject] = useState<string>('all');

    const fetchData = useCallback(() => {
        setLoading(true);
        Promise.all([
            examService.listAllQuestionsFromBank(),
            listSubjects()
        ]).then(([qData, sData]) => {
            setQuestions(qData);
            setSubjects(sData);
        }).catch(() => addToast('Failed to load data.', 'error'))
          .finally(() => setLoading(false));
    }, [addToast]);

    useEffect(() => {
        fetchData();
    }, [fetchData]);

    const handleOpenModal = (q: Question | null = null) => {
        setEditingQuestion(q);
        setIsModalOpen(true);
    };

    const handleSaveSuccess = () => {
        setIsModalOpen(false);
        setEditingQuestion(null);
        addToast('Question saved to bank.', 'success');
        fetchData();
    };

    const handleDelete = async (questionId: string) => {
        if (!user || !window.confirm('Are you sure you want to delete this question from the bank? This cannot be undone.')) return;
        try {
            await examService.deleteQuestionFromBank(questionId, user);
            addToast('Question deleted.', 'success');
            fetchData();
        } catch {
            addToast('Failed to delete question.', 'error');
        }
    };
    
    const subjectMap = useMemo(() => new Map(subjects.map(s => [s.id, s.name])), [subjects]);

    const filteredQuestions = useMemo(() => {
        if (filterSubject === 'all') return questions;
        return questions.filter(q => q.subjectId === filterSubject);
    }, [questions, filterSubject]);

    return (
        <div className="space-y-6">
            <div className="flex justify-between items-center">
                <h1 className="text-3xl font-bold text-gray-800">Question Bank</h1>
                <button onClick={() => handleOpenModal()} className="px-4 py-2 text-sm text-white bg-indigo-600 rounded-md">Add Question</button>
            </div>

            <div className="bg-white p-4 rounded-lg shadow-sm border">
                <select value={filterSubject} onChange={e => setFilterSubject(e.target.value)} className="rounded-md">
                    <option value="all">All Subjects</option>
                    {subjects.map(s => <option key={s.id} value={s.id}>{s.name}</option>)}
                </select>
            </div>

            <div className="space-y-4">
                {loading ? <p>Loading questions...</p> : filteredQuestions.length === 0 ? (
                    <p className="text-center text-gray-500 p-8 bg-gray-50 rounded-lg">No questions found.</p>
                ) : (
                    filteredQuestions.map((q, index) => (
                        <div key={q.id} className="bg-white p-4 rounded-lg shadow-sm border">
                            <div className="flex justify-between items-start">
                                <div>
                                    <p className="font-semibold">{q.questionText} <span className="text-sm font-normal text-gray-500">({q.marks} marks)</span></p>
                                    <p className="text-xs text-gray-500">{subjectMap.get(q.subjectId)} | {q.type}</p>
                                </div>
                                <div className="space-x-2 text-sm font-medium">
                                    <button onClick={() => handleOpenModal(q)} className="text-indigo-600">Edit</button>
                                    <button onClick={() => handleDelete(q.id)} className="text-red-600">Delete</button>
                                </div>
                            </div>
                            <ul className="mt-2 text-sm list-decimal list-inside pl-4">
                                {q.options.map((opt, i) => (
                                    <li key={i} className={i === q.correctOptionIndex ? 'font-bold text-green-700' : ''}>{opt}</li>
                                ))}
                            </ul>
                        </div>
                    ))
                )}
            </div>
            
            {user && (
                <QuestionModal 
                    isOpen={isModalOpen} 
                    onClose={() => setIsModalOpen(false)} 
                    onSaveSuccess={handleSaveSuccess} 
                    initialData={editingQuestion} 
                    actor={user} 
                    subjects={subjects}
                />
            )}
        </div>
    );
};

export default QuestionBankPage;
