import React, { useState } from 'react';
import BiConnectionModal from '../../components/analytics/BiConnectionModal';

type BiTool = 'Power BI' | 'Looker Studio' | 'Tableau' | 'Metabase';

interface BiToolInfo {
    name: BiTool;
    logo: string;
    description: string;
}

const tools: BiToolInfo[] = [
    { name: 'Power BI', logo: 'https://seeklogo.com/images/P/power-bi-logo-34442D608E-seeklogo.com.png', description: 'Microsoft\'s business analytics service.' },
    { name: 'Looker Studio', logo: 'https://seeklogo.com/images/G/google-looker-studio-logo-B69299865A-seeklogo.com.png', description: 'Google\'s data visualization product.' },
    { name: 'Tableau', logo: 'https://seeklogo.com/images/T/tableau-software-logo-F9361BE123-seeklogo.com.png', description: 'Interactive data visualization software.' },
    { name: 'Metabase', logo: 'https://seeklogo.com/images/M/metabase-logo-924220372F-seeklogo.com.png', description: 'Open source business intelligence tool.' },
];

const BiConnectorsPage: React.FC = () => {
    const [selectedTool, setSelectedTool] = useState<BiTool | null>(null);

    return (
        <div className="space-y-6">
            {selectedTool && <BiConnectionModal tool={selectedTool} onClose={() => setSelectedTool(null)} />}
            <div>
                <h1 className="text-3xl font-bold text-gray-800">BI Connectors</h1>
                <p className="mt-1 text-sm text-gray-500">Connect your preferred Business Intelligence tool to the data warehouse.</p>
            </div>
            
            <div className="bg-white p-6 rounded-lg shadow-sm border">
                <h2 className="text-lg font-semibold text-gray-700">Available Connectors</h2>
                <div className="mt-4 grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                    {tools.map(tool => (
                        <div key={tool.name} className="flex flex-col bg-gray-50 p-4 rounded-lg border hover:shadow-md transition-shadow">
                            <div className="flex items-center gap-4">
                                <img src={tool.logo} alt={`${tool.name} logo`} className="h-12 w-12 object-contain"/>
                                <div>
                                    <h3 className="font-bold text-gray-800">{tool.name}</h3>
                                    <p className="text-xs text-gray-500">{tool.description}</p>
                                </div>
                            </div>
                            <div className="mt-4 flex-grow flex items-end">
                                <button onClick={() => setSelectedTool(tool.name)} className="w-full text-center px-4 py-2 text-sm font-medium text-indigo-600 bg-indigo-100 rounded-md hover:bg-indigo-200">
                                    Get Connection Details
                                </button>
                            </div>
                        </div>
                    ))}
                </div>
            </div>
        </div>
    );
};

export default BiConnectorsPage;
