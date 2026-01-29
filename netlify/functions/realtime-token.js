// netlify/functions/realtime-token.js
// Generates ephemeral token for OpenAI Realtime API

export default async (request, context) => {
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
        return new Response(JSON.stringify({ error: "OPENAI_API_KEY not configured" }), {
            status: 500,
            headers
        });
    }

    try {
        const body = await request.json();
        const mode = body.mode || 'academic';

        // Create ephemeral token via OpenAI API
        const tokenResponse = await fetch("https://api.openai.com/v1/realtime/sessions", {
            method: "POST",
            headers: {
                "Authorization": `Bearer ${apiKey}`,
                "Content-Type": "application/json"
            },
            body: JSON.stringify({
                model: "gpt-4o-realtime-preview-2024-12-17",
                voice: "alloy",
                instructions: mode === 'academic'
                    ? `You are an English language tutor helping a student practice academic speaking skills. 
             - Engage in academic discussions on various topics
             - Gently correct any grammar or pronunciation errors
             - Suggest more academic ways to express ideas
             - Ask follow-up questions to encourage more speaking
             - Use clear, articulate speech at a moderate pace`
                    : `You are a friendly English conversation partner for casual chat practice.
             - Have natural, everyday conversations
             - Use common idioms and expressions
             - Gently correct any errors
             - Keep the conversation flowing naturally
             - Be encouraging and supportive`
            })
        });

        if (!tokenResponse.ok) {
            const errorData = await tokenResponse.json().catch(() => ({}));
            console.error("OpenAI Realtime token error:", errorData);
            return new Response(JSON.stringify({
                error: errorData.error?.message || "Failed to create realtime session"
            }), {
                status: tokenResponse.status,
                headers
            });
        }

        const sessionData = await tokenResponse.json();

        // Generate unique session ID
        const sessionId = `speak_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;

        return new Response(JSON.stringify({
            token: sessionData.client_secret?.value || sessionData.token,
            sessionId: sessionId,
            expiresAt: sessionData.expires_at
        }), {
            status: 200,
            headers
        });

    } catch (error) {
        console.error("Realtime token error:", error);
        return new Response(JSON.stringify({
            error: "Internal server error",
            message: error.message
        }), {
            status: 500,
            headers
        });
    }
};
