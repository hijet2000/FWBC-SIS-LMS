import React, { useState, useEffect, useCallback } from 'react';
import { useAuth } from '../../auth/AuthContext';
import { useToast } from '../../contexts/ToastContext';
import * as hostelService from '../../lib/hostelService';
import type { Allocation, Hostel, Room, Bed, HostelSettings } from '../../types';

type AllocationDetails = Allocation & { hostel: Hostel, room: Room, bed: Bed };

const InfoCard: React.FC<{ title: string; children: React.ReactNode; }> = ({ title, children }) => (
    <div className="bg-white p-4 rounded-lg shadow-sm border border-gray-200">
        <h3 className="text-lg font-semibold text-gray-700 mb-2">{title}</h3>
        <div className="space-y-2 text-sm">{children}</div>
    </div>
);

const StudentHostelPage: React.FC = () => {
    const { user } = useAuth();
    const { addToast } = useToast();
    const studentId = 's01'; // HACK: Hardcoded for demo

    const [allocation, setAllocation] = useState<AllocationDetails | null>(null);
    const [settings, setSettings] = useState<HostelSettings | null>(null);
    const [loading, setLoading] = useState(true);

    const fetchData = useCallback(async () => {
        if (!studentId) return;
        setLoading(true);
        try {
            const [allocData, settingsData] = await Promise.all([
                hostelService.getAllocationForStudent(studentId),
                hostelService.getHostelSettings(),
            ]);
            setAllocation(allocData);
            setSettings(settingsData);
        } catch {
            addToast('Failed to load hostel information.', 'error');
        } finally {
            setLoading(false);
        }
    }, [studentId, addToast]);

    useEffect(() => {
        fetchData();
    }, [fetchData]);

    if (loading) return <div className="p-8 text-center">Loading your hostel details...</div>;

    if (!allocation) {
        return (
            <div className="p-8 text-center bg-white rounded-lg border">
                <h2 className="text-xl font-semibold text-gray-700">Not a Boarder</h2>
                <p className="mt-2 text-gray-500">You do not currently have an active hostel allocation.</p>
            </div>
        );
    }

    return (
        <div className="space-y-6">
            <h1 className="text-3xl font-bold text-gray-800">My Hostel Allocation</h1>
            
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                <div className="lg:col-span-1">
                    <InfoCard title="Your Allocation">
                        <p><strong>Hostel:</strong> {allocation.hostel.name}</p>
                        <p><strong>Room:</strong> {allocation.room.roomNumber}</p>
                        <p><strong>Bed:</strong> {allocation.bed.bedIdentifier}</p>
                        <p><strong>Check-in Date:</strong> {allocation.checkInDate}</p>
                    </InfoCard>
                </div>
                <div className="lg:col-span-2">
                    {settings && (
                        <InfoCard title="Hostel Rules">
                            <p><strong>Curfew:</strong> {settings.curfewTime} daily</p>
                            <p><strong>Late After:</strong> {settings.lateThresholdMin} minutes past curfew</p>
                            <p><strong>Max Daily Visitors:</strong> {settings.maxVisitorsPerDay}</p>
                            <p><strong>ID Required for Visitors:</strong> {settings.idRequiredForVisitors ? 'Yes' : 'No'}</p>
                        </InfoCard>
                    )}
                </div>
            </div>
        </div>
    );
};

export default StudentHostelPage;
