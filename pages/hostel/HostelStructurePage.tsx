import React, { useState, useEffect, useMemo, useCallback } from 'react';
import { useToast } from '../../contexts/ToastContext';
import * as hostelService from '../../lib/hostelService';
import { useAuth } from '../../auth/AuthContext';
import type { Hostel, HostelFloor, HostelRoom, Bed } from '../../types';
import RoomModal from '../../components/hostel/RoomModal';

const HostelStructurePage: React.FC = () => {
    const { addToast } = useToast();
    const { user } = useAuth();
    const [structure, setStructure] = useState<{ hostels: Hostel[], floors: HostelFloor[], rooms: HostelRoom[], beds: Bed[] } | null>(null);
    const [loading, setLoading] = useState(true);
    const [editingRoom, setEditingRoom] = useState<HostelRoom | null>(null);

    const fetchData = useCallback(() => {
        setLoading(true);
        hostelService.getHostelStructure()
            .then(setStructure)
            .catch(() => addToast('Failed to load hostel structure.', 'error'))
            .finally(() => setLoading(false));
    }, [addToast]);

    useEffect(() => {
        fetchData();
    }, [fetchData]);

    const handleBedToggle = async (bed: Bed) => {
        if (!user) return;
        const newStatus = bed.status === 'Available' ? 'Blocked' : 'Available';
        await hostelService.updateBedStatus(bed.id, newStatus, user);
        addToast(`Bed ${bed.name} status set to ${newStatus}.`, 'success');
        fetchData();
    };

    const handleRoomSave = () => {
        setEditingRoom(null);
        addToast('Room updated successfully.', 'success');
        fetchData();
    };

    if (loading) return <p>Loading structure...</p>;
    if (!structure) return null;

    return (
        <div className="space-y-6">
            <h1 className="text-3xl font-bold text-gray-800">Hostel Structure</h1>
            
            <div className="space-y-8">
                {structure.hostels.map(hostel => (
                    <div key={hostel.id} className="bg-white p-4 rounded-lg shadow-sm border">
                        <h2 className="text-xl font-bold text-indigo-700">{hostel.name} <span className="text-base font-medium text-gray-500">({hostel.type})</span></h2>
                        <div className="mt-4 space-y-4">
                            {structure.floors.filter(f => f.hostelId === hostel.id).map(floor => (
                                <div key={floor.id} className="pl-4">
                                    <h3 className="font-semibold text-gray-800">{floor.name}</h3>
                                    <div className="mt-2 grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                                        {structure.rooms.filter(r => r.floorId === floor.id).map(room => (
                                            <div key={room.id} className="p-3 bg-gray-50 border rounded-md">
                                                <div className="flex justify-between items-center">
                                                    <h4 className="font-bold">Room {room.name}</h4>
                                                    <button onClick={() => setEditingRoom(room)} className="text-xs text-indigo-600">Edit</button>
                                                </div>
                                                <p className="text-xs text-gray-500">{room.capacity}-person {room.roomType}</p>
                                                <div className="mt-2 flex flex-wrap gap-2">
                                                    {structure.beds.filter(b => b.roomId === room.id).map(bed => (
                                                        <button key={bed.id} onClick={() => handleBedToggle(bed)} title={`Click to ${bed.status === 'Available' ? 'Block' : 'Unblock'}`}
                                                            className={`px-2 py-1 text-xs rounded-full ${bed.status === 'Available' ? 'bg-green-100 text-green-800' : bed.status === 'Occupied' ? 'bg-blue-100 text-blue-800' : 'bg-red-100 text-red-800'}`}>
                                                            {bed.name}
                                                        </button>
                                                    ))}
                                                </div>
                                            </div>
                                        ))}
                                    </div>
                                </div>
                            ))}
                        </div>
                    </div>
                ))}
            </div>

            {user && editingRoom && (
                <RoomModal 
                    isOpen={!!editingRoom}
                    onClose={() => setEditingRoom(null)}
                    onSave={handleRoomSave}
                    room={editingRoom}
                    actor={user}
                />
            )}
        </div>
    );
};

export default HostelStructurePage;