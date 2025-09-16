import React, { useState, useEffect } from 'react';
import { useParams, Link } from 'react-router-dom';
import { useToast } from '../../contexts/ToastContext';
import { getMember, listLoansForMember } from '../../lib/libraryService';
import type { LibraryMember, EnrichedLoan } from '../../types';

const DetailCard: React.FC<{ title: string; children: React.ReactNode; }> = ({ title, children }) => (
    <div className="bg-white p-4 rounded-lg shadow-sm border">
        <h3 className="text-lg font-semibold text-gray-700 border-b pb-2 mb-4">{title}</h3>
        <div className="space-y-3">{children}</div>
    </div>
);

const MemberDetailPage: React.FC = () => {
    const { memberId } = useParams<{ memberId: string }>();
    const { addToast } = useToast();

    const [member, setMember] = useState<LibraryMember | null>(null);
    const [loans, setLoans] = useState<EnrichedLoan[]>([]);
    const [loading, setLoading] = useState(true);
    
    useEffect(() => {
        if (!memberId) return;
        setLoading(true);
        Promise.all([getMember(memberId), listLoansForMember(memberId)])
            .then(([memberData, loanData]) => {
                setMember(memberData);
                setLoans(loanData);
            })
            .catch(() => addToast('Failed to load member details.', 'error'))
            .finally(() => setLoading(false));
    }, [memberId, addToast]);

    if (loading) return <p>Loading member profile...</p>;
    if (!member) return <p>Member not found.</p>;

    const currentLoans = loans.filter(l => !l.returnedAt);
    const loanHistory = loans.filter(l => l.returnedAt);
    const totalFines = currentLoans.reduce((acc, loan) => acc + loan.fine, 0);

    return (
        <div className="space-y-6">
            <Link to="/school/site_123/library/members" className="text-sm text-indigo-600">&larr; Back to Members</Link>
            <h1 className="text-3xl font-bold">{member.name}</h1>
            
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                <div className="lg:col-span-1 space-y-6">
                    <DetailCard title="Member Card">
                        <div className="bg-gray-800 text-white p-4 rounded-lg font-mono text-center">
                            <p className="text-sm">{member.name}</p>
                            <p className="text-2xl tracking-widest">{member.barcode}</p>
                        </div>
                    </DetailCard>
                     <DetailCard title="Summary">
                        <p><strong>Type:</strong> {member.memberType}</p>
                        <p><strong>Current Loans:</strong> {currentLoans.length}</p>
                        <p><strong>Outstanding Fines:</strong> <span className="font-bold text-red-600">£{totalFines.toFixed(2)}</span></p>
                    </DetailCard>
                </div>
                <div className="lg:col-span-2 space-y-6">
                    <DetailCard title="Current Loans">
                        {currentLoans.length === 0 ? <p className="text-sm text-gray-500">No books currently on loan.</p> :
                        <ul className="divide-y divide-gray-200">{currentLoans.map(loan => (
                            <li key={loan.id} className="py-2">
                                <p className="font-medium">{loan.bookTitle}</p>
                                <p className="text-sm text-gray-500">Due: {loan.dueAt} {loan.fine > 0 && <span className="ml-2 font-bold text-red-500">Fine: £{loan.fine.toFixed(2)}</span>}</p>
                            </li>
                        ))}</ul>}
                    </DetailCard>
                    <DetailCard title="Loan History">
                         {loanHistory.length === 0 ? <p className="text-sm text-gray-500">No previous loans.</p> :
                        <ul className="divide-y divide-gray-200">{loanHistory.map(loan => (
                            <li key={loan.id} className="py-2">
                                <p className="font-medium">{loan.bookTitle}</p>
                                <p className="text-sm text-gray-500">Returned: {new Date(loan.returnedAt!).toLocaleDateString()}</p>
                            </li>
                        ))}</ul>}
                    </DetailCard>
                </div>
            </div>
        </div>
    );
};

export default MemberDetailPage;