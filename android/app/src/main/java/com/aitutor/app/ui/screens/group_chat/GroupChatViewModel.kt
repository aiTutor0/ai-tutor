package com.aitutor.app.ui.screens.group_chat

import androidx.lifecycle.ViewModel
import androidx.lifecycle.viewModelScope
import com.aitutor.app.domain.model.GroupMessage
import com.aitutor.app.domain.model.Room
import com.aitutor.app.domain.repository.GroupChatRepository
import dagger.hilt.android.lifecycle.HiltViewModel
import kotlinx.coroutines.Job
import kotlinx.coroutines.flow.MutableStateFlow
import kotlinx.coroutines.flow.StateFlow
import kotlinx.coroutines.flow.asStateFlow
import kotlinx.coroutines.flow.update
import kotlinx.coroutines.launch
import javax.inject.Inject

data class GroupChatState(
    val rooms: List<Room> = emptyList(),
    val activeRoom: Room? = null,
    val messages: List<GroupMessage> = emptyList(),
    val isLoading: Boolean = false,
    val errorMessage: String? = null
)

@HiltViewModel
class GroupChatViewModel @Inject constructor(
    private val repository: GroupChatRepository
) : ViewModel() {
    private val _state = MutableStateFlow(GroupChatState())
    val state: StateFlow<GroupChatState> = _state.asStateFlow()

    private var observeJob: Job? = null

    init {
        refreshRooms()
    }

    fun refreshRooms() {
        _state.update { it.copy(isLoading = true) }
        viewModelScope.launch {
            repository.listRooms()
                .onSuccess { rooms -> _state.update { it.copy(rooms = rooms, isLoading = false) } }
                .onFailure { e ->
                    _state.update {
                        it.copy(isLoading = false, errorMessage = e.message ?: "Couldn't load rooms")
                    }
                }
        }
    }

    fun createRoom(name: String) {
        if (name.isBlank()) return
        viewModelScope.launch {
            repository.createRoom(name)
                .onSuccess { room ->
                    _state.update { it.copy(rooms = it.rooms + room) }
                    enterRoom(room)
                }
                .onFailure { e ->
                    _state.update { it.copy(errorMessage = e.message ?: "Couldn't create room") }
                }
        }
    }

    fun enterRoom(room: Room) {
        observeJob?.cancel()
        _state.update { it.copy(activeRoom = room, messages = emptyList()) }
        viewModelScope.launch { repository.joinRoom(room.id) }
        observeJob = viewModelScope.launch {
            repository.observeMessages(room.id).collect { msgs ->
                _state.update { it.copy(messages = msgs) }
            }
        }
    }

    fun leaveRoom() {
        observeJob?.cancel()
        observeJob = null
        _state.update { it.copy(activeRoom = null, messages = emptyList()) }
    }

    fun send(text: String) {
        val room = _state.value.activeRoom ?: return
        viewModelScope.launch { repository.sendMessage(room.id, text) }
    }

    fun clearError() = _state.update { it.copy(errorMessage = null) }

    override fun onCleared() {
        observeJob?.cancel()
    }
}
