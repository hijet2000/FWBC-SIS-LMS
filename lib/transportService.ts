import type { Vehicle, Driver, TransportRoute, Trip, EligibleStudent, BoardingEvent, AlertSettings, TripStatus, BoardingDirection } from '../types';

// --- MOCK DATA STORE ---
const getTodayDateString = () => new Date().toISOString().split('T')[0];

let MOCK_VEHICLES: Vehicle[] = [
    { id: 'v1', regNo: 'BUS-001', make: 'Mercedes', model: 'Sprinter', capacity: 22, active: true, notes: 'Primary route vehicle.' },
    { id: 'v2', regNo: 'BUS-002', make: 'Ford', model: 'Transit', capacity: 18, active: true },
    { id: 'v3', regNo: 'BUS-003', make: 'Toyota', model: 'Coaster', capacity: 30, active: true },
    { id: 'v4', regNo: 'VAN-001', make: 'VW', model: 'Transporter', capacity: 8, active: false, notes: 'Maintenance' },
    { id: 'v5', regNo: 'BUS-004', make: 'Iveco', model: 'Daily', capacity: 25, active: true },
    { id: 'v6', regNo: 'BUS-005', make: 'Ford', model: 'Transit', capacity: 18, active: true },
];

let MOCK_DRIVERS: Driver[] = [
    { id: 'd1', name: 'John Smith', phone: '555-1111', licenseNo: 'S1234567A', active: true },
    { id: 'd2', name: 'Maria Garcia', phone: '555-2222', licenseNo: 'G7654321B', active: true },
    { id: 'd3', name: 'Chen Wei', phone: '555-3333', licenseNo: 'C1122334D', active: true },
    { id: 'd4', name: 'David Wilson', phone: '555-4444', licenseNo: 'W5566778E', active: false },
    { id: 'd5', name: 'Aisha Khan', phone: '555-5555', licenseNo: 'K9988776F', active: true },
];

let MOCK_ROUTES: TransportRoute[] = [
    { id: 'r1', name: 'North Route', stops: [ { id: 's1', label: 'Maple Creek' }, { id: 's2', label: 'Willow Valley' }, { id: 's3', label: 'Oak Ridge' }] },
    { id: 'r2', name: 'South Route', stops: [ { id: 's4', label: 'Pine Harbor' }, { id: 's5', label: 'Cedar Lane' }, { id: 's6', label: 'Elm Court' }] },
    { id: 'r3', name: 'Express Route', stops: [ { id: 's7', label: 'Central Station' }, { id: 's8', label: 'FWBC Campus' }] },
];

// Let's use some student IDs from schoolService
const MOCK_STUDENTS_ON_TRANSPORT: Partial<EligibleStudent>[] = [
    { id: 's01', transportRouteId: 'r1', pickupStopId: 's1', dropoffStopId: 's1', guardianPhone: '555-0101' },
    { id: 's02', transportRouteId: 'r1', pickupStopId: 's2', dropoffStopId: 's2', guardianPhone: '555-0102' },
    { id: 's06', transportRouteId: 'r1', pickupStopId: 's3', dropoffStopId: 's3', guardianPhone: '555-0106' },
    { id: 's15', transportRouteId: 'r2', pickupStopId: 's4', dropoffStopId: 's4', guardianPhone: '555-0115' },
    { id: 's16', transportRouteId: 'r2', pickupStopId: 's5', dropoffStopId: 's5', guardianPhone: '555-0116' },
    { id: 's11', transportRouteId: 'r3', pickupStopId: 's7', dropoffStopId: 's7', guardianPhone: '555-0111' },
];

let MOCK_TRIPS: Trip[] = [
    { id: 'trip1', date: getTodayDateString(), vehicleId: 'v1', driverId: 'd1', routeId: 'r1', startTime: '07:30', status: 'In Progress' },
    { id: 'trip2', date: getTodayDateString(), vehicleId: 'v2', driverId: 'd2', routeId: 'r2', startTime: '07:45', status: 'Planned' },
    { id: 'trip3', date: getTodayDateString(), vehicleId: 'v3', driverId: 'd3', routeId: 'r3', status: 'Planned' },
    { id: 'trip4', date: '2025-09-01', vehicleId: 'v5', driverId: 'd5', routeId: 'r1', status: 'Completed', startTime: '07:30', endTime: '08:15' },
];

let MOCK_BOARDING_EVENTS: BoardingEvent[] = [];

let MOCK_ALERT_SETTINGS: AlertSettings = { enabled: true, onPickup: true, onDropoff: false };

// --- MOCK API ---
const delay = (ms: number) => new Promise(res => setTimeout(res, ms));

// Vehicles
export const listVehicles = async (siteId: string): Promise<Vehicle[]> => { await delay(300); return [...MOCK_VEHICLES]; };
export const createVehicle = async (siteId: string, input: Omit<Vehicle, 'id'>): Promise<{ id: string }> => {
    await delay(500);
    const newVehicle: Vehicle = { ...input, id: `v${Date.now()}` };
    MOCK_VEHICLES.push(newVehicle);
    return { id: newVehicle.id };
};
export const updateVehicle = async (siteId: string, id: string, input: Partial<Omit<Vehicle, 'id'>>): Promise<void> => {
    await delay(500);
    const index = MOCK_VEHICLES.findIndex(v => v.id === id);
    if (index !== -1) MOCK_VEHICLES[index] = { ...MOCK_VEHICLES[index], ...input };
};
export const toggleVehicle = async (siteId: string, id: string, active: boolean): Promise<void> => updateVehicle(siteId, id, { active });

// Drivers & Routes
export const listDrivers = async (siteId: string): Promise<Driver[]> => { await delay(200); return [...MOCK_DRIVERS]; };
export const listRoutes = async (siteId: string): Promise<TransportRoute[]> => { await delay(250); return [...MOCK_ROUTES]; };

// Trips
export const listTrips = async (siteId: string, params?: { date?: string }): Promise<Trip[]> => {
    await delay(400);
    if (params?.date) return MOCK_TRIPS.filter(t => t.date === params.date);
    return [...MOCK_TRIPS];
};
export const createTrip = async (siteId: string, input: Omit<Trip, 'id' | 'status'>): Promise<{ id: string }> => {
    await delay(500);
    const newTrip: Trip = { ...input, id: `trip${Date.now()}`, status: 'Planned' };
    MOCK_TRIPS.push(newTrip);
    return { id: newTrip.id };
};
export const updateTrip = async (siteId: string, id: string, input: Partial<Omit<Trip, 'id'>>): Promise<void> => {
    await delay(500);
    const index = MOCK_TRIPS.findIndex(t => t.id === id);
    if (index !== -1) MOCK_TRIPS[index] = { ...MOCK_TRIPS[index], ...input };
};

// Students & Boarding
export const listEligibleStudents = async (siteId: string): Promise<Partial<EligibleStudent>[]> => { await delay(300); return MOCK_STUDENTS_ON_TRANSPORT; };

export const logBoarding = async (siteId: string, input: { tripId: string; studentId: string; direction: BoardingDirection; timestampISO: string; deviceId?: string }): Promise<{ id: string }> => {
    await delay(200);
    const newEvent: BoardingEvent = { ...input, id: `be${Date.now()}`, alertSent: false };
    MOCK_BOARDING_EVENTS.push(newEvent);
    return { id: newEvent.id };
};

export const listBoardingEvents = async (siteId: string, params: { tripId?: string; studentId?: string; date?: string }): Promise<BoardingEvent[]> => {
    await delay(300);
    let results = [...MOCK_BOARDING_EVENTS];
    if (params.tripId) results = results.filter(e => e.tripId === params.tripId);
    if (params.studentId) results = results.filter(e => e.studentId === params.studentId);
    if (params.date) results = results.filter(e => e.timestampISO.startsWith(params.date!));
    return results.sort((a,b) => b.timestampISO.localeCompare(a.timestampISO));
};

// Notifications
export const getAlertSettings = async (siteId: string): Promise<AlertSettings> => { await delay(150); return { ...MOCK_ALERT_SETTINGS }; };
export const updateAlertSettings = async (siteId: string, settings: AlertSettings): Promise<void> => {
    await delay(400);
    MOCK_ALERT_SETTINGS = settings;
};
export const sendParentAlert = async (siteId: string, input: { studentId: string; tripId: string; direction: BoardingDirection; timestampISO: string }): Promise<{ ok: boolean }> => {
    await delay(600);
    const student = MOCK_STUDENTS_ON_TRANSPORT.find(s => s.id === input.studentId);
    console.log(`%c[MOCK ALERT] Sending ${input.direction} alert to guardian of student ${input.studentId} (phone: ${student?.guardianPhone}) at ${input.timestampISO}`, "color: blue; font-weight: bold;");
    const eventIndex = MOCK_BOARDING_EVENTS.findIndex(e => e.studentId === input.studentId && e.tripId === input.tripId && e.timestampISO === input.timestampISO);
    if (eventIndex !== -1) MOCK_BOARDING_EVENTS[eventIndex].alertSent = true;
    return { ok: true };
};
