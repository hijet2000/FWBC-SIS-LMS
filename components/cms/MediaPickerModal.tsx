
import React, { useState, useEffect, useCallback } from 'react';
import * as cmsService from '../../lib/cmsService';
import type { MediaAsset } from '../../types';
import Modal from '../ui/Modal';

interface MediaPickerModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSelect: (mediaId: string) => void;
}

const MediaPickerModal: React.FC<MediaPickerModalProps> = ({ isOpen, onClose, onSelect }) => {
    const [assets, setAssets] = useState<MediaAsset[]>([]);
    const [loading, setLoading] = useState(true);

    const fetchData = useCallback(() => {
        setLoading(true);
        cmsService.listMediaAssets().then(setAssets).finally(() => setLoading(false));
    }, []);

    useEffect(() => {
        if (isOpen) {
            fetchData();
        }
    }, [isOpen, fetchData]);

    return (
        <Modal isOpen={isOpen} onClose={onClose} title="Select Media from Library">
            <div className="p-6 max-h-[70vh] overflow-y-auto">
                {loading ? <p>Loading...</p> : (
                    <div className="grid grid-cols-3 md:grid-cols-5 gap-4">
                        {assets.map(asset => (
                            <button key={asset.id} onClick={() => onSelect(asset.id)} className="border rounded-lg overflow-hidden hover:border-indigo-500 focus:outline-none focus:ring-2 focus:ring-indigo-500">
                                <img src={asset.url} alt={asset.altText || asset.fileName} className="w-full h-24 object-cover" />
                                <p className="p-1 text-xs truncate">{asset.fileName}</p>
                            </button>
                        ))}
                    </div>
                )}
            </div>
             <div className="bg-gray-50 px-6 py-3 flex justify-end">
                <button type="button" onClick={onClose} className="px-4 py-2 border rounded-md">Cancel</button>
            </div>
        </Modal>
    );
};

export default MediaPickerModal;
