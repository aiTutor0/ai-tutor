package com.aitutor.app.ui.screens.writing

import androidx.compose.foundation.background
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
import androidx.compose.foundation.shape.RoundedCornerShape
import androidx.compose.foundation.text.BasicTextField
import androidx.compose.foundation.verticalScroll
import androidx.compose.material3.CircularProgressIndicator
import androidx.compose.material3.LinearProgressIndicator
import androidx.compose.material3.MaterialTheme
import androidx.compose.material3.Text
import androidx.compose.runtime.Composable
import androidx.compose.runtime.collectAsState
import androidx.compose.runtime.getValue
import androidx.compose.ui.Alignment
import androidx.compose.ui.Modifier
import androidx.compose.ui.text.SpanStyle
import androidx.compose.ui.text.buildAnnotatedString
import androidx.compose.ui.text.font.FontWeight
import androidx.compose.ui.text.withStyle
import androidx.compose.ui.unit.dp
import androidx.hilt.navigation.compose.hiltViewModel
import com.aitutor.app.domain.model.ExamMode
import com.aitutor.app.domain.model.WritingEvaluation
import com.aitutor.app.domain.model.WritingTaskType
import com.aitutor.app.ui.components.DuoButton
import com.aitutor.app.ui.components.ResultHeader
import com.aitutor.app.ui.components.StatTile
import com.aitutor.app.ui.theme.DuoBlue
import com.aitutor.app.ui.theme.DuoBlueDark
import com.aitutor.app.ui.theme.DuoGreen
import com.aitutor.app.ui.theme.DuoGreenDark
import com.aitutor.app.ui.theme.DuoOrange

@Composable
fun WritingScreen(
    examMode: ExamMode?,
    onBack: () -> Unit,
    viewModel: WritingViewModel = hiltViewModel()
) {
    val state by viewModel.state.collectAsState()
    val mode = examMode ?: ExamMode.IELTS

    when (val s = state) {
        WritingState.PickingTask -> TaskPicker(mode, onPick = viewModel::pickTask, onBack = onBack)
        is WritingState.Composing -> Composing(
            state = s,
            onTextChange = viewModel::updateText,
            onNewTopic = viewModel::newTopic,
            onSubmit = viewModel::submit,
            onCancel = viewModel::reset
        )
        is WritingState.Evaluating -> EvaluatingView()
        is WritingState.Result -> ResultView(
            state = s,
            onAgain = viewModel::reset,
            onDone = onBack
        )
        is WritingState.Error -> ErrorOverlay(
            message = s.message,
            onDismiss = viewModel::dismissError,
            onCancel = viewModel::reset
        )
    }
}

@Composable
private fun TaskPicker(mode: ExamMode, onPick: (WritingTaskType) -> Unit, onBack: () -> Unit) {
    val tasks = WritingTaskType.forExam(mode)
    Column(
        Modifier
            .fillMaxSize()
            .padding(24.dp)
    ) {
        Spacer(Modifier.height(24.dp))
        Text("Writing — ${mode.displayName}", style = MaterialTheme.typography.displaySmall)
        Spacer(Modifier.height(8.dp))
        Text(
            "Pick a task to practice. AI will evaluate your essay against the official rubric.",
            style = MaterialTheme.typography.bodyLarge,
            color = MaterialTheme.colorScheme.onSurfaceVariant
        )
        Spacer(Modifier.height(32.dp))

        tasks.forEach { task ->
            Box(
                Modifier
                    .fillMaxWidth()
                    .background(DuoOrange.copy(alpha = 0.08f), RoundedCornerShape(20.dp))
                    .clickable { onPick(task) }
                    .padding(20.dp)
            ) {
                Column {
                    Text(task.displayName, style = MaterialTheme.typography.titleLarge)
                    Spacer(Modifier.size(4.dp))
                    Text(
                        "${task.targetWords}+ words • ${task.timeLimitMinutes} min",
                        style = MaterialTheme.typography.bodyMedium,
                        color = MaterialTheme.colorScheme.onSurfaceVariant
                    )
                }
            }
            Spacer(Modifier.height(12.dp))
        }

        Spacer(Modifier.weight(1f))
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
private fun Composing(
    state: WritingState.Composing,
    onTextChange: (String) -> Unit,
    onNewTopic: () -> Unit,
    onSubmit: () -> Unit,
    onCancel: () -> Unit
) {
    Column(
        Modifier
            .fillMaxSize()
            .padding(16.dp)
    ) {
        Text(state.taskType.displayName, style = MaterialTheme.typography.titleMedium)
        Spacer(Modifier.height(8.dp))
        Box(
            Modifier
                .fillMaxWidth()
                .background(MaterialTheme.colorScheme.surfaceContainer, RoundedCornerShape(16.dp))
                .padding(16.dp)
        ) {
            Column {
                Text(state.topic.prompt, style = MaterialTheme.typography.bodyLarge)
                state.topic.sourceMaterial?.let {
                    Spacer(Modifier.height(8.dp))
                    Text(
                        it,
                        style = MaterialTheme.typography.bodyMedium,
                        color = MaterialTheme.colorScheme.onSurfaceVariant
                    )
                }
            }
        }
        Spacer(Modifier.height(8.dp))
        Row(
            Modifier.fillMaxWidth(),
            horizontalArrangement = Arrangement.SpaceBetween,
            verticalAlignment = Alignment.CenterVertically
        ) {
            Text(
                "${state.wordCount}/${state.taskType.targetWords} words",
                style = MaterialTheme.typography.bodySmall,
                color = MaterialTheme.colorScheme.onSurfaceVariant
            )
            Text(
                "Tap 'New topic' to shuffle",
                style = MaterialTheme.typography.bodySmall,
                color = MaterialTheme.colorScheme.onSurfaceVariant
            )
        }
        Spacer(Modifier.height(8.dp))
        Box(
            Modifier
                .fillMaxWidth()
                .weight(1f)
                .background(MaterialTheme.colorScheme.surfaceContainerHighest, RoundedCornerShape(16.dp))
                .padding(12.dp)
        ) {
            BasicTextField(
                value = state.text,
                onValueChange = onTextChange,
                modifier = Modifier.fillMaxSize(),
                textStyle = MaterialTheme.typography.bodyLarge.copy(
                    color = MaterialTheme.colorScheme.onSurface
                ),
                cursorBrush = androidx.compose.ui.graphics.SolidColor(MaterialTheme.colorScheme.primary),
                decorationBox = { inner ->
                    if (state.text.isEmpty()) {
                        Text(
                            "Start writing your response…",
                            style = MaterialTheme.typography.bodyLarge,
                            color = MaterialTheme.colorScheme.onSurfaceVariant
                        )
                    }
                    inner()
                }
            )
        }
        Spacer(Modifier.height(12.dp))
        Row(Modifier.fillMaxWidth(), horizontalArrangement = Arrangement.spacedBy(8.dp)) {
            DuoButton(
                text = "New topic",
                onClick = onNewTopic,
                containerColor = DuoBlue,
                shadowColor = DuoBlueDark,
                modifier = Modifier.weight(1f)
            )
            DuoButton(
                text = "Submit",
                onClick = onSubmit,
                enabled = state.wordCount >= 50,
                containerColor = DuoGreen,
                shadowColor = DuoGreenDark,
                modifier = Modifier.weight(1f)
            )
        }
        Spacer(Modifier.height(8.dp))
        DuoButton(
            text = "Cancel",
            onClick = onCancel,
            containerColor = MaterialTheme.colorScheme.surfaceContainerHigh,
            shadowColor = MaterialTheme.colorScheme.outline,
            modifier = Modifier.fillMaxWidth()
        )
    }
}

@Composable
private fun EvaluatingView() {
    Column(
        Modifier
            .fillMaxSize()
            .padding(24.dp),
        verticalArrangement = Arrangement.Center,
        horizontalAlignment = Alignment.CenterHorizontally
    ) {
        CircularProgressIndicator()
        Spacer(Modifier.height(16.dp))
        Text("AI examiner is reading your essay…", style = MaterialTheme.typography.titleMedium)
        Spacer(Modifier.height(4.dp))
        Text(
            "This usually takes 10–20 seconds.",
            style = MaterialTheme.typography.bodyMedium,
            color = MaterialTheme.colorScheme.onSurfaceVariant
        )
    }
}

@Composable
private fun ResultView(
    state: WritingState.Result,
    onAgain: () -> Unit,
    onDone: () -> Unit
) {
    val ev = state.evaluation
    Column(
        Modifier
            .fillMaxSize()
            .padding(16.dp)
            .verticalScroll(rememberScrollState())
    ) {
        val score = if (state.taskType.examMode == ExamMode.TOEFL)
            "${ev.toeflEquivalent()} / 30"
        else
            "Band ${"%.1f".format(ev.bandScore)}"
        ResultHeader(
            title = score,
            subtitle = "${ev.wordCount} words",
            stars = when {
                ev.bandScore >= 7.5 -> 3
                ev.bandScore >= 6.0 -> 2
                ev.bandScore >= 5.0 -> 1
                else -> 0
            }
        )
        Spacer(Modifier.height(16.dp))
        Row(horizontalArrangement = Arrangement.spacedBy(8.dp)) {
            StatTile("Task", "%.1f".format(ev.taskAchievement), Modifier.weight(1f))
            StatTile("C&C", "%.1f".format(ev.coherenceCohesion), Modifier.weight(1f))
            StatTile("Lex", "%.1f".format(ev.lexicalResource), Modifier.weight(1f))
            StatTile("Grm", "%.1f".format(ev.grammarAccuracy), Modifier.weight(1f))
        }
        Spacer(Modifier.height(16.dp))
        if (ev.feedback.isNotBlank()) {
            Section("Feedback") { Text(ev.feedback) }
        }
        if (ev.strengths.isNotEmpty()) {
            Section("Strengths") {
                ev.strengths.forEach { Text("• $it") }
            }
        }
        if (ev.weaknesses.isNotEmpty()) {
            Section("Weaknesses") {
                ev.weaknesses.forEach { Text("• $it") }
            }
        }
        if (ev.suggestions.isNotEmpty()) {
            Section("Suggestions") {
                ev.suggestions.forEach { Text("• $it") }
            }
        }
        if (ev.grammarErrors.isNotEmpty()) {
            Section("Grammar fixes") {
                ev.grammarErrors.forEach { gerr ->
                    Text(buildAnnotatedString {
                        withStyle(SpanStyle(color = MaterialTheme.colorScheme.error)) {
                            append("× ${gerr.original}")
                        }
                        append("\n")
                        withStyle(SpanStyle(color = DuoGreenDark, fontWeight = FontWeight.Bold)) {
                            append("✓ ${gerr.corrected}")
                        }
                        append("\n${gerr.explanation}")
                    })
                    Spacer(Modifier.height(8.dp))
                }
            }
        }
        Spacer(Modifier.height(16.dp))
        DuoButton("New essay", onClick = onAgain, modifier = Modifier.fillMaxWidth())
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
private fun Section(title: String, content: @Composable () -> Unit) {
    Spacer(Modifier.height(12.dp))
    Text(title, style = MaterialTheme.typography.titleMedium)
    Spacer(Modifier.height(6.dp))
    content()
}

@Composable
private fun ErrorOverlay(message: String, onDismiss: () -> Unit, onCancel: () -> Unit) {
    Column(
        Modifier
            .fillMaxSize()
            .padding(24.dp),
        verticalArrangement = Arrangement.Center,
        horizontalAlignment = Alignment.CenterHorizontally
    ) {
        Text("Couldn't evaluate", style = MaterialTheme.typography.headlineMedium)
        Spacer(Modifier.height(8.dp))
        Text(message, color = MaterialTheme.colorScheme.error)
        Spacer(Modifier.height(20.dp))
        DuoButton("Try again", onClick = onDismiss, modifier = Modifier.fillMaxWidth())
        Spacer(Modifier.height(8.dp))
        DuoButton(
            "Cancel",
            onClick = onCancel,
            containerColor = MaterialTheme.colorScheme.surfaceContainerHigh,
            shadowColor = MaterialTheme.colorScheme.outline,
            modifier = Modifier.fillMaxWidth()
        )
    }
}
