package com.aitutor.app.ui.screens.reading

import androidx.compose.foundation.layout.Arrangement
import androidx.compose.foundation.layout.Box
import androidx.compose.foundation.layout.Column
import androidx.compose.foundation.layout.Row
import androidx.compose.foundation.layout.Spacer
import androidx.compose.foundation.layout.fillMaxSize
import androidx.compose.foundation.layout.fillMaxWidth
import androidx.compose.foundation.layout.height
import androidx.compose.foundation.layout.padding
import androidx.compose.foundation.rememberScrollState
import androidx.compose.foundation.verticalScroll
import androidx.compose.material3.CircularProgressIndicator
import androidx.compose.material3.LinearProgressIndicator
import androidx.compose.material3.MaterialTheme
import androidx.compose.material3.Text
import androidx.compose.runtime.Composable
import androidx.compose.runtime.LaunchedEffect
import androidx.compose.runtime.collectAsState
import androidx.compose.runtime.getValue
import androidx.compose.runtime.mutableLongStateOf
import androidx.compose.runtime.remember
import androidx.compose.runtime.setValue
import androidx.compose.ui.Alignment
import androidx.compose.ui.Modifier
import androidx.compose.ui.unit.dp
import androidx.hilt.navigation.compose.hiltViewModel
import com.aitutor.app.domain.model.ExamMode
import com.aitutor.app.ui.components.DuoButton
import com.aitutor.app.ui.components.QuestionView
import com.aitutor.app.ui.components.ResultHeader
import com.aitutor.app.ui.components.StatTile
import com.aitutor.app.ui.theme.DuoBlue
import com.aitutor.app.ui.theme.DuoBlueDark
import com.aitutor.app.ui.theme.DuoGreen
import com.aitutor.app.ui.theme.DuoGreenDark
import com.aitutor.app.ui.theme.DuoRed
import com.aitutor.app.ui.theme.DuoRedDark
import kotlinx.coroutines.delay

@Composable
fun ReadingScreen(
    examMode: ExamMode?,
    onBack: () -> Unit,
    viewModel: ReadingViewModel = hiltViewModel()
) {
    val state by viewModel.state.collectAsState()
    val mode = examMode ?: ExamMode.IELTS

    when (val s = state) {
        ReadingState.Idle -> ReadingIntro(mode = mode, onStart = { viewModel.start(mode) }, onBack = onBack)
        ReadingState.Loading -> CenteredLoader("Generating your passage…")
        is ReadingState.Error -> ReadingError(s.message, onRetry = { viewModel.start(mode) }, onBack = onBack)
        is ReadingState.InProgress -> when (s.phase) {
            ReadingState.InProgress.Phase.READING -> PassageView(
                state = s,
                onContinue = { viewModel.goToQuestions() },
                onExit = onBack
            )
            ReadingState.InProgress.Phase.ANSWERING -> AnsweringView(
                state = s,
                onAnswer = viewModel::answer,
                onPrev = viewModel::previous,
                onNext = viewModel::next,
                onSubmit = { viewModel.submit(mode) },
                onExit = onBack
            )
        }
        is ReadingState.Finished -> ResultView(
            mode = mode,
            state = s,
            onRetry = { viewModel.restart(); viewModel.start(mode) },
            onExit = onBack
        )
    }
}

@Composable
private fun ReadingIntro(mode: ExamMode, onStart: () -> Unit, onBack: () -> Unit) {
    Column(
        Modifier
            .fillMaxSize()
            .padding(24.dp),
        verticalArrangement = Arrangement.Center,
        horizontalAlignment = Alignment.CenterHorizontally
    ) {
        Text("Reading — ${mode.displayName}", style = MaterialTheme.typography.displaySmall)
        Spacer(Modifier.height(8.dp))
        Text(
            when (mode) {
                ExamMode.IELTS -> "Read an academic passage and answer 5–7 questions: True/False/Not Given, Multiple Choice, and Fill in the Blank."
                ExamMode.TOEFL -> "Read an academic passage and answer questions including inference and summary tasks."
            },
            style = MaterialTheme.typography.bodyLarge,
            color = MaterialTheme.colorScheme.onSurfaceVariant
        )
        Spacer(Modifier.height(32.dp))
        DuoButton(
            text = "Start session",
            onClick = onStart,
            containerColor = DuoGreen,
            shadowColor = DuoGreenDark,
            modifier = Modifier.fillMaxWidth()
        )
        Spacer(Modifier.height(12.dp))
        DuoButton(
            text = "Back",
            onClick = onBack,
            containerColor = MaterialTheme.colorScheme.surfaceContainerHigh,
            shadowColor = MaterialTheme.colorScheme.outline,
            modifier = Modifier.fillMaxWidth()
        )
    }
}

@Composable
private fun CenteredLoader(text: String) {
    Box(Modifier.fillMaxSize(), contentAlignment = Alignment.Center) {
        Column(horizontalAlignment = Alignment.CenterHorizontally) {
            CircularProgressIndicator()
            Spacer(Modifier.height(12.dp))
            Text(text, style = MaterialTheme.typography.titleMedium)
        }
    }
}

@Composable
private fun ReadingError(message: String, onRetry: () -> Unit, onBack: () -> Unit) {
    Column(
        Modifier
            .fillMaxSize()
            .padding(24.dp),
        verticalArrangement = Arrangement.Center,
        horizontalAlignment = Alignment.CenterHorizontally
    ) {
        Text("Couldn't load passage", style = MaterialTheme.typography.headlineMedium)
        Spacer(Modifier.height(8.dp))
        Text(
            message,
            style = MaterialTheme.typography.bodyMedium,
            color = MaterialTheme.colorScheme.error
        )
        Spacer(Modifier.height(24.dp))
        DuoButton("Try again", onClick = onRetry, modifier = Modifier.fillMaxWidth())
        Spacer(Modifier.height(8.dp))
        DuoButton(
            "Back",
            onClick = onBack,
            containerColor = MaterialTheme.colorScheme.surfaceContainerHigh,
            shadowColor = MaterialTheme.colorScheme.outline,
            modifier = Modifier.fillMaxWidth()
        )
    }
}

@Composable
private fun PassageView(
    state: ReadingState.InProgress,
    onContinue: () -> Unit,
    onExit: () -> Unit
) {
    var elapsed by remember { mutableLongStateOf(0L) }
    LaunchedEffect(state.startedAtMillis) {
        while (true) {
            elapsed = (System.currentTimeMillis() - state.startedAtMillis) / 1000
            delay(1000)
        }
    }

    Column(
        Modifier
            .fillMaxSize()
            .padding(16.dp)
    ) {
        Row(
            Modifier.fillMaxWidth(),
            horizontalArrangement = Arrangement.SpaceBetween,
            verticalAlignment = Alignment.CenterVertically
        ) {
            Text(state.passage.title, style = MaterialTheme.typography.headlineSmall, modifier = Modifier.weight(1f))
            Text(
                formatTime(elapsed),
                style = MaterialTheme.typography.titleMedium,
                color = MaterialTheme.colorScheme.primary
            )
        }
        Spacer(Modifier.height(8.dp))
        Text(
            "${state.passage.wordCount} words",
            style = MaterialTheme.typography.bodySmall,
            color = MaterialTheme.colorScheme.onSurfaceVariant
        )
        Spacer(Modifier.height(12.dp))
        Box(Modifier.weight(1f)) {
            Column(Modifier.verticalScroll(rememberScrollState())) {
                Text(state.passage.passage, style = MaterialTheme.typography.bodyLarge)
                Spacer(Modifier.height(24.dp))
            }
        }
        Spacer(Modifier.height(12.dp))
        DuoButton(
            "Go to questions (${state.passage.questions.size})",
            onClick = onContinue,
            modifier = Modifier.fillMaxWidth()
        )
    }
}

@Composable
private fun AnsweringView(
    state: ReadingState.InProgress,
    onAnswer: (Int, String) -> Unit,
    onPrev: () -> Unit,
    onNext: () -> Unit,
    onSubmit: () -> Unit,
    onExit: () -> Unit
) {
    val q = state.passage.questions[state.currentQuestion]
    val total = state.passage.questions.size
    val isLast = state.currentQuestion == total - 1

    Column(
        Modifier
            .fillMaxSize()
            .padding(16.dp)
    ) {
        LinearProgressIndicator(
            progress = { (state.currentQuestion + 1) / total.toFloat() },
            modifier = Modifier.fillMaxWidth(),
            color = DuoGreen
        )
        Spacer(Modifier.height(12.dp))
        Text(
            "Question ${state.currentQuestion + 1} of $total",
            style = MaterialTheme.typography.titleSmall,
            color = MaterialTheme.colorScheme.onSurfaceVariant
        )
        Spacer(Modifier.height(8.dp))
        Box(Modifier.weight(1f)) {
            Column(Modifier.verticalScroll(rememberScrollState())) {
                QuestionView(
                    question = q,
                    answer = state.answers[state.currentQuestion],
                    onAnswer = { onAnswer(state.currentQuestion, it) }
                )
            }
        }
        Spacer(Modifier.height(12.dp))
        Row(
            Modifier.fillMaxWidth(),
            horizontalArrangement = Arrangement.spacedBy(8.dp)
        ) {
            if (state.currentQuestion > 0) {
                DuoButton(
                    text = "Back",
                    onClick = onPrev,
                    containerColor = MaterialTheme.colorScheme.surfaceContainerHigh,
                    shadowColor = MaterialTheme.colorScheme.outline,
                    modifier = Modifier.weight(1f)
                )
            }
            if (!isLast) {
                DuoButton(
                    text = "Next",
                    onClick = onNext,
                    modifier = Modifier.weight(1f),
                    containerColor = DuoBlue,
                    shadowColor = DuoBlueDark
                )
            } else {
                DuoButton(
                    text = "Submit",
                    onClick = onSubmit,
                    modifier = Modifier.weight(1f),
                    containerColor = DuoGreen,
                    shadowColor = DuoGreenDark
                )
            }
        }
    }
}

@Composable
private fun ResultView(
    mode: ExamMode,
    state: ReadingState.Finished,
    onRetry: () -> Unit,
    onExit: () -> Unit
) {
    Column(
        Modifier
            .fillMaxSize()
            .padding(16.dp)
            .verticalScroll(rememberScrollState())
    ) {
        ResultHeader(
            title = "${state.result.scorePercentage}%",
            subtitle = "${state.result.correctCount}/${state.result.totalQuestions} correct",
            stars = state.result.starsEarned
        )
        Spacer(Modifier.height(16.dp))
        Row(horizontalArrangement = Arrangement.spacedBy(8.dp)) {
            StatTile("XP", "+${state.result.xpEarned}", Modifier.weight(1f))
            StatTile("WPM", state.result.wordsPerMinute.toString(), Modifier.weight(1f))
            StatTile("Time", formatTime(state.result.timeTakenSeconds), Modifier.weight(1f))
        }
        Spacer(Modifier.height(20.dp))
        Text("Review", style = MaterialTheme.typography.titleLarge)
        Spacer(Modifier.height(8.dp))
        state.result.perQuestion.forEachIndexed { i, g ->
            val q = state.passage.questions[i]
            ReviewItem(
                index = i + 1,
                question = q.question,
                correctAnswer = g.correctAnswer,
                userAnswer = g.userAnswer,
                explanation = g.explanation,
                isCorrect = g.isCorrect
            )
            Spacer(Modifier.height(12.dp))
        }
        Spacer(Modifier.height(12.dp))
        DuoButton(
            text = "New passage",
            onClick = onRetry,
            modifier = Modifier.fillMaxWidth()
        )
        Spacer(Modifier.height(8.dp))
        DuoButton(
            text = "Done",
            onClick = onExit,
            containerColor = MaterialTheme.colorScheme.surfaceContainerHigh,
            shadowColor = MaterialTheme.colorScheme.outline,
            modifier = Modifier.fillMaxWidth()
        )
    }
}

@Composable
private fun ReviewItem(
    index: Int,
    question: String,
    correctAnswer: String,
    userAnswer: String,
    explanation: String?,
    isCorrect: Boolean
) {
    val tint = if (isCorrect) DuoGreen else DuoRed
    Column(
        Modifier
            .fillMaxWidth()
            .padding(2.dp)
    ) {
        Text(
            "${if (isCorrect) "✓" else "✗"}  Q$index",
            style = MaterialTheme.typography.titleMedium,
            color = tint
        )
        Spacer(Modifier.height(4.dp))
        Text(question, style = MaterialTheme.typography.bodyMedium)
        Spacer(Modifier.height(4.dp))
        Text(
            "Your answer: ${userAnswer.ifBlank { "—" }}",
            style = MaterialTheme.typography.bodySmall,
            color = MaterialTheme.colorScheme.onSurfaceVariant
        )
        if (!isCorrect) {
            Text(
                "Correct: $correctAnswer",
                style = MaterialTheme.typography.bodySmall,
                color = DuoGreen
            )
        }
        if (!explanation.isNullOrBlank()) {
            Text(
                explanation,
                style = MaterialTheme.typography.bodySmall,
                color = MaterialTheme.colorScheme.onSurfaceVariant
            )
        }
    }
}

internal fun formatTime(seconds: Long): String {
    val m = seconds / 60
    val s = seconds % 60
    return "%d:%02d".format(m, s)
}

@Composable
internal fun PhaseStub(title: String, body: String, onBack: () -> Unit) {
    Column(
        modifier = Modifier
            .fillMaxSize()
            .padding(24.dp),
        verticalArrangement = Arrangement.Center,
        horizontalAlignment = Alignment.CenterHorizontally
    ) {
        Text(title, style = MaterialTheme.typography.displaySmall)
        Spacer(Modifier.height(12.dp))
        Text(
            body,
            style = MaterialTheme.typography.bodyLarge,
            color = MaterialTheme.colorScheme.onSurfaceVariant
        )
        Spacer(Modifier.height(32.dp))
        DuoButton(
            text = "Back",
            onClick = onBack,
            containerColor = DuoBlue,
            shadowColor = DuoBlueDark
        )
    }
}
