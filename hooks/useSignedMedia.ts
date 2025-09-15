import { useState, useEffect } from 'react';
import { getSignedUrl } from '../lib/secureMediaService';

export const useSignedMedia = (rawUrl: string | null | undefined) => {
    const [signedUrl, setSignedUrl] = useState<string | null>(null);
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState<string | null>(null);

    useEffect(() => {
        if (!rawUrl) {
            setSignedUrl(null);
            return;
        }

        let isMounted = true;
        const fetchUrl = async () => {
            setLoading(true);
            setError(null);
            try {
                const url = await getSignedUrl(rawUrl);
                if (isMounted) {
                    setSignedUrl(url);
                }
            } catch (err) {
                if (isMounted) {
                    setError('Could not retrieve secure media URL.');
                }
            } finally {
                if (isMounted) {
                    setLoading(false);
                }
            }
        };

        fetchUrl();

        return () => {
            isMounted = false;
        };
    }, [rawUrl]);

    return { signedUrl, loading, error };
};
