
import React, { useState, useEffect } from 'react';
import { useAuth } from '../../auth/AuthContext';
import { useToast } from '../../contexts/ToastContext';
import { listMyCertificates } from '../../lib/certificateService';

const MyCertificatesPage: React.FC = () => {
    const { user } = useAuth();
    const { addToast } = useToast();
    const studentId = 's01'; // HACK: for demo purposes

    const [certificates, setCertificates] = useState<any[]>([]);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        if (!studentId) return;
        setLoading(true);
        listMyCertificates(studentId)
            .then(setCertificates)
            .catch(() => addToast('Failed to load certificates.', 'error'))
            .finally(() => setLoading(false));
    }, [studentId, addToast]);
    
    return (
        <div className="space-y-6">
            <h1 className="text-3xl font-bold">My Certificates</h1>
            {loading ? <p>Loading...</p> : certificates.map(cert => (
                <div key={cert.id} className="bg-white p-4 rounded-lg shadow-sm border">
                    <h2 className="font-semibold">{cert.details}</h2>
                    <p className="text-sm text-gray-500">Issued: {cert.issueDate}</p>
                    <a href={`/verify?code=${cert.verificationCode}`} target="_blank" rel="noreferrer" className="text-sm text-indigo-600">
                        View & Verify
                    </a>
                </div>
            ))}
        </div>
    );
};

export default MyCertificatesPage;
