import React, { useState, useEffect, useRef, useCallback } from 'react';
import type { WatchProgress } from '../types';
import { saveWatchProgress } from '../lib/catchupService';

interface WatchTrackerOptions {
    contentId: string;
    studentId: string;
    initialProgress: WatchProgress | null;
}

const SAVE_INTERVAL_MS = 5000; // Save every 5 seconds

const useWatchTracker = (
    videoRef: React.RefObject<HTMLVideoElement>,
    options: WatchTrackerOptions
) => {
    const { contentId, studentId, initialProgress } = options;
    const [totalSecondsWatched, setTotalSecondsWatched] = useState(0);
    const [lastKnownTime, setLastKnownTime] = useState(0);
    
    // Use a ref for the set to avoid re-renders on every update
    const watchedSecondsSetRef = useRef<Set<number>>(new Set());
    const saveTimeoutRef = useRef<number | null>(null);
    const hasLoadedInitialProgress = useRef(false);
    
    const getProgress = useCallback((): Omit<WatchProgress, 'lastUpdatedISO'> => {
        return {
            secondsWatched: watchedSecondsSetRef.current.size,
            lastSecond: lastKnownTime,
            completed: initialProgress?.completed || false, // Preserve completed status
        };
    }, [lastKnownTime, initialProgress]);

    const saveProgressToServer = useCallback(async () => {
        if (saveTimeoutRef.current) {
            clearTimeout(saveTimeoutRef.current);
            saveTimeoutRef.current = null;
        }
        await saveWatchProgress('site_123', contentId, studentId, getProgress());
    }, [contentId, studentId, getProgress]);

    // Effect to initialize state from fetched progress
    useEffect(() => {
        if (initialProgress && !hasLoadedInitialProgress.current) {
            const initialSet = new Set<number>();
            // This is a simplification; a real implementation would store ranges
            for (let i = 0; i < initialProgress.secondsWatched; i++) {
                initialSet.add(i);
            }
            watchedSecondsSetRef.current = initialSet;
            setTotalSecondsWatched(initialProgress.secondsWatched);
            setLastKnownTime(initialProgress.lastSecond);

            if (videoRef.current) {
                videoRef.current.currentTime = initialProgress.lastSecond;
            }
            hasLoadedInitialProgress.current = true;
        }
    }, [initialProgress, videoRef]);


    // Effect to handle video events
    useEffect(() => {
        const video = videoRef.current;
        if (!video) return;

        const handleTimeUpdate = () => {
            const currentTime = Math.floor(video.currentTime);
            setLastKnownTime(currentTime);

            // Only update if the second hasn't been watched before
            if (!watchedSecondsSetRef.current.has(currentTime)) {
                watchedSecondsSetRef.current.add(currentTime);
                setTotalSecondsWatched(watchedSecondsSetRef.current.size);
            }
        };

        const scheduleSave = () => {
            if (saveTimeoutRef.current) clearTimeout(saveTimeoutRef.current);
            saveTimeoutRef.current = window.setTimeout(saveProgressToServer, SAVE_INTERVAL_MS);
        };
        
        const handlePause = () => {
            saveProgressToServer();
        };

        video.addEventListener('timeupdate', handleTimeUpdate);
        video.addEventListener('play', scheduleSave);
        video.addEventListener('pause', handlePause);

        return () => {
            video.removeEventListener('timeupdate', handleTimeUpdate);
            video.removeEventListener('play', scheduleSave);
            video.removeEventListener('pause', handlePause);
            if (saveTimeoutRef.current) clearTimeout(saveTimeoutRef.current);
        };
    }, [videoRef, saveProgressToServer]);

    // Effect for saving on unload
    useEffect(() => {
        const handleBeforeUnload = () => {
            // Note: Most modern browsers block async requests in beforeunload.
            // A better approach is the Beacon API, but for this mock, a sync save on pause/blur is the main strategy.
            saveProgressToServer();
        };
        window.addEventListener('beforeunload', handleBeforeUnload);
        return () => window.removeEventListener('beforeunload', handleBeforeUnload);
    }, [saveProgressToServer]);


    return {
        totalSecondsWatched,
        lastKnownTime,
        getProgress,
    };
};

export default useWatchTracker;