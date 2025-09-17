import React, { useState } from 'react';
import ToggleSwitch from '../../components/ui/ToggleSwitch';

interface FeatureFlag {
  id: string;
  name: string;
  description: string;
  enabled: boolean;
  canaryPercent: number | null;
}

const initialFlags: FeatureFlag[] = [
  { id: 'new-report-builder', name: 'New Report Builder UI', description: 'A redesigned interface for creating custom reports.', enabled: true, canaryPercent: null },
  { id: 'ai-powered-insights', name: 'AI-Powered Insights', description: 'Shows generative AI insights on analytics dashboards.', enabled: true, canaryPercent: 10 },
  { id: 'parent-portal-v2', name: 'Parent Portal v2', description: 'The next generation of the parent-facing portal.', enabled: false, canaryPercent: null },
  { id: 'realtime-boarding-map', name: 'Real-time Bus Boarding Map', description: 'Live map view for transport boarding.', enabled: false, canaryPercent: null },
];

const FeatureFlagsPage: React.FC = () => {
  const [flags, setFlags] = useState<FeatureFlag[]>(initialFlags);

  const handleToggle = (id: string, enabled: boolean) => {
    setFlags(flags.map(f => f.id === id ? { ...f, enabled, canaryPercent: enabled ? f.canaryPercent : null } : f));
  };
  
  const handleCanaryChange = (id: string, percent: number) => {
    setFlags(flags.map(f => f.id === id ? { ...f, canaryPercent: percent > 0 ? percent : null } : f));
  };

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold text-gray-800">Releases & Feature Flags</h1>
        <p className="mt-1 text-sm text-gray-500">Manage feature flags and control canary releases to mitigate risk.</p>
      </div>

      <div className="bg-white rounded-lg shadow-sm border">
        <ul className="divide-y divide-gray-200">
          {flags.map(flag => (
            <li key={flag.id} className="p-4 flex flex-col md:flex-row justify-between md:items-center">
              <div className="flex-grow">
                <div className="flex items-center gap-4">
                  <ToggleSwitch enabled={flag.enabled} setEnabled={(val) => handleToggle(flag.id, val)} />
                  <div>
                    <h3 className={`font-semibold ${flag.enabled ? 'text-gray-800' : 'text-gray-400'}`}>{flag.name}</h3>
                    <p className="text-sm text-gray-500">{flag.description}</p>
                  </div>
                </div>
              </div>
              <div className="flex items-center gap-2 mt-2 md:mt-0 md:w-1/4">
                <input
                  type="range"
                  min="0"
                  max="100"
                  step="5"
                  value={flag.canaryPercent || 0}
                  onChange={(e) => handleCanaryChange(flag.id, Number(e.target.value))}
                  disabled={!flag.enabled}
                  className="w-full"
                  title="Canary Release Percentage"
                />
                <span className={`font-mono text-sm w-16 text-center p-1 rounded ${flag.enabled && flag.canaryPercent ? 'bg-indigo-100 text-indigo-800' : 'bg-gray-100 text-gray-400'}`}>
                  {flag.enabled && flag.canaryPercent ? `${flag.canaryPercent}%` : '---'}
                </span>
              </div>
            </li>
          ))}
        </ul>
      </div>
    </div>
  );
};

export default FeatureFlagsPage;
