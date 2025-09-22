import React from 'react';
import type { PageBlock } from '../../types';

interface PageBlockProps {
    block: PageBlock;
    onUpdate: (id: string, content: any) => void;
    onDelete: (id: string) => void;
    onMove: (id: string, direction: 'up' | 'down') => void;
}

const PageBlockComponent: React.FC<PageBlockProps> = ({ block, onUpdate, onDelete, onMove }) => {
    const renderBlockContent = () => {
        switch (block.type) {
            case 'text':
                return (
                    <textarea
                        value={block.content.text}
                        onChange={(e) => onUpdate(block.id, { text: e.target.value })}
                        className="w-full p-2 border rounded-md"
                        rows={5}
                        placeholder="Start writing..."
                    />
                );
            case 'image':
                 return (
                    <div className="flex gap-2 items-center">
                        <input
                            value={block.content.mediaId}
                            onChange={(e) => onUpdate(block.id, { ...block.content, mediaId: e.target.value })}
                            placeholder="Media ID (e.g., media-1)"
                            className="flex-grow p-2 border rounded-md"
                        />
                        <input
                            value={block.content.caption}
                            onChange={(e) => onUpdate(block.id, { ...block.content, caption: e.target.value })}
                            placeholder="Caption"
                            className="flex-grow p-2 border rounded-md"
                        />
                     </div>
                );
            default:
                return <div className="p-2 bg-gray-100 text-sm">Unsupported block type.</div>;
        }
    };
    
    return (
        <div className="bg-white p-4 rounded-lg shadow-sm border relative group">
            <div className="absolute top-2 right-2 flex gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                <button onClick={() => onMove(block.id, 'up')} className="p-1 bg-gray-200 rounded text-xs">↑</button>
                <button onClick={() => onMove(block.id, 'down')} className="p-1 bg-gray-200 rounded text-xs">↓</button>
                <button onClick={() => onDelete(block.id)} className="p-1 bg-red-200 text-red-800 rounded text-xs">✕</button>
            </div>
            <h3 className="text-sm font-medium text-gray-500 capitalize mb-2">{block.type} Block</h3>
            {renderBlockContent()}
        </div>
    );
};

export default PageBlockComponent;
