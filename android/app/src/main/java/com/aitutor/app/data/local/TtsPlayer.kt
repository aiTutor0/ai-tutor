package com.aitutor.app.data.local

import android.content.Context
import android.speech.tts.TextToSpeech
import android.speech.tts.UtteranceProgressListener
import dagger.hilt.android.qualifiers.ApplicationContext
import kotlinx.coroutines.flow.MutableStateFlow
import kotlinx.coroutines.flow.StateFlow
import kotlinx.coroutines.flow.asStateFlow
import java.util.Locale
import javax.inject.Inject
import javax.inject.Singleton

/**
 * Lightweight Android-native TTS for the Listening module. We use the
 * platform engine for offline reliability — Phase 11 will swap this for an
 * OpenAI TTS endpoint streamed via ExoPlayer.
 */
@Singleton
class TtsPlayer @Inject constructor(
    @ApplicationContext private val context: Context
) {
    private var tts: TextToSpeech? = null
    private val _isPlaying = MutableStateFlow(false)
    val isPlaying: StateFlow<Boolean> = _isPlaying.asStateFlow()

    private val _isReady = MutableStateFlow(false)
    val isReady: StateFlow<Boolean> = _isReady.asStateFlow()

    fun init(onReady: () -> Unit = {}) {
        if (tts != null) {
            if (_isReady.value) onReady()
            return
        }
        tts = TextToSpeech(context) { status ->
            if (status == TextToSpeech.SUCCESS) {
                tts?.language = Locale.US
                tts?.setSpeechRate(0.95f)
                _isReady.value = true
                tts?.setOnUtteranceProgressListener(object : UtteranceProgressListener() {
                    override fun onStart(utteranceId: String?) { _isPlaying.value = true }
                    override fun onDone(utteranceId: String?) { _isPlaying.value = false }
                    @Deprecated("legacy")
                    override fun onError(utteranceId: String?) { _isPlaying.value = false }
                    override fun onError(utteranceId: String?, errorCode: Int) { _isPlaying.value = false }
                })
                onReady()
            }
        }
    }

    fun speak(text: String) {
        val engine = tts ?: return
        if (_isPlaying.value) engine.stop()
        engine.speak(text, TextToSpeech.QUEUE_FLUSH, null, "aitutor-listening")
        _isPlaying.value = true
    }

    fun stop() {
        tts?.stop()
        _isPlaying.value = false
    }

    fun shutdown() {
        tts?.stop()
        tts?.shutdown()
        tts = null
        _isReady.value = false
        _isPlaying.value = false
    }
}
