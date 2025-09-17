
import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { useAuth } from '../../auth/AuthContext';
import { useToast } from '../../contexts/ToastContext';
import { getTemplate, saveTemplate } from '../../lib/certificateService';

const TemplateDesignerPage: React.FC = () => {
    const { templateId } = useParams<{ templateId: string }>();
    const { user } = useAuth();
    const { addToast } = useToast();
    const navigate = useNavigate();

    const [template, setTemplate] = useState({ name: '', design: { backgroundColor: '#ffffff', textColor: '#000000' } });
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        if (templateId === 'new') {
            setLoading(false);
            return;
        }
        getTemplate(templateId!)
            .then(data => data && setTemplate(data))
            .finally(() => setLoading(false));
    }, [templateId]);
    
    const handleSave = async () => {
        if (!user) return;
        await saveTemplate({ id: templateId !== 'new' ? templateId : undefined, ...template }, user);
        addToast('Template saved!', 'success');
        navigate('/school/site_123/certificates/templates');
    };

    if (loading) return <p>Loading template...</p>;

    return (
        <div className="space-y-6">
            <h1 className="text-3xl font-bold">{templateId === 'new' ? 'New Template' : 'Edit Template'}</h1>
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                <div className="lg:col-span-1 bg-white p-4 rounded-lg shadow-sm border space-y-4">
                    <h2 className="text-lg font-semibold">Properties</h2>
                    <input value={template.name} onChange={e => setTemplate({...template, name: e.target.value})} placeholder="Template Name" className="w-full rounded-md" />
                    <div>
                        <label className="text-sm">Background Color</label>
                        <input type="color" value={template.design.backgroundColor} onChange={e => setTemplate({...template, design: {...template.design, backgroundColor: e.target.value}})} className="w-full h-10 rounded-md" />
                    </div>
                    <div>
                        <label className="text-sm">Text Color</label>
                        <input type="color" value={template.design.textColor} onChange={e => setTemplate({...template, design: {...template.design, textColor: e.target.value}})} className="w-full h-10 rounded-md" />
                    </div>
                    <button onClick={handleSave} className="w-full py-2 bg-indigo-600 text-white rounded-md">Save Template</button>
                </div>
                <div className="lg:col-span-2 bg-white p-4 rounded-lg shadow-sm border">
                    <h2 className="text-lg font-semibold mb-4">Live Preview</h2>
                    <div className="aspect-[1.414] border-2 border-dashed flex items-center justify-center" style={{ backgroundColor: template.design.backgroundColor, color: template.design.textColor }}>
                        <div className="text-center">
                            <h3 className="text-4xl font-bold">Certificate of Achievement</h3>
                            <p className="mt-4">This certifies that</p>
                            <p className="text-3xl font-serif my-2">[Student Name]</p>
                            <p>has successfully completed the course</p>
                            <p className="text-xl font-semibold my-2">[Course Details]</p>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
};

export default TemplateDesignerPage;
