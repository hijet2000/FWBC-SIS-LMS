import React, { useState, useEffect } from 'react';
import { useParams } from 'react-router-dom';
import { useAuth } from '../../auth/AuthContext';
import { useToast } from '../../contexts/ToastContext';
import { getAllocationForStudent } from '../../lib/hostelService';
import type { Allocation, HostelRoom, Bed, Hostel } from '../../types';

const DetailCard: React.FC<{ title: string; children: React.ReactNode }> = ({ title, children }) => (
    <div className="bg-white p-6 rounded-lg shadow-sm border">
        <h3 className="text-lg font-semibold text-gray-700 border-b pb-2 mb-4">{title}</h3>
        <div className="space-y-2 text-gray-700">{children}</div>
    </div>
);

const StudentHostelPage: React.FC = () => {
    const { addToast } = useToast();
    const { user } = useAuth();
    // In a real app, studentId would come directly from the authenticated user object.
    const studentId = user?.scopes.includes('student') ? 's01' : null;

    const [allocationInfo, setAllocationInfo] = useState<{ allocation: Allocation, room: HostelRoom, bed: Bed, hostel: Hostel } | null>(null);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        if (!studentId) {
            setLoading(false);
            return;
        }
        setLoading(true);
        getAllocationForStudent(studentId)
            .then(setAllocationInfo)
            .catch(() => addToast('Failed to load hostel information.', 'error'))
            .finally(() => setLoading(false));
    }, [studentId, addToast]);
    
    if (loading) return <p>Loading your hostel details...</p>;
    
    return (
        <div className="space-y-6">
            <h1 className="text-3xl font-bold text-gray-800">My Hostel Information</h1>

            {allocationInfo ? (
                <DetailCard title="Current Allocation">
                    <p><strong>Hostel:</strong> {allocationInfo.hostel.name} ({allocationInfo.hostel.type})</p>
                    <p><strong>Room:</strong> {allocationInfo.room.name}</p>
                    <p><strong>Bed:</strong> {allocationInfo.bed.name}</p>
                    <p><strong>Check-in Date:</strong> {new Date(allocationInfo.allocation.checkInDate).toLocaleDateString()}</p>
                </DetailCard>
            ) : (
                 <div className="text-center py-12 bg-gray-50 rounded-lg">
                    <h3 className="text-lg font-medium text-gray-800">No Allocation Found</h3>
                    <p className="mt-1 text-sm text-gray-500">You are not currently assigned to a hostel room.</p>
                </div>
            )}
        </div>
    );
};

export default StudentHostelPage;