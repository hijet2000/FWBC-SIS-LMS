import React, { useState, useEffect, useCallback } from 'react';
import { useAuth } from '../../auth/AuthContext';
import { useToast } from '../../contexts/ToastContext';
import * as commsService from '../../lib/commsService';
import type { Audience, User } from '../../types';
import AudienceModal from '../../components/comms/AudienceModal';

const AudiencesPage: React.FC = () => {
    const { user } = useAuth();
    const { addToast } = useToast();
    const [audiences, setAudiences] = useState<Audience[]>([]);
    const [loading, setLoading] = useState(true);
    const [isModalOpen, setIsModalOpen] = useState(false);
    const [editingAudience, setEditingAudience] = useState<Audience | null>(null);

    const fetchData = useCallback(() => {
        setLoading(true);
        commsService.listAudiences()
            .then(setAudiences)
            .catch(() => addToast('Failed to load audiences.', 'error'))
            .finally(() => setLoading(false));
    }, [addToast]);

    useEffect(() => {
        fetchData();
    }, [fetchData]);

    const handleOpenModal = (audience: Audience | null = null) => {
        setEditingAudience(audience);
        setIsModalOpen(true);
    };
    
    const handleSaveSuccess = () => {
        setIsModalOpen(false);
        setEditingAudience(null);
        addToast('Audience saved.', 'success');
        fetchData();
    };

    return (
        <div className="space-y-6">
            <div className="flex justify-between items-center">
                <h1 className="text-3xl font-bold">Audiences</h1>
                <button onClick={() => handleOpenModal()} className="px-4 py-2 bg-indigo-600 text-white rounded-md shadow-sm">New Audience</button>
            </div>

            <div className="bg-white rounded-lg shadow-sm border">
                <ul className="divide-y divide-gray-200">
                    {loading ? <li className="p-4 text-center">Loading...</li> : audiences.map(aud => (
                        <li key={aud.id} className="p-4 flex justify-between items-center">
                            <div>
                                <p className="font-semibold">{aud.name}</p>
                                <p className="text-sm text-gray-500">{aud.description}</p>
                            </div>
                            <button onClick={() => handleOpenModal(aud)} className="text-sm text-indigo-600">Edit</button>
                        </li>
                    ))}
                </ul>
            </div>
            
            {user && (
                <AudienceModal 
                    isOpen={isModalOpen} 
                    onClose={() => setIsModalOpen(false)}
                    onSaveSuccess={handleSaveSuccess}
                    initialData={editingAudience}
                    actor={user}
                />
            )}
        </div>
    );
};

export default AudiencesPage;