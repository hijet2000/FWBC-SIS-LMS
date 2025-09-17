import React from 'react';

type IncidentStatus = 'Investigating' | 'Identified' | 'Monitoring' | 'Resolved';
type IncidentSeverity = 'SEV1' | 'SEV2' | 'SEV3';

interface Incident {
    id: string;
    title: string;
    status: IncidentStatus;
    severity: IncidentSeverity;
    timestamp: string;
}

const mockIncidents: Incident[] = [
    { id: 'INC-2025-012', title: 'Fee PDF generation failing for Tenant X', status: 'Investigating', severity: 'SEV2', timestamp: new Date(Date.now() - 30 * 60 * 1000).toISOString() },
    { id: 'INC-2025-011', title: 'API latency spike', status: 'Resolved', severity: 'SEV3', timestamp: new Date(Date.now() - 5 * 60 * 60 * 1000).toISOString() },
    { id: 'INC-2025-010', title: 'User login failures', status: 'Resolved', severity: 'SEV1', timestamp: new Date(Date.now() - 2 * 24 * 60 * 60 * 1000).toISOString() },
];

const statusStyles: Record<IncidentStatus, string> = {
    Investigating: 'bg-yellow-100 text-yellow-800',
    Identified: 'bg-blue-100 text-blue-800',
    Monitoring: 'bg-cyan-100 text-cyan-800',
    Resolved: 'bg-green-100 text-green-800',
};

const severityStyles: Record<IncidentSeverity, string> = {
    SEV1: 'bg-red-600 text-white',
    SEV2: 'bg-orange-500 text-white',
    SEV3: 'bg-yellow-500 text-black',
};

const IncidentsPage: React.FC = () => {
  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold text-gray-800">Incidents</h1>
        <p className="mt-1 text-sm text-gray-500">View and manage ongoing and past system incidents.</p>
      </div>
      <div className="overflow-x-auto shadow ring-1 ring-black ring-opacity-5 sm:rounded-lg">
        <table className="min-w-full divide-y divide-gray-300">
          <thead className="bg-gray-50">
            <tr>
              <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">Incident ID</th>
              <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">Title</th>
              <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">Severity</th>
              <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">Status</th>
              <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">Started At</th>
            </tr>
          </thead>
          <tbody className="bg-white divide-y divide-gray-200">
            {mockIncidents.map(inc => (
                <tr key={inc.id}>
                    <td className="px-4 py-4 text-sm font-mono text-gray-600">{inc.id}</td>
                    <td className="px-4 py-4 text-sm font-medium text-gray-800">{inc.title}</td>
                    <td className="px-4 py-4 text-sm">
                        <span className={`px-2 py-1 text-xs font-bold rounded-full ${severityStyles[inc.severity]}`}>{inc.severity}</span>
                    </td>
                    <td className="px-4 py-4 text-sm">
                        <span className={`px-2 py-1 text-xs font-semibold rounded-full ${statusStyles[inc.status]}`}>{inc.status}</span>
                    </td>
                    <td className="px-4 py-4 text-sm text-gray-600">{new Date(inc.timestamp).toLocaleString()}</td>
                </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
};

export default IncidentsPage;
