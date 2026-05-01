package com.aitutor.app.ui.screens.listening

import androidx.compose.foundation.background
import androidx.compose.foundation.layout.Arrangement
import androidx.compose.foundation.layout.Box
import androidx.compose.foundation.layout.Column
import androidx.compose.foundation.layout.Row
import androidx.compose.foundation.layout.Spacer
import androidx.compose.foundation.layout.fillMaxSize
import androidx.compose.foundation.layout.fillMaxWidth
import androidx.compose.foundation.layout.height
import androidx.compose.foundation.layout.padding
import androidx.compose.foundation.layout.size
import androidx.compose.foundation.rememberScrollState
import androidx.compose.foundation.shape.CircleShape
import androidx.compose.foundation.verticalScroll
import androidx.compose.material.icons.Icons
import androidx.compose.material.icons.filled.Headphones
import androidx.compose.material.icons.filled.Pause
import androidx.compose.material.icons.filled.PlayArrow
import androidx.compose.material3.CircularProgressIndicator
import androidx.compose.material3.Icon
import androidx.compose.material3.LinearProgressIndicator
import androidx.compose.material3.MaterialTheme
import androidx.compose.material3.Text
import androidx.compose.runtime.Composable
import androidx.compose.runtime.collectAsState
import androidx.compose.runtime.getValue
import androidx.compose.ui.Alignment
import androidx.compose.ui.Modifier
import androidx.compose.ui.graphics.Color
import androidx.compose.ui.unit.dp
import androidx.hilt.navigation.compose.hiltViewModel
import com.aitutor.app.domain.model.ExamMode
import com.aitutor.app.ui.components.DuoButton
import com.aitutor.app.ui.components.QuestionView
import com.aitutor.app.ui.components.ResultHeader
import com.aitutor.app.ui.components.StatTile
import com.aitutor.app.ui.screens.reading.formatTime
import com.aitutor.app.ui.theme.DuoBlue
import com.aitutor.app.ui.theme.DuoBlueDark
import com.aitutor.app.ui.theme.DuoGreen
import com.aitutor.app.ui.theme.DuoGreenDark

@Composable
fun ListeningScreen(
    examMode: ExamMode?,
    onBack: () -> Unit,
    viewModel: ListeningViewModel = hiltViewModel()
) {
    val state by viewModel.state.collectAsState()
    val isPlaying by viewModel.tts.isPlaying.collectAsState()
    val mode = examMode ?: ExamMode.IELTS

    when (val s = state) {
        ListeningState.Idle -> Intro(mode = mode, onStart = { viewModel.start(mode) }, onBack = onBack)
        ListeningState.Loading -> CenteredLoader("Generating lecture…")
        is ListeningState.Error -> Error(s.message, onRetry = { viewModel.start(mode) }, onBack = onBack)
        is ListeningState.Playing -> Player(
            state = s,
            isPlaying = isPlaying,
            onPlay = viewModel::playAudio,
            onStop = viewModel::stopAudio,
            onContinue = viewModel::goToQuestions
        )
        is ListeningState.Answering -> Answering(
            state = s,
            onAnswer = viewModel::answer,
            onPrev = viewModel::previous,
            onNext = viewModel::next,
            onSubmit = { viewModel.submit(mode) }
        )
        is ListeningState.Finished -> Result(
            state = s,
            onRetry = { viewModel.restart(); viewModel.start(mode) },
            onExit = onBack
        )
    }
}

@Composable
private fun Intro(mode: ExamMode, onStart: () -> Unit, onBack: () -> Unit) {
    Column(
        Modifier
            .fillMaxSize()
            .padding(24.dp),
        verticalArrangement = Arrangement.Center,
        horizontalAlignment = Alignment.CenterHorizontally
    ) {
        Box(
            Modifier
                .size(96.dp)
                .background(DuoBlue, CircleShape),
            contentAlignment = Alignment.Center
        ) {
            Icon(Icons.Default.Headphones, null, tint = Color.White, modifier = Modifier.size(48.dp))
        }
        Spacer(Modifier.height(20.dp))
        Text("Listening — ${mode.displayName}", style = MaterialTheme.typography.displaySmall)
        Spacer(Modifier.height(8.dp))
        Text(
            "Listen to a short academic lecture, then answer comprehension questions.",
            style = MaterialTheme.typography.bodyLarge,
            color = MaterialTheme.colorScheme.onSurfaceVariant
        )
        Spacer(Modifier.height(32.dp))
        DuoButton(
            text = "Start session",
            onClick = onStart,
            containerColor = DuoBlue,
            shadowColor = DuoBlueDark,
            modifier = Modifier.fillMaxWidth()
        )
        Spacer(Modifier.height(8.dp))
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
            Text(text)
        }
    }
}

@Composable
private fun Error(message: String, onRetry: () -> Unit, onBack: () -> Unit) {
    Column(
        Modifier
            .fillMaxSize()
            .padding(24.dp),
        verticalArrangement = Arrangement.Center,
        horizontalAlignment = Alignment.CenterHorizontally
    ) {
        Text("Couldn't load lecture", style = MaterialTheme.typography.headlineMedium)
        Spacer(Modifier.height(8.dp))
        Text(message, color = MaterialTheme.colorScheme.error)
        Spacer(Modifier.height(20.dp))
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
private fun Player(
    state: ListeningState.Playing,
    isPlaying: Boolean,
    onPlay: () -> Unit,
    onStop: () -> Unit,
    onContinue: () -> Unit
) {
    Column(
        Modifier
            .fillMaxSize()
            .padding(24.dp)
    ) {
        Text(state.content.title, style = MaterialTheme.typography.headlineMedium)
        state.content.topic?.let {
            Spacer(Modifier.height(4.dp))
            Text(it, style = MaterialTheme.typography.bodyMedium,
                color = MaterialTheme.colorScheme.onSurfaceVariant)
        }
        Spacer(Modifier.height(32.dp))
        Box(
            Modifier
                .fillMaxWidth()
                .background(DuoBlue.copy(alpha = 0.08f), MaterialTheme.shapes.large)
                .padding(vertical = 32.dp),
            contentAlignment = Alignment.Center
        ) {
            Box(
                Modifier
                    .size(96.dp)
                    .background(DuoBlue, CircleShape),
                contentAlignment = Alignment.Center
            ) {
                Icon(
                    if (isPlaying) Icons.Default.Pause else Icons.Default.PlayArrow,
                    null,
                    tint = Color.White,
                    modifier = Modifier
                        .size(56.dp)
                        .let {
                            it
                        }
                )
            }
        }
        Spacer(Modifier.height(16.dp))
        Row(Modifier.fillMaxWidth(), horizontalArrangement = Arrangement.spacedBy(8.dp)) {
            DuoButton(
                text = if (isPlaying) "Stop" else if (state.playedOnce) "Replay" else "Play",
                onClick = if (isPlaying) onStop else onPlay,
                containerColor = DuoBlue,
                shadowColor = DuoBlueDark,
                modifier = Modifier.weight(1f)
            )
            DuoButton(
                text = "Continue",
                onClick = onContinue,
                enabled = state.playedOnce,
                modifier = Modifier.weight(1f)
            )
        }
        Spacer(Modifier.height(24.dp))
        Text(
            "Tip: you may replay the audio. After this point, you'll answer ${state.content.questions.size} questions.",
            style = MaterialTheme.typography.bodySmall,
            color = MaterialTheme.colorScheme.onSurfaceVariant
        )
    }
}

@Composable
private fun Answering(
    state: ListeningState.Answering,
    onAnswer: (Int, String) -> Unit,
    onPrev: () -> Unit,
    onNext: () -> Unit,
    onSubmit: () -> Unit
) {
    val q = state.content.questions[state.currentQuestion]
    val total = state.content.questions.size
    val isLast = state.currentQuestion == total - 1

    Column(
        Modifier
            .fillMaxSize()
            .padding(16.dp)
    ) {
        LinearProgressIndicator(
            progress = { (state.currentQuestion + 1) / total.toFloat() },
            modifier = Modifier.fillMaxWidth(),
            color = DuoBlue
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
        Row(Modifier.fillMaxWidth(), horizontalArrangement = Arrangement.spacedBy(8.dp)) {
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
                    containerColor = DuoBlue,
                    shadowColor = DuoBlueDark,
                    modifier = Modifier.weight(1f)
                )
            } else {
                DuoButton(
                    text = "Submit",
                    onClick = onSubmit,
                    containerColor = DuoGreen,
                    shadowColor = DuoGreenDark,
                    modifier = Modifier.weight(1f)
                )
            }
        }
    }
}

@Composable
private fun Result(
    state: ListeningState.Finished,
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
            StatTile("Time", formatTime(state.result.timeTakenSeconds), Modifier.weight(1f))
        }
        Spacer(Modifier.height(16.dp))
        Text("Transcript", style = MaterialTheme.typography.titleLarge)
        Spacer(Modifier.height(8.dp))
        Text(state.content.transcript, style = MaterialTheme.typography.bodyMedium)
        Spacer(Modifier.height(20.dp))
        DuoButton("Another lecture", onClick = onRetry, modifier = Modifier.fillMaxWidth())
        Spacer(Modifier.height(8.dp))
        DuoButton(
            "Done",
            onClick = onExit,
            containerColor = MaterialTheme.colorScheme.surfaceContainerHigh,
            shadowColor = MaterialTheme.colorScheme.outline,
            modifier = Modifier.fillMaxWidth()
        )
    }
}
