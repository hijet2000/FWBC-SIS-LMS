import React, { useState, useEffect, useRef, useCallback } from 'react';
import Modal from '../ui/Modal';

interface PhotoCaptureModalProps {
    isOpen: boolean;
    onClose: () => void;
    onSave: (dataUrl: string) => void;
}

const PhotoCaptureModal: React.FC<PhotoCaptureModalProps> = ({ isOpen, onClose, onSave }) => {
    const videoRef = useRef<HTMLVideoElement>(null);
    const canvasRef = useRef<HTMLCanvasElement>(null);
    const [stream, setStream] = useState<MediaStream | null>(null);
    const [capturedImage, setCapturedImage] = useState<string | null>(null);
    const [error, setError] = useState<string | null>(null);

    const startCamera = useCallback(async () => {
        setError(null);
        setCapturedImage(null);
        try {
            const mediaStream = await navigator.mediaDevices.getUserMedia({ video: true });
            setStream(mediaStream);
            if (videoRef.current) {
                videoRef.current.srcObject = mediaStream;
            }
        } catch (err) {
            console.error("Error accessing camera:", err);
            setError("Could not access the camera. Please check permissions.");
        }
    }, []);

    const stopCamera = useCallback(() => {
        if (stream) {
            stream.getTracks().forEach(track => track.stop());
            setStream(null);
        }
    }, [stream]);

    useEffect(() => {
        if (isOpen) {
            startCamera();
        } else {
            stopCamera();
        }
        return () => stopCamera();
    }, [isOpen, startCamera, stopCamera]);
    
    const handleCapture = () => {
        if (videoRef.current && canvasRef.current) {
            const video = videoRef.current;
            const canvas = canvasRef.current;
            canvas.width = video.videoWidth;
            canvas.height = video.videoHeight;
            const context = canvas.getContext('2d');
            if (context) {
                // Flip the image horizontally for a mirror effect
                context.translate(video.videoWidth, 0);
                context.scale(-1, 1);
                context.drawImage(video, 0, 0, video.videoWidth, video.videoHeight);
            }
            setCapturedImage(canvas.toDataURL('image/png'));
            stopCamera();
        }
    };
    
    const handleRetake = () => {
        startCamera();
    };
    
    const handleSave = () => {
        if (capturedImage) {
            onSave(capturedImage);
        }
    };

    return (
        <Modal isOpen={isOpen} onClose={onClose} title="Capture Profile Photo">
            <div className="p-6">
                <div className="w-full aspect-video bg-black rounded-md overflow-hidden flex items-center justify-center">
                    {error ? <p className="text-red-500 p-4 text-center">{error}</p> :
                     capturedImage ? 
                        <img src={capturedImage} alt="Captured" className="max-h-full max-w-full" /> :
                        <video ref={videoRef} autoPlay playsInline muted className="w-full h-full object-cover transform scale-x-[-1]" />
                    }
                    <canvas ref={canvasRef} className="hidden" />
                </div>
                 <div className="mt-4 flex justify-center gap-4">
                     {capturedImage ? (
                        <>
                           <button onClick={handleRetake} className="px-4 py-2 border rounded-md">Retake</button>
                           <button onClick={handleSave} className="px-4 py-2 bg-indigo-600 text-white rounded-md">Save Photo</button>
                        </>
                     ) : (
                        <button onClick={handleCapture} disabled={!stream} className="px-4 py-2 bg-indigo-600 text-white rounded-md disabled:bg-gray-400">Capture</button>
                     )}
                </div>
            </div>
        </Modal>
    );
};

export default PhotoCaptureModal;
