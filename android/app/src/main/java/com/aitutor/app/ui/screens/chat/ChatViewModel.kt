package com.aitutor.app.ui.screens.chat

import androidx.lifecycle.ViewModel
import androidx.lifecycle.viewModelScope
import com.aitutor.app.domain.model.ChatMessage
import com.aitutor.app.domain.model.TutorMode
import com.aitutor.app.domain.repository.ChatRepository
import dagger.hilt.android.lifecycle.HiltViewModel
import kotlinx.coroutines.flow.MutableStateFlow
import kotlinx.coroutines.flow.StateFlow
import kotlinx.coroutines.flow.asStateFlow
import kotlinx.coroutines.flow.update
import kotlinx.coroutines.launch
import java.util.UUID
import javax.inject.Inject

data class ChatUiState(
    val mode: TutorMode = TutorMode.CHAT,
    val messages: List<ChatMessage> = emptyList(),
    val isAwaiting: Boolean = false,
    val errorMessage: String? = null
)

@HiltViewModel
class ChatViewModel @Inject constructor(
    private val repository: ChatRepository
) : ViewModel() {

    private val _state = MutableStateFlow(ChatUiState())
    val state: StateFlow<ChatUiState> = _state.asStateFlow()

    fun setMode(mode: TutorMode) {
        _state.update { it.copy(mode = mode, messages = emptyList(), errorMessage = null) }
    }

    fun send(text: String) {
        val trimmed = text.trim()
        if (trimmed.isEmpty() || _state.value.isAwaiting) return

        val userMsg = ChatMessage(UUID.randomUUID().toString(), ChatMessage.Role.USER, trimmed)
        _state.update {
            it.copy(messages = it.messages + userMsg, isAwaiting = true, errorMessage = null)
        }

        viewModelScope.launch {
            val mode = _state.value.mode
            val history = _state.value.messages
            repository.ask(mode, history.dropLast(1), trimmed)
                .onSuccess { reply ->
                    val ai = ChatMessage(UUID.randomUUID().toString(), ChatMessage.Role.ASSISTANT, reply)
                    _state.update { it.copy(messages = it.messages + ai, isAwaiting = false) }
                }
                .onFailure { e ->
                    _state.update {
                        it.copy(
                            isAwaiting = false,
                            errorMessage = e.message ?: "AI tutor is not responding"
                        )
                    }
                }
        }
    }

    fun clearError() = _state.update { it.copy(errorMessage = null) }
}
