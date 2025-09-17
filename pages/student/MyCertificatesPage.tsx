import React, { useState, useEffect } from 'react';
import { useAuth } from '../../auth/AuthContext';
import { useToast } from '../../contexts/ToastContext';
import { listMyCertificates } from '../../lib/certificateService';
import { IssuedCertificate } from '../../types';

const MyCertificatesPage: React.FC = () => {
    const { user } = useAuth();
    const { addToast } = useToast();
    const studentId = 's01'; // HACK: for demo purposes

    const [certificates, setCertificates] = useState<IssuedCertificate[]>([]);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        if (!studentId) return;
        setLoading(true);
        listMyCertificates(studentId)
            .then(setCertificates)
            .catch(() => addToast('Failed to load certificates.', 'error'))
            .finally(() => setLoading(false));
    }, [studentId, addToast]);
    
    const handleDownload = () => {
        addToast("PDF generation is a mock feature.", "info");
    };

    return (
        <div className="space-y-6">
            <h1 className="text-3xl font-bold">My Certificates & ID Cards</h1>
            {loading ? <p>Loading...</p> : 
            certificates.length === 0 ? <p className="text-gray-500">You have not been issued any certificates yet.</p> :
            certificates.map(cert => (
                <div key={cert.id} className="bg-white p-4 rounded-lg shadow-sm border">
                    <div className="flex justify-between items-start">
                        <div>
                            <h2 className="font-semibold text-gray-800">{cert.details.main || cert.studentName}</h2>
                            <p className="text-sm text-gray-500">Issued: {cert.issueDate}</p>
                            <p className="text-xs font-mono text-gray-400 mt-2">Serial: {cert.serialNumber}</p>
                        </div>
                        <span className={`px-2 py-1 text-xs font-medium rounded-full ${cert.status === 'Issued' ? 'bg-green-100 text-green-800' : 'bg-red-100 text-red-800'}`}>
                            {cert.status}
                        </span>
                    </div>
                    <div className="mt-4 pt-4 border-t flex gap-2">
                        <button onClick={handleDownload} className="text-sm font-medium text-indigo-600 hover:text-indigo-800 px-3 py-1.5 bg-indigo-50 rounded-md">
                            Download PDF
                        </button>
                        <a href={`/verify/${cert.serialNumber}`} target="_blank" rel="noreferrer" className="text-sm font-medium text-gray-600 hover:text-gray-800 px-3 py-1.5 bg-gray-100 rounded-md">
                            Verify
                        </a>
                    </div>
                </div>
            ))}
        </div>
    );
};

export default MyCertificatesPage;