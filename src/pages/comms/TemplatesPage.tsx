import React, { useState, useEffect } from 'react';
import * as commsService from '../../lib/commsService';
import type { CommunicationTemplate } from '../../types';

const TemplatesPage: React.FC = () => {
    const [templates, setTemplates] = useState<CommunicationTemplate[]>([]);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        commsService.listTemplates().then(setTemplates).finally(() => setLoading(false));
    }, []);

    return (
        <div className="space-y-6">
            <div className="flex justify-between items-center">
                <h1 className="text-3xl font-bold">Templates</h1>
                <button className="px-4 py-2 bg-indigo-600 text-white rounded-md shadow-sm">New Template</button>
            </div>
             <div className="bg-white rounded-lg shadow-sm border">
                <ul className="divide-y divide-gray-200">
                    {loading ? <li className="p-4 text-center">Loading...</li> : templates.map(tpl => (
                        <li key={tpl.id} className="p-4 flex justify-between items-center">
                            <div>
                                <p className="font-semibold">{tpl.name}</p>
                                <p className="text-sm text-gray-500">{tpl.channel}</p>
                            </div>
                            <button className="text-sm text-indigo-600">Edit</button>
                        </li>
                    ))}
                </ul>
            </div>
        </div>
    );
};

export default TemplatesPage;