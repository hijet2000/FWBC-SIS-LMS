
import React, { useState, useEffect, useMemo, useCallback } from 'react';
import type { Trip, Vehicle, Driver, TransportRoute, BoardingEvent, AlertSettings, EligibleStudent, BoardingDirection } from '../../types';
import * as transportService from '../../lib/transportService';
import { getStudents } from '../../lib/schoolService';
import Toast from '../../components/ui/Toast';

const getTodayDateString = () => new Date().toISOString().split('T')[0];

const BoardingPage: React.FC = () => {
    const [date, setDate] = useState(getTodayDateString());
    const [selectedTripId, setSelectedTripId] = useState<string | null>(null);

    // Data
    const [trips, setTrips] = useState<Trip[]>([]);
    const [vehicles, setVehicles] = useState<Vehicle[]>([]);
    const [drivers, setDrivers] = useState<Driver[]>([]);
    const [routes, setRoutes] = useState<TransportRoute[]>([]);
    const [students, setStudents] = useState<EligibleStudent[]>([]);
    const [boardingEvents, setBoardingEvents] = useState<BoardingEvent[]>([]);
    const [alertSettings, setAlertSettings] = useState<AlertSettings | null>(null);

    // UI
    const [loading, setLoading] = useState({ trips: true, events: false, settings: true });
    const [error, setError] = useState<string | null>(null);
    const [toast, setToast] = useState<{ message: string, type: 'success' | 'error' | 'warning' } | null>(null);
    const [studentIdentifier, setStudentIdentifier] = useState('');
    const [isProcessing, setIsProcessing] = useState(false);
    
    // Fetch initial static data
    useEffect(() => {
        const fetchStaticData = async () => {
            try {
                const [vehiclesData, driversData, routesData, studentsData, eligibleStudentsData] = await Promise.all([
                    transportService.listVehicles('site_123'),
                    transportService.listDrivers('site_123'),
                    transportService.listRoutes('site_123'),
                    getStudents({ limit: 1000 }),
                    transportService.listEligibleStudents('site_123'),
                ]);
                setVehicles(vehiclesData);
                setDrivers(driversData);
                setRoutes(routesData);
                
                const eligibleMap = new Map(eligibleStudentsData.map(s => [s.id, s]));
                // FIX: Add a fallback empty object for the spread operator to prevent errors if a student is not in the eligible map.
                const enrichedStudents = studentsData.students.map(s => ({
                    ...s,
                    ...(eligibleMap.get(s.id) || {}),
                }));
                setStudents(enrichedStudents as EligibleStudent[]);
                
            } catch {
                setError('Failed to load essential data.');
            }
        };
        fetchStaticData();
    }, []);

    // Fetch trips when date changes
    useEffect(() => {
        setLoading(p => ({ ...p, trips: true }));
        setSelectedTripId(null);
        transportService.listTrips('site_123', { date })
            .then(data => {
                setTrips(data.filter(t => t.status === 'In Progress' || t.status === 'Planned'));
            })
            .catch(() => setToast({ message: 'Could not load trips for selected date.', type: 'error' }))
            .finally(() => setLoading(p => ({ ...p, trips: false })));
    }, [date]);
    
    // Fetch events and settings when trip changes
    useEffect(() => {
        if (!selectedTripId) {
            setBoardingEvents([]);
            return;
        }
        setLoading(p => ({ ...p, events: true, settings: true }));
        const fetchTripData = async () => {
            try {
                const [eventsData, settingsData] = await Promise.all([
                    transportService.listBoardingEvents('site_123', { tripId: selectedTripId }),
                    transportService.getAlertSettings('site_123'),
                ]);
                setBoardingEvents(eventsData);
                setAlertSettings(settingsData);
            } catch {
                setToast({ message: 'Could not load trip data.', type: 'error' });
            } finally {
                setLoading(p => ({ ...p, events: false, settings: false }));
            }
        };
        fetchTripData();
    }, [selectedTripId]);

    const handleAlertSettingsChange = async (update: Partial<AlertSettings>) => {
        if (!alertSettings) return;
        const newSettings = { ...alertSettings, ...update };
        setAlertSettings(newSettings);
        try {
            await transportService.updateAlertSettings('site_123', newSettings);
        } catch {
            setToast({ message: 'Failed to save settings.', type: 'error' });
            // revert
            transportService.getAlertSettings('site_123').then(setAlertSettings);
        }
    };
    
    const handleBoarding = useCallback(async (direction: BoardingDirection) => {
        if (!studentIdentifier || !selectedTripId || isProcessing) return;
        setIsProcessing(true);

        const student = students.find(s => s.id === studentIdentifier || s.admissionNo === studentIdentifier);
        const trip = trips.find(t => t.id === selectedTripId);

        if (!student || !trip) {
            setToast({ message: 'Student or Trip not found.', type: 'error' });
            setIsProcessing(false);
            return;
        }
        
        // Safety check
        if (student.transportRouteId !== trip.routeId) {
            setToast({ message: `${student.name} is not assigned to this route.`, type: 'warning' });
        }

        try {
            const timestampISO = new Date().toISOString();
            const logResult = await transportService.logBoarding('site_123', { tripId: selectedTripId, studentId: student.id, direction, timestampISO });
            setToast({ message: `${student.name} marked for ${direction}.`, type: 'success' });
            setStudentIdentifier('');
            
            // Refetch events
            transportService.listBoardingEvents('site_123', { tripId: selectedTripId }).then(setBoardingEvents);

            // Send alert if applicable
            const shouldSendAlert = alertSettings?.enabled && ((direction === 'Pickup' && alertSettings.onPickup) || (direction === 'Dropoff' && alertSettings.onDropoff));
            if (shouldSendAlert) {
                await transportService.sendParentAlert('site_123', { studentId: student.id, tripId: selectedTripId, direction, timestampISO });
                // Refetch to show alert status
                transportService.listBoardingEvents('site_123', { tripId: selectedTripId }).then(setBoardingEvents);
            }

        } catch {
            setToast({ message: 'Failed to log boarding event.', type: 'error' });
        } finally {
            // Debounce to prevent double scans
            setTimeout(() => setIsProcessing(false), 1500);
        }

    }, [studentIdentifier, selectedTripId, isProcessing, students, trips, alertSettings]);

    const vehicleMap = useMemo(() => new Map(vehicles.map(v => [v.id, v])), [vehicles]);
    const driverMap = useMemo(() => new Map(drivers.map(d => [d.id, d])), [drivers]);
    const routeMap = useMemo(() => new Map(routes.map(r => [r.id, r])), [routes]);
    const studentMap = useMemo(() => new Map(students.map(s => [s.id, s])), [students]);

    const selectedTrip = trips.find(t => t.id === selectedTripId);

    return (
        <div className="space-y-6">
            {toast && <Toast {...toast} onClose={() => setToast(null)} />}
            <h1 className="text-3xl font-bold text-gray-800">Transport — Boarding</h1>
            
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                {/* Left Panel */}
                <div className="lg:col-span-1 space-y-4">
                     <div className="bg-white p-4 rounded-lg shadow-sm border border-gray-200">
                        <h2 className="text-lg font-semibold text-gray-700 mb-2">Select Trip</h2>
                        <input type="date" value={date} onChange={e => setDate(e.target.value)} className="w-full rounded-md border-gray-300 shadow-sm mb-2" />
                        {loading.trips ? <div className="h-10 bg-gray-200 rounded animate-pulse" /> :
                        <select value={selectedTripId || ''} onChange={e => setSelectedTripId(e.target.value || null)} className="w-full rounded-md border-gray-300 shadow-sm">
                            <option value="">-- Select an active trip --</option>
                            {trips.map(t => <option key={t.id} value={t.id}>{routeMap.get(t.routeId)?.name} ({vehicleMap.get(t.vehicleId)?.regNo})</option>)}
                        </select>
                        }
                    </div>
                     {alertSettings && selectedTripId && (
                         <div className="bg-white p-4 rounded-lg shadow-sm border border-gray-200">
                             <h2 className="text-lg font-semibold text-gray-700 mb-2">Parent Alerts</h2>
                             {loading.settings ? <div className="h-10 bg-gray-200 rounded animate-pulse w-1/2" /> :
                             <div className="space-y-3 text-sm">
                                 <div className="flex items-center justify-between"><label>Enable Alerts</label><input type="checkbox" checked={alertSettings.enabled} onChange={e => handleAlertSettingsChange({ enabled: e.target.checked })} /></div>
                                 <div className="flex items-center justify-between"><label>On Pickup</label><input type="checkbox" checked={alertSettings.onPickup} onChange={e => handleAlertSettingsChange({ onPickup: e.target.checked })} disabled={!alertSettings.enabled} /></div>
                                 <div className="flex items-center justify-between"><label>On Dropoff</label><input type="checkbox" checked={alertSettings.onDropoff} onChange={e => handleAlertSettingsChange({ onDropoff: e.target.checked })} disabled={!alertSettings.enabled} /></div>
                             </div>
                             }
                         </div>
                     )}
                </div>

                {/* Right Panel */}
                <div className="lg:col-span-2 space-y-4">
                    <div className="bg-white p-4 rounded-lg shadow-sm border border-gray-200">
                         <h2 className="text-lg font-semibold text-gray-700 mb-2">Boarding Interface</h2>
                        {!selectedTrip ? <p className="text-gray-500 text-center py-8">Please select a trip to begin boarding.</p> :
                        <div className="space-y-4">
                            <div className="text-center p-2 bg-gray-50 rounded">
                                Trip: <span className="font-bold">{routeMap.get(selectedTrip.routeId)?.name}</span> | Vehicle: <span className="font-bold">{vehicleMap.get(selectedTrip.vehicleId)?.regNo}</span> | Driver: <span className="font-bold">{driverMap.get(selectedTrip.driverId)?.name}</span>
                            </div>
                            <div className="p-4 border-2 border-dashed border-gray-300 rounded-lg text-center">
                                <p className="text-gray-500">QR Scanner Placeholder</p>
                            </div>
                            <div>
                                <label htmlFor="studentId" className="sr-only">Student ID or Admission No</label>
                                <input id="studentId" type="text" value={studentIdentifier} onChange={e => setStudentIdentifier(e.target.value)} placeholder="Enter Student ID / Admission No" className="w-full rounded-md border-gray-300 shadow-sm" />
                            </div>
                            <div className="grid grid-cols-2 gap-4">
                                <button onClick={() => handleBoarding('Pickup')} disabled={isProcessing} className="w-full py-3 text-white font-bold bg-green-600 rounded-md hover:bg-green-700 disabled:bg-gray-400">Mark Pickup</button>
                                <button onClick={() => handleBoarding('Dropoff')} disabled={isProcessing} className="w-full py-3 text-white font-bold bg-blue-600 rounded-md hover:bg-blue-700 disabled:bg-gray-400">Mark Dropoff</button>
                            </div>
                        </div>
                        }
                    </div>
                     {selectedTripId && (
                         <div className="bg-white p-4 rounded-lg shadow-sm border border-gray-200">
                             <h2 className="text-lg font-semibold text-gray-700 mb-2">Recent Events</h2>
                             {loading.events ? <p>Loading events...</p> : boardingEvents.length === 0 ? <p className="text-gray-500">No boarding events for this trip yet.</p> :
                             <ul className="divide-y divide-gray-200">
                                 {boardingEvents.slice(0, 5).map(e => {
                                     const student = studentMap.get(e.studentId);
                                     return (
                                         <li key={e.id} className="py-2 flex justify-between items-center text-sm">
                                             <div>
                                                 <span className="font-medium text-gray-800">{student?.name || 'Unknown'}</span>
                                                 <span className={`ml-2 px-2 py-0.5 rounded-full text-xs ${e.direction === 'Pickup' ? 'bg-green-100 text-green-800' : 'bg-blue-100 text-blue-800'}`}>{e.direction}</span>
                                             </div>
                                             <div className="text-right">
                                                 <p className="text-gray-600">{new Date(e.timestampISO).toLocaleTimeString()}</p>
                                                 <p className={`text-xs ${e.alertSent ? 'text-green-500' : 'text-gray-400'}`}>{e.alertSent ? 'Alert Sent ✓' : 'Alert Off'}</p>
                                             </div>
                                         </li>
                                     );
                                 })}
                             </ul>
                             }
                         </div>
                     )}
                </div>
            </div>
        </div>
    );
};

export default BoardingPage;
