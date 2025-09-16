import { useState, useEffect, useCallback, useRef } from 'react';
import * as secureMediaService from '../lib/secureMediaService';
import { useAuth } from '../auth/AuthContext';

type MediaKind = 'VIDEO' | 'AUDIO' | 'EBOOK';
const RENEWAL_WINDOW_SEC = 120;

interface UseSignedMediaOptions {
    contentId: string | null;
    rawUrl: string | null;
    kind: MediaKind;
    ttlSec: number;
}

interface SignedMediaError {
    code: string;
    message: string;
}

export const useSignedMedia = ({ contentId, rawUrl, kind, ttlSec }: UseSignedMediaOptions) => {
    const { user } = useAuth();
    const [signedUrl, setSignedUrl] = useState<string | null>(null);
    const [tokenId, setTokenId] = useState<string | null>(null);
    const [expiresAt, setExpiresAt] = useState<string | null>(null);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState<SignedMediaError | null>(null);
    
    const renewalTimeoutRef = useRef<number | null>(null);
    const isRetryingRef = useRef(false);

    const clearRenewalTimer = useCallback(() => {
        if (renewalTimeoutRef.current) {
            clearTimeout(renewalTimeoutRef.current);
            renewalTimeoutRef.current = null;
        }
    }, []);

    const scheduleRenewal = useCallback((expiryIso: string) => {
        clearRenewalTimer();
        const expiryTime = new Date(expiryIso).getTime();
        const now = Date.now();
        const timeUntilExpiry = expiryTime - now;
        const renewalTime = timeUntilExpiry - (RENEWAL_WINDOW_SEC * 1000);

        if (renewalTime > 0 && tokenId && rawUrl && user) {
            renewalTimeoutRef.current = window.setTimeout(async () => {
                try {
                    console.log('Attempting to renew media URL...');
                    const uaHash = await secureMediaService.createUaHash(navigator.userAgent);
                    const bind = { userId: user.id, sessionId: 'mock-session-id', uaHash };
                    const { signedUrl: newUrl, expiresAtISO: newExpiry } = await secureMediaService.renewSignedMedia('site_123', tokenId, rawUrl, { bind, ttlSec });
                    setSignedUrl(newUrl);
                    setExpiresAt(newExpiry);
                    scheduleRenewal(newExpiry); // Schedule the next renewal
                    secureMediaService.logMediaEvent('site_123', tokenId, { type: 'RENEW', tsISO: new Date().toISOString() });
                } catch (err: any) {
                    console.error('Failed to renew media URL', err);
                    setError({ code: err.code || 'RENEW_FAILED', message: err.message || 'Could not renew session.' });
                    setSignedUrl(null); // Invalidate the URL
                }
            }, renewalTime);
        }
    }, [clearRenewalTimer, tokenId, rawUrl, ttlSec, user]);


    const fetchSignedMedia = useCallback(async () => {
        if (!contentId || !rawUrl || !user) {
            setLoading(false);
            return;
        }

        setLoading(true);
        setError(null);
        clearRenewalTimer();

        try {
            const uaHash = await secureMediaService.createUaHash(navigator.userAgent);
            const bind = { userId: user.id, sessionId: 'mock-session-id', uaHash };
            
            const response = await secureMediaService.requestSignedMedia('site_123', contentId, rawUrl, { kind, bind, ttlSec });
            
            setSignedUrl(response.signedUrl);
            setTokenId(response.tokenId);
            setExpiresAt(response.expiresAtISO);
            scheduleRenewal(response.expiresAtISO);
            isRetryingRef.current = false;
        } catch (err: any) {
            console.error('Failed to fetch signed media URL', err);
            setError({ code: err.code || 'FETCH_FAILED', message: err.message || 'An unknown error occurred.' });
            setSignedUrl(null);
            setTokenId(null);
        } finally {
            setLoading(false);
        }
    }, [contentId, rawUrl, user, kind, ttlSec, clearRenewalTimer, scheduleRenewal]);

    useEffect(() => {
        fetchSignedMedia();
        // Cleanup on unmount
        return () => clearRenewalTimer();
    }, [fetchSignedMedia]);

    const retry = useCallback(() => {
        if (!isRetryingRef.current) {
            isRetryingRef.current = true;
            fetchSignedMedia();
        }
    }, [fetchSignedMedia]);


    return { signedUrl, tokenId, expiresAt, loading, error, retry };
};
