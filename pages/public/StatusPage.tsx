import React, { useState, useEffect } from 'react';
import { useSearchParams } from 'react-router-dom';
import * as admissionsService from '../../lib/admissionsService';
import type { PublicApplicationView } from '../../types';

const StatusPage: React.FC = () => {
    const [searchParams, setSearchParams] = useSearchParams();
    const [ref, setRef] = useState(searchParams.get('ref') || '');
    const [email, setEmail] = useState(searchParams.get('email') || '');
    
    const [status, setStatus] = useState<PublicApplicationView | null>(null);
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState('');
    const [searched, setSearched] = useState(!!(searchParams.get('ref') && searchParams.get('email')));

    const handleSubmit = async (e?: React.FormEvent) => {
        e?.preventDefault();
        if (!ref || !email) return;

        setLoading(true);
        setError('');
        setSearched(true);
        setSearchParams({ ref, email });
        
        try {
            const result = await admissionsService.getPublicApplicationStatus(ref, email);
            if (!result) {
                setError('No matching application found. Please check your details and try again.');
            }
            setStatus(result);
        } catch {
            setError('An error occurred. Please try again later.');
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        if (searched) {
            handleSubmit();
        }
    }, []); // eslint-disable-line react-hooks/exhaustive-deps


    return (
        <div className="min-h-screen bg-gray-100 flex items-center justify-center p-4">
            <div className="max-w-md w-full bg-white p-8 rounded-lg shadow-md">
                <h1 className="text-2xl font-bold text-center mb-6">Check Application Status</h1>

                <form onSubmit={handleSubmit} className="space-y-4">
                    <input value={ref} onChange={e => setRef(e.target.value)} placeholder="Application Reference" className="w-full p-2 border rounded-md" required />
                    <input type="email" value={email} onChange={e => setEmail(e.target.value)} placeholder="Guardian Email" className="w-full p-2 border rounded-md" required />
                    <button type="submit" disabled={loading} className="w-full py-2 bg-indigo-600 text-white rounded-md disabled:bg-gray-400">
                        {loading ? 'Checking...' : 'Check Status'}
                    </button>
                </form>

                {error && <p className="mt-4 text-center text-red-600">{error}</p>}
                
                {searched && !loading && status && (
                    <div className="mt-6 pt-6 border-t">
                        <h2 className="text-lg font-semibold">Status for {status.applicantName}</h2>
                        <p className="mt-2"><strong>Current Status:</strong> <span className="font-mono bg-gray-100 p-1 rounded">{status.status}</span></p>
                        <p className="mt-2"><strong>Next Steps:</strong> {status.nextSteps}</p>
                        {status.interviewDetails?.scheduledAt && <p><strong>Interview:</strong> {new Date(status.interviewDetails.scheduledAt).toLocaleString()}</p>}
                        {status.missingDocuments.length > 0 && <p className="text-yellow-700"><strong>Action Required:</strong> Please submit {status.missingDocuments.join(', ')}.</p>}
                    </div>
                )}
            </div>
        </div>
    );
};

export default StatusPage;