package com.aitutor.app.ui.screens.listening

import androidx.lifecycle.ViewModel
import androidx.lifecycle.viewModelScope
import com.aitutor.app.data.local.TtsPlayer
import com.aitutor.app.data.local.UserPreferences
import com.aitutor.app.domain.model.ExamMode
import com.aitutor.app.domain.model.ListeningContent
import com.aitutor.app.domain.model.ReadingPassage
import com.aitutor.app.domain.model.ReadingResult
import com.aitutor.app.domain.repository.ListeningRepository
import com.aitutor.app.domain.usecase.GradeReadingAnswersUseCase
import dagger.hilt.android.lifecycle.HiltViewModel
import kotlinx.coroutines.flow.MutableStateFlow
import kotlinx.coroutines.flow.StateFlow
import kotlinx.coroutines.flow.asStateFlow
import kotlinx.coroutines.flow.update
import kotlinx.coroutines.launch
import javax.inject.Inject

sealed interface ListeningState {
    data object Idle : ListeningState
    data object Loading : ListeningState
    data class Error(val message: String) : ListeningState
    data class Playing(
        val content: ListeningContent,
        val playedOnce: Boolean = false
    ) : ListeningState
    data class Answering(
        val content: ListeningContent,
        val currentQuestion: Int = 0,
        val answers: List<String> = List(content.questions.size) { "" },
        val startedAtMillis: Long = System.currentTimeMillis()
    ) : ListeningState
    data class Finished(
        val content: ListeningContent,
        val result: ReadingResult,
        val answers: List<String>
    ) : ListeningState
}

@HiltViewModel
class ListeningViewModel @Inject constructor(
    private val repository: ListeningRepository,
    private val grader: GradeReadingAnswersUseCase,
    private val userPreferences: UserPreferences,
    val tts: TtsPlayer
) : ViewModel() {

    private val _state = MutableStateFlow<ListeningState>(ListeningState.Idle)
    val state: StateFlow<ListeningState> = _state.asStateFlow()

    init {
        tts.init()
    }

    fun start(examMode: ExamMode) {
        if (_state.value is ListeningState.Loading) return
        _state.value = ListeningState.Loading
        viewModelScope.launch {
            repository.generateContent(examMode)
                .onSuccess { _state.value = ListeningState.Playing(content = it) }
                .onFailure { e ->
                    _state.value = ListeningState.Error(e.message ?: "Failed to load lecture")
                }
        }
    }

    fun playAudio() {
        val s = _state.value as? ListeningState.Playing ?: return
        tts.speak(s.content.transcript)
        _state.update { (it as ListeningState.Playing).copy(playedOnce = true) }
    }

    fun stopAudio() = tts.stop()

    fun goToQuestions() {
        val s = _state.value as? ListeningState.Playing ?: return
        tts.stop()
        _state.value = ListeningState.Answering(content = s.content)
    }

    fun answer(idx: Int, value: String) = _state.update { current ->
        if (current is ListeningState.Answering) {
            val updated = current.answers.toMutableList()
            if (idx in updated.indices) updated[idx] = value
            current.copy(answers = updated)
        } else current
    }

    fun next() = _state.update { current ->
        if (current is ListeningState.Answering &&
            current.currentQuestion < current.content.questions.lastIndex
        ) current.copy(currentQuestion = current.currentQuestion + 1) else current
    }

    fun previous() = _state.update { current ->
        if (current is ListeningState.Answering && current.currentQuestion > 0)
            current.copy(currentQuestion = current.currentQuestion - 1) else current
    }

    fun submit(examMode: ExamMode) {
        val s = _state.value as? ListeningState.Answering ?: return
        val elapsed = (System.currentTimeMillis() - s.startedAtMillis) / 1000
        val passageShim = ReadingPassage(
            title = s.content.title,
            passage = s.content.transcript,
            wordCount = s.content.wordCount.coerceAtLeast(1),
            questions = s.content.questions
        )
        val result = grader(passageShim, s.answers, elapsed)
        _state.value = ListeningState.Finished(s.content, result, s.answers)
        viewModelScope.launch {
            userPreferences.addXp(result.xpEarned)
            userPreferences.bumpStreakIfNeeded(System.currentTimeMillis())
            repeat((result.totalQuestions - result.correctCount).coerceAtMost(2)) {
                userPreferences.loseHeart()
            }
            repository.saveSession(examMode, s.content, s.answers, result)
        }
    }

    fun restart() {
        tts.stop()
        _state.value = ListeningState.Idle
    }

    override fun onCleared() {
        tts.stop()
    }
}
