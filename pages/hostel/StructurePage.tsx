import React, { useState, useEffect, useCallback } from 'react';
import { useAuth } from '../../auth/AuthContext';
import { useToast } from '../../contexts/ToastContext';
import * as hostelService from '../../lib/hostelService';
// FIX: Import BedStatus and Bed types from types.ts where they are defined and exported,
// instead of from hostelService.ts which only imports them locally.
import type { HostelWithRoomsAndBeds, BedStatus, Bed } from '../../types';
import HostelModal from '../../components/hostel/HostelModal';
import RoomModal from '../../components/hostel/RoomModal';

// --- Bed Component ---
const BedSquare: React.FC<{ bed: Bed; onToggleStatus: (bedId: string, newStatus: BedStatus) => void }> = ({ bed, onToggleStatus }) => {
    const statusStyles: Record<BedStatus, string> = {
        Available: 'bg-green-100 border-green-300 text-green-800 hover:bg-green-200',
        Occupied: 'bg-blue-100 border-blue-300 text-blue-800 cursor-not-allowed',
        Blocked: 'bg-gray-200 border-gray-400 text-gray-600 hover:bg-gray-300 line-through',
    };
    const canToggle = bed.status !== 'Occupied';
    
    const handleClick = () => {
        if (!canToggle) return;
        const newStatus = bed.status === 'Available' ? 'Blocked' : 'Available';
        onToggleStatus(bed.id, newStatus);
    };

    return (
        <div 
            onClick={handleClick}
            className={`p-2 border rounded-md text-center ${canToggle ? 'cursor-pointer' : ''} ${statusStyles[bed.status]}`}
            title={`Status: ${bed.status}. Click to toggle.`}
        >
            <span className="font-bold">{bed.bedIdentifier}</span>
        </div>
    );
};


// --- Room Component ---
const RoomRow: React.FC<{ room: hostelService.RoomWithBeds, onToggleBedStatus: (bedId: string, newStatus: BedStatus) => void, onPrint: (type: 'room', data: any) => void }> = ({ room, onToggleBedStatus, onPrint }) => {
    return (
        <div className="p-4 bg-gray-50 border-t">
            <div className="flex items-center">
                <h4 className="font-semibold">{room.roomNumber} <span className="text-sm font-normal text-gray-500">(Floor: {room.floor}, Capacity: {room.capacity})</span></h4>
                <button onClick={() => onPrint('room', room)} className="ml-4 text-xs text-indigo-500 hover:underline">Print Door Card</button>
            </div>
            <div className="grid grid-cols-4 md:grid-cols-6 lg:grid-cols-8 gap-2 mt-2">
                {room.beds.map(bed => <BedSquare key={bed.id} bed={bed} onToggleStatus={onToggleBedStatus} />)}
            </div>
        </div>
    );
};

// --- Hostel Component ---
const HostelCard: React.FC<{ hostel: HostelWithRoomsAndBeds, onAddRoom: (hostelId: string) => void, onToggleBedStatus: (bedId: string, newStatus: BedStatus) => void, onPrint: (type: 'hostel' | 'room', data: any) => void }> = ({ hostel, onAddRoom, onToggleBedStatus, onPrint }) => {
    const [isExpanded, setIsExpanded] = useState(false);
    return (
        <div className="bg-white rounded-lg shadow-sm border border-gray-200">
            <div className="p-4 flex justify-between items-center cursor-pointer" onClick={() => setIsExpanded(!isExpanded)}>
                <div>
                    <h3 className="text-xl font-bold text-gray-800">{hostel.name} <span className="text-base font-normal text-gray-500">({hostel.type})</span></h3>
                     <button onClick={(e) => { e.stopPropagation(); onPrint('hostel', hostel); }} className="text-xs text-gray-500 hover:underline">Print Occupancy List</button>
                </div>
                <button className="text-indigo-600">{isExpanded ? 'Collapse' : 'Expand'}</button>
            </div>
            {isExpanded && (
                <div>
                    {hostel.rooms.map(room => <RoomRow key={room.id} room={room} onToggleBedStatus={onToggleBedStatus} onPrint={onPrint} />)}
                    <div className="p-4 bg-gray-100 border-t">
                        <button onClick={(e) => { e.stopPropagation(); onAddRoom(hostel.id); }} className="text-sm text-indigo-600 font-medium">+ Add Room</button>
                    </div>
                </div>
            )}
        </div>
    );
};

// --- Main Page ---
const StructurePage: React.FC = () => {
    const { user } = useAuth();
    const { addToast } = useToast();
    const [hostels, setHostels] = useState<HostelWithRoomsAndBeds[]>([]);
    const [loading, setLoading] = useState(true);

    const [isHostelModalOpen, setIsHostelModalOpen] = useState(false);
    const [isRoomModalOpen, setIsRoomModalOpen] = useState(false);
    const [selectedHostelId, setSelectedHostelId] = useState<string | null>(null);

    const fetchData = useCallback(() => {
        setLoading(true);
        hostelService.listHostelsWithRoomsAndBeds()
            .then(setHostels)
            .catch(() => addToast('Failed to load hostel data.', 'error'))
            .finally(() => setLoading(false));
    }, [addToast]);

    useEffect(() => {
        fetchData();
    }, [fetchData]);

    const handleAddRoomClick = (hostelId: string) => {
        setSelectedHostelId(hostelId);
        setIsRoomModalOpen(true);
    };

    const handleSaveSuccess = () => {
        setIsHostelModalOpen(false);
        setIsRoomModalOpen(false);
        fetchData();
    };
    
    const handleToggleBedStatus = async (bedId: string, newStatus: BedStatus) => {
        if (!user) return;
        try {
            await hostelService.updateBedStatus(bedId, newStatus, user);
            addToast(`Bed status updated to ${newStatus}.`, 'success');
            fetchData();
        } catch {
            addToast('Failed to update bed status.', 'error');
        }
    };
    
    const handlePrint = (type: 'hostel' | 'room', data: any) => {
        if (type === 'hostel') {
            addToast(`Printing list for ${data.name}... (Mock Action)`, 'info');
            console.log("Printing Hostel List:", data);
        } else {
            addToast(`Printing door card for Room ${data.roomNumber}... (Mock Action)`, 'info');
            console.log("Printing Door Card:", data);
        }
    };

    return (
        <div className="space-y-6">
            <div className="flex justify-between items-center">
                <h1 className="text-3xl font-bold text-gray-800">Hostel Structure</h1>
                <button onClick={() => setIsHostelModalOpen(true)} className="px-4 py-2 text-white bg-indigo-600 rounded-md shadow-sm hover:bg-indigo-700">Add Hostel</button>
            </div>

            {loading ? <p>Loading structure...</p> : (
                <div className="space-y-4">
                    {hostels.map(hostel => (
                        <HostelCard key={hostel.id} hostel={hostel} onAddRoom={handleAddRoomClick} onToggleBedStatus={handleToggleBedStatus} onPrint={handlePrint} />
                    ))}
                </div>
            )}
            
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
