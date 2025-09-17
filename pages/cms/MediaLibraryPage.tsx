
import React, { useState, useEffect, useCallback } from 'react';
import { useAuth } from '../../auth/AuthContext';
import { useToast } from '../../contexts/ToastContext';
import { listMedia, uploadMedia } from '../../lib/cmsService';
import { useDropzone } from 'react-dropzone';
import { MediaAsset } from '../../types';

const formatBytes = (bytes: number, decimals = 2) => {
  if (bytes === 0) return '0 Bytes';
  const k = 1024;
  const dm = decimals < 0 ? 0 : decimals;
  const sizes = ['Bytes', 'KB', 'MB', 'GB', 'TB'];
  const i = Math.floor(Math.log(bytes) / Math.log(k));
  return parseFloat((bytes / Math.pow(k, i)).toFixed(dm)) + ' ' + sizes[i];
};

const MediaLibraryPage: React.FC = () => {
    const { user } = useAuth();
    const { addToast } = useToast();
    const [media, setMedia] = useState<MediaAsset[]>([]);
    const [loading, setLoading] = useState(true);

    const fetchData = useCallback(() => {
        setLoading(true);
        listMedia().then(setMedia).finally(() => setLoading(false));
    }, []);

    useEffect(() => {
        fetchData();
    }, [fetchData]);

    const onDrop = useCallback(async (acceptedFiles: File[]) => {
        if (!user) return;
        for (const file of acceptedFiles) {
            await uploadMedia(file, user);
        }
        addToast(`${acceptedFiles.length} file(s) uploaded.`, 'success');
        fetchData();
    }, [user, addToast, fetchData]);

    const { getRootProps, getInputProps, isDragActive } = useDropzone({ onDrop });
    
    return (
        <div className="space-y-6">
            <h1 className="text-3xl font-bold">Media Library</h1>
            <div {...getRootProps()} className={`p-8 border-2 border-dashed rounded-lg text-center cursor-pointer transition-colors ${isDragActive ? 'border-indigo-500 bg-indigo-50' : 'border-gray-300 hover:border-gray-400'}`}>
                <input {...getInputProps()} />
                <p>Drag 'n' drop some files here, or click to select files</p>
            </div>
            {loading ? <p>Loading media...</p> :
            <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-6 gap-4">
                {media.map(item => (
                    <div key={item.id} className="bg-white p-2 rounded-lg shadow-sm border">
                        {item.type.startsWith('image/') ? 
                            <img src={item.url} alt={item.fileName} className="w-full h-24 object-cover rounded-md" /> :
                            <div className="w-full h-24 bg-gray-100 flex items-center justify-center rounded-md font-bold text-gray-500">{item.type.split('/')[1]}</div>
                        }
                        <p className="text-xs mt-2 truncate font-medium" title={item.fileName}>{item.fileName}</p>
                        <p className="text-xs text-gray-400">{formatBytes(item.size)}</p>
                    </div>
                ))}
            </div>
            }
        </div>
    );
};

export default MediaLibraryPage;
