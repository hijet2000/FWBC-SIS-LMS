
import type { Hostel, HostelFloor, HostelRoom, Bed, Allocation, HostelVisitor, CurfewCheck, User, Student, CurfewException, HostelPolicy } from '../types';
import { getStudents } from './schoolService';
import { logAuditEvent } from './auditService';

// --- MOCK DATA STORE ---
const getTodayDateString = () => new Date().toISOString().split('T')[0];
const getISODateMinutesAgo = (minutes: number) => new Date(Date.now() - minutes * 60 * 1000).toISOString();
const getISODateDaysFromNow = (days: number): string => {
    const date = new Date();
    date.setDate(date.getDate() + days);
    return date.toISOString().split('T')[0];
};

const MOCK_HOSTELS: Hostel[] = [
    { id: 'H1', name: 'Founders Hall', type: 'Boys' },
    { id: 'H2', name: 'Centenary House', type: 'Girls' },
];

const MOCK_FLOORS: HostelFloor[] = [
    { id: 'F1', hostelId: 'H1', name: 'Ground Floor' },
    { id: 'F2', hostelId: 'H1', name: 'First Floor' },
    { id: 'F3', hostelId: 'H2', name: 'Ground Floor' },
];

let MOCK_ROOMS: HostelRoom[] = [
    { id: 'R101', floorId: 'F1', name: '101', capacity: 4, roomType: 'Standard' },
    { id: 'R102', floorId: 'F1', name: '102', capacity: 4, roomType: 'Standard' },
    { id: 'R201', floorId: 'F2', name: '201', capacity: 2, roomType: 'Premium' },
    { id: 'R301', floorId: 'F3', name: 'G01', capacity: 4, roomType: 'Standard' },
];

let MOCK_BEDS: Bed[] = [
    // R101
    { id: 'B101A', roomId: 'R101', name: 'A', status: 'Occupied' },
    { id: 'B101B', roomId: 'R101', name: 'B', status: 'Available' },
    { id: 'B101C', roomId: 'R101', name: 'C', status: 'Blocked' },
    { id: 'B101D', roomId: 'R101', name: 'D', status: 'Available' },
    // R201
    { id: 'B201A', roomId: 'R201', name: 'A', status: 'Occupied' },
    { id: 'B201B', roomId: 'R201', name: 'B', status: 'Available' },
     // R301
    { id: 'B301A', roomId: 'R301', name: 'A', status: 'Occupied' },
    { id: 'B301B', roomId: 'R301', name: 'B', status: 'Occupied' },
];

let MOCK_ALLOCATIONS: Allocation[] = [
    { id: 'A1', studentId: 's01', bedId: 'B101A', checkInDate: '2025-09-01' },
    { id: 'A2', studentId: 's06', bedId: 'B201A', checkInDate: '2025-09-01' },
    { id: 'A3', studentId: 's02', bedId: 'B301A', checkInDate: '2025-09-01' },
    { id: 'A4', studentId: 's07', bedId: 'B301B', checkInDate: '2025-09-01' },
];

let MOCK_VISITORS: HostelVisitor[] = [
    { id: 'HV1', studentId: 's01', visitorName: 'Jane Johnson', relationship: 'Mother', timeIn: getISODateMinutesAgo(60), timeOut: getISODateMinutesAgo(30) },
    { id: 'HV2', studentId: 's06', visitorName: 'Michael Garcia', relationship: 'Father', timeIn: getISODateMinutesAgo(20) },
];

let MOCK_CURFEW_CHECKS: CurfewCheck[] = [];
let MOCK_CURFEW_EXCEPTIONS: CurfewException[] = [
    { id: 'CE1', studentId: 's01', fromDate: getTodayDateString(), toDate: getISODateDaysFromNow(2), reason: 'Family event', approvedByUserId: 'user-evelyn-reed' },
];

// FIX: Add mock policy data
let MOCK_POLICY: HostelPolicy = {
    curfewTime: "22:00",
    lateThresholdMin: 15,
    genderRule: 'Warn',
    maxVisitorsPerDay: 2,
    idRequiredForVisitors: false,
    maxOverstayMinutes: 30,
};

// --- MOCK API ---
const delay = (ms: number) => new Promise(res => setTimeout(res, ms));

export const getHostelStructure = async () => {
    await delay(500);
    return {
        hostels: MOCK_HOSTELS,
        floors: MOCK_FLOORS,
        rooms: MOCK_ROOMS,
        beds: MOCK_BEDS,
    };
};

export const updateBedStatus = async (bedId: string, status: 'Available' | 'Blocked', actor: User) => {
    await delay(300);
    const bed = MOCK_BEDS.find(b => b.id === bedId);
    if (bed && bed.status !== 'Occupied') {
        bed.status = status;
    }
};

export const createRoom = async (roomData: Omit<HostelRoom, 'id'>, actor: User): Promise<HostelRoom> => {
    await delay(500);
    const newRoom: HostelRoom = {
        ...roomData,
        id: `R-${Date.now()}`
    };
    MOCK_ROOMS.push(newRoom);

    // Auto-create beds
    const bedLetters = ['A', 'B', 'C', 'D', 'E', 'F', 'G', 'H'];
    for (let i = 0; i < newRoom.capacity; i++) {
        const newBed: Bed = {
            id: `B-${newRoom.id}-${bedLetters[i]}`,
            roomId: newRoom.id,
            name: bedLetters[i],
            status: 'Available'
        };
        MOCK_BEDS.push(newBed);
    }

    logAuditEvent({ actorId: actor.id, actorName: actor.name, action: 'CREATE', module: 'HOSTEL', entityType: 'Room', entityId: newRoom.id, entityDisplay: `Room ${newRoom.name}`, after: newRoom });
    return newRoom;
};

export const updateRoom = async (roomId: string, update: Partial<Omit<HostelRoom, 'id' | 'floorId' | 'name'>>, actor: User): Promise<HostelRoom> => {
    await delay(400);
    const room = MOCK_ROOMS.find(r => r.id === roomId);
    if (!room) throw new Error("Room not found");

    const before = { ...room };
    Object.assign(room, update);
    
    // Adjust beds if capacity changes
    const currentBeds = MOCK_BEDS.filter(b => b.roomId === roomId);
    if (update.capacity !== undefined && update.capacity > currentBeds.length) {
        // Add beds
        const bedLetters = ['A', 'B', 'C', 'D', 'E', 'F', 'G', 'H'];
        for (let i = currentBeds.length; i < update.capacity; i++) {
            const newBed: Bed = { id: `B-${roomId}-${bedLetters[i]}`, roomId, name: bedLetters[i], status: 'Available' };
            MOCK_BEDS.push(newBed);
        }
    } else if (update.capacity !== undefined && update.capacity < currentBeds.length) {
        // Remove beds, but only available ones
        const bedsToRemove = currentBeds.length - update.capacity;
        const availableBeds = currentBeds.filter(b => b.status === 'Available');
        if (availableBeds.length < bedsToRemove) {
            throw new Error("Cannot reduce capacity, not enough available beds to remove.");
        }
        const bedsToDelete = availableBeds.slice(-bedsToRemove);
        MOCK_BEDS = MOCK_BEDS.filter(b => !bedsToDelete.some(bd => bd.id === b.id));
    }


    logAuditEvent({ actorId: actor.id, actorName: actor.name, action: 'UPDATE', module: 'HOSTEL', entityType: 'Room', entityId: roomId, entityDisplay: `Room ${room.name}`, before, after: room });
    return room;
};

export const deleteRoom = async (roomId: string, actor: User): Promise<void> => {
    await delay(600);
    const roomBeds = MOCK_BEDS.filter(b => b.roomId === roomId);
    const isOccupied = roomBeds.some(b => b.status === 'Occupied');

    if (isOccupied) {
        throw new Error("Cannot delete room with allocated students.");
    }
    
    const before = MOCK_ROOMS.find(r => r.id === roomId);
    MOCK_ROOMS = MOCK_ROOMS.filter(r => r.id !== roomId);
    MOCK_BEDS = MOCK_BEDS.filter(b => b.roomId !== roomId);
    
    logAuditEvent({ actorId: actor.id, actorName: actor.name, action: 'DELETE', module: 'HOSTEL', entityType: 'Room', entityId: roomId, entityDisplay: `Room ${before?.name}`, before });
};


// FIX: Update function to return all data required by the dashboard.
export const getDashboardStats = async () => {
    await delay(400);
    const totalBeds = MOCK_BEDS.length;
    const occupied = MOCK_ALLOCATIONS.filter(a => !a.checkOutDate).length;

    // Calculate occupancy by hostel
    const occupancyByHostel: { hostel: Hostel, occupied: number, capacity: number }[] = [];
    for (const hostel of MOCK_HOSTELS) {
        const floorsInHostel = MOCK_FLOORS.filter(f => f.hostelId === hostel.id).map(f => f.id);
        const roomsInHostel = MOCK_ROOMS.filter(r => floorsInHostel.includes(r.floorId));
        const capacity = roomsInHostel.reduce((sum, room) => sum + room.capacity, 0);
        
        const roomIds = roomsInHostel.map(r => r.id);
        const bedsInHostel = MOCK_BEDS.filter(b => roomIds.includes(b.roomId));
        const bedIds = bedsInHostel.map(b => b.id);
        const occupiedInHostel = MOCK_ALLOCATIONS.filter(a => !a.checkOutDate && bedIds.includes(a.bedId)).length;
        
        occupancyByHostel.push({ hostel, occupied: occupiedInHostel, capacity });
    }
    
    // Calculate curfew summary for today
    const today = getTodayDateString();
    const todayChecks = MOCK_CURFEW_CHECKS.filter(c => c.date === today);
    const absent = todayChecks.filter(c => c.status === 'Absent').length;
    const totalResidents = MOCK_ALLOCATIONS.filter(a => !a.checkOutDate).length; // simple way to get total residents

    // Calculate alerts
    let overCapacityCount = 0;
    occupancyByHostel.forEach(h => {
        if (h.occupied > h.capacity) {
            overCapacityCount++;
        }
    });
    const alerts = {
        overCapacity: overCapacityCount,
        blockedBeds: MOCK_BEDS.filter(b => b.status === 'Blocked').length
    };

    return {
        occupancyRate: totalBeds > 0 ? (occupied / totalBeds) * 100 : 0,
        availableBeds: MOCK_BEDS.filter(b => b.status === 'Available').length,
        visitorsIn: MOCK_VISITORS.filter(v => !v.timeOut).length,
        occupancyByHostel,
        curfewSummary: { date: today, absent, total: totalResidents },
        alerts,
    };
};

export const listAllocations = async () => {
    await delay(500);
    const { students } = await getStudents({ limit: 1000 });
    const studentMap = new Map(students.map(s => [s.id, s]));
    return MOCK_ALLOCATIONS.map(alloc => {
        const bed = MOCK_BEDS.find(b => b.id === alloc.bedId)!;
        const room = MOCK_ROOMS.find(r => r.id === bed.roomId)!;
        const floor = MOCK_FLOORS.find(f => f.id === room.floorId)!;
        const hostel = MOCK_HOSTELS.find(h => h.id === floor.hostelId)!;
        return {
            ...alloc,
            studentName: studentMap.get(alloc.studentId)?.name || 'Unknown',
            hostelName: hostel.name,
            roomName: room.name,
            bedName: bed.name,
        };
    });
};

export const getAvailableBeds = async () => {
    await delay(300);
    return MOCK_BEDS.filter(b => b.status === 'Available');
};

export const createAllocation = async (studentId: string, bedId: string, actor: User) => {
    await delay(600);
    const newAllocation: Allocation = {
        id: `A-${Date.now()}`,
        studentId, bedId,
        checkInDate: getTodayDateString(),
    };
    MOCK_ALLOCATIONS.push(newAllocation);
    const bed = MOCK_BEDS.find(b => b.id === bedId)!;
    bed.status = 'Occupied';
};

export const checkoutStudent = async (allocationId: string, actor: User) => {
    await delay(500);
    const alloc = MOCK_ALLOCATIONS.find(a => a.id === allocationId);
    if (alloc) {
        alloc.checkOutDate = getTodayDateString();
        const bed = MOCK_BEDS.find(b => b.id === alloc.bedId);
        if (bed) bed.status = 'Available';
    }
};

export const listHostelVisitors = async () => {
    await delay(400);
    const { students } = await getStudents({ limit: 1000 });
    const studentMap = new Map(students.map(s => [s.id, s.name]));
    return MOCK_VISITORS.map(v => ({
        ...v,
        studentName: studentMap.get(v.studentId) || 'Unknown',
    })).sort((a,b) => b.timeIn.localeCompare(a.timeIn));
};

export const createVisitor = async (visitor: Omit<HostelVisitor, 'id'>, actor: User) => {
    await delay(500);
    const newVisitor: HostelVisitor = { ...visitor, id: `HV-${Date.now()}` };
    MOCK_VISITORS.unshift(newVisitor);
};

export const signOutVisitor = async (visitorId: string, actor: User) => {
    await delay(300);
    const visitor = MOCK_VISITORS.find(v => v.id === visitorId);
    if (visitor) {
        visitor.timeOut = new Date().toISOString();
    }
};

export const listCurfewChecks = async (date: string) => {
    await delay(200);
    return MOCK_CURFEW_CHECKS.filter(c => c.date === date);
};

export const saveCurfewChecks = async (checks: Omit<CurfewCheck, 'id'>[], actor: User) => {
    await delay(700);
    // Remove old checks for this date
    const date = checks[0]?.date;
    if (date) {
        MOCK_CURFEW_CHECKS = MOCK_CURFEW_CHECKS.filter(c => c.date !== date);
    }
    // Add new checks
    const newChecks = checks.map(c => ({...c, id: `CC-${c.studentId}-${c.date}`}));
    MOCK_CURFEW_CHECKS.push(...newChecks);
};

export const listCurfewExceptions = async (): Promise<CurfewException[]> => {
    await delay(300);
    return [...MOCK_CURFEW_EXCEPTIONS];
};

export const createCurfewException = async (exception: Omit<CurfewException, 'id'>, actor: User): Promise<CurfewException> => {
    await delay(500);
    const newException: CurfewException = { ...exception, id: `CE-${Date.now()}` };
    MOCK_CURFEW_EXCEPTIONS.push(newException);
    logAuditEvent({
        actorId: actor.id,
        actorName: actor.name,
        action: 'CREATE',
        module: 'HOSTEL',
        entityType: 'CurfewException',
        entityId: newException.id,
        entityDisplay: `Exception for student ${exception.studentId}`,
        after: newException
    });
    return newException;
};

export const deleteCurfewException = async (exceptionId: string, actor: User): Promise<void> => {
    await delay(400);
    const index = MOCK_CURFEW_EXCEPTIONS.findIndex(e => e.id === exceptionId);
    if (index > -1) {
        const deleted = MOCK_CURFEW_EXCEPTIONS.splice(index, 1);
        logAuditEvent({
            actorId: actor.id,
            actorName: actor.name,
            action: 'DELETE',
            module: 'HOSTEL',
            entityType: 'CurfewException',
            entityId: exceptionId,
            entityDisplay: `Exception for student ${deleted[0].studentId}`,
            before: deleted[0]
        });
    }
};

export const getOccupancyReport = async () => {
    await delay(600);
    const report: { hostelId: string, name: string, capacity: number, occupied: number }[] = [];
    for (const hostel of MOCK_HOSTELS) {
        const floorsInHostel = MOCK_FLOORS.filter(f => f.hostelId === hostel.id).map(f => f.id);
        const roomsInHostel = MOCK_ROOMS.filter(r => floorsInHostel.includes(r.floorId));
        const capacity = roomsInHostel.reduce((sum, room) => sum + room.capacity, 0);
        
        const roomIds = roomsInHostel.map(r => r.id);
        const bedsInHostel = MOCK_BEDS.filter(b => roomIds.includes(b.roomId));
        const bedIds = bedsInHostel.map(b => b.id);
        const occupied = MOCK_ALLOCATIONS.filter(a => !a.checkOutDate && bedIds.includes(a.bedId)).length;
        
        report.push({ hostelId: hostel.id, name: hostel.name, capacity, occupied });
    }
    return report;
};

export const getAllocationForStudent = async (studentId: string): Promise<{ allocation: Allocation, room: HostelRoom, bed: Bed, hostel: Hostel } | null> => {
    await delay(300);
    const allocation = MOCK_ALLOCATIONS.find(a => a.studentId === studentId && !a.checkOutDate);
    if (!allocation) return null;

    const bed = MOCK_BEDS.find(b => b.id === allocation.bedId)!;
    const room = MOCK_ROOMS.find(r => r.id === bed.roomId)!;
    const floor = MOCK_FLOORS.find(f => f.id === room.floorId)!;
    const hostel = MOCK_HOSTELS.find(h => h.id === floor.hostelId)!;
    
    return { allocation, bed, room, hostel };
};

// FIX: Add getPolicies function
export const getPolicies = async (): Promise<HostelPolicy> => {
    await delay(200);
    return { ...MOCK_POLICY };
};

// FIX: Add updatePolicies function
export const updatePolicies = async (policy: HostelPolicy, actor: User): Promise<void> => {
    await delay(500);
    const before = { ...MOCK_POLICY };
    MOCK_POLICY = policy;
    logAuditEvent({
        actorId: actor.id,
        actorName: actor.name,
        action: 'UPDATE',
        module: 'HOSTEL',
        entityType: 'Policy',
        entityId: 'hostel-policy',
        entityDisplay: 'Hostel Policies',
        before,
        after: policy
    });
};
