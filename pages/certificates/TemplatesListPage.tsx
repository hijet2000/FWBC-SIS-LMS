
import React, { useState, useEffect } from 'react';
import { Link, useParams } from 'react-router-dom';
import { listTemplates } from '../../lib/certificateService';

const TemplatesListPage: React.FC = () => {
    const { siteId } = useParams<{ siteId: string }>();
    const [templates, setTemplates] = useState<any[]>([]);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        setLoading(true);
        listTemplates()
            .then(setTemplates)
            .finally(() => setLoading(false));
    }, []);
    
    return (
        <div className="space-y-6">
            <div className="flex justify-between items-center">
                <h1 className="text-3xl font-bold">Certificate Templates</h1>
                <Link to={`/school/${siteId}/certificates/templates/new`} className="px-4 py-2 bg-indigo-600 text-white rounded-md shadow-sm">
                    New Template
                </Link>
            </div>
            
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                {loading ? <p>Loading...</p> : templates.map(tpl => (
                    <Link key={tpl.id} to={`/school/${siteId}/certificates/templates/${tpl.id}`} className="block bg-white p-4 rounded-lg shadow-sm border hover:shadow-md">
                        <div className="aspect-video mb-4" style={{ backgroundColor: tpl.design.backgroundColor }}></div>
                        <h3 className="font-semibold">{tpl.name}</h3>
                    </Link>
                ))}
            </div>
        </div>
    );
};

export default TemplatesListPage;
