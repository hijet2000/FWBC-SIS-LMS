import React, { useState, useEffect, useMemo } from 'react';
import { useToast } from '../../contexts/ToastContext';
import * as hostelService from '../../lib/hostelService';

interface ReportData {
    hostelId: string;
    name: string;
    capacity: number;
    occupied: number;
}

const HostelReportsPage: React.FC = () => {
    const { addToast } = useToast();
    const [report, setReport] = useState<ReportData[]>([]);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        setLoading(true);
        hostelService.getOccupancyReport()
            .then(setReport)
            .catch(() => addToast('Failed to load report data.', 'error'))
            .finally(() => setLoading(false));
    }, [addToast]);
    
    const totalCapacity = useMemo(() => report.reduce((sum, h) => sum + h.capacity, 0), [report]);
    const totalOccupied = useMemo(() => report.reduce((sum, h) => sum + h.occupied, 0), [report]);

    return (
        <div className="space-y-6">
            <h1 className="text-3xl font-bold text-gray-800">Hostel Occupancy Report</h1>
            
            <div className="bg-white p-6 rounded-lg shadow-sm border">
                <h2 className="text-xl font-semibold mb-4">Summary</h2>
                <div className="grid grid-cols-3 gap-4">
                    <div className="text-center">
                        <p className="text-3xl font-bold">{totalCapacity}</p>
                        <p className="text-sm text-gray-500">Total Capacity</p>
                    </div>
                     <div className="text-center">
                        <p className="text-3xl font-bold">{totalOccupied}</p>
                        <p className="text-sm text-gray-500">Total Occupied</p>
                    </div>
                     <div className="text-center">
                        <p className="text-3xl font-bold text-green-600">{totalCapacity > 0 ? ((totalOccupied/totalCapacity)*100).toFixed(1) : 0}%</p>
                        <p className="text-sm text-gray-500">Overall Occupancy</p>
                    </div>
                </div>
            </div>
            
            <div className="overflow-x-auto shadow ring-1 ring-black ring-opacity-5 sm:rounded-lg">
                <table className="min-w-full divide-y divide-gray-300">
                    <thead className="bg-gray-50"><tr>
                        <th className="p-3 text-left text-xs uppercase">Hostel</th>
                        <th className="p-3 text-center text-xs uppercase">Capacity</th>
                        <th className="p-3 text-center text-xs uppercase">Occupied</th>
                        <th className="p-3 text-left text-xs uppercase">Occupancy Rate</th>
                    </tr></thead>
                    <tbody className="bg-white divide-y divide-gray-200">
                        {loading ? <tr><td colSpan={4} className="p-4 text-center">Loading...</td></tr> :
                        report.map(hostel => {
                            const rate = hostel.capacity > 0 ? (hostel.occupied / hostel.capacity) * 100 : 0;
                            return (
                            <tr key={hostel.hostelId}>
                                <td className="p-3 font-medium">{hostel.name}</td>
                                <td className="p-3 text-center">{hostel.capacity}</td>
                                <td className="p-3 text-center">{hostel.occupied}</td>
                                <td className="p-3">
                                    <div className="w-full bg-gray-200 rounded-full h-4">
                                        <div className="bg-indigo-600 h-4 rounded-full text-white text-xs flex items-center justify-center" style={{ width: `${rate}%`}}>
                                            {rate.toFixed(0)}%
                                        </div>
                                    </div>
                                </td>
                            </tr>
                        )})}
                    </tbody>
                </table>
            </div>
        </div>
    );
};

export default HostelReportsPage;
