import React, { useState } from 'react';
import { useParams } from 'react-router-dom';
import { useAuth } from '../../auth/AuthContext';
import { useToast } from '../../contexts/ToastContext';
import * as alumniService from '../../lib/alumniService';

const AlumniDonatePage: React.FC = () => {
    const { alumniId } = useParams<{ alumniId: string }>();
    const { user } = useAuth();
    const { addToast } = useToast();

    const [amount, setAmount] = useState(50);
    const [isAnonymous, setIsAnonymous] = useState(false);
    const [isSubmitting, setIsSubmitting] = useState(false);

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!user || !alumniId || amount <= 0) return;
        setIsSubmitting(true);
        try {
            await alumniService.createDonation({
                alumniId,
                amount,
                date: new Date().toISOString().split('T')[0],
                isAnonymous,
                campaign: 'Annual Fund'
            }, user);
            addToast('Thank you for your generous donation!', 'success');
            setAmount(50);
            setIsAnonymous(false);
        } catch {
            addToast('Donation failed. Please try again.', 'error');
        } finally {
            setIsSubmitting(false);
        }
    };
    
    return (
        <div className="max-w-md mx-auto">
            <h1 className="text-3xl font-bold text-gray-800 text-center">Give Back</h1>
            <p className="text-center text-gray-600 mt-2">Your contributions help shape the future of FWBC.</p>

            <form onSubmit={handleSubmit} className="mt-8 bg-white p-6 rounded-lg shadow-sm border space-y-4">
                <div>
                    <label className="text-lg font-semibold">Donation Amount (£)</label>
                    <div className="flex gap-2 mt-2">
                        {[25, 50, 100, 250].map(val => (
                            <button type="button" key={val} onClick={() => setAmount(val)} className={`flex-1 p-2 border rounded-md ${amount === val ? 'bg-indigo-600 text-white' : 'bg-gray-100'}`}>
                                £{val}
                            </button>
                        ))}
                    </div>
                    <input 
                        type="number" 
                        value={amount} 
                        onChange={e => setAmount(Number(e.target.value))}
                        className="w-full mt-2 p-2 border rounded-md"
                        min="1"
                    />
                </div>
                
                <div className="flex items-center gap-2">
                    <input type="checkbox" id="anonymous" checked={isAnonymous} onChange={e => setIsAnonymous(e.target.checked)} />
                    <label htmlFor="anonymous">Make my donation anonymous</label>
                </div>

                <button type="submit" disabled={isSubmitting} className="w-full p-3 bg-green-600 text-white font-bold rounded-md disabled:bg-gray-400">
                    {isSubmitting ? 'Processing...' : `Donate £${amount}`}
                </button>
            </form>
        </div>
    );
};

export default AlumniDonatePage;
