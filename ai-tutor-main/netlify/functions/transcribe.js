// netlify/functions/transcribe.js
export default async (request, context) => {
    // CORS headers for browser requests
    const headers = {
        "Content-Type": "application/json",
        "Access-Control-Allow-Origin": "*",
        "Access-Control-Allow-Headers": "Content-Type",
        "Access-Control-Allow-Methods": "POST, OPTIONS"
    };

    // Handle preflight requests
    if (request.method === "OPTIONS") {
        return new Response(null, { status: 204, headers });
    }

    if (request.method !== "POST") {
        return new Response(JSON.stringify({ error: "Method Not Allowed" }), {
            status: 405,
            headers
        });
    }

    const apiKey = process.env.OPENAI_API_KEY;
    if (!apiKey) {
        return new Response(JSON.stringify({ error: "OPENAI_API_KEY missing on server" }), {
            status: 500,
            headers
        });
    }

    try {
        const body = await request.json();
        const audioBase64 = body.audio;

        if (!audioBase64) {
            return new Response(JSON.stringify({ error: "No audio data provided" }), {
                status: 400,
                headers
            });
        }

        // Extract base64 data and mime type
        const matches = audioBase64.match(/^data:(.+);base64,(.+)$/);
        if (!matches) {
            return new Response(JSON.stringify({ error: "Invalid audio format" }), {
                status: 400,
                headers
            });
        }

        const mimeType = matches[1];
        const base64Data = matches[2];

        // Convert base64 to binary
        const binaryData = Uint8Array.from(atob(base64Data), c => c.charCodeAt(0));

        // Determine file extension from mime type
        let extension = 'webm';
        if (mimeType.includes('mp3')) extension = 'mp3';
        else if (mimeType.includes('wav')) extension = 'wav';
        else if (mimeType.includes('m4a')) extension = 'm4a';
        else if (mimeType.includes('ogg')) extension = 'ogg';

        // Create FormData for OpenAI Whisper API
        const formData = new FormData();
        formData.append('file', new Blob([binaryData], { type: mimeType }), `audio.${extension}`);
        formData.append('model', 'whisper-1');
        formData.append('language', 'en'); // Can detect automatically, but English is primary

        // Call OpenAI Whisper API
        const whisperResponse = await fetch("https://api.openai.com/v1/audio/transcriptions", {
            method: "POST",
            headers: {
                "Authorization": `Bearer ${apiKey}`
            },
            body: formData
        });

        const data = await whisperResponse.json();

        if (!whisperResponse.ok) {
            console.error("Whisper Error:", data);
            return new Response(JSON.stringify({
                error: data.error?.message || "Whisper API error",
                details: data
            }), {
                status: whisperResponse.status,
                headers
            });
        }

        // Return transcribed text
        return new Response(JSON.stringify({ text: data.text || "" }), {
            status: 200,
            headers
        });

    } catch (error) {
        console.error("Transcribe Function Error:", error);
        return new Response(JSON.stringify({
            error: "Internal server error",
            message: error.message
        }), {
            status: 500,
            headers
        });
    }
};
