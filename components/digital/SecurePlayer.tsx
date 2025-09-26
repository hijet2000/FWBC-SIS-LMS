
import React, { useEffect, useRef } from 'react';

declare global {
    interface Window {
        Hls: any;
    }
}

interface SecurePlayerProps {
    src: string;
    watermarkText?: string;
}

// FIX: Wrap component in React.forwardRef and use React.useImperativeHandle.
// This allows a parent component to pass a ref to get access to the underlying <video> element,
// which is required by the useWatchTracker hook, while still allowing the component's internal
// logic to also have a reference to it.
const SecurePlayer = React.forwardRef<HTMLVideoElement, SecurePlayerProps>(({ src, watermarkText }, ref) => {
    const videoRef = useRef<HTMLVideoElement>(null);
    React.useImperativeHandle(ref, () => videoRef.current!, []);

    useEffect(() => {
        const video = videoRef.current;
        if (!video) return;

        let hls: any;

        // Handoff Note: For production, you would replace the static `src` prop
        // with a dynamically generated, short-lived signed URL from your backend.
        // Example: const fetchSignedUrl = async () => { ... }; fetchSignedUrl().then(url => video.src = url);

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
            />
            {watermarkText && (
                <div className="absolute inset-0 flex items-center justify-center pointer-events-none" aria-hidden="true">
                    <span className="text-white/20 text-4xl md:text-6xl font-bold select-none transform -rotate-12">
                        {watermarkText}
                    </span>
                </div>
            )}
        </div>
    );
});

SecurePlayer.displayName = 'SecurePlayer';
export default SecurePlayer;
