package com.aitutor.app.ui.screens.speaking

import androidx.lifecycle.ViewModel
import androidx.lifecycle.viewModelScope
import com.aitutor.app.data.local.RealtimeAudioClient
import com.aitutor.app.data.local.UserPreferences
import com.aitutor.app.domain.model.ExamMode
import com.aitutor.app.domain.model.SpeakingMode
import com.aitutor.app.domain.model.SpeakingTurn
import dagger.hilt.android.lifecycle.HiltViewModel
import kotlinx.coroutines.flow.MutableStateFlow
import kotlinx.coroutines.flow.SharingStarted
import kotlinx.coroutines.flow.StateFlow
import kotlinx.coroutines.flow.asStateFlow
import kotlinx.coroutines.flow.stateIn
import kotlinx.coroutines.launch
import javax.inject.Inject

data class SpeakingUiState(
    val mode: SpeakingMode = SpeakingMode.ACADEMIC,
    val isConnecting: Boolean = false,
    val isConnected: Boolean = false,
    val isAiSpeaking: Boolean = false,
    val isMuted: Boolean = false,
    val transcript: List<SpeakingTurn> = emptyList(),
    val errorMessage: String? = null
)

@HiltViewModel
class SpeakingViewModel @Inject constructor(
    private val client: RealtimeAudioClient,
    private val userPreferences: UserPreferences
) : ViewModel() {
    private val _state = MutableStateFlow(SpeakingUiState())
    val state: StateFlow<SpeakingUiState> = _state.asStateFlow()

    init {
        viewModelScope.launch {
            client.isConnected.collect { conn ->
                _state.value = _state.value.copy(isConnected = conn)
            }
        }
        viewModelScope.launch {
            client.isAiSpeaking.collect { sp ->
                _state.value = _state.value.copy(isAiSpeaking = sp)
            }
        }
        viewModelScope.launch {
            client.transcript.collect { tr ->
                _state.value = _state.value.copy(transcript = tr)
            }
        }
        viewModelScope.launch {
            client.error.collect { e ->
                if (e != null) _state.value = _state.value.copy(errorMessage = e)
            }
        }
    }

    fun setMode(mode: SpeakingMode) {
        _state.value = _state.value.copy(mode = mode)
    }

    fun connect(examMode: ExamMode) {
        if (_state.value.isConnecting || _state.value.isConnected) return
        _state.value = _state.value.copy(isConnecting = true, errorMessage = null)
        viewModelScope.launch {
            client.connect(_state.value.mode)
            _state.value = _state.value.copy(isConnecting = false)
            userPreferences.bumpStreakIfNeeded(System.currentTimeMillis())
            userPreferences.addXp(15)
        }
    }

    fun toggleMute() {
        val muted = !_state.value.isMuted
        if (muted) client.mute() else client.unmute()
        _state.value = _state.value.copy(isMuted = muted)
    }

    fun disconnect() {
        client.disconnect()
        _state.value = _state.value.copy(isConnected = false, isAiSpeaking = false)
    }

    fun clearError() = _state.value.copy(errorMessage = null)
        .also { _state.value = it }

    override fun onCleared() {
        client.disconnect()
    }
}
