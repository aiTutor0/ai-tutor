package com.aitutor.app.ui.screens.writing

import androidx.lifecycle.ViewModel
import androidx.lifecycle.viewModelScope
import com.aitutor.app.data.local.UserPreferences
import com.aitutor.app.domain.model.ExamMode
import com.aitutor.app.domain.model.WritingEvaluation
import com.aitutor.app.domain.model.WritingTaskType
import com.aitutor.app.domain.model.WritingTopic
import com.aitutor.app.domain.repository.WritingRepository
import dagger.hilt.android.lifecycle.HiltViewModel
import kotlinx.coroutines.flow.MutableStateFlow
import kotlinx.coroutines.flow.StateFlow
import kotlinx.coroutines.flow.asStateFlow
import kotlinx.coroutines.launch
import javax.inject.Inject

sealed interface WritingState {
    data object PickingTask : WritingState
    data class Composing(
        val taskType: WritingTaskType,
        val topic: WritingTopic,
        val text: String = "",
        val startedAtMillis: Long = System.currentTimeMillis()
    ) : WritingState {
        val wordCount: Int
            get() = text.trim().split(Regex("\\s+")).filter { it.isNotEmpty() }.size
    }
    data class Evaluating(val taskType: WritingTaskType, val topic: WritingTopic, val text: String) : WritingState
    data class Result(
        val taskType: WritingTaskType,
        val topic: WritingTopic,
        val text: String,
        val evaluation: WritingEvaluation
    ) : WritingState
    data class Error(val message: String, val previous: WritingState) : WritingState
}

@HiltViewModel
class WritingViewModel @Inject constructor(
    private val repository: WritingRepository,
    private val userPreferences: UserPreferences
) : ViewModel() {
    private val _state = MutableStateFlow<WritingState>(WritingState.PickingTask)
    val state: StateFlow<WritingState> = _state.asStateFlow()

    fun pickTask(taskType: WritingTaskType) {
        val topic = repository.randomTopic(taskType)
        _state.value = WritingState.Composing(taskType, topic)
    }

    fun newTopic() {
        val s = _state.value
        if (s is WritingState.Composing) {
            _state.value = s.copy(topic = repository.randomTopic(s.taskType), text = "")
        }
    }

    fun updateText(text: String) {
        _state.value = (_state.value as? WritingState.Composing)?.copy(text = text) ?: _state.value
    }

    fun submit() {
        val s = _state.value as? WritingState.Composing ?: return
        if (s.wordCount < 50) {
            _state.value = WritingState.Error("Please write at least 50 words before submitting.", s)
            return
        }
        _state.value = WritingState.Evaluating(s.taskType, s.topic, s.text)
        viewModelScope.launch {
            repository.evaluate(s.topic, s.text)
                .onSuccess { evaluation ->
                    _state.value = WritingState.Result(s.taskType, s.topic, s.text, evaluation)
                    val xp = (evaluation.bandScore * 5).toInt().coerceAtLeast(5)
                    userPreferences.addXp(xp)
                    userPreferences.bumpStreakIfNeeded(System.currentTimeMillis())
                    repository.saveEssay(s.taskType, s.topic, s.text, evaluation)
                }
                .onFailure { e ->
                    _state.value = WritingState.Error(e.message ?: "Evaluation failed", s)
                }
        }
    }

    fun dismissError() {
        val s = _state.value as? WritingState.Error ?: return
        _state.value = s.previous
    }

    fun reset() {
        _state.value = WritingState.PickingTask
    }
}
