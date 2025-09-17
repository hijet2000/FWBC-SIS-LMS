import React from 'react';

interface SloData {
  cuj: string; // Critical User Journey
  target: number;
  compliance: number;
  errorBudget: number;
  burnRate: number;
}

const mockSlos: SloData[] = [
  { cuj: 'User Login', target: 99.9, compliance: 99.95, errorBudget: 95.2, burnRate: 0.5 },
  { cuj: 'Attendance Save', target: 99.95, compliance: 99.98, errorBudget: 98.1, burnRate: 0.1 },
  { cuj: 'Fees PDF Generation', target: 99.5, compliance: 99.41, errorBudget: 15.6, burnRate: 8.2 },
  { cuj: 'Live Class Join', target: 99.9, compliance: 99.91, errorBudget: 89.5, burnRate: 1.1 },
  { cuj: 'Catch-up Video Start', target: 99.8, compliance: 99.85, errorBudget: 92.0, burnRate: 0.8 },
  { cuj: 'Report Export', target: 99.0, compliance: 99.7, errorBudget: 99.2, burnRate: 0.0 },
];

const getStatusColor = (compliance: number, target: number) => {
    if (compliance >= target) return 'text-green-600';
    if (compliance >= target * 0.999) return 'text-yellow-600'; // within 0.1% of target
    return 'text-red-600';
};

const getBudgetColor = (budget: number) => {
    if (budget > 50) return 'bg-green-500';
    if (budget > 10) return 'bg-yellow-500';
    return 'bg-red-500';
};

const SloDashboardPage: React.FC = () => {
  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold text-gray-800">SLO Dashboard</h1>
        <p className="mt-1 text-sm text-gray-500">Service Level Objectives for critical user journeys (30-day rolling window).</p>
      </div>

      <div className="overflow-x-auto shadow ring-1 ring-black ring-opacity-5 sm:rounded-lg">
        <table className="min-w-full divide-y divide-gray-300">
          <thead className="bg-gray-50">
            <tr>
              <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">Critical User Journey</th>
              <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">SLO Target</th>
              <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">Current Compliance</th>
              <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">Error Budget (30d)</th>
              <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">Burn Rate (1h)</th>
            </tr>
          </thead>
          <tbody className="bg-white divide-y divide-gray-200">
            {mockSlos.map(slo => {
                const statusColor = getStatusColor(slo.compliance, slo.target);
                const budgetColor = getBudgetColor(slo.errorBudget);
                return (
                    <tr key={slo.cuj}>
                        <td className="px-4 py-4 text-sm font-medium text-gray-800">{slo.cuj}</td>
                        <td className="px-4 py-4 text-sm font-mono text-gray-600">{slo.target.toFixed(3)}%</td>
                        <td className={`px-4 py-4 text-sm font-mono font-bold ${statusColor}`}>{slo.compliance.toFixed(3)}%</td>
                        <td className="px-4 py-4 text-sm">
                            <div className="flex items-center gap-2">
                                <div className="w-full bg-gray-200 rounded-full h-2.5">
                                    <div className={`${budgetColor} h-2.5 rounded-full`} style={{ width: `${slo.errorBudget}%` }}></div>
                                </div>
                                <span className="w-16 font-mono text-right">{slo.errorBudget.toFixed(1)}%</span>
                            </div>
                        </td>
                        <td className="px-4 py-4 text-sm font-mono text-gray-600">{slo.burnRate.toFixed(1)}x</td>
                    </tr>
                );
            })}
          </tbody>
        </table>
      </div>
    </div>
  );
};

export default SloDashboardPage;
