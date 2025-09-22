import React, { useState, useEffect } from 'react';
import { useParams } from 'react-router-dom';
import { useToast } from '../../contexts/ToastContext';
import * as libraryService from '../../lib/libraryService';
import type { MemberDetails, MemberLoanDetails } from '../../types';

const InfoCard: React.FC<{ title: string; children: React.ReactNode; }> = ({ title, children }) => (
    <div className="bg-white p-4 rounded-lg shadow-sm border border-gray-200">
        <h3 className="text-lg font-semibold text-gray-700 mb-2">{title}</h3>
        {children}
    </div>
);

const LoanList: React.FC<{ loans: MemberLoanDetails[], isHistory?: boolean }> = ({ loans, isHistory = false }) => (
    <ul className="divide-y divide-gray-200">
        {loans.map(loan => (
            <li key={loan.id} className="py-3">
                <p className="font-medium">{loan.bookTitle}</p>
                <p className="text-sm text-gray-500">{loan.bookAuthor}</p>
                <p className="text-xs text-gray-400 mt-1">
                    {isHistory ? `Returned: ${loan.returnedAt ? new Date(loan.returnedAt).toLocaleDateString() : 'N/A'}` : `Due: ${new Date(loan.dueAt).toLocaleDateString()}`}
                </p>
            </li>
        ))}
    </ul>
);

const ParentLibraryPage: React.FC = () => {
    const { studentId } = useParams<{ studentId: string }>();
    const { addToast } = useToast();

    const [details, setDetails] = useState<MemberDetails | null>(null);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        if (!studentId) return;
        setLoading(true);
        libraryService.getMemberDetails(studentId)
            .then(setDetails)
            .catch(() => addToast('Failed to load library data.', 'error'))
            .finally(() => setLoading(false));
    }, [studentId, addToast]);

    if (loading) return <p>Loading library information...</p>;

    if (!details) {
        return (
             <div className="p-8 text-center bg-white rounded-lg border">
                <h2 className="text-xl font-semibold text-gray-700">Not a Library Member</h2>
                <p className="mt-2 text-gray-500">This student is not yet enrolled in the library. Please contact the librarian.</p>
            </div>
        );
    }

    return (
        <div className="space-y-6">
            <h1 className="text-3xl font-bold text-gray-800">Library Account</h1>

            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 items-start">
                <div className="lg:col-span-1">
                    <InfoCard title="Account Summary">
                        <div className="p-4 bg-red-50 border border-red-200 rounded-md text-center">
                            <p className="text-sm text-red-700">Outstanding Fines</p>
                            <p className="text-2xl font-bold text-red-900">£{details.totalFines.toFixed(2)}</p>
                        </div>
                    </InfoCard>
                </div>
                <div className="lg:col-span-2 space-y-6">
                     <InfoCard title="Current Loans">
                        {details.currentLoans.length > 0 ? (
                           <LoanList loans={details.currentLoans} />
                        ) : <p className="text-sm text-gray-500">No books are currently on loan.</p>}
                    </InfoCard>
                     <InfoCard title="Loan History">
                        {details.loanHistory.length > 0 ? (
                           <LoanList loans={details.loanHistory} isHistory />
                        ) : <p className="text-sm text-gray-500">No previous loans on record.</p>}
                    </InfoCard>
                </div>
            </div>
        </div>
    );
};

export default ParentLibraryPage;
