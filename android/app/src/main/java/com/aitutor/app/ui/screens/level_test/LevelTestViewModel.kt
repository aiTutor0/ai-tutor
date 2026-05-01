package com.aitutor.app.ui.screens.level_test

import androidx.lifecycle.ViewModel
import androidx.lifecycle.viewModelScope
import com.aitutor.app.data.local.LevelTestBank
import com.aitutor.app.data.local.UserPreferences
import com.aitutor.app.domain.model.CefrLevel
import com.aitutor.app.domain.model.LevelTestQuestion
import dagger.hilt.android.lifecycle.HiltViewModel
import kotlinx.coroutines.flow.MutableStateFlow
import kotlinx.coroutines.flow.StateFlow
import kotlinx.coroutines.flow.asStateFlow
import kotlinx.coroutines.launch
import javax.inject.Inject

sealed interface LevelTestState {
    data object Idle : LevelTestState
    data class InProgress(
        val questions: List<LevelTestQuestion>,
        val currentIndex: Int = 0,
        val answers: List<Int> = List(questions.size) { -1 }
    ) : LevelTestState
    data class Finished(
        val correctCount: Int,
        val total: Int,
        val percent: Int,
        val level: CefrLevel,
        val perQuestion: List<Pair<LevelTestQuestion, Int>>
    ) : LevelTestState
}

@HiltViewModel
class LevelTestViewModel @Inject constructor(
    private val userPreferences: UserPreferences
) : ViewModel() {
    private val _state = MutableStateFlow<LevelTestState>(LevelTestState.Idle)
    val state: StateFlow<LevelTestState> = _state.asStateFlow()

    fun start() {
        _state.value = LevelTestState.InProgress(LevelTestBank.questions())
    }

    fun answer(index: Int, optionIdx: Int) {
        val s = _state.value as? LevelTestState.InProgress ?: return
        val newAnswers = s.answers.toMutableList()
        if (index in newAnswers.indices) newAnswers[index] = optionIdx
        _state.value = s.copy(answers = newAnswers)
    }

    fun next() {
        val s = _state.value as? LevelTestState.InProgress ?: return
        if (s.currentIndex < s.questions.lastIndex) {
            _state.value = s.copy(currentIndex = s.currentIndex + 1)
        }
    }

    fun previous() {
        val s = _state.value as? LevelTestState.InProgress ?: return
        if (s.currentIndex > 0) _state.value = s.copy(currentIndex = s.currentIndex - 1)
    }

    fun submit() {
        val s = _state.value as? LevelTestState.InProgress ?: return
        val correct = s.questions.zip(s.answers).count { (q, a) -> q.correctIndex == a }
        val total = s.questions.size
        val percent = (100.0 * correct / total).toInt()
        val level = CefrLevel.fromScorePercentage(percent)
        _state.value = LevelTestState.Finished(
            correctCount = correct,
            total = total,
            percent = percent,
            level = level,
            perQuestion = s.questions.zip(s.answers)
        )
        viewModelScope.launch {
            userPreferences.addXp(correct * 10)
            userPreferences.bumpStreakIfNeeded(System.currentTimeMillis())
        }
    }

    fun reset() {
        _state.value = LevelTestState.Idle
    }
}
