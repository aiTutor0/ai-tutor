package com.aitutor.app.ui.screens.reading

import androidx.lifecycle.ViewModel
import androidx.lifecycle.viewModelScope
import com.aitutor.app.data.local.UserPreferences
import com.aitutor.app.domain.model.ExamMode
import com.aitutor.app.domain.model.ReadingPassage
import com.aitutor.app.domain.model.ReadingResult
import com.aitutor.app.domain.repository.ReadingRepository
import com.aitutor.app.domain.usecase.GradeReadingAnswersUseCase
import dagger.hilt.android.lifecycle.HiltViewModel
import kotlinx.coroutines.flow.MutableStateFlow
import kotlinx.coroutines.flow.StateFlow
import kotlinx.coroutines.flow.asStateFlow
import kotlinx.coroutines.flow.first
import kotlinx.coroutines.flow.update
import kotlinx.coroutines.launch
import javax.inject.Inject

sealed interface ReadingState {
    data object Idle : ReadingState
    data object Loading : ReadingState
    data class Error(val message: String) : ReadingState
    data class InProgress(
        val passage: ReadingPassage,
        val currentQuestion: Int = 0,
        val answers: List<String> = List(passage.questions.size) { "" },
        val startedAtMillis: Long = System.currentTimeMillis(),
        val phase: Phase = Phase.READING
    ) : ReadingState {
        enum class Phase { READING, ANSWERING }
    }
    data class Finished(
        val passage: ReadingPassage,
        val result: ReadingResult,
        val answers: List<String>
    ) : ReadingState
}

@HiltViewModel
class ReadingViewModel @Inject constructor(
    private val repository: ReadingRepository,
    private val grader: GradeReadingAnswersUseCase,
    private val userPreferences: UserPreferences
) : ViewModel() {

    private val _state = MutableStateFlow<ReadingState>(ReadingState.Idle)
    val state: StateFlow<ReadingState> = _state.asStateFlow()

    fun start(examMode: ExamMode) {
        if (_state.value is ReadingState.Loading) return
        _state.value = ReadingState.Loading
        viewModelScope.launch {
            repository.generatePassage(examMode)
                .onSuccess { _state.value = ReadingState.InProgress(passage = it) }
                .onFailure { e ->
                    _state.value = ReadingState.Error(e.message ?: "Failed to load passage")
                }
        }
    }

    fun goToQuestions() {
        val s = _state.value as? ReadingState.InProgress ?: return
        _state.value = s.copy(phase = ReadingState.InProgress.Phase.ANSWERING)
    }

    fun answer(questionIndex: Int, value: String) {
        _state.update { current ->
            if (current is ReadingState.InProgress) {
                val updated = current.answers.toMutableList()
                if (questionIndex in updated.indices) updated[questionIndex] = value
                current.copy(answers = updated)
            } else current
        }
    }

    fun next() = _state.update { current ->
        if (current is ReadingState.InProgress &&
            current.currentQuestion < current.passage.questions.lastIndex
        ) current.copy(currentQuestion = current.currentQuestion + 1) else current
    }

    fun previous() = _state.update { current ->
        if (current is ReadingState.InProgress && current.currentQuestion > 0)
            current.copy(currentQuestion = current.currentQuestion - 1) else current
    }

    fun submit(examMode: ExamMode) {
        val s = _state.value as? ReadingState.InProgress ?: return
        val elapsed = (System.currentTimeMillis() - s.startedAtMillis) / 1000
        val result = grader(s.passage, s.answers, elapsed)
        _state.value = ReadingState.Finished(s.passage, result, s.answers)
        viewModelScope.launch {
            // Reward XP, refresh streak
            userPreferences.addXp(result.xpEarned)
            userPreferences.bumpStreakIfNeeded(System.currentTimeMillis())
            // Lose a heart per wrong answer (clamped to 0)
            repeat((result.totalQuestions - result.correctCount).coerceAtMost(2)) {
                userPreferences.loseHeart()
            }
            // Best-effort save
            repository.saveSession(
                examMode = examMode,
                passage = s.passage,
                userAnswers = s.answers,
                result = result,
                timeLimitSeconds = TIME_LIMIT_SECONDS
            )
        }
    }

    fun restart() {
        _state.value = ReadingState.Idle
    }

    companion object {
        const val TIME_LIMIT_SECONDS = 20 * 60
    }
}
