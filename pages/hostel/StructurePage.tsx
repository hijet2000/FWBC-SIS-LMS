import React, { useState, useEffect, useCallback } from 'react';
import { useAuth } from '../../auth/AuthContext';
import { useToast } from '../../contexts/ToastContext';
import * as hostelService from '../../lib/hostelService';
import type { HostelWithRoomsAndBeds, BedStatus, Bed } from '../../types';
import HostelModal from '../../components/hostel/HostelModal';
import RoomModal from '../../components/hostel/RoomModal';

const BedComponent: React.FC<{ bed: Bed, onToggleStatus: (bed: Bed) => void }> = ({ bed, onToggleStatus }) => {
    const statusStyles: Record<BedStatus, string> = {
        Available: 'bg-green-100 text-green-800',
        Occupied: 'bg-blue-100 text-blue-800',
        Blocked: 'bg-yellow-100 text-yellow-800',
    };

    return (
        <div className="flex justify-between items-center p-2 border-b last:border-0">
            <span className={`px-2 py-1 text-xs rounded-full ${statusStyles[bed.status]}`}>Bed {bed.bedIdentifier} - {bed.status}</span>
            {bed.status !== 'Occupied' && (
                <button 
                    onClick={() => onToggleStatus(bed)}
                    className="text-xs text-indigo-600 hover:underline"
                >
                    {bed.status === 'Available' ? 'Block' : 'Unblock'}
                </button>
            )}
        </div>
    );
};

const StructurePage: React.FC = () => {
    const { user } = useAuth();
    const { addToast } = useToast();
    const [structure, setStructure] = useState<HostelWithRoomsAndBeds[]>([]);
    const [loading, setLoading] = useState(true);

    const [isHostelModalOpen, setIsHostelModalOpen] = useState(false);
    const [isRoomModalOpen, setIsRoomModalOpen] = useState(false);
    const [selectedHostelId, setSelectedHostelId] = useState<string | null>(null);

    const fetchData = useCallback(() => {
        setLoading(true);
        hostelService.listHostelsWithRoomsAndBeds()
            .then(setStructure)
            .catch(() => addToast('Failed to load hostel structure.', 'error'))
            .finally(() => setLoading(false));
    }, [addToast]);

    useEffect(() => {
        fetchData();
    }, [fetchData]);

    const handleSaveSuccess = () => {
        setIsHostelModalOpen(false);
        setIsRoomModalOpen(false);
        fetchData();
    };

    const handleToggleBedStatus = async (bed: Bed) => {
        if (!user) return;
        const newStatus: BedStatus = bed.status === 'Available' ? 'Blocked' : 'Available';
        try {
            await hostelService.updateBedStatus(bed.id, newStatus, user);
            addToast('Bed status updated.', 'success');
            fetchData();
        } catch {
            addToast('Failed to update bed status.', 'error');
        }
    };
    
    const handleOpenRoomModal = (hostelId: string) => {
        setSelectedHostelId(hostelId);
        setIsRoomModalOpen(true);
    };

    return (
        <div className="space-y-6">
            <div className="flex justify-between items-center">
                <h1 className="text-3xl font-bold text-gray-800">Hostel Structure</h1>
                <button onClick={() => setIsHostelModalOpen(true)} className="px-4 py-2 text-sm text-white bg-indigo-600 rounded-md">Add Hostel</button>
            </div>

            {loading ? <p>Loading structure...</p> :
            <div className="space-y-4">
                {structure.map(hostel => (
                    <div key={hostel.id} className="bg-white rounded-lg shadow-sm border">
                        <div className="p-3 border-b flex justify-between items-center">
                            <h2 className="text-xl font-semibold">{hostel.name} <span className="text-base font-normal text-gray-500">({hostel.type})</span></h2>
                            <button onClick={() => handleOpenRoomModal(hostel.id)} className="text-sm text-indigo-600 font-medium">Add Room</button>
                        </div>
                        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4 p-4">
                            {hostel.rooms.map(room => (
                                <div key={room.id} className="border rounded-md">
                                    <div className="p-2 bg-gray-50 border-b">
                                        <h3 className="font-semibold">Room {room.roomNumber}</h3>
                                        <p className="text-xs text-gray-500">Floor: {room.floor} | Capacity: {room.capacity}</p>
                                    </div>
                                    <div>
                                        {room.beds.map(bed => <BedComponent key={bed.id} bed={bed} onToggleStatus={handleToggleBedStatus} />)}
                                    </div>
                                </div>
                            ))}
                             {hostel.rooms.length === 0 && <p className="text-sm text-gray-500 p-4">No rooms defined for this hostel.</p>}
                        </div>
                    </div>
                ))}
            </div>
            }

            {user && (
                <>
                    <HostelModal isOpen={isHostelModalOpen} onClose={() => setIsHostelModalOpen(false)} onSaveSuccess={handleSaveSuccess} actor={user} />
                    <RoomModal isOpen={isRoomModalOpen} onClose={() => setIsRoomModalOpen(false)} onSaveSuccess={handleSaveSuccess} actor={user} hostelId={selectedHostelId} />
                </>
            )}
        </div>
    );
};

export default StructurePage;
