package com.aitutor.app.ui.screens.schedule

import androidx.lifecycle.ViewModel
import androidx.lifecycle.viewModelScope
import com.aitutor.app.domain.model.StudySession
import com.aitutor.app.domain.repository.ScheduleRepository
import dagger.hilt.android.lifecycle.HiltViewModel
import kotlinx.coroutines.flow.MutableStateFlow
import kotlinx.coroutines.flow.StateFlow
import kotlinx.coroutines.flow.asStateFlow
import kotlinx.coroutines.flow.update
import kotlinx.coroutines.launch
import javax.inject.Inject

data class ScheduleUiState(
    val sessions: List<StudySession> = emptyList(),
    val isLoading: Boolean = false,
    val errorMessage: String? = null
)

@HiltViewModel
class ScheduleViewModel @Inject constructor(
    private val repository: ScheduleRepository
) : ViewModel() {
    private val _state = MutableStateFlow(ScheduleUiState())
    val state: StateFlow<ScheduleUiState> = _state.asStateFlow()

    init { refresh() }

    fun refresh() {
        _state.update { it.copy(isLoading = true) }
        viewModelScope.launch {
            repository.upcoming()
                .onSuccess { list ->
                    _state.update { it.copy(sessions = list, isLoading = false) }
                }
                .onFailure { e ->
                    _state.update { it.copy(isLoading = false, errorMessage = e.message) }
                }
        }
    }

    fun add(title: String, notes: String?, scheduledForIso: String) {
        viewModelScope.launch {
            repository.add(title, notes, scheduledForIso)
                .onSuccess { newSession ->
                    _state.update { it.copy(sessions = (it.sessions + newSession).sortedBy { s -> s.scheduledFor }) }
                }
                .onFailure { e -> _state.update { it.copy(errorMessage = e.message) } }
        }
    }

    fun remove(id: String) {
        viewModelScope.launch {
            repository.remove(id).onSuccess {
                _state.update { it.copy(sessions = it.sessions.filter { s -> s.id != id }) }
            }
        }
    }

    fun clearError() = _state.update { it.copy(errorMessage = null) }
}
