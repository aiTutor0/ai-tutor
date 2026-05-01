package com.aitutor.app.ui.screens.level_test

import androidx.compose.foundation.background
import androidx.compose.foundation.border
import androidx.compose.foundation.clickable
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
import androidx.compose.foundation.shape.RoundedCornerShape
import androidx.compose.foundation.verticalScroll
import androidx.compose.material3.LinearProgressIndicator
import androidx.compose.material3.MaterialTheme
import androidx.compose.material3.Text
import androidx.compose.runtime.Composable
import androidx.compose.runtime.collectAsState
import androidx.compose.runtime.getValue
import androidx.compose.ui.Alignment
import androidx.compose.ui.Modifier
import androidx.compose.ui.graphics.Color
import androidx.compose.ui.text.font.FontWeight
import androidx.compose.ui.unit.dp
import androidx.hilt.navigation.compose.hiltViewModel
import com.aitutor.app.domain.model.LevelTestQuestion
import com.aitutor.app.ui.components.DuoButton
import com.aitutor.app.ui.components.ResultHeader
import com.aitutor.app.ui.components.StatTile
import com.aitutor.app.ui.theme.DuoGreen
import com.aitutor.app.ui.theme.DuoGreenDark
import com.aitutor.app.ui.theme.DuoYellow

@Composable
fun LevelTestScreen(
    onBack: () -> Unit,
    viewModel: LevelTestViewModel = hiltViewModel()
) {
    val state by viewModel.state.collectAsState()
    when (val s = state) {
        LevelTestState.Idle -> Intro(onStart = viewModel::start, onBack = onBack)
        is LevelTestState.InProgress -> InProgressView(
            state = s,
            onAnswer = viewModel::answer,
            onPrev = viewModel::previous,
            onNext = viewModel::next,
            onSubmit = viewModel::submit
        )
        is LevelTestState.Finished -> Finished(
            state = s,
            onAgain = { viewModel.reset(); viewModel.start() },
            onDone = onBack
        )
    }
}

@Composable
private fun Intro(onStart: () -> Unit, onBack: () -> Unit) {
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
                .background(DuoYellow, CircleShape),
            contentAlignment = Alignment.Center
        ) {
            Text("?", style = MaterialTheme.typography.displayLarge,
                color = Color.White, fontWeight = FontWeight.ExtraBold)
        }
        Spacer(Modifier.height(20.dp))
        Text("CEFR Placement", style = MaterialTheme.typography.displaySmall)
        Spacer(Modifier.height(8.dp))
        Text(
            "10 quick grammar/vocabulary questions to estimate your CEFR level (A1 to C1).",
            style = MaterialTheme.typography.bodyLarge,
            color = MaterialTheme.colorScheme.onSurfaceVariant
        )
        Spacer(Modifier.height(32.dp))
        DuoButton(
            text = "Start test",
            onClick = onStart,
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
private fun InProgressView(
    state: LevelTestState.InProgress,
    onAnswer: (Int, Int) -> Unit,
    onPrev: () -> Unit,
    onNext: () -> Unit,
    onSubmit: () -> Unit
) {
    val q = state.questions[state.currentIndex]
    val total = state.questions.size
    val isLast = state.currentIndex == total - 1
    val current = state.answers[state.currentIndex]

    Column(
        Modifier
            .fillMaxSize()
            .padding(16.dp)
    ) {
        LinearProgressIndicator(
            progress = { (state.currentIndex + 1) / total.toFloat() },
            modifier = Modifier.fillMaxWidth(),
            color = DuoYellow
        )
        Spacer(Modifier.height(12.dp))
        Text(
            "Question ${state.currentIndex + 1} of $total",
            style = MaterialTheme.typography.titleSmall,
            color = MaterialTheme.colorScheme.onSurfaceVariant
        )
        Spacer(Modifier.height(8.dp))
        Text(q.question, style = MaterialTheme.typography.headlineSmall)
        Spacer(Modifier.height(20.dp))

        q.options.forEachIndexed { idx, opt ->
            OptionRow(
                letter = ('A' + idx).toString(),
                text = opt,
                selected = current == idx,
                onClick = { onAnswer(state.currentIndex, idx) }
            )
            Spacer(Modifier.height(8.dp))
        }

        Spacer(Modifier.weight(1f))

        Row(Modifier.fillMaxWidth(), horizontalArrangement = Arrangement.spacedBy(8.dp)) {
            if (state.currentIndex > 0) {
                DuoButton(
                    "Back",
                    onClick = onPrev,
                    containerColor = MaterialTheme.colorScheme.surfaceContainerHigh,
                    shadowColor = MaterialTheme.colorScheme.outline,
                    modifier = Modifier.weight(1f)
                )
            }
            if (!isLast) {
                DuoButton(
                    "Next",
                    onClick = onNext,
                    enabled = current >= 0,
                    modifier = Modifier.weight(1f)
                )
            } else {
                DuoButton(
                    "Submit",
                    onClick = onSubmit,
                    enabled = state.answers.all { it >= 0 },
                    containerColor = DuoGreen,
                    shadowColor = DuoGreenDark,
                    modifier = Modifier.weight(1f)
                )
            }
        }
    }
}

@Composable
private fun OptionRow(
    letter: String,
    text: String,
    selected: Boolean,
    onClick: () -> Unit
) {
    val border = if (selected) DuoYellow else MaterialTheme.colorScheme.outline
    val bg = if (selected) DuoYellow.copy(alpha = 0.1f) else MaterialTheme.colorScheme.surface
    Row(
        modifier = Modifier
            .fillMaxWidth()
            .border(if (selected) 2.dp else 1.dp, border, RoundedCornerShape(14.dp))
            .background(bg, RoundedCornerShape(14.dp))
            .clickable(onClick = onClick)
            .padding(14.dp),
        verticalAlignment = Alignment.CenterVertically
    ) {
        Box(
            Modifier
                .size(28.dp)
                .background(
                    if (selected) DuoYellow else MaterialTheme.colorScheme.surfaceVariant,
                    CircleShape
                ),
            contentAlignment = Alignment.Center
        ) {
            Text(letter, style = MaterialTheme.typography.labelLarge,
                color = if (selected) Color.White else MaterialTheme.colorScheme.onSurface)
        }
        Spacer(Modifier.size(12.dp))
        Text(text, style = MaterialTheme.typography.bodyLarge)
    }
}

@Composable
private fun Finished(
    state: LevelTestState.Finished,
    onAgain: () -> Unit,
    onDone: () -> Unit
) {
    Column(
        Modifier
            .fillMaxSize()
            .padding(16.dp)
            .verticalScroll(rememberScrollState())
    ) {
        ResultHeader(
            title = state.level.code,
            subtitle = state.level.description,
            stars = when (state.level) {
                com.aitutor.app.domain.model.CefrLevel.C1,
                com.aitutor.app.domain.model.CefrLevel.C2 -> 3
                com.aitutor.app.domain.model.CefrLevel.B2 -> 2
                else -> 1
            }
        )
        Spacer(Modifier.height(16.dp))
        Row(horizontalArrangement = Arrangement.spacedBy(8.dp)) {
            StatTile("Correct", "${state.correctCount}/${state.total}", Modifier.weight(1f))
            StatTile("Score", "${state.percent}%", Modifier.weight(1f))
        }
        Spacer(Modifier.height(16.dp))
        Text("Review", style = MaterialTheme.typography.titleLarge)
        Spacer(Modifier.height(8.dp))
        state.perQuestion.forEachIndexed { i, (q, ans) ->
            ReviewItem(i + 1, q, ans)
            Spacer(Modifier.height(10.dp))
        }
        Spacer(Modifier.height(16.dp))
        DuoButton("Take again", onClick = onAgain, modifier = Modifier.fillMaxWidth())
        Spacer(Modifier.height(8.dp))
        DuoButton(
            "Done",
            onClick = onDone,
            containerColor = MaterialTheme.colorScheme.surfaceContainerHigh,
            shadowColor = MaterialTheme.colorScheme.outline,
            modifier = Modifier.fillMaxWidth()
        )
    }
}

@Composable
private fun ReviewItem(index: Int, q: LevelTestQuestion, userIdx: Int) {
    val correct = q.correctIndex == userIdx
    val tint = if (correct) DuoGreen else MaterialTheme.colorScheme.error
    Column {
        Text(
            "${if (correct) "✓" else "✗"}  Q$index — ${q.level.code}",
            style = MaterialTheme.typography.titleMedium,
            color = tint
        )
        Text(q.question, style = MaterialTheme.typography.bodyMedium)
        Text(
            "Your answer: ${if (userIdx >= 0) ('A' + userIdx).toString() + ". " + q.options[userIdx] else "—"}",
            style = MaterialTheme.typography.bodySmall,
            color = MaterialTheme.colorScheme.onSurfaceVariant
        )
        if (!correct) {
            Text(
                "Correct: ${q.correctLetter}. ${q.options[q.correctIndex]}",
                style = MaterialTheme.typography.bodySmall,
                color = DuoGreen
            )
        }
    }
}
