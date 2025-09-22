
import type { Hostel, HostelType, Room, Bed, BedStatus, User, HostelDashboardSummary, Allocation, AllocationStatus, HostelVisitor, Curfew, CurfewRecord, CurfewSettings, CurfewStatus, Student, HostelSettings } from '../types';
import { getStudents } from './schoolService';
import { logAuditEvent } from './auditService';

// --- MOCK DATA STORE ---
let MOCK_HOSTELS: Hostel[] = [
    { id: 'h-1', name: 'Eagle House', type: 'Boys', wardenId: 't-1' },
    { id: 'h-2', name: 'Phoenix House', type: 'Girls', wardenId: 't-2' },
];

let MOCK_ROOMS: Room[] = [
    { id: 'r-1', hostelId: 'h-1', roomNumber: '101', capacity: 4, floor: '1' },
    { id: 'r-2', hostelId: 'h-1', roomNumber: '102', capacity: 4, floor: '1' },
    { id: 'r-3', hostelId: 'h-2', roomNumber: 'G01', capacity: 3, floor: 'Ground' },
    { id: 'r-4', hostelId: 'h-2', roomNumber: 'G02', capacity: 3, floor: 'Ground' },
];

let MOCK_BEDS: Bed[] = [
    // Room 101
    { id: 'b-1', roomId: 'r-1', bedIdentifier: 'A', status: 'Occupied' }, // Allocated to s02
    { id: 'b-2', roomId: 'r-1', bedIdentifier: 'B', status: 'Available' },
    { id: 'b-3', roomId: 'r-1', bedIdentifier: 'C', status: 'Blocked' },
    { id: 'b-4', roomId: 'r-1', bedIdentifier: 'D', status: 'Available' },
    // Room 102
    { id: 'b-5', roomId: 'r-2', bedIdentifier: 'A', status: 'Available' },
    { id: 'b-6', roomId: 'r-2', bedIdentifier: 'B', status: 'Available' },
    { id: 'b-7', roomId: 'r-2', bedIdentifier: 'C', status: 'Available' },
    { id: 'b-8', roomId: 'r-2', bedIdentifier: 'D', status: 'Available' },
    // Room G01
    { id: 'b-9', roomId: 'r-3', bedIdentifier: '1', status: 'Occupied' }, // Allocated to s01
    { id: 'b-10', roomId: 'r-3', bedIdentifier: '2', status: 'Occupied' }, // Allocated to s04
    { id: 'b-11', roomId: 'r-3', bedIdentifier: '3', status: 'Available' },
];

let MOCK_ALLOCATIONS: Allocation[] = [
    { id: 'alloc-1', studentId: 's01', bedId: 'b-9', roomId: 'r-3', hostelId: 'h-2', status: 'CheckedIn', checkInDate: '2025-08-20' },
    { id: 'alloc-2', studentId: 's02', bedId: 'b-1', roomId: 'r-1', hostelId: 'h-1', status: 'CheckedIn', checkInDate: '2025-08-20' },
    { id: 'alloc-3', studentId: 's04', bedId: 'b-10', roomId: 'r-3', hostelId: 'h-2', status: 'CheckedIn', checkInDate: '2025-08-20' },
    { id: 'alloc-4', studentId: 's05', bedId: 'b-5', roomId: 'r-2', hostelId: 'h-1', status: 'Scheduled', checkInDate: '2025-09-01' },
];

let MOCK_HOSTEL_VISITORS: HostelVisitor[] = [
    { id: 'hv-1', visitorName: 'Jane Johnson', studentId: 's01', relation: 'Mother', idChecked: true, timeIn: new Date(Date.now() - 60 * 60 * 1000).toISOString() }, // 1 hour ago
    { id: 'hv-2', visitorName: 'Mark Williams', studentId: 's02', relation: 'Father', idChecked: true, timeIn: new Date(Date.now() - 5 * 60 * 60 * 1000).toISOString() }, // 5 hours ago - overstay
    { id: 'hv-3', visitorName: 'Chris Brown', studentId: 's02', relation: 'Friend', idChecked: false, timeIn: new Date(Date.now() - 120 * 60 * 1000).toISOString(), timeOut: new Date(Date.now() - 90 * 60 * 1000).toISOString() }, // Past visit
];

let MOCK_CURFEWS: Curfew[] = [];
let MOCK_CURFEW_RECORDS: CurfewRecord[] = [];
let MOCK_CURFEW_SETTINGS: CurfewSettings = { alertsEnabled: true };

let MOCK_HOSTEL_SETTINGS: HostelSettings = {
    curfewTime: '22:00',
    lateThresholdMin: 15,
    genderRule: 'Enforce',
    maxVisitorsPerDay: 2,
    idRequiredForVisitors: true,
};


export interface RoomWithBeds extends Room {
    beds: Bed[];
}
export interface HostelWithRoomsAndBeds extends Hostel {
    rooms: RoomWithBeds[];
}


// --- MOCK API ---
const delay = (ms: number) => new Promise(res => setTimeout(res, ms));

export const listHostelsWithRoomsAndBeds = async (): Promise<HostelWithRoomsAndBeds[]> => {
    await delay(500);
    return MOCK_HOSTELS.map(hostel => ({
        ...hostel,
        rooms: MOCK_ROOMS
            .filter(room => room.hostelId === hostel.id)
            .map(room => ({
                ...room,
                beds: MOCK_BEDS.filter(bed => bed.roomId === room.id),
            })),
    }));
};

export const createHostel = async (input: Omit<Hostel, 'id'>, actor: User): Promise<Hostel> => {
    await delay(400);
    const newHostel: Hostel = { ...input, id: `h-${Date.now()}` };
    MOCK_HOSTELS.push(newHostel);
    logAuditEvent({ actorId: actor.id, actorName: actor.name, action: 'CREATE', module: 'HOSTEL', entityType: 'Hostel', entityId: newHostel.id, entityDisplay: newHostel.name });
    return newHostel;
};

export const createRoom = async (input: Omit<Room, 'id'>, actor: User): Promise<Room> => {
    await delay(600);
    const newRoom: Room = { ...input, id: `r-${Date.now()}` };
    MOCK_ROOMS.push(newRoom);
    logAuditEvent({ actorId: actor.id, actorName: actor.name, action: 'CREATE', module: 'HOSTEL', entityType: 'Room', entityId: newRoom.id, entityDisplay: `Room ${newRoom.roomNumber}` });
    
    // Auto-generate beds
    for (let i = 0; i < newRoom.capacity; i++) {
        const newBed: Bed = {
            id: `b-${Date.now()}-${i}`,
            roomId: newRoom.id,
            bedIdentifier: String.fromCharCode(65 + i), // A, B, C...
            status: 'Available',
        };
        MOCK_BEDS.push(newBed);
    }

    return newRoom;
};

export const updateBedStatus = async (bedId: string, status: BedStatus, actor: User): Promise<Bed> => {
    await delay(300);
    const bed = MOCK_BEDS.find(b => b.id === bedId);
    if (!bed) throw new Error("Bed not found");
    const before = { ...bed };
    bed.status = status;
    logAuditEvent({ actorId: actor.id, actorName: actor.name, action: 'UPDATE', module: 'HOSTEL', entityType: 'Bed', entityId: bed.id, entityDisplay: `Bed ${bed.bedIdentifier}`, before, after: bed });
    return bed;
};

export const getHostelDashboardSummary = async (): Promise<HostelDashboardSummary> => {
    await delay(600);

    const summary: HostelDashboardSummary = {
        kpis: { totalCapacity: 0, totalOccupied: 0, occupancyRate: 0, totalAvailable: 0 },
        occupancyByHostel: [],
        alerts: { overcapacityRooms: [], totalBlockedBeds: 0 },
    };

    const roomMap = new Map(MOCK_ROOMS.map(r => [r.id, r]));

    summary.alerts.totalBlockedBeds = MOCK_BEDS.filter(b => b.status === 'Blocked').length;

    for (const hostel of MOCK_HOSTELS) {
        const hostelRooms = MOCK_ROOMS.filter(r => r.hostelId === hostel.id);
        let capacity = 0;
        let occupied = 0;
        let available = 0;
        let blocked = 0;

        for (const room of hostelRooms) {
            capacity += room.capacity;
            const roomBeds = MOCK_BEDS.filter(b => b.roomId === room.id);
            const roomOccupied = roomBeds.filter(b => b.status === 'Occupied').length;

            if (roomOccupied > room.capacity) {
                summary.alerts.overcapacityRooms.push({
                    roomNumber: room.roomNumber,
                    hostelName: hostel.name,
                    capacity: room.capacity,
                    occupied: roomOccupied,
                });
            }

            occupied += roomOccupied;
            available += roomBeds.filter(b => b.status === 'Available').length;
            blocked += roomBeds.filter(b => b.status === 'Blocked').length;
        }
        
        summary.occupancyByHostel.push({ id: hostel.id, name: hostel.name, type: hostel.type, capacity, occupied, available, blocked });
        summary.kpis.totalCapacity += capacity;
        summary.kpis.totalOccupied += occupied;
        summary.kpis.totalAvailable += available;
    }

    if (summary.kpis.totalCapacity > 0) {
        summary.kpis.occupancyRate = (summary.kpis.totalOccupied / summary.kpis.totalCapacity) * 100;
    }

    return summary;
};

// --- Allocations API ---

export const listAllocations = async (): Promise<Allocation[]> => {
    await delay(400);
    return [...MOCK_ALLOCATIONS];
};

export const getUnallocatedStudents = async () => {
    await delay(300);
    const { students } = await getStudents({ limit: 1000 });
    const allocatedStudentIds = new Set(
        MOCK_ALLOCATIONS.filter(a => a.status !== 'CheckedOut').map(a => a.studentId)
    );
    return students.filter(s => !allocatedStudentIds.has(s.id));
};

export const createAllocation = async (input: Omit<Allocation, 'id'|'status'|'roomId'|'hostelId'>, actor: User): Promise<Allocation> => {
    await delay(700);
    const { studentId, bedId, checkInDate } = input;
    
    const student = (await getStudents({ limit: 1000 })).students.find(s => s.id === studentId);
    const bed = MOCK_BEDS.find(b => b.id === bedId);
    if (!student || !bed) throw new Error("Student or bed not found.");

    const room = MOCK_ROOMS.find(r => r.id === bed.roomId);
    if (!room) throw new Error("Room not found.");
    const hostel = MOCK_HOSTELS.find(h => h.id === room.hostelId);
    if (!hostel) throw new Error("Hostel not found.");

    // Gender check with policy
    if ((student.gender === 'Male' && hostel.type === 'Girls') || (student.gender === 'Female' && hostel.type === 'Boys')) {
        if (MOCK_HOSTEL_SETTINGS.genderRule === 'Enforce') {
            throw new Error(`Policy Violation: Cannot assign ${student.gender.toLowerCase()} student to a ${hostel.type.toLowerCase()} hostel.`);
        }
    }

    if (MOCK_ALLOCATIONS.some(a => a.studentId === studentId && a.status !== 'CheckedOut')) {
         throw new Error("Policy Violation: Student already has an active or scheduled allocation.");
    }

    const today = new Date().toISOString().split('T')[0];
    const status: AllocationStatus = checkInDate <= today ? 'CheckedIn' : 'Scheduled';

    const newAllocation: Allocation = {
        ...input,
        id: `alloc-${Date.now()}`,
        status,
        roomId: room.id,
        hostelId: hostel.id,
    };
    MOCK_ALLOCATIONS.push(newAllocation);

    if (status === 'CheckedIn') {
        await updateBedStatus(bedId, 'Occupied', actor);
    }
    
    logAuditEvent({ actorId: actor.id, actorName: actor.name, action: 'CREATE', module: 'HOSTEL', entityType: 'Allocation', entityId: newAllocation.id, entityDisplay: `Allocation for ${student.name}`, after: newAllocation });

    return newAllocation;
};

export const checkOut = async (allocationId: string, reason: string, notes: string, actor: User): Promise<Allocation> => {
    await delay(500);
    const alloc = MOCK_ALLOCATIONS.find(a => a.id === allocationId);
    if (!alloc || alloc.status === 'CheckedOut') throw new Error("Invalid allocation for checkout.");

    const before = { ...alloc };
    alloc.status = 'CheckedOut';
    alloc.checkOutDate = new Date().toISOString().split('T')[0];
    alloc.checkOutReason = reason;
    alloc.depositNotes = notes;

    await updateBedStatus(alloc.bedId, 'Available', actor);

    logAuditEvent({ actorId: actor.id, actorName: actor.name, action: 'UPDATE', module: 'HOSTEL', entityType: 'Allocation', entityId: alloc.id, entityDisplay: `Checkout for allocation ${alloc.id}`, before, after: alloc, meta: { reason, notes } });

    return alloc;
};

// --- Visitors API ---

export const listHostelVisitors = async (): Promise<HostelVisitor[]> => {
    await delay(400);
    const now = Date.now();
    const OVERSTAY_HOURS = 4;
    return [...MOCK_HOSTEL_VISITORS].map(v => ({
        ...v,
        isOverstay: !v.timeOut && (now - new Date(v.timeIn).getTime() > OVERSTAY_HOURS * 60 * 60 * 1000),
    })).sort((a,b) => b.timeIn.localeCompare(a.timeIn));
};

export const listBoarders = async (): Promise<Student[]> => {
    await delay(200);
    const { students } = await getStudents({ limit: 1000 });
    const boarderIds = new Set(MOCK_ALLOCATIONS.filter(a => a.status === 'CheckedIn').map(a => a.studentId));
    return students.filter(s => boarderIds.has(s.id));
};

export const checkInHostelVisitor = async (input: Omit<HostelVisitor, 'id' | 'timeIn'>, actor: User): Promise<HostelVisitor> => {
    await delay(500);
    const { studentId, idChecked } = input;
    
    if (MOCK_HOSTEL_SETTINGS.idRequiredForVisitors && !idChecked) {
        throw new Error("Policy Violation: Photo ID must be checked for all visitors.");
    }
    
    const today = new Date().toISOString().split('T')[0];
    const todaysVisitorsForStudent = MOCK_HOSTEL_VISITORS.filter(v => v.studentId === studentId && v.timeIn.startsWith(today)).length;
    
    if (todaysVisitorsForStudent >= MOCK_HOSTEL_SETTINGS.maxVisitorsPerDay) {
        throw new Error(`Policy Violation: Student has reached the maximum of ${MOCK_HOSTEL_SETTINGS.maxVisitorsPerDay} visitors for today.`);
    }

    const newVisitor: HostelVisitor = {
        ...input,
        id: `hv-${Date.now()}`,
        timeIn: new Date().toISOString(),
    };
    MOCK_HOSTEL_VISITORS.unshift(newVisitor);
    logAuditEvent({ actorId: actor.id, actorName: actor.name, action: 'CREATE', module: 'HOSTEL', entityType: 'VisitorLog', entityId: newVisitor.id, entityDisplay: newVisitor.visitorName, after: newVisitor });
    return newVisitor;
};

export const checkOutHostelVisitor = async (visitorId: string, actor: User): Promise<HostelVisitor> => {
    await delay(400);
    const visitor = MOCK_HOSTEL_VISITORS.find(v => v.id === visitorId);
    if (!visitor) throw new Error("Visitor not found.");
    const before = { ...visitor };
    visitor.timeOut = new Date().toISOString();
    logAuditEvent({ actorId: actor.id, actorName: actor.name, action: 'UPDATE', module: 'HOSTEL', entityType: 'VisitorLog', entityId: visitor.id, entityDisplay: visitor.visitorName, before, after: visitor, meta: { action: 'CheckOut' } });
    return visitor;
};

// --- Curfew API ---

export const getCurfewDataForDate = async (date: string): Promise<{ curfew: Curfew; records: CurfewRecord[] }> => {
    await delay(400);
    let curfew = MOCK_CURFEWS.find(c => c.date === date);
    if (!curfew) {
        curfew = { id: `curfew-${date}`, date, time: MOCK_HOSTEL_SETTINGS.curfewTime };
        MOCK_CURFEWS.push(curfew);
    }
    const records = MOCK_CURFEW_RECORDS.filter(r => r.curfewId === curfew!.id);
    return { curfew, records };
};

export const setCurfewTime = async (date: string, time: string, actor: User): Promise<Curfew> => {
    await delay(300);
    let curfew = MOCK_CURFEWS.find(c => c.date === date);
    if (curfew) {
        curfew.time = time;
    } else {
        curfew = { id: `curfew-${date}`, date, time };
        MOCK_CURFEWS.push(curfew);
    }
    logAuditEvent({ actorId: actor.id, actorName: actor.name, action: 'UPDATE', module: 'HOSTEL', entityType: 'Curfew', entityId: curfew.id, entityDisplay: `Curfew for ${date}` });
    return curfew;
};

export const saveCurfewRecords = async (curfewId: string, records: Omit<CurfewRecord, 'id' | 'curfewId'>[], actor: User): Promise<void> => {
    await delay(800);
    records.forEach(newRecord => {
        const existingIndex = MOCK_CURFEW_RECORDS.findIndex(r => r.curfewId === curfewId && r.studentId === newRecord.studentId);
        if (existingIndex > -1) {
            MOCK_CURFEW_RECORDS[existingIndex] = { ...MOCK_CURFEW_RECORDS[existingIndex], ...newRecord };
        } else {
            MOCK_CURFEW_RECORDS.push({ id: `cr-${Date.now()}-${newRecord.studentId}`, curfewId, ...newRecord });
        }
    });
    logAuditEvent({ actorId: actor.id, actorName: actor.name, action: 'UPDATE', module: 'HOSTEL', entityType: 'CurfewSheet', entityId: curfewId, entityDisplay: `Curfew Records for ${curfewId}`, meta: { count: records.length } });
};

export const getCurfewSettings = async (): Promise<CurfewSettings> => {
    await delay(200);
    return { ...MOCK_CURFEW_SETTINGS };
};

export const updateCurfewSettings = async (settings: CurfewSettings, actor: User): Promise<void> => {
    await delay(400);
    MOCK_CURFEW_SETTINGS = { ...settings };
    logAuditEvent({ actorId: actor.id, actorName: actor.name, action: 'UPDATE', module: 'HOSTEL', entityType: 'Settings', entityId: 'curfew-settings', entityDisplay: 'Curfew Settings', after: settings });
};

export const sendCurfewAlert = async (studentId: string, status: 'Late' | 'Absent', actor: User): Promise<void> => {
    await delay(600);
    logAuditEvent({ actorId: actor.id, actorName: actor.name, action: 'NOTIFY', module: 'HOSTEL', entityType: 'Student', entityId: studentId, entityDisplay: `Curfew Alert for ${studentId}`, meta: { curfewStatus: status } });
};

// --- Settings & Portal API ---

export const getHostelSettings = async (): Promise<HostelSettings> => {
    await delay(200);
    return JSON.parse(JSON.stringify(MOCK_HOSTEL_SETTINGS));
};

export const updateHostelSettings = async (settings: HostelSettings, actor: User): Promise<void> => {
    await delay(500);
    const before = { ...MOCK_HOSTEL_SETTINGS };
    MOCK_HOSTEL_SETTINGS = settings;
    logAuditEvent({ actorId: actor.id, actorName: actor.name, action: 'UPDATE', module: 'HOSTEL', entityType: 'Settings', entityId: 'hostel-settings', entityDisplay: 'Hostel Policies', before, after: settings });
};

export const getAllocationForStudent = async (studentId: string): Promise<(Allocation & { hostel: Hostel, room: Room, bed: Bed }) | null> => {
    await delay(300);
    const allocation = MOCK_ALLOCATIONS.find(a => a.studentId === studentId && a.status === 'CheckedIn');
    if (!allocation) return null;

    const hostel = MOCK_HOSTELS.find(h => h.id === allocation.hostelId);
    const room = MOCK_ROOMS.find(r => r.id === allocation.roomId);
    const bed = MOCK_BEDS.find(b => b.id === allocation.bedId);

    if (!hostel || !room || !bed) return null;

    return { ...allocation, hostel, room, bed };
};
