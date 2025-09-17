import React from 'react';
import { CertificateTemplate, DesignElement } from '../../types';

interface TemplatePreviewProps {
    template: CertificateTemplate;
    sampleData: Record<string, string>;
    activeElementId?: string | null;
}

const SIZES = {
    'A4_Portrait': { w: 210, h: 297 },
    'A4_Landscape': { w: 297, h: 210 },
    'ID_Card_CR80': { w: 85.6, h: 53.98 },
};

const PIXELS_PER_MM = 3; // Adjust for preview scaling

const TemplatePreview: React.FC<TemplatePreviewProps> = ({ template, sampleData, activeElementId }) => {
    if (!template) return null;

    const size = SIZES[template.size || 'A4_Landscape'];
    const widthPx = size.w * PIXELS_PER_MM;
    const heightPx = size.h * PIXELS_PER_MM;

    const renderElement = (el: DesignElement) => {
        let content = el.content;
        Object.entries(sampleData).forEach(([key, value]) => {
            content = content.replace(`{{${key}}}`, value);
        });

        const style: React.CSSProperties = {
            position: 'absolute',
            left: `${el.x * PIXELS_PER_MM}px`,
            top: `${el.y * PIXELS_PER_MM}px`,
            width: `${el.width * PIXELS_PER_MM}px`,
            height: `${el.height * PIXELS_PER_MM}px`,
            outline: activeElementId === el.id ? '2px dashed #4f46e5' : 'none',
        };

        switch (el.type) {
            case 'TEXT':
                return <div style={{ ...style, fontSize: `${(el.fontSize || 12) * 1.33}px`, fontWeight: el.fontWeight, textAlign: el.textAlign, color: el.color || '#000000' }}>{content}</div>;
            case 'IMAGE':
                return <img src={content} alt="placeholder" style={{ ...style, objectFit: 'cover' }} />;
            case 'QR_CODE':
                return <div style={{...style, backgroundColor: '#ccc' }}><img src={`https://api.qrserver.com/v1/create-qr-code/?size=150x150&data=${encodeURIComponent(content)}`} alt="QR Code" className="w-full h-full"/></div>;
            default:
                return null;
        }
    };

    return (
        <div 
            className="relative shadow-lg"
            style={{ 
                width: `${widthPx}px`, 
                height: `${heightPx}px`, 
                backgroundColor: template.frontDesign?.backgroundColor || '#ffffff',
                transformOrigin: 'top left',
            }}
        >
            {template.frontDesign?.elements.map(el => (
                <React.Fragment key={el.id}>{renderElement(el)}</React.Fragment>
            ))}
        </div>
    );
};

export default TemplatePreview;