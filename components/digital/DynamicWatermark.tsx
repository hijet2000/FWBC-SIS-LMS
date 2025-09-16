import React, { useState, useEffect, useRef } from 'react';

interface DynamicWatermarkProps {
  children: React.ReactNode;
  userName?: string;
  admissionNo?: string;
  siteId?: string;
  tokenId?: string | null;
}

const DynamicWatermark: React.FC<DynamicWatermarkProps> = ({ children, userName, admissionNo, siteId, tokenId }) => {
    const [timestamp, setTimestamp] = useState('');
    const [position, setPosition] = useState({ top: '50%', left: '50%' });
    const visibilityCounter = useRef(0);

    // Update timestamp every 20 seconds
    useEffect(() => {
        const update = () => setTimestamp(new Date().toISOString());
        update();
        const intervalId = setInterval(update, 20000);
        return () => clearInterval(intervalId);
    }, []);
    
    // Shuffle position on visibility change
    useEffect(() => {
        const shufflePosition = () => {
            const top = `${Math.floor(Math.random() * 50) + 25}%`; // 25% to 75%
            const left = `${Math.floor(Math.random() * 50) + 25}%`; // 25% to 75%
            setPosition({ top, left });
        };

        const handleVisibilityChange = () => {
            if (document.visibilityState === 'visible') {
                visibilityCounter.current += 1;
                shufflePosition();
                if (visibilityCounter.current > 5 && tokenId) {
                     console.log(`[Telemetry] High visibility toggle rate for token ${tokenId}.`);
                }
            }
        };

        shufflePosition(); // Initial position
        document.addEventListener('visibilitychange', handleVisibilityChange);
        
        return () => {
            document.removeEventListener('visibilitychange', handleVisibilityChange);
        };
    }, [tokenId]);

    const watermarkText = [
        userName || 'N/A',
        admissionNo,
        siteId,
        timestamp,
        tokenId ? `TID:${tokenId.substring(4, 14)}` : null
    ].filter(Boolean).join(' | ');

    return (
        <div className="relative w-full h-full">
            {children}
            <div
                className="absolute inset-0 flex items-center justify-center pointer-events-none transition-all duration-1000"
                style={{ top: position.top, left: position.left, transform: 'translate(-50%, -50%) rotate(-15deg)' }}
                aria-hidden="true"
            >
                <span className="text-white/10 text-xl md:text-3xl font-bold select-none text-center break-all whitespace-pre-wrap px-4">
                    {watermarkText}
                </span>
            </div>
        </div>
    );
};

export default DynamicWatermark;
