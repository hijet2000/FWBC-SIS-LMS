import React, { useState, useEffect, useCallback } from 'react';
import { useParams } from 'react-router-dom';
import { useToast } from '../../contexts/ToastContext';
import * as hostelService from '../../lib/hostelService';
import * as schoolService from '../../lib/schoolService';
import type { Allocation, Hostel, Room, Bed, HostelSettings, Student } from '../../types';

type AllocationDetails = Allocation & { hostel: Hostel, room: Room, bed: Bed };

const InfoCard: React.FC<{ title: string; children: React.ReactNode; }> = ({ title, children }) => (
    <div className="bg-white p-4 rounded-lg shadow-sm border border-gray-200">
        <h3 className="text-lg font-semibold text-gray-700 mb-2">{title}</h3>
        <div className="space-y-2 text-sm">{children}</div>
    </div>
);

const ParentHostelPage: React.FC = () => {
    const { studentId } = useParams<{ studentId: string }>();
    const { addToast } = useToast();

    const [student, setStudent] = useState<Student | null>(null);
    const [allocation, setAllocation] = useState<AllocationDetails | null>(null);
    const [settings, setSettings] = useState<HostelSettings | null>(null);
    const [loading, setLoading] = useState(true);

    const fetchData = useCallback(async () => {
        if (!studentId) return;
        setLoading(true);
        try {
            const [studentData, allocData, settingsData] = await Promise.all([
                schoolService.getStudent(studentId),
                hostelService.getAllocationForStudent(studentId),
                hostelService.getHostelSettings(),
            ]);
            setStudent(studentData);
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

    if (loading) return <div className="p-8 text-center">Loading hostel details...</div>;

    if (!allocation) {
        return (
            <div className="p-8 text-center bg-white rounded-lg border">
                <h2 className="text-xl font-semibold text-gray-700">Not a Boarder</h2>
                <p className="mt-2 text-gray-500">{student?.name || 'Your child'} does not currently have an active hostel allocation.</p>
            </div>
        );
    }

    return (
        <div className="space-y-6">
            <h1 className="text-3xl font-bold text-gray-800">Hostel Allocation</h1>
            {student && <p className="text-gray-600">Viewing details for: <span className="font-semibold">{student.name}</span></p>}
            
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                <div className="lg:col-span-1">
                    <InfoCard title="Current Allocation">
                        <p><strong>Hostel:</strong> {allocation.hostel.name}</p>
                        <p><strong>Room:</strong> {allocation.room.roomNumber}</p>
                        <p><strong>Bed:</strong> {allocation.bed.bedIdentifier}</p>
                        <p><strong>Check-in Date:</strong> {allocation.checkInDate}</p>
                    </InfoCard>
                </div>
                <div className="lg:col-span-2">
                    {settings && (
                        <InfoCard title="Key Hostel Rules">
                            <p><strong>Curfew:</strong> {settings.curfewTime} daily</p>
                            <p><strong>Max Daily Visitors:</strong> {settings.maxVisitorsPerDay}</p>
                            <p><strong>ID Required for Visitors:</strong> {settings.idRequiredForVisitors ? 'Yes' : 'No'}</p>
                        </InfoCard>
                    )}
                </div>
            </div>
        </div>
    );
};

export default ParentHostelPage;