import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { useAuth } from '../../auth/AuthContext';
import { useToast } from '../../contexts/ToastContext';
import { getTemplate, saveTemplate } from '../../lib/certificateService';
import { CertificateTemplate, DesignElement, TemplateSize } from '../../types';
import TemplatePreview from '../../components/certificates/TemplatePreview';

const SIZES: Record<TemplateSize, { name: string, w: number, h: number }> = {
    'A4_Portrait': { name: "A4 Portrait", w: 210, h: 297 },
    'A4_Landscape': { name: "A4 Landscape", w: 297, h: 210 },
    'ID_Card_CR80': { name: "ID Card (CR80)", w: 85.6, h: 53.98 },
};

const FONT_WEIGHTS = ['normal', 'bold'];
const TEXT_ALIGNS = ['left', 'center', 'right'];

const TemplateDesignerPage: React.FC = () => {
    const { templateId, siteId } = useParams<{ templateId: string; siteId: string }>();
    const { user } = useAuth();
    const { addToast } = useToast();
    const navigate = useNavigate();

    const [template, setTemplate] = useState<Partial<CertificateTemplate>>({ name: '', type: 'Certificate', size: 'A4_Landscape', frontDesign: { backgroundColor: '#ffffff', elements: [] } });
    const [activeElementId, setActiveElementId] = useState<string | null>(null);
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
        navigate(`/school/${siteId}/certificates/templates`);
    };

    const addElement = (type: DesignElement['type']) => {
        const newElement: DesignElement = {
            id: `el-${Date.now()}`, type, content: 'Sample Text',
            x: 20, y: 20, width: 100, height: 20,
            fontSize: 12, fontWeight: 'normal', textAlign: 'left', color: '#000000'
        };
        if(type === 'QR_CODE') {
            newElement.content = '{{verifyUrl}}';
            newElement.width = 30;
            newElement.height = 30;
        }
        setTemplate(t => ({...t, frontDesign: {...t.frontDesign!, elements: [...(t.frontDesign?.elements || []), newElement] }}));
        setActiveElementId(newElement.id);
    };

    const updateElement = (id: string, props: Partial<DesignElement>) => {
        setTemplate(t => ({...t, frontDesign: {...t.frontDesign!, elements: (t.frontDesign?.elements || []).map(el => el.id === id ? {...el, ...props} : el) }}));
    };
    
    const activeElement = template.frontDesign?.elements.find(el => el.id === activeElementId);

    if (loading) return <p>Loading template...</p>;

    return (
        <div className="space-y-6">
            <div className="flex justify-between items-center">
                <h1 className="text-3xl font-bold">{templateId === 'new' ? 'New Template' : 'Edit Template'}</h1>
                <button onClick={handleSave} className="px-4 py-2 bg-indigo-600 text-white rounded-md">Save Template</button>
            </div>
            <div className="grid grid-cols-1 lg:grid-cols-4 gap-6">
                <div className="lg:col-span-1 space-y-4">
                     <div className="bg-white p-4 rounded-lg shadow-sm border">
                        <h2 className="text-lg font-semibold">Properties</h2>
                        <input value={template.name} onChange={e => setTemplate({...template, name: e.target.value})} className="w-full mt-2 rounded-md" />
                        <select value={template.size} onChange={e => setTemplate({...template, size: e.target.value as TemplateSize})} className="w-full mt-2 rounded-md">
                            {Object.entries(SIZES).map(([key, val]) => <option key={key} value={key}>{val.name}</option>)}
                        </select>
                        <input type="color" value={template.frontDesign?.backgroundColor} onChange={e => setTemplate({...template, frontDesign: {...template.frontDesign!, backgroundColor: e.target.value}})} className="w-full h-10 mt-2"/>
                    </div>
                    <div className="bg-white p-4 rounded-lg shadow-sm border">
                        <h2 className="text-lg font-semibold">Layers</h2>
                         <div className="flex gap-2 mt-2">
                             <button onClick={() => addElement('TEXT')} className="text-sm p-2 bg-gray-100 rounded-md">Add Text</button>
                             <button onClick={() => addElement('IMAGE')} className="text-sm p-2 bg-gray-100 rounded-md">Add Image</button>
                             <button onClick={() => addElement('QR_CODE')} className="text-sm p-2 bg-gray-100 rounded-md">Add QR</button>
                         </div>
                        <ul className="mt-2 space-y-1">
                            {template.frontDesign?.elements.map(el => (
                                <li key={el.id} onClick={() => setActiveElementId(el.id)} className={`p-2 rounded-md cursor-pointer ${activeElementId === el.id ? 'bg-indigo-100' : 'hover:bg-gray-50'}`}>
                                    {el.type}: {el.content.substring(0,20)}...
                                </li>
                            ))}
                        </ul>
                    </div>
                     {activeElement && <div className="bg-white p-4 rounded-lg shadow-sm border">
                        <h2 className="text-lg font-semibold">Edit Element</h2>
                        <div className="grid grid-cols-2 gap-2 mt-2">
                           <input type="number" value={activeElement.x} onChange={e => updateElement(activeElement.id, {x: +e.target.value})} title="X (mm)"/>
                           <input type="number" value={activeElement.y} onChange={e => updateElement(activeElement.id, {y: +e.target.value})} title="Y (mm)"/>
                           <input type="number" value={activeElement.width} onChange={e => updateElement(activeElement.id, {width: +e.target.value})} title="Width (mm)"/>
                           <input type="number" value={activeElement.height} onChange={e => updateElement(activeElement.id, {height: +e.target.value})} title="Height (mm)"/>
                        </div>
                         <input value={activeElement.content} onChange={e => updateElement(activeElement.id, {content: e.target.value})} className="w-full mt-2"/>
                         {activeElement.type === 'TEXT' && <>
                            <input type="number" value={activeElement.fontSize} onChange={e => updateElement(activeElement.id, {fontSize: +e.target.value})} className="w-full mt-2"/>
                            <select value={activeElement.fontWeight} onChange={e => updateElement(activeElement.id, {fontWeight: e.target.value as any})} className="w-full mt-2">{FONT_WEIGHTS.map(w => <option key={w} value={w}>{w}</option>)}</select>
                            <select value={activeElement.textAlign} onChange={e => updateElement(activeElement.id, {textAlign: e.target.value as any})} className="w-full mt-2">{TEXT_ALIGNS.map(a => <option key={a} value={a}>{a}</option>)}</select>
                            <input type="color" value={activeElement.color} onChange={e => updateElement(activeElement.id, {color: e.target.value})} className="w-full mt-2"/>
                         </>}
                    </div>}
                </div>
                <div className="lg:col-span-3 bg-white p-4 rounded-lg shadow-sm border overflow-auto">
                    <h2 className="text-lg font-semibold mb-4">Live Preview</h2>
                    <TemplatePreview template={template as CertificateTemplate} sampleData={{'student.name': 'Alice Johnson', 'student.photoUrl': `https://i.pravatar.cc/150?u=s01`, 'student.admissionNo': 'ADM-2025-001', 'details.main': 'Excellence in Science', 'issue.date': new Date().toLocaleDateString()}} activeElementId={activeElementId} />
                </div>
            </div>
        </div>
    );
};

export default TemplateDesignerPage;