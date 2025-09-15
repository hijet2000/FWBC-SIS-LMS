// This is a mock service. In a real application, this would contact your backend
// to get a short-lived, signed URL for a private media asset.

export const getSignedUrl = async (rawUrl: string): Promise<string> => {
    console.log(`[Mock] Requesting signed URL for: ${rawUrl}`);
    // Simulate network delay
    await new Promise(res => setTimeout(res, 200));
    // In this mock, we just return the original URL.
    return rawUrl;
};
