import React, { useState, useEffect, useMemo } from 'react';
import { useParams } from 'react-router-dom';
import { useToast } from '../../contexts/ToastContext';
import * as homeworkService from '../../lib/homeworkService';
import * as libraryService from '../../lib/libraryService';
import * as hostelService from '../../lib/hostelService';
import { getStudent } from '../../lib/schoolService';
import { listSubjects } from '../../lib/academicsService';
import type { Subject, EnrichedHomeworkForStudent, Student, EnrichedLoan, Allocation, HostelRoom, Bed, Hostel } from '../../types';

type HomeworkStatus = 'Overdue' | 'Completed' | 'Submitted' | 'Not Submitted' | 'Due' | 'Late';

const getStatus = (hw: EnrichedHomeworkForStudent): { text: HomeworkStatus, className: string } => {
    const { submission, dueDate } = hw;
    if (submission?.feedback) {
        return { text: 'Completed', className: 'bg-green-100 text-green-800' };
    }
    if (submission) {
        if (submission.status === 'Late') {
            return { text: 'Late', className: 'bg-yellow-100 text-yellow-800' };
        }
        return { text: 'Submitted', className: 'bg-blue-100 text-blue-800' };
    }
    if (new Date(dueDate) < new Date()) {
        return { text: 'Overdue', className: 'bg-red-100 text-red-800' };
    }
    return { text: 'Due', className: 'bg-gray-100 text-gray-800' };
};

const ParentPortalPage: React.FC = () => {
    const { studentId } = useParams<{ studentId: string }>();
    const { addToast } = useToast();

    const [homework, setHomework] = useState<EnrichedHomeworkForStudent[]>([]);
    const [loans, setLoans] = useState<EnrichedLoan[]>([]);
    const [allocation, setAllocation] = useState<{ allocation: Allocation, room: HostelRoom, bed: Bed, hostel: Hostel } | null>(null);
    const [student, setStudent] = useState<Student | null>(null);
    const [subjects, setSubjects] = useState<Subject[]>([]);
    const [loading, setLoading] = useState(true);
    const [activeTab, setActiveTab] = useState<'homework' | 'library' | 'hostel'>('homework');

    useEffect(() => {
        if (!studentId) {
            addToast('Student ID is missing.', 'error');
            setLoading(false);
            return;
        }
        setLoading(true);
        Promise.all([
            homeworkService.listHomeworkForStudent(studentId),
            libraryService.listLoansForMember(studentId),
            hostelService.getAllocationForStudent(studentId),
            listSubjects(),
            getStudent(studentId),
        ]).then(([hwData, loanData, allocData, subjectData, studentData]) => {
            setHomework(hwData);
            setLoans(loanData.filter(l => !l.returnedAt)); // Only show current loans
            setAllocation(allocData);
            setSubjects(subjectData);
            setStudent(studentData);
        }).catch(() => {
            addToast('Failed to load portal data for the student.', 'error');
        }).finally(() => {
            setLoading(false);
        });
    }, [studentId, addToast]);
    
    const subjectMap = useMemo(() => new Map(subjects.map(s => [s.id, s.name])), [subjects]);

    const renderContent = () => {
        if (loading) return <div className="text-center p-8">Loading data...</div>;

        switch (activeTab) {
            case 'homework':
                return (
                     <div className="overflow-x-auto shadow ring-1 ring-black ring-opacity-5 sm:rounded-lg">
                        <table className="min-w-full divide-y divide-gray-300">
                            <thead className="bg-gray-50"><tr>
                                <th className="px-4 py-3 text-left text-xs uppercase">Subject</th>
                                <th className="px-4 py-3 text-left text-xs uppercase">Title</th>
                                <th className="px-4 py-3 text-left text-xs uppercase">Due</th>
                                <th className="px-4 py-3 text-left text-xs uppercase">Status</th>
                                <th className="px-4 py-3 text-left text-xs uppercase">Score</th>
                                <th className="px-4 py-3 text-left text-xs uppercase">Feedback</th>
                            </tr></thead>
                            <tbody className="bg-white divide-y divide-gray-200">
                                {homework.map(hw => {
                                    const status = getStatus(hw);
                                    return (
                                        <tr key={hw.id}>
                                            <td className="px-4 py-4 text-sm">{subjectMap.get(hw.subjectId)}</td>
                                            <td className="px-4 py-4 text-sm font-medium">{hw.title}</td>
                                            <td className="px-4 py-4 text-sm">{hw.dueDate}</td>
                                            <td className="px-4 py-4 text-sm"><span className={`px-2 py-1 text-xs rounded-full ${status.className}`}>{status.text}</span></td>
                                            <td className="px-4 py-4 text-sm">{hw.submission?.feedback?.score ?? 'N/A'}</td>
                                            <td className="px-4 py-4 text-sm max-w-xs truncate" title={hw.submission?.feedback?.comments}>{hw.submission?.feedback?.comments || 'N/A'}</td>
                                        </tr>
                                    );
                                })}
                            </tbody>
                        </table>
                    </div>
                );
            case 'library':
                return (
                    <div className="overflow-x-auto shadow ring-1 ring-black ring-opacity-5 sm:rounded-lg">
                         <table className="min-w-full divide-y divide-gray-300">
                            <thead className="bg-gray-50"><tr>
                                <th className="px-4 py-3 text-left text-xs uppercase">Book Title</th>
                                <th className="px-4 py-3 text-left text-xs uppercase">Due Date</th>
                                <th className="px-4 py-3 text-left text-xs uppercase">Fine</th>
                            </tr></thead>
                            <tbody className="bg-white divide-y divide-gray-200">
                                {loans.length === 0 ? <tr><td colSpan={3} className="text-center p-4">No books currently on loan.</td></tr> :
                                loans.map(loan => (
                                    <tr key={loan.id}>
                                        <td className="px-4 py-4 text-sm font-medium">{loan.bookTitle}</td>
                                        <td className="px-4 py-4 text-sm">{loan.dueAt}</td>
                                        <td className={`px-4 py-4 text-sm font-bold ${loan.fine > 0 ? 'text-red-600' : 'text-green-600'}`}>£{loan.fine.toFixed(2)}</td>
                                    </tr>
                                ))}
                            </tbody>
                        </table>
                    </div>
                );
            case 'hostel':
                 return (
                    <div className="bg-white p-6 rounded-lg shadow-sm border">
                         <h2 className="text-xl font-semibold text-gray-800">Hostel Allocation</h2>
                        {allocation ? (
                            <div className="mt-4 space-y-2 text-gray-700">
                                <p><strong>Hostel:</strong> {allocation.hostel.name}</p>
                                <p><strong>Room:</strong> {allocation.room.name}</p>
                                <p><strong>Bed:</strong> {allocation.bed.name}</p>
                                <p><strong>Check-in Date:</strong> {new Date(allocation.allocation.checkInDate).toLocaleDateString()}</p>
                            </div>
                        ) : (
                            <p className="mt-4 text-gray-500">This student is not currently allocated to a hostel.</p>
                        )}
                    </div>
                );
        }
    };

    return (
        <div className="min-h-screen bg-gray-50">
            <header className="bg-white shadow-sm">
                <div className="max-w-7xl mx-auto py-4 px-4 sm:px-6 lg:px-8">
                    <h1 className="text-xl font-semibold text-gray-900">Parent Portal for {student?.name || '...'}</h1>
                </div>
            </header>
            <main className="max-w-7xl mx-auto py-6 sm:px-6 lg:px-8">
                <div className="px-4 py-6 sm:px-0">
                    <div className="border-b border-gray-200">
                        <nav className="-mb-px flex space-x-8" aria-label="Tabs">
                             <button onClick={() => setActiveTab('homework')} className={`whitespace-nowrap py-4 px-1 border-b-2 font-medium text-sm ${activeTab === 'homework' ? 'border-indigo-500 text-indigo-600' : 'border-transparent text-gray-500 hover:border-gray-300'}`}>Homework</button>
                             <button onClick={() => setActiveTab('library')} className={`whitespace-nowrap py-4 px-1 border-b-2 font-medium text-sm ${activeTab === 'library' ? 'border-indigo-500 text-indigo-600' : 'border-transparent text-gray-500 hover:border-gray-300'}`}>Library</button>
                             <button onClick={() => setActiveTab('hostel')} className={`whitespace-nowrap py-4 px-1 border-b-2 font-medium text-sm ${activeTab === 'hostel' ? 'border-indigo-500 text-indigo-600' : 'border-transparent text-gray-500 hover:border-gray-300'}`}>Hostel</button>
                        </nav>
                    </div>
                    <div className="mt-6">{renderContent()}</div>
                </div>
            </main>
        </div>
    );
};

export default ParentPortalPage;