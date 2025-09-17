
import React, { useState, useEffect } from 'react';
import { useSearchParams } from 'react-router-dom';
import { verifyCertificate } from '../../lib/certificateService';

const VerifyPage: React.FC = () => {
    const [searchParams] = useSearchParams();
    const code = searchParams.get('code');

    const [result, setResult] = useState<any>(null);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState('');

    useEffect(() => {
        if (!code) {
            setLoading(false);
            return;
        }
        verifyCertificate(code)
            .then(data => {
                if (!data) setError('Invalid or expired verification code.');
                setResult(data);
            })
            .catch(() => setError('An error occurred during verification.'))
            .finally(() => setLoading(false));
    }, [code]);

    const renderResult = () => {
        if (loading) return <p>Verifying...</p>;
        if (error) return <p className="text-red-600">{error}</p>;
        if (!result) return <p>Enter a code to verify a certificate.</p>;

        return (
            <div className="mt-6 pt-6 border-t text-left">
                <h2 className="text-2xl font-bold text-green-600">✓ Verified</h2>
                <p>This document is authentic.</p>
                <div className="mt-4 space-y-2">
                    <p><strong>Recipient:</strong> {result.studentName}</p>
                    <p><strong>Certificate:</strong> {result.templateName}</p>
                    <p><strong>Details:</strong> {result.details}</p>
                    <p><strong>Issue Date:</strong> {result.issueDate}</p>
                </div>
            </div>
        );
    };

    return (
        <div className="min-h-screen bg-gray-100 flex items-center justify-center p-4">
            <div className="max-w-md w-full bg-white p-8 rounded-lg shadow-md text-center">
                <h1 className="text-2xl font-bold text-center mb-6">Verify Certificate</h1>
                {renderResult()}
            </div>
        </div>
    );
};

export default VerifyPage;
