package com.aitutor.app.ui.components

import androidx.compose.foundation.background
import androidx.compose.foundation.border
import androidx.compose.foundation.clickable
import androidx.compose.foundation.layout.Arrangement
import androidx.compose.foundation.layout.Box
import androidx.compose.foundation.layout.Column
import androidx.compose.foundation.layout.Row
import androidx.compose.foundation.layout.Spacer
import androidx.compose.foundation.layout.fillMaxWidth
import androidx.compose.foundation.layout.height
import androidx.compose.foundation.layout.padding
import androidx.compose.foundation.layout.size
import androidx.compose.foundation.shape.CircleShape
import androidx.compose.foundation.shape.RoundedCornerShape
import androidx.compose.material3.MaterialTheme
import androidx.compose.material3.OutlinedTextField
import androidx.compose.material3.Text
import androidx.compose.runtime.Composable
import androidx.compose.ui.Alignment
import androidx.compose.ui.Modifier
import androidx.compose.ui.text.font.FontWeight
import androidx.compose.ui.unit.dp
import com.aitutor.app.domain.model.QuestionType
import com.aitutor.app.domain.model.ReadingQuestion
import com.aitutor.app.ui.theme.DuoGreen

@Composable
fun QuestionView(
    question: ReadingQuestion,
    answer: String,
    onAnswer: (String) -> Unit
) {
    Column {
        Text(
            text = question.question,
            style = MaterialTheme.typography.titleLarge
        )
        Spacer(Modifier.height(16.dp))
        when (question.type) {
            QuestionType.MULTIPLE_CHOICE,
            QuestionType.INFERENCE -> ChoiceList(
                options = question.options.ifEmpty { listOf("A", "B", "C", "D") },
                selected = answer,
                onSelect = onAnswer
            )

            QuestionType.TRUE_FALSE -> ChoiceList(
                options = listOf("True", "False"),
                selected = answer,
                onSelect = onAnswer
            )

            QuestionType.TRUE_FALSE_NG -> ChoiceList(
                options = listOf("True", "False", "Not Given"),
                selected = answer,
                onSelect = onAnswer
            )

            QuestionType.FILL_BLANK -> OutlinedTextField(
                value = answer,
                onValueChange = onAnswer,
                placeholder = { Text("Type your answer…") },
                singleLine = false,
                modifier = Modifier.fillMaxWidth()
            )

            QuestionType.SUMMARY -> Column {
                Text(
                    "Pick the three letters (e.g. A,C,E) that best summarize the passage:",
                    style = MaterialTheme.typography.bodySmall,
                    color = MaterialTheme.colorScheme.onSurfaceVariant
                )
                Spacer(Modifier.height(8.dp))
                question.options.forEach { opt ->
                    Text("• $opt", style = MaterialTheme.typography.bodyMedium)
                }
                Spacer(Modifier.height(12.dp))
                OutlinedTextField(
                    value = answer,
                    onValueChange = onAnswer,
                    label = { Text("Letters, comma-separated") },
                    singleLine = true,
                    modifier = Modifier.fillMaxWidth()
                )
            }
        }
    }
}

@Composable
private fun ChoiceList(
    options: List<String>,
    selected: String,
    onSelect: (String) -> Unit
) {
    Column(verticalArrangement = Arrangement.spacedBy(8.dp)) {
        options.forEachIndexed { index, opt ->
            val letter = when {
                opt.length >= 2 && opt[1] == ')' -> opt.substring(0, 1)
                else -> ('A' + index).toString()
            }
            val displayText = opt.substringAfter(") ", opt)
            val isSelected = selected.equals(letter, ignoreCase = true) ||
                selected.equals(opt, ignoreCase = true) ||
                selected.equals(displayText, ignoreCase = true)
            ChoiceRow(
                letter = letter,
                text = displayText,
                selected = isSelected,
                onClick = { onSelect(letter) }
            )
        }
    }
}

@Composable
private fun ChoiceRow(
    letter: String,
    text: String,
    selected: Boolean,
    onClick: () -> Unit
) {
    val borderColor = if (selected) DuoGreen else MaterialTheme.colorScheme.outline
    val bg = if (selected) DuoGreen.copy(alpha = 0.08f) else MaterialTheme.colorScheme.surface
    Row(
        modifier = Modifier
            .fillMaxWidth()
            .border(
                width = if (selected) 2.dp else 1.dp,
                color = borderColor,
                shape = RoundedCornerShape(14.dp)
            )
            .background(bg, RoundedCornerShape(14.dp))
            .clickable(onClick = onClick)
            .padding(horizontal = 12.dp, vertical = 12.dp),
        verticalAlignment = Alignment.CenterVertically
    ) {
        Box(
            modifier = Modifier
                .size(28.dp)
                .background(
                    if (selected) DuoGreen else MaterialTheme.colorScheme.surfaceVariant,
                    CircleShape
                ),
            contentAlignment = Alignment.Center
        ) {
            Text(
                letter,
                style = MaterialTheme.typography.labelLarge,
                color = if (selected) androidx.compose.ui.graphics.Color.White
                else MaterialTheme.colorScheme.onSurface,
                fontWeight = FontWeight.ExtraBold
            )
        }
        Spacer(Modifier.size(12.dp))
        Text(text, style = MaterialTheme.typography.bodyLarge)
    }
}
