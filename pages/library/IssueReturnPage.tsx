import React, { useState, useEffect, useCallback } from 'react';
import { useAuth } from '../../auth/AuthContext';
import { useToast } from '../../contexts/ToastContext';
import * as libraryService from '../../lib/libraryService';
import type { CirculationDetails } from '../../types';
import OverrideModal from '../../components/library/OverrideModal';

// A simple debounce hook
const useDebounce = <T,>(value: T, delay: number): T => {
  const [debouncedValue, setDebouncedValue] = useState<T>(value);
  useEffect(() => {
    const handler = setTimeout(() => { setDebouncedValue(value); }, delay);
    return () => { clearTimeout(handler); };
  }, [value, delay]);
  return debouncedValue;
};

const InfoCard: React.FC<{ title: string; children: React.ReactNode; }> = ({ title, children }) => (
    <div className="bg-white p-4 rounded-lg shadow-sm border border-gray-200">
        <h3 className="text-lg font-semibold text-gray-700 border-b pb-2 mb-4">{title}</h3>
        <div className="space-y-2 text-sm">{children}</div>
    </div>
);


const IssueReturnPage: React.FC = () => {
    const { user } = useAuth();
    const { addToast } = useToast();

    const [memberBarcode, setMemberBarcode] = useState('');
    const [bookBarcode, setBookBarcode] = useState('');
    const debouncedMemberBarcode = useDebounce(memberBarcode, 300);
    const debouncedBookBarcode = useDebounce(bookBarcode, 300);
    
    const [details, setDetails] = useState<CirculationDetails | null>(null);
    const [loading, setLoading] = useState(false);
    
    const [isOverrideModalOpen, setIsOverrideModalOpen] = useState(false);
    const [overrideAction, setOverrideAction] = useState<(() => void) | null>(null);
    const [overrideReasonText, setOverrideReasonText] = useState('');

    useEffect(() => {
        const fetchDetails = async () => {
            if (!debouncedMemberBarcode && !debouncedBookBarcode) {
                setDetails(null);
                return;
            }
            setLoading(true);
            try {
                const data = await libraryService.getCirculationDetails(debouncedMemberBarcode, debouncedBookBarcode);
                setDetails(data);
            } catch {
                addToast('Failed to fetch details.', 'error');
            } finally {
                setLoading(false);
            }
        };
        fetchDetails();
    }, [debouncedMemberBarcode, debouncedBookBarcode, addToast]);
    
    const resetForm = () => {
        setMemberBarcode('');
        setBookBarcode('');
        setDetails(null);
    };

    const handleIssue = async (overrideReason?: string) => {
        if (!user || !details?.member || !details?.copy) return;
        try {
            await libraryService.issueBook(details.member.id, details.copy.id, user, overrideReason);
            addToast('Book issued successfully!', 'success');
            resetForm();
        } catch (err: any) {
            if (err.message.includes('Policy Violation') && !overrideReason) {
                setOverrideReasonText(err.message);
                setOverrideAction(() => () => handleIssue('Override reason provided'));
                setIsOverrideModalOpen(true);
            } else {
                addToast(err.message || 'Failed to issue book.', 'error');
            }
        }
    };

    const handleReturn = async (overrideReason?: string) => {
        if (!user || !details?.loan) return;
        try {
            const returnedLoan = await libraryService.returnBook(details.loan.id, user, overrideReason);
            addToast('Book returned successfully!', 'success');
            if(returnedLoan.fineIncurred) {
                addToast(`Fine of £${returnedLoan.fineIncurred.toFixed(2)} was incurred.`, 'warning');
            }
            resetForm();
        } catch (err: any) {
             addToast(err.message || 'Failed to return book.', 'error');
        }
    };

    const action = details?.copy?.status === 'Available' ? 'issue' : details?.loan ? 'return' : null;

    return (
        <div className="space-y-6">
            <h1 className="text-3xl font-bold text-gray-800">Library Circulation Desk</h1>
            
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
                <input value={memberBarcode} onChange={e => setMemberBarcode(e.target.value)} placeholder="Scan or Enter Member Barcode..." className="p-3 text-lg rounded-md" autoFocus />
                <input value={bookBarcode} onChange={e => setBookBarcode(e.target.value)} placeholder="Scan or Enter Book Barcode..." className="p-3 text-lg rounded-md" />
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 items-start">
                <div className="lg:col-span-1 space-y-4">
                    <InfoCard title="Member Details">
                        {loading && !details ? <p>Loading...</p> : details?.member ? (
                            <>
                                <p><strong>Name:</strong> {details.member.name}</p>
                                <p><strong>Type:</strong> {details.member.type}</p>
                                {/* FIX: The maxConcurrentLoans property is now available on the member object within circulation details. Added a fallback for safety. */}
                                <p><strong>Loans Allowed:</strong> {details.member.maxConcurrentLoans ?? 'N/A'}</p>
                            </>
                        ) : <p className="text-gray-500">Scan member barcode.</p>}
                    </InfoCard>
                    <InfoCard title="Book Details">
                         {loading && !details ? <p>Loading...</p> : details?.book ? (
                            <>
                                <p><strong>Title:</strong> {details.book.title}</p>
                                <p><strong>Author:</strong> {details.book.author}</p>
                                <p><strong>Status:</strong> <span className="font-bold">{details.copy?.status}</span></p>
                                {details.loan && <p className="text-red-600">On loan to another member.</p>}
                            </>
                        ) : <p className="text-gray-500">Scan book barcode.</p>}
                    </InfoCard>
                </div>
                 <div className="lg:col-span-2">
                    <InfoCard title="Action Panel">
                        {details?.policyViolations && details.policyViolations.length > 0 && (
                            <div className="p-3 bg-yellow-100 text-yellow-800 rounded-md">
                                <h4 className="font-bold">Policy Violations</h4>
                                <ul className="list-disc list-inside text-sm">
                                    {details.policyViolations.map((v, i) => <li key={i}>{v}</li>)}
                                </ul>
                            </div>
                        )}
                        
                        <div className="mt-4 flex flex-col gap-4">
                            {action === 'issue' && <button onClick={() => handleIssue()} disabled={!details.member || details.policyViolations.length > 0} className="w-full p-4 text-xl font-bold text-white bg-green-600 rounded-md disabled:bg-gray-400">ISSUE BOOK</button>}
                            {action === 'return' && <button onClick={() => handleReturn()} disabled={!details.loan} className="w-full p-4 text-xl font-bold text-white bg-blue-600 rounded-md disabled:bg-gray-400">RETURN BOOK</button>}

                            {details?.policyViolations.length > 0 && (
                                <button onClick={() => handleIssue()} className="w-full p-2 text-sm text-white bg-red-600 rounded-md">Manual Override</button>
                            )}
                        </div>

                        {!action && details && <p className="text-center text-gray-500 p-8">No valid action. The book may be unavailable or not on loan.</p>}
                    </InfoCard>
                </div>
            </div>

            <OverrideModal
                isOpen={isOverrideModalOpen}
                onClose={() => setIsOverrideModalOpen(false)}
                onConfirm={(reason) => {
                    if (overrideAction) {
                        overrideAction();
                    }
                    setIsOverrideModalOpen(false);
                }}
                reasonText={overrideReasonText}
            />

        </div>
    );
};

export default IssueReturnPage;
