import React, { useState, useEffect } from 'react';
import { Link, useParams } from 'react-router-dom';
import { listTemplates } from '../../lib/certificateService';
import { CertificateTemplate } from '../../types';
import TemplatePreview from '../../components/certificates/TemplatePreview';

const TemplatesListPage: React.FC = () => {
    const { siteId } = useParams<{ siteId: string }>();
    const [templates, setTemplates] = useState<CertificateTemplate[]>([]);
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
                <h1 className="text-3xl font-bold">Certificate & ID Card Templates</h1>
                <Link to={`/school/${siteId}/certificates/templates/new`} className="px-4 py-2 bg-indigo-600 text-white rounded-md shadow-sm">
                    New Template
                </Link>
            </div>
            
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                {loading ? <p>Loading templates...</p> : templates.map(tpl => (
                    <Link key={tpl.id} to={`/school/${siteId}/certificates/templates/${tpl.id}`} className="block bg-white p-4 rounded-lg shadow-sm border hover:shadow-md transition-all group">
                        <div className="aspect-video mb-4 rounded-md overflow-hidden transform scale-50 -m-12 group-hover:scale-[0.55] transition-transform">
                           <TemplatePreview template={tpl} sampleData={{'student.name': 'John Doe', 'details.main': 'Sample Text'}} />
                        </div>
                        <h3 className="font-semibold mt-2">{tpl.name}</h3>
                        <p className="text-sm text-gray-500">{tpl.type} - {tpl.size}</p>
                    </Link>
                ))}
            </div>
        </div>
    );
};

export default TemplatesListPage;