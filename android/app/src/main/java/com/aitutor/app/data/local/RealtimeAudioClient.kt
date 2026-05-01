package com.aitutor.app.data.local

import android.content.Context
import com.aitutor.app.data.remote.AiProxyApi
import com.aitutor.app.domain.model.SpeakingMode
import com.aitutor.app.domain.model.SpeakingTurn
import dagger.hilt.android.qualifiers.ApplicationContext
import io.ktor.client.HttpClient
import io.ktor.client.engine.okhttp.OkHttp
import io.ktor.client.request.headers
import io.ktor.client.request.post
import io.ktor.client.request.setBody
import io.ktor.client.statement.bodyAsText
import io.ktor.http.ContentType
import io.ktor.http.HttpHeaders
import io.ktor.http.contentType
import kotlinx.coroutines.Dispatchers
import kotlinx.coroutines.flow.MutableStateFlow
import kotlinx.coroutines.flow.StateFlow
import kotlinx.coroutines.flow.asStateFlow
import kotlinx.coroutines.flow.update
import kotlinx.coroutines.withContext
import kotlinx.serialization.json.Json
import kotlinx.serialization.json.JsonObject
import kotlinx.serialization.json.JsonPrimitive
import kotlinx.serialization.json.buildJsonObject
import kotlinx.serialization.json.put
import org.webrtc.AudioTrack
import org.webrtc.DataChannel
import org.webrtc.DefaultVideoDecoderFactory
import org.webrtc.DefaultVideoEncoderFactory
import org.webrtc.EglBase
import org.webrtc.IceCandidate
import org.webrtc.MediaConstraints
import org.webrtc.MediaStream
import org.webrtc.PeerConnection
import org.webrtc.PeerConnectionFactory
import org.webrtc.RtpReceiver
import org.webrtc.SdpObserver
import org.webrtc.SessionDescription
import java.nio.charset.Charset
import javax.inject.Inject
import javax.inject.Singleton

/**
 * WebRTC client that talks to OpenAI Realtime API for live voice sessions.
 *
 * Flow:
 *   1. Ask Edge Function for an ephemeral token (server-side OPENAI key).
 *   2. Build a PeerConnection, add local mic track, open a DataChannel.
 *   3. POST our SDP offer to OpenAI Realtime, set remote answer.
 *   4. Stream user/AI audio + transcripts via the data channel.
 *
 * The lifetime is short — one session per disconnect call.
 */
@Singleton
class RealtimeAudioClient @Inject constructor(
    @ApplicationContext private val context: Context,
    private val ai: AiProxyApi
) {
    private val json = Json { ignoreUnknownKeys = true }
    private val http = HttpClient(OkHttp)

    private var factory: PeerConnectionFactory? = null
    private var peerConnection: PeerConnection? = null
    private var dataChannel: DataChannel? = null
    private var localAudioTrack: AudioTrack? = null
    private var eglBase: EglBase? = null

    private val _isConnected = MutableStateFlow(false)
    val isConnected: StateFlow<Boolean> = _isConnected.asStateFlow()

    private val _isAiSpeaking = MutableStateFlow(false)
    val isAiSpeaking: StateFlow<Boolean> = _isAiSpeaking.asStateFlow()

    private val _transcript = MutableStateFlow<List<SpeakingTurn>>(emptyList())
    val transcript: StateFlow<List<SpeakingTurn>> = _transcript.asStateFlow()

    private val _error = MutableStateFlow<String?>(null)
    val error: StateFlow<String?> = _error.asStateFlow()

    suspend fun connect(mode: SpeakingMode) = withContext(Dispatchers.IO) {
        try {
            val tokenResp = ai.createRealtimeToken(mode.wire)

            initFactory()
            val factory = factory!!

            val rtcConfig = PeerConnection.RTCConfiguration(emptyList())
            val pc = factory.createPeerConnection(rtcConfig, peerObserver())
                ?: error("Failed to create PeerConnection")
            peerConnection = pc

            val audioSource = factory.createAudioSource(MediaConstraints().apply {
                mandatory.add(MediaConstraints.KeyValuePair("googEchoCancellation", "true"))
                mandatory.add(MediaConstraints.KeyValuePair("googAutoGainControl", "true"))
                mandatory.add(MediaConstraints.KeyValuePair("googNoiseSuppression", "true"))
            })
            val track = factory.createAudioTrack("ai-tutor-mic", audioSource)
            localAudioTrack = track
            pc.addTrack(track, listOf("ai-tutor-stream"))

            val dc = pc.createDataChannel("oai-events", DataChannel.Init())
            dataChannel = dc
            dc.registerObserver(dataChannelObserver(mode))

            val offer = createOffer(pc)
            setLocalDescription(pc, offer)

            // Send offer to OpenAI Realtime endpoint
            val answerSdp = http.post("https://api.openai.com/v1/realtime?model=gpt-4o-realtime-preview-2024-12-17") {
                headers {
                    append(HttpHeaders.Authorization, "Bearer ${tokenResp.token}")
                }
                contentType(ContentType("application", "sdp"))
                setBody(offer.description)
            }.bodyAsText()

            setRemoteDescription(pc, SessionDescription(SessionDescription.Type.ANSWER, answerSdp))
            _isConnected.value = true
        } catch (t: Throwable) {
            _error.value = t.message
            cleanup()
        }
    }

    fun mute() { localAudioTrack?.setEnabled(false) }
    fun unmute() { localAudioTrack?.setEnabled(true) }

    fun disconnect() {
        cleanup()
    }

    private fun cleanup() {
        try { dataChannel?.close() } catch (_: Throwable) {}
        try { peerConnection?.close() } catch (_: Throwable) {}
        dataChannel = null
        peerConnection = null
        localAudioTrack = null
        _isConnected.value = false
        _isAiSpeaking.value = false
    }

    private fun initFactory() {
        if (factory != null) return
        eglBase = EglBase.create()
        PeerConnectionFactory.initialize(
            PeerConnectionFactory.InitializationOptions.builder(context)
                .createInitializationOptions()
        )
        factory = PeerConnectionFactory.builder()
            .setVideoEncoderFactory(DefaultVideoEncoderFactory(eglBase!!.eglBaseContext, true, true))
            .setVideoDecoderFactory(DefaultVideoDecoderFactory(eglBase!!.eglBaseContext))
            .createPeerConnectionFactory()
    }

    private fun peerObserver() = object : PeerConnection.Observer {
        override fun onIceCandidate(candidate: IceCandidate?) {}
        override fun onIceCandidatesRemoved(candidates: Array<out IceCandidate>?) {}
        override fun onSignalingChange(state: PeerConnection.SignalingState?) {}
        override fun onIceConnectionChange(state: PeerConnection.IceConnectionState?) {
            if (state == PeerConnection.IceConnectionState.DISCONNECTED ||
                state == PeerConnection.IceConnectionState.FAILED
            ) cleanup()
        }
        override fun onIceConnectionReceivingChange(p0: Boolean) {}
        override fun onIceGatheringChange(state: PeerConnection.IceGatheringState?) {}
        override fun onAddStream(stream: MediaStream?) {
            // OpenAI's audio comes back here; PeerConnectionFactory's default
            // audio device plays it through the speaker automatically.
            stream?.audioTracks?.forEach { it.setEnabled(true) }
        }
        override fun onRemoveStream(stream: MediaStream?) {}
        override fun onAddTrack(receiver: RtpReceiver?, streams: Array<out MediaStream>?) {}
        override fun onDataChannel(channel: DataChannel?) {}
        override fun onRenegotiationNeeded() {}
    }

    private fun dataChannelObserver(mode: SpeakingMode) = object : DataChannel.Observer {
        override fun onBufferedAmountChange(p0: Long) {}
        override fun onStateChange() {
            if (dataChannel?.state() == DataChannel.State.OPEN) {
                // Ask the model to greet the user
                val greet = buildJsonObject {
                    put("type", "response.create")
                    put("response", buildJsonObject {
                        put("modalities", kotlinx.serialization.json.JsonArray(
                            listOf(JsonPrimitive("text"), JsonPrimitive("audio"))
                        ))
                        put(
                            "instructions",
                            JsonPrimitive(
                                if (mode == SpeakingMode.ACADEMIC)
                                    "Greet the user formally and ask what academic topic they would like to discuss today."
                                else
                                    "Greet the user casually and ask what they want to chat about today."
                            )
                        )
                    })
                }
                send(greet)
            }
        }

        override fun onMessage(buffer: DataChannel.Buffer?) {
            val text = buffer?.data?.let { bb ->
                val bytes = ByteArray(bb.remaining())
                bb.get(bytes)
                String(bytes, Charset.forName("UTF-8"))
            } ?: return
            val event = runCatching { json.parseToJsonElement(text) as? JsonObject }.getOrNull() ?: return
            handleEvent(event)
        }
    }

    private fun handleEvent(event: JsonObject) {
        when ((event["type"] as? JsonPrimitive)?.content) {
            "conversation.item.input_audio_transcription.completed" -> {
                val t = (event["transcript"] as? JsonPrimitive)?.content?.takeIf { it.isNotBlank() }
                if (t != null) appendTurn(SpeakingTurn.Role.USER, t)
            }
            "response.audio_transcript.done" -> {
                val t = (event["transcript"] as? JsonPrimitive)?.content?.takeIf { it.isNotBlank() }
                if (t != null) appendTurn(SpeakingTurn.Role.ASSISTANT, t)
                _isAiSpeaking.value = false
            }
            "response.created" -> _isAiSpeaking.value = true
            "response.done" -> _isAiSpeaking.value = false
            "error" -> {
                val msg = ((event["error"] as? JsonObject)?.get("message") as? JsonPrimitive)?.content
                _error.value = msg ?: "Realtime error"
            }
        }
    }

    private fun appendTurn(role: SpeakingTurn.Role, content: String) {
        _transcript.update { it + SpeakingTurn(role, content) }
    }

    private fun send(obj: JsonObject) {
        val data = obj.toString().toByteArray(Charset.forName("UTF-8"))
        val bb = java.nio.ByteBuffer.wrap(data)
        dataChannel?.send(DataChannel.Buffer(bb, false))
    }

    // ── SDP helpers ────────────────────────────────────────────────────────
    private suspend fun createOffer(pc: PeerConnection): SessionDescription =
        kotlinx.coroutines.suspendCancellableCoroutine { cont ->
            pc.createOffer(object : SdpObserver {
                override fun onCreateSuccess(sdp: SessionDescription?) {
                    if (sdp != null) cont.resumeWith(Result.success(sdp))
                    else cont.resumeWith(Result.failure(IllegalStateException("Empty offer")))
                }
                override fun onSetSuccess() {}
                override fun onCreateFailure(reason: String?) {
                    cont.resumeWith(Result.failure(IllegalStateException(reason ?: "createOffer failed")))
                }
                override fun onSetFailure(reason: String?) {}
            }, MediaConstraints().apply {
                mandatory.add(MediaConstraints.KeyValuePair("OfferToReceiveAudio", "true"))
            })
        }

    private suspend fun setLocalDescription(pc: PeerConnection, desc: SessionDescription) =
        kotlinx.coroutines.suspendCancellableCoroutine<Unit> { cont ->
            pc.setLocalDescription(object : SdpObserver {
                override fun onCreateSuccess(p0: SessionDescription?) {}
                override fun onSetSuccess() { cont.resumeWith(Result.success(Unit)) }
                override fun onCreateFailure(p0: String?) {}
                override fun onSetFailure(reason: String?) {
                    cont.resumeWith(Result.failure(IllegalStateException(reason ?: "setLocal failed")))
                }
            }, desc)
        }

    private suspend fun setRemoteDescription(pc: PeerConnection, desc: SessionDescription) =
        kotlinx.coroutines.suspendCancellableCoroutine<Unit> { cont ->
            pc.setRemoteDescription(object : SdpObserver {
                override fun onCreateSuccess(p0: SessionDescription?) {}
                override fun onSetSuccess() { cont.resumeWith(Result.success(Unit)) }
                override fun onCreateFailure(p0: String?) {}
                override fun onSetFailure(reason: String?) {
                    cont.resumeWith(Result.failure(IllegalStateException(reason ?: "setRemote failed")))
                }
            }, desc)
        }
}
