package com.aitutor.app.ui.components

import androidx.compose.foundation.background
import androidx.compose.foundation.layout.Arrangement
import androidx.compose.foundation.layout.Row
import androidx.compose.foundation.layout.Spacer
import androidx.compose.foundation.layout.fillMaxWidth
import androidx.compose.foundation.layout.height
import androidx.compose.foundation.layout.padding
import androidx.compose.foundation.layout.size
import androidx.compose.foundation.shape.RoundedCornerShape
import androidx.compose.material.icons.Icons
import androidx.compose.material.icons.filled.Bolt
import androidx.compose.material.icons.filled.Favorite
import androidx.compose.material.icons.filled.LocalFireDepartment
import androidx.compose.material3.Icon
import androidx.compose.material3.MaterialTheme
import androidx.compose.material3.Text
import androidx.compose.runtime.Composable
import androidx.compose.ui.Alignment
import androidx.compose.ui.Modifier
import androidx.compose.ui.graphics.Color
import androidx.compose.ui.unit.dp
import com.aitutor.app.domain.model.ExamMode
import com.aitutor.app.ui.theme.DuoOrange
import com.aitutor.app.ui.theme.DuoRed
import com.aitutor.app.ui.theme.DuoYellow

/**
 * Top bar with the Duolingo-style streak / hearts / XP chips and the current
 * exam mode pill on the left. Sits above each tab screen.
 */
@Composable
fun GamificationTopBar(
    examMode: ExamMode?,
    streakDays: Int,
    hearts: Int,
    totalXp: Int,
    onExamClick: () -> Unit,
    modifier: Modifier = Modifier
) {
    Row(
        modifier = modifier
            .fillMaxWidth()
            .padding(horizontal = 16.dp, vertical = 8.dp),
        verticalAlignment = Alignment.CenterVertically,
        horizontalArrangement = Arrangement.spacedBy(8.dp)
    ) {
        // Exam mode pill
        examMode?.let {
            ExamPill(mode = it, onClick = onExamClick)
        }

        Spacer(Modifier.weight(1f))

        StatChip(
            icon = { Icon(Icons.Default.LocalFireDepartment, null, tint = DuoOrange) },
            value = streakDays.toString(),
            tint = DuoOrange
        )
        StatChip(
            icon = { Icon(Icons.Default.Favorite, null, tint = DuoRed) },
            value = hearts.toString(),
            tint = DuoRed
        )
        StatChip(
            icon = { Icon(Icons.Default.Bolt, null, tint = DuoYellow) },
            value = totalXp.toString(),
            tint = DuoYellow
        )
    }
}

@Composable
private fun ExamPill(mode: ExamMode, onClick: () -> Unit) {
    Row(
        modifier = Modifier
            .background(mode.brandColor.copy(alpha = 0.15f), RoundedCornerShape(50))
            .padding(horizontal = 12.dp, vertical = 6.dp),
        verticalAlignment = Alignment.CenterVertically
    ) {
        androidx.compose.foundation.Canvas(Modifier.size(8.dp)) {
            drawCircle(mode.brandColor)
        }
        Spacer(Modifier.size(6.dp))
        Text(
            text = mode.displayName,
            style = MaterialTheme.typography.labelMedium,
            color = mode.brandColor
        )
    }
}

@Composable
private fun StatChip(icon: @Composable () -> Unit, value: String, tint: Color) {
    Row(verticalAlignment = Alignment.CenterVertically) {
        icon()
        Spacer(Modifier.size(4.dp))
        Text(
            text = value,
            style = MaterialTheme.typography.labelLarge,
            color = tint
        )
    }
}
