import React, { useState, useEffect } from 'react';
import { useParams } from 'react-router-dom';
import { verifyBySerial } from '../../lib/certificateService';

interface VerificationResult {
    studentName: string;
    templateName: string;
    issueDate: string;
    status: 'Issued' | 'Revoked' | 'Expired';
    revocation?: {
        reason: string;
        revokedAt: string;
        revokedBy: string;
    };
}

const VerifyPage: React.FC = () => {
    const { serialNumber } = useParams<{ serialNumber: string }>();
    const [result, setResult] = useState<VerificationResult | null>(null);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState('');

    useEffect(() => {
        if (!serialNumber) {
            setLoading(false);
            setError('No serial number provided.');
            return;
        }
        setLoading(true);
        setError('');
        verifyBySerial(serialNumber)
            .then(data => {
                if (!data) {
                    setError('This serial number is not valid or does not exist.');
                }
                setResult(data);
            })
            .catch(() => setError('An error occurred during verification.'))
            .finally(() => setLoading(false));
    }, [serialNumber]);
    
    const renderResult = () => {
        if (loading) return <p className="mt-6 text-center">Verifying...</p>;
        if (error) return <div className="mt-6 text-center bg-red-100 text-red-700 p-4 rounded-md"><strong>Error:</strong> {error}</div>;
        if (!result) return <div className="mt-6 text-center bg-gray-100 p-4 rounded-md">Please provide a serial number to verify.</div>;

        if(result.status === 'Issued') {
            return (
                <div className="mt-6 pt-6 border-t border-green-300">
                    <h2 className="text-2xl font-bold text-green-600">✓ VALID</h2>
                    <p className="text-gray-600">This document is authentic and was issued by FWBC.</p>
                    <div className="mt-4 space-y-2 text-left bg-green-50 p-4 rounded-md border border-green-200">
                        <p><strong>Recipient:</strong> {result.studentName}</p>
                        <p><strong>Certificate:</strong> {result.templateName}</p>
                        <p><strong>Issue Date:</strong> {result.issueDate}</p>
                    </div>
                </div>
            );
        }

        if(result.status === 'Revoked') {
             return (
                <div className="mt-6 pt-6 border-t border-red-300">
                    <h2 className="text-2xl font-bold text-red-600">✗ REVOKED</h2>
                    <p className="text-gray-600">This document is no longer valid.</p>
                    <div className="mt-4 space-y-2 text-left bg-red-50 p-4 rounded-md border border-red-200">
                        <p><strong>Recipient:</strong> {result.studentName}</p>
                        <p><strong>Certificate:</strong> {result.templateName}</p>
                        <p><strong>Revocation Reason:</strong> {result.revocation?.reason}</p>
                        <p><strong>Revoked On:</strong> {result.revocation && new Date(result.revocation.revokedAt).toLocaleDateString()}</p>
                    </div>
                </div>
            );
        }

        return null;
    };


    return (
        <div className="min-h-screen bg-gray-100 flex items-center justify-center p-4">
            <div className="max-w-md w-full bg-white p-8 rounded-lg shadow-md text-center">
                <h1 className="text-2xl font-bold text-center mb-6">Verify Document</h1>
                <p className="text-sm font-mono bg-gray-100 p-2 rounded-md break-all">{serialNumber}</p>
                {renderResult()}
            </div>
        </div>
    );
};

export default VerifyPage;