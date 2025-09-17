import React from 'react';

type AlertStatus = 'OK' | 'Firing';
type AlertSeverity = 'Critical' | 'Warning' | 'Info';

interface AlertRule {
    name: string;
    condition: string;
    severity: AlertSeverity;
    status: AlertStatus;
}

const mockAlerts: AlertRule[] = [
    { name: 'High Error Budget Burn (Login)', condition: 'Burn rate > 5x for 15m', severity: 'Critical', status: 'OK' },
    { name: 'High Error Budget Burn (Fees PDF)', condition: 'Burn rate > 2x for 1h', severity: 'Warning', status: 'Firing' },
    { name: 'API Latency High (p99)', condition: 'p99 latency > 2s for 5m', severity: 'Warning', status: 'OK' },
    { name: 'Database CPU High', condition: 'CPU usage > 90% for 10m', severity: 'Critical', status: 'OK' },
    { name: 'ETL Job Freshness Stale', condition: 'Last success > 2h ago', severity: 'Warning', status: 'OK' },
];

const statusStyles: Record<AlertStatus, string> = {
    OK: 'bg-green-100 text-green-800',
    Firing: 'bg-red-100 text-red-800 animate-pulse',
};
const severityStyles: Record<AlertSeverity, string> = {
    Critical: 'text-red-600',
    Warning: 'text-yellow-600',
    Info: 'text-blue-600',
};

const AlertingPage: React.FC = () => {
  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold text-gray-800">Alerting Rules</h1>
        <p className="mt-1 text-sm text-gray-500">Manage and view multi-signal alerts tied to SLOs and system health.</p>
      </div>
      <div className="overflow-x-auto shadow ring-1 ring-black ring-opacity-5 sm:rounded-lg">
        <table className="min-w-full divide-y divide-gray-300">
          <thead className="bg-gray-50">
            <tr>
              <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">Alert Name</th>
              <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">Condition</th>
              <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">Severity</th>
              <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">Status</th>
              <th className="px-4 py-3 text-right text-xs font-medium text-gray-500 uppercase">Actions</th>
            </tr>
          </thead>
          <tbody className="bg-white divide-y divide-gray-200">
            {mockAlerts.map(alert => (
                <tr key={alert.name}>
                    <td className="px-4 py-4 text-sm font-medium text-gray-800">{alert.name}</td>
                    <td className="px-4 py-4 text-sm font-mono text-gray-600">{alert.condition}</td>
                    <td className={`px-4 py-4 text-sm font-bold ${severityStyles[alert.severity]}`}>{alert.severity}</td>
                    <td className="px-4 py-4 text-sm">
                        <span className={`px-2 py-1 text-xs font-semibold rounded-full ${statusStyles[alert.status]}`}>{alert.status}</span>
                    </td>
                    <td className="px-4 py-4 text-right text-sm font-medium">
                        <a href="#" className="text-indigo-600 hover:text-indigo-900">View Runbook</a>
                    </td>
                </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
};

export default AlertingPage;
