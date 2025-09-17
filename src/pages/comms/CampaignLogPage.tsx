import React, { useState, useEffect } from 'react';
import { listCampaigns } from '../../lib/commsService';
import type { Campaign } from '../../types';

const CampaignLogPage: React.FC = () => {
    const [campaigns, setCampaigns] = useState<Campaign[]>([]);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        listCampaigns().then(setCampaigns).finally(() => setLoading(false));
    }, []);

    return (
        <div className="space-y-6">
            <h1 className="text-3xl font-bold">Campaign Log</h1>
             <div className="overflow-x-auto shadow ring-1 ring-black ring-opacity-5 sm:rounded-lg">
                <table className="min-w-full divide-y divide-gray-300">
                    <thead className="bg-gray-50"><tr>
                        <th className="p-3 text-left text-xs uppercase">Campaign</th>
                        <th className="p-3 text-left text-xs uppercase">Created At</th>
                        <th className="p-3 text-left text-xs uppercase">Status</th>
                    </tr></thead>
                    <tbody className="bg-white divide-y divide-gray-200">
                        {loading ? <tr><td colSpan={3} className="p-4 text-center">Loading...</td></tr> :
                        campaigns.map(camp => (
                            <tr key={camp.id}>
                                <td className="p-3 font-medium">{camp.name}</td>
                                <td className="p-3 text-sm">{new Date(camp.createdAt).toLocaleString()}</td>
                                <td className="p-3 text-sm">{camp.status}</td>
                            </tr>
                        ))}
                    </tbody>
                </table>
            </div>
        </div>
    );
};

export default CampaignLogPage;