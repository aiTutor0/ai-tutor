// js/services/speakService.js
// Real-time speaking service using OpenAI Realtime API

import { supabase } from "../config/supabaseClient.js";

// ======================================
// REALTIME CLIENT CLASS
// ======================================

class RealtimeClient {
    constructor() {
        this.peerConnection = null;
        this.dataChannel = null;
        this.audioElement = null;
        this.mediaStream = null;
        this.sessionId = null;
        this.mode = null;
        this.startTime = null;
        this.transcript = [];
        this.corrections = [];
        this.isConnected = false;

        // Event callbacks
        this.onTranscriptUpdate = null;
        this.onCorrectionReceived = null;
        this.onAISpeaking = null;
        this.onAIStopped = null;
        this.onConnectionChange = null;
        this.onError = null;
    }

    async connect(mode = 'academic') {
        this.mode = mode;
        this.startTime = new Date();

        try {
            // Get ephemeral token from server
            const tokenResponse = await fetch('/api/realtime-token', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ mode })
            });

            if (!tokenResponse.ok) {
                const error = await tokenResponse.json();
                throw new Error(error.error || 'Failed to get realtime token');
            }

            const { token, sessionId } = await tokenResponse.json();
            this.sessionId = sessionId;

            // Create peer connection
            this.peerConnection = new RTCPeerConnection();

            // Set up audio element for AI response
            this.audioElement = document.createElement('audio');
            this.audioElement.autoplay = true;

            // Handle incoming audio track
            this.peerConnection.ontrack = (event) => {
                this.audioElement.srcObject = event.streams[0];
                if (this.onAISpeaking) this.onAISpeaking();
            };

            // Get user's microphone
            this.mediaStream = await navigator.mediaDevices.getUserMedia({
                audio: {
                    echoCancellation: true,
                    noiseSuppression: true,
                    autoGainControl: true
                }
            });

            // Add audio track to peer connection
            this.mediaStream.getTracks().forEach(track => {
                this.peerConnection.addTrack(track, this.mediaStream);
            });

            // Create data channel for events
            this.dataChannel = this.peerConnection.createDataChannel('oai-events');
            this.setupDataChannelHandlers();

            // Create and set local description
            const offer = await this.peerConnection.createOffer();
            await this.peerConnection.setLocalDescription(offer);

            // Send offer to OpenAI and get answer
            const sdpResponse = await fetch(`https://api.openai.com/v1/realtime?model=gpt-4o-realtime-preview-2024-12-17`, {
                method: 'POST',
                headers: {
                    'Authorization': `Bearer ${token}`,
                    'Content-Type': 'application/sdp'
                },
                body: offer.sdp
            });

            if (!sdpResponse.ok) {
                throw new Error('Failed to establish WebRTC connection');
            }

            const answerSdp = await sdpResponse.text();
            await this.peerConnection.setRemoteDescription({
                type: 'answer',
                sdp: answerSdp
            });

            this.isConnected = true;
            if (this.onConnectionChange) this.onConnectionChange(true);

            // Handle connection state changes
            this.peerConnection.onconnectionstatechange = () => {
                if (this.peerConnection.connectionState === 'disconnected' ||
                    this.peerConnection.connectionState === 'failed') {
                    this.handleDisconnect();
                }
            };

            return { success: true, sessionId: this.sessionId };

        } catch (error) {
            console.error('Realtime connection error:', error);
            if (this.onError) this.onError(error.message);
            return { success: false, error: error.message };
        }
    }

    setupDataChannelHandlers() {
        this.dataChannel.onopen = () => {
            console.log('Data channel opened');
            // Send initial greeting prompt
            this.sendEvent({
                type: 'response.create',
                response: {
                    modalities: ['text', 'audio'],
                    instructions: this.mode === 'academic'
                        ? 'Greet the user formally and ask what academic topic they would like to practice discussing today.'
                        : 'Greet the user casually and ask what they want to chat about today.'
                }
            });
        };

        this.dataChannel.onmessage = (event) => {
            try {
                const data = JSON.parse(event.data);
                this.handleRealtimeEvent(data);
            } catch (error) {
                console.error('Failed to parse realtime event:', error);
            }
        };

        this.dataChannel.onerror = (error) => {
            console.error('Data channel error:', error);
            if (this.onError) this.onError('Data channel error');
        };
    }

    handleRealtimeEvent(event) {
        switch (event.type) {
            case 'conversation.item.input_audio_transcription.completed':
                // User's speech transcribed
                const userText = event.transcript;
                if (userText) {
                    this.transcript.push({ role: 'user', content: userText, timestamp: new Date() });
                    if (this.onTranscriptUpdate) {
                        this.onTranscriptUpdate('user', userText);
                    }
                }
                break;

            case 'response.audio_transcript.delta':
                // AI is speaking - streaming transcript
                if (this.onTranscriptUpdate && event.delta) {
                    this.onTranscriptUpdate('assistant_delta', event.delta);
                }
                break;

            case 'response.audio_transcript.done':
                // AI finished speaking
                const aiText = event.transcript;
                if (aiText) {
                    this.transcript.push({ role: 'assistant', content: aiText, timestamp: new Date() });
                    if (this.onTranscriptUpdate) {
                        this.onTranscriptUpdate('assistant', aiText);
                    }
                    // Check for corrections in the response
                    this.extractCorrections(aiText);
                }
                if (this.onAIStopped) this.onAIStopped();
                break;

            case 'response.done':
                if (this.onAIStopped) this.onAIStopped();
                break;

            case 'error':
                console.error('Realtime API error:', event.error);
                if (this.onError) this.onError(event.error?.message || 'Unknown error');
                break;
        }
    }

    extractCorrections(text) {
        // Look for correction patterns in AI response
        const correctionPatterns = [
            /(?:A more academic way|Native speakers usually say|You could say|Try saying|Instead of saying|A better way)/i
        ];

        for (const pattern of correctionPatterns) {
            if (pattern.test(text)) {
                this.corrections.push({
                    text: text,
                    timestamp: new Date()
                });
                if (this.onCorrectionReceived) {
                    this.onCorrectionReceived(text);
                }
                break;
            }
        }
    }

    sendEvent(event) {
        if (this.dataChannel && this.dataChannel.readyState === 'open') {
            this.dataChannel.send(JSON.stringify(event));
        }
    }

    mute() {
        if (this.mediaStream) {
            this.mediaStream.getAudioTracks().forEach(track => {
                track.enabled = false;
            });
        }
    }

    unmute() {
        if (this.mediaStream) {
            this.mediaStream.getAudioTracks().forEach(track => {
                track.enabled = true;
            });
        }
    }

    handleDisconnect() {
        this.isConnected = false;
        if (this.onConnectionChange) this.onConnectionChange(false);
    }

    async disconnect() {
        // Calculate session duration
        const endTime = new Date();
        const durationSeconds = Math.floor((endTime - this.startTime) / 1000);

        // Save session to Supabase
        const sessionData = {
            mode: this.mode,
            durationSeconds,
            transcript: this.transcript,
            corrections: this.corrections
        };

        // Clean up WebRTC
        if (this.dataChannel) {
            this.dataChannel.close();
            this.dataChannel = null;
        }

        if (this.peerConnection) {
            this.peerConnection.close();
            this.peerConnection = null;
        }

        if (this.mediaStream) {
            this.mediaStream.getTracks().forEach(track => track.stop());
            this.mediaStream = null;
        }

        if (this.audioElement) {
            this.audioElement.srcObject = null;
            this.audioElement = null;
        }

        this.isConnected = false;
        if (this.onConnectionChange) this.onConnectionChange(false);

        // Save to database
        await saveSpeakSession(sessionData);

        return sessionData;
    }
}

// ======================================
// SUPABASE FUNCTIONS
// ======================================

export async function saveSpeakSession(sessionData) {
    if (!supabase) return { error: { message: "Supabase not connected" } };

    try {
        const { data: { user } } = await supabase.auth.getUser();
        if (!user) return { error: { message: "Not authenticated" } };

        // Save session
        const { data, error } = await supabase
            .from('speak_sessions')
            .insert({
                user_id: user.id,
                mode: sessionData.mode,
                duration_seconds: sessionData.durationSeconds,
                transcript: JSON.stringify(sessionData.transcript),
                corrections: JSON.stringify(sessionData.corrections)
            })
            .select()
            .single();

        if (error) {
            console.error('Error saving speak session:', error);
            return { error };
        }

        // Update statistics
        await updateSpeakStatistics(user.id, sessionData);

        return { data };

    } catch (error) {
        console.error('Save session error:', error);
        return { error };
    }
}

async function updateSpeakStatistics(userId, sessionData) {
    if (!supabase) return;

    try {
        // Get current stats
        const { data: currentStats } = await supabase
            .from('speak_statistics')
            .select('*')
            .eq('user_id', userId)
            .single();

        if (currentStats) {
            // Update existing stats
            await supabase
                .from('speak_statistics')
                .update({
                    total_sessions: currentStats.total_sessions + 1,
                    total_duration_seconds: currentStats.total_duration_seconds + sessionData.durationSeconds,
                    academic_sessions: sessionData.mode === 'academic'
                        ? currentStats.academic_sessions + 1
                        : currentStats.academic_sessions,
                    native_sessions: sessionData.mode === 'native'
                        ? currentStats.native_sessions + 1
                        : currentStats.native_sessions,
                    updated_at: new Date().toISOString()
                })
                .eq('user_id', userId);
        } else {
            // Create new stats record
            await supabase
                .from('speak_statistics')
                .insert({
                    user_id: userId,
                    total_sessions: 1,
                    total_duration_seconds: sessionData.durationSeconds,
                    academic_sessions: sessionData.mode === 'academic' ? 1 : 0,
                    native_sessions: sessionData.mode === 'native' ? 1 : 0
                });
        }
    } catch (error) {
        console.error('Update statistics error:', error);
    }
}

export async function getSpeakSessions() {
    if (!supabase) return { data: [], error: null };

    try {
        const { data: { user } } = await supabase.auth.getUser();
        if (!user) return { data: [], error: null };

        const { data, error } = await supabase
            .from('speak_sessions')
            .select('*')
            .eq('user_id', user.id)
            .order('created_at', { ascending: false })
            .limit(20);

        return { data: data || [], error };

    } catch (error) {
        console.error('Get sessions error:', error);
        return { data: [], error };
    }
}

export async function getSpeakStatistics() {
    if (!supabase) return { data: null, error: null };

    try {
        const { data: { user } } = await supabase.auth.getUser();
        if (!user) return { data: null, error: null };

        const { data, error } = await supabase
            .from('speak_statistics')
            .select('*')
            .eq('user_id', user.id)
            .single();

        return { data, error };

    } catch (error) {
        console.error('Get statistics error:', error);
        return { data: null, error };
    }
}

// ======================================
// EXPORTS
// ======================================

// Singleton instance
let realtimeClient = null;

export function getRealtimeClient() {
    if (!realtimeClient) {
        realtimeClient = new RealtimeClient();
    }
    return realtimeClient;
}

export function createNewRealtimeClient() {
    if (realtimeClient && realtimeClient.isConnected) {
        realtimeClient.disconnect();
    }
    realtimeClient = new RealtimeClient();
    return realtimeClient;
}

export { RealtimeClient };
