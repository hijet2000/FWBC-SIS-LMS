import React, { useState, useEffect } from 'react';
import { useParams } from 'react-router-dom';
import * as certificateService from '../../lib/certificateService';
import type { IssuedCertificate } from '../../types';

const CheckCircleIcon: React.FC<{ className?: string }> = ({ className }) => (
  <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" className={className}>
    <path strokeLinecap="round" strokeLinejoin="round" d="M9 12.75L11.25 15 15 9.75M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
  </svg>
);

const XCircleIcon: React.FC<{ className?: string }> = ({ className }) => (
  <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" className={className}>
    <path strokeLinecap="round" strokeLinejoin="round" d="M9.75 9.75l4.5 4.5m0-4.5l-4.5 4.5M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
  </svg>
);

const QuestionMarkCircleIcon: React.FC<{ className?: string }> = ({ className }) => (
  <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" className={className}>
    <path strokeLinecap="round" strokeLinejoin="round" d="M9.879 7.519c1.171-1.025 3.071-1.025 4.242 0 1.172 1.025 1.172 2.687 0 3.712-.203.179-.43.326-.67.442-.745.361-1.45.999-1.45 1.827v.75M21 12a9 9 0 11-18 0 9 9 0 0118 0zm-9 5.25h.008v.008H12v-.008z" />
  </svg>
);


const PublicVerifyPage: React.FC = () => {
    const { serial } = useParams<{ serial: string }>();
    const [certificate, setCertificate] = useState<IssuedCertificate | null>(null);
    const [loading, setLoading] = useState(true);
    const [template, setTemplate] = useState<any>(null);

    useEffect(() => {
        if (serial) {
            setLoading(true);
            certificateService.getIssuedCertificateBySerial(serial)
                .then(async (cert) => {
                    setCertificate(cert);
                    if (cert) {
                        const templates = await certificateService.getTemplates();
                        setTemplate(templates.find(t => t.id === cert.templateId));
                    }
                })
                .finally(() => setLoading(false));
        } else {
            setLoading(false);
        }
    }, [serial]);

    const renderResult = () => {
        if (loading) {
            return <div className="text-center p-8">Verifying...</div>;
        }

        if (!certificate) {
            return (
                <div className="bg-white p-8 rounded-lg shadow-md text-center">
                    <QuestionMarkCircleIcon className="w-24 h-24 mx-auto text-gray-400" />
                    <h2 className="mt-4 text-3xl font-bold text-gray-800">Not Found</h2>
                    <p className="mt-2 text-gray-600">The serial number <span className="font-mono bg-gray-100 p-1 rounded">{serial}</span> does not match our records.</p>
                </div>
            );
        }

        if (certificate.status === 'Valid') {
             return (
                <div className="bg-white p-8 rounded-lg shadow-md text-center border-t-8 border-green-500">
                    <CheckCircleIcon className="w-24 h-24 mx-auto text-green-500" />
                    <h2 className="mt-4 text-3xl font-bold text-green-600">VALID</h2>
                    <div className="mt-4 text-left space-y-2">
                        <p><strong>Holder:</strong> {certificate.holderName}</p>
                        <p><strong>Document:</strong> {template?.name || 'Certificate'}</p>
                        <p><strong>Issued On:</strong> {new Date(certificate.issuedAt).toLocaleDateString()}</p>
                        {certificate.expiresAt && <p><strong>Expires On:</strong> {new Date(certificate.expiresAt).toLocaleDateString()}</p>}
                    </div>
                </div>
            );
        }

        if (certificate.status === 'Revoked') {
            return (
                <div className="bg-white p-8 rounded-lg shadow-md text-center border-t-8 border-red-500">
                    <XCircleIcon className="w-24 h-24 mx-auto text-red-500" />
                    <h2 className="mt-4 text-3xl font-bold text-red-500">REVOKED</h2>
                    <div className="mt-4 text-left space-y-2">
                         <p><strong>Holder:</strong> {certificate.holderName}</p>
                         <p><strong>Document:</strong> {template?.name || 'Certificate'}</p>
                         <p><strong>Revoked On:</strong> {certificate.revokedAt ? new Date(certificate.revokedAt).toLocaleDateString() : 'N/A'}</p>
                         <p><strong>Reason:</strong> {certificate.revocationReason || 'No reason provided.'}</p>
                    </div>
                </div>
            );
        }
    };

    return (
        <div className="min-h-screen bg-gray-100 flex flex-col items-center justify-center p-4">
             <h1 className="text-2xl font-bold text-gray-700 mb-4">FWBC Document Verification</h1>
             <div className="max-w-md w-full">
                {renderResult()}
             </div>
        </div>
    );
};

export default PublicVerifyPage;
