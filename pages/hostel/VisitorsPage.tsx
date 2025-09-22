import React, { useState, useEffect, useCallback, useMemo } from 'react';
import { useAuth } from '../../auth/AuthContext';
import { useToast } from '../../contexts/ToastContext';
import * as hostelService from '../../lib/hostelService';
import type { HostelVisitor, Student } from '../../types';
import { exportToCsv } from '../../lib/exporters';
import HostelVisitorModal from '../../components/hostel/HostelVisitorModal';

const VisitorsPage: React.FC = () => {
    const { user } = useAuth();
    const { addToast } = useToast();

    const [logs, setLogs] = useState<HostelVisitor[]>([]);
    const [boarders, setBoarders] = useState<Student[]>([]);
    const [loading, setLoading] = useState(true);
    const [isModalOpen, setIsModalOpen] = useState(false);
    
    const [fireMusterMode, setFireMusterMode] = useState(false);
    const [kioskMode, setKioskMode] = useState(false);

    const fetchData = useCallback(() => {
        setLoading(true);
        Promise.all([hostelService.listHostelVisitors(), hostelService.listBoarders()])
            .then(([visitorData, boarderData]) => {
                setLogs(visitorData);
                setBoarders(boarderData);
            })
            .catch(() => addToast('Failed to load visitor data.', 'error'))
            .finally(() => setLoading(false));
    }, [addToast]);

    useEffect(() => {
        fetchData();
    }, [fetchData]);
    
    const handleCheckOut = async (logId: string) => {
        if (!user) return;
        try {
            await hostelService.checkOutHostelVisitor(logId, user);
            addToast('Visitor signed out.', 'success');
            fetchData();
        } catch {
            addToast('Failed to sign out visitor.', 'error');
        }
    };
    
    const handleSaveSuccess = () => {
        setIsModalOpen(false);
        fetchData();
    };

    const handleExport = () => {
        const studentMap = new Map(boarders.map(s => [s.id, s.name]));
        const dataToExport = filteredLogs.map(log => ({
            ...log,
            studentName: studentMap.get(log.studentId) || 'N/A',
            timeIn: new Date(log.timeIn).toLocaleString(),
            timeOut: log.timeOut ? new Date(log.timeOut).toLocaleString() : '',
        }));
        exportToCsv('hostel_visitor_log.csv', [
            { key: 'visitorName', label: 'Visitor' }, { key: 'studentName', label: 'Visiting' },
            { key: 'relation', label: 'Relation' }, { key: 'idChecked', label: 'ID Checked' },
            { key: 'timeIn', label: 'Time In' }, { key: 'timeOut', label: 'Time Out' }
        ], dataToExport);
    };

    const filteredLogs = useMemo(() => {
        if (fireMusterMode) {
            return logs.filter(log => !log.timeOut);
        }
        return logs;
    }, [logs, fireMusterMode]);
    
    const studentMap = useMemo(() => new Map(boarders.map(s => [s.id, s.name])), [boarders]);

    const getStatus = (log: HostelVisitor): { text: string; className: string } => {
        if (log.timeOut) return { text: 'Signed Out', className: 'bg-gray-100 text-gray-800' };
        if (log.isOverstay) return { text: 'Overstay', className: 'bg-yellow-100 text-yellow-800 animate-pulse' };
        return { text: 'In House', className: 'bg-green-100 text-green-800' };
    };

    return (
        <div className={`space-y-6 ${kioskMode ? 'p-4 bg-white fixed inset-0 z-50' : ''}`}>
            {user && <HostelVisitorModal isOpen={isModalOpen} onClose={() => setIsModalOpen(false)} onSaveSuccess={handleSaveSuccess} actor={user} boarders={boarders} />}

            <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
                <div>
                    <h1 className={`${kioskMode ? 'text-4xl' : 'text-3xl'} font-bold text-gray-800`}>Hostel Visitor Log</h1>
                </div>
                <div className="flex items-center gap-2 flex-wrap">
                    <button onClick={handleExport} className="px-4 py-2 text-sm bg-white border rounded-md">Export CSV</button>
                    <button onClick={() => setIsModalOpen(true)} className="px-4 py-2 text-sm text-white bg-indigo-600 rounded-md">Check-in Visitor</button>
                </div>
            </div>

            <div className="bg-white p-4 rounded-lg shadow-sm border flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
                <div className="text-sm text-gray-600">
                    <p>Currently In House: <strong>{logs.filter(l => !l.timeOut).length}</strong></p>
                </div>
                <div className="flex items-center gap-4">
                    <div className="flex items-center"><label htmlFor="fire-muster" className="mr-2 text-sm font-medium">Fire Muster</label><input type="checkbox" id="fire-muster" checked={fireMusterMode} onChange={() => setFireMusterMode(!fireMusterMode)} /></div>
                    <div className="flex items-center"><label htmlFor="kiosk-mode" className="mr-2 text-sm font-medium">Kiosk Mode</label><input type="checkbox" id="kiosk-mode" checked={kioskMode} onChange={() => setKioskMode(!kioskMode)} /></div>
                </div>
            </div>
            
             <div className="overflow-x-auto shadow ring-1 ring-black ring-opacity-5 sm:rounded-lg">
                <table className="min-w-full divide-y divide-gray-300">
                    <thead className="bg-gray-50"><tr>
                        <th className="p-3 text-left text-xs font-medium uppercase">Visitor</th>
                        <th className="p-3 text-left text-xs font-medium uppercase">Visiting</th>
                        <th className="p-3 text-left text-xs font-medium uppercase">Time In/Out</th>
                        <th className="p-3 text-left text-xs font-medium uppercase">Status</th>
                        <th className="p-3 text-right text-xs font-medium uppercase">Actions</th>
                    </tr></thead>
                    <tbody className="bg-white divide-y divide-gray-200">
                        {loading ? <tr><td colSpan={5} className="p-4 text-center">Loading...</td></tr> :
                        filteredLogs.map(log => {
                            const status = getStatus(log);
                            return(
                            <tr key={log.id}>
                                <td className="p-3 text-sm">
                                    <div className="font-medium">{log.visitorName}</div>
                                    <div className="text-gray-500">{log.relation}</div>
                                </td>
                                <td className="p-3 text-sm">{studentMap.get(log.studentId) || 'N/A'}</td>
                                <td className="p-3 text-sm">
                                    {new Date(log.timeIn).toLocaleString()}
                                    {log.timeOut && ` - ${new Date(log.timeOut).toLocaleTimeString()}`}
                                </td>
                                <td className="p-3 text-sm"><span className={`px-2 py-1 text-xs font-semibold rounded-full ${status.className}`}>{status.text}</span></td>
                                <td className="p-3 text-right">
                                    {!log.timeOut && <button onClick={() => handleCheckOut(log.id)} className="text-red-600 font-medium">Sign Out</button>}
                                </td>
                            </tr>
                        )})}
                    </tbody>
                </table>
            </div>
        </div>
    );
};

export default VisitorsPage;
