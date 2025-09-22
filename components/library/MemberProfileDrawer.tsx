import React, { useState, useEffect, useRef } from 'react';
import * as libraryService from '../../lib/libraryService';
import type { MemberDetails, MemberLoanDetails } from '../../types';
import Drawer from '../admin/Drawer';

const MemberProfileDrawer: React.FC<{ memberId: string | null; isOpen: boolean; onClose: () => void }> = ({ memberId, isOpen, onClose }) => {
    const [details, setDetails] = useState<MemberDetails | null>(null);
    const [loading, setLoading] = useState(false);
    const [activeTab, setActiveTab] = useState('current');
    const cardRef = useRef<HTMLDivElement>(null);

    useEffect(() => {
        if (memberId) {
            setLoading(true);
            libraryService.getMemberDetails(memberId)
                .then(setDetails)
                .finally(() => setLoading(false));
        }
    }, [memberId]);
    
    const handlePrint = () => {
        const printContent = cardRef.current?.innerHTML;
        const printWindow = window.open('', '_blank', 'height=400,width=600');
        if (printWindow && printContent) {
            printWindow.document.write('<html><head><title>Print Member Card</title>');
            printWindow.document.write('<style>body { font-family: sans-serif; } .card { border: 1px solid #ccc; padding: 20px; border-radius: 8px; width: 300px; } .barcode { font-family: "Libre Barcode 39", cursive; font-size: 36px; text-align: center; } </style>');
            printWindow.document.write('<link href="https://fonts.googleapis.com/css2?family=Libre+Barcode+39&display=swap" rel="stylesheet">');
            printWindow.document.write('</head><body>');
            printWindow.document.write(printContent);
            printWindow.document.write('</body></html>');
            printWindow.document.close();
            printWindow.focus();
            setTimeout(() => { printWindow.print(); }, 500);
        }
    };


    return (
        <Drawer isOpen={isOpen} onClose={onClose} title="Member Profile">
            {loading ? <div className="p-4">Loading details...</div> : !details ? <div className="p-4">Could not load member details.</div> : (
                <div className="p-4 space-y-4">
                    <div ref={cardRef} className="card bg-gray-50 p-4 rounded-lg border border-gray-200">
                        <h3 className="text-lg font-bold">{details.user.name}</h3>
                        <p className="text-sm text-gray-600">{details.user.type}</p>
                        <div className="barcode mt-2">{details.member.barcode}</div>
                        <p className="text-center text-xs">{details.member.barcode}</p>
                    </div>
                     <button onClick={handlePrint} className="w-full text-sm py-2 bg-gray-200 rounded-md hover:bg-gray-300">Print Card</button>
                     
                     <div className="p-2 bg-red-100 text-red-800 rounded-md text-center font-bold">
                        Outstanding Fines: £{details.totalFines.toFixed(2)}
                     </div>

                    <div>
                        <div className="border-b border-gray-200">
                            <nav className="-mb-px flex space-x-8">
                                <button onClick={() => setActiveTab('current')} className={`py-2 px-1 border-b-2 text-sm font-medium ${activeTab === 'current' ? 'border-indigo-500' : 'border-transparent'}`}>Current Loans ({details.currentLoans.length})</button>
                                <button onClick={() => setActiveTab('history')} className={`py-2 px-1 border-b-2 text-sm font-medium ${activeTab === 'history' ? 'border-indigo-500' : 'border-transparent'}`}>Loan History ({details.loanHistory.length})</button>
                            </nav>
                        </div>
                        <div className="mt-4 text-sm">
                            {activeTab === 'current' && (
                                <ul>
                                    {details.currentLoans.map(loan => (
                                        <li key={loan.id} className="py-2 border-b">
                                            <p className="font-semibold">{loan.bookTitle}</p>
                                            <p className="text-xs text-gray-500">Due: {new Date(loan.dueAt).toLocaleDateString()}</p>
                                        </li>
                                    ))}
                                </ul>
                            )}
                             {activeTab === 'history' && (
                                <ul>
                                    {details.loanHistory.map(loan => (
                                        <li key={loan.id} className="py-2 border-b">
                                            <p className="font-semibold">{loan.bookTitle}</p>
                                            <p className="text-xs text-gray-500">Returned: {loan.returnedAt ? new Date(loan.returnedAt).toLocaleDateString() : 'N/A'}</p>
                                        </li>
                                    ))}
                                </ul>
                            )}
                        </div>
                    </div>
                </div>
            )}
        </Drawer>
    );
};

export default MemberProfileDrawer;
