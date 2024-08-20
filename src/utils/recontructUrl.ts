export function reconstructUrl(inputUrl: string): string | null {
    try {
        const decodedUrl = decodeURIComponent(inputUrl);
        return new URL(decodedUrl).toString();
    } catch (error) {
        console.error("Invalid URL:", error);
        return null;
    }
}
