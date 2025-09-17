import React, { useState } from 'react';
import { useToast } from '../../contexts/ToastContext';
import { exportToCsv } from '../../lib/exporters';

interface ExportItem {
    id: string;
    name: string;
    description: string;
}

const exportItems: ExportItem[] = [
    { id: 'students', name: 'All Students', description: 'A complete list of all students currently enrolled.' },
    { id: 'attendance', name: 'All Attendance Records', description: 'Historical attendance data for all students.' },
    { id: 'invoices', name: 'All Invoices', description: 'Complete financial records of all issued invoices.' },
    { id: 'payments', name: 'All Payments', description: 'Complete record of all payments received.' },
];

const DataExportsPage: React.FC = () => {
    const { addToast } = useToast();
    const [exporting, setExporting] = useState<string | null>(null);

    const handleExport = (item: ExportItem, format: 'CSV' | 'JSON') => {
        setExporting(`${item.id}-${format}`);
        addToast(`Generating ${format} export for ${item.name}...`, 'info');
        
        // Simulate a server-side export process
        setTimeout(() => {
            // Mock data for export
            const mockData = [{ id: 1, name: 'Mock Data' }, { id: 2, name: 'More Mock Data' }];
            if (format === 'CSV') {
                exportToCsv(`${item.id}_export.csv`, [{key: 'id', label: 'ID'}, {key: 'name', label: 'Name'}], mockData);
            } else {
                 const jsonString = JSON.stringify(mockData, null, 2);
                 const blob = new Blob([jsonString], { type: 'application/json' });
                 const url = URL.createObjectURL(blob);
                 const link = document.createElement('a');
                 link.href = url;
                 link.download = `${item.id}_export.json`;
                 document.body.appendChild(link);
                 link.click();
                 document.body.removeChild(link);
                 URL.revokeObjectURL(url);
            }
            addToast('Export complete!', 'success');
            setExporting(null);
        }, 1500);
    };

    return (
        <div className="space-y-6">
            <div>
                <h1 className="text-3xl font-bold text-gray-800">Data Exports</h1>
                <p className="mt-1 text-sm text-gray-500">Download bulk data from the data warehouse for offline analysis.</p>
            </div>

            <div className="bg-white rounded-lg shadow-sm border">
                <ul className="divide-y divide-gray-200">
                    {exportItems.map(item => (
                        <li key={item.id} className="p-4 flex flex-col md:flex-row justify-between md:items-center">
                            <div>
                                <h3 className="font-semibold text-gray-800">{item.name}</h3>
                                <p className="text-sm text-gray-500">{item.description}</p>
                            </div>
                            <div className="flex gap-2 mt-2 md:mt-0">
                                <button 
                                    onClick={() => handleExport(item, 'CSV')}
                                    disabled={!!exporting}
                                    className="px-3 py-1.5 text-sm bg-green-100 text-green-800 rounded-md hover:bg-green-200 disabled:bg-gray-200 disabled:text-gray-500"
                                >
                                    {exporting === `${item.id}-CSV` ? '...' : 'Export CSV'}
                                </button>
                                <button 
                                    onClick={() => handleExport(item, 'JSON')}
                                    disabled={!!exporting}
                                    className="px-3 py-1.5 text-sm bg-blue-100 text-blue-800 rounded-md hover:bg-blue-200 disabled:bg-gray-200 disabled:text-gray-500"
                                >
                                    {exporting === `${item.id}-JSON` ? '...' : 'Export JSON'}
                                </button>
                            </div>
                        </li>
                    ))}
                </ul>
            </div>
        </div>
    );
};

export default DataExportsPage;
