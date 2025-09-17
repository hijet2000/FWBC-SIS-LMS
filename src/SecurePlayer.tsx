
import React, { useEffect, useRef } from 'react';

declare global {
    interface Window {
        Hls: any;
    }
}

interface SecurePlayerProps {
    src: string;
}

const SecurePlayer = React.forwardRef<HTMLVideoElement, SecurePlayerProps>(({ src }, ref) => {
    const videoRef = useRef<HTMLVideoElement>(null);
    React.useImperativeHandle(ref, () => videoRef.current!, []);

    useEffect(() => {
        const video = videoRef.current;
        if (!video) return;

        let hls: any;

        // Handoff Note: The `src` prop is now a dynamically generated, short-lived signed URL
        // provided by the useSignedMedia hook.

        if (src.includes('m3u8')) {
            if (video.canPlayType('application/vnd.apple.mpegurl')) {
                // Native HLS support (Safari)
                video.src = src;
            } else if (window.Hls && window.Hls.isSupported()) {
                // Use hls.js
                hls = new window.Hls();
                hls.loadSource(src);
                hls.attachMedia(video);
            } else {
                console.error("This browser does not support HLS playback.");
            }
        } else {
            // For non-HLS media like MP4
            video.src = src;
        }

        return () => {
            if (hls) {
                hls.destroy();
            }
        };
    }, [src]);

    return (
        <div className="relative w-full aspect-video bg-black rounded-lg overflow-hidden">
            <video
                ref={videoRef}
                controls
                className="w-full h-full"
                onContextMenu={(e) => e.preventDefault()}
                title="Secure Video Player"
                aria-label="Digital asset video content"
                controlsList="nodownload"
            />
        </div>
    );
});

export default SecurePlayer;
