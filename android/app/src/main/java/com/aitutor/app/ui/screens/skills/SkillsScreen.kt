package com.aitutor.app.ui.screens.skills

import androidx.compose.foundation.background
import androidx.compose.foundation.clickable
import androidx.compose.foundation.layout.Arrangement
import androidx.compose.foundation.layout.Box
import androidx.compose.foundation.layout.Column
import androidx.compose.foundation.layout.Row
import androidx.compose.foundation.layout.Spacer
import androidx.compose.foundation.layout.fillMaxSize
import androidx.compose.foundation.layout.fillMaxWidth
import androidx.compose.foundation.layout.padding
import androidx.compose.foundation.layout.size
import androidx.compose.foundation.lazy.LazyColumn
import androidx.compose.foundation.shape.CircleShape
import androidx.compose.foundation.shape.RoundedCornerShape
import androidx.compose.material.icons.Icons
import androidx.compose.material.icons.filled.Edit
import androidx.compose.material.icons.filled.Headphones
import androidx.compose.material.icons.filled.MenuBook
import androidx.compose.material.icons.filled.Mic
import androidx.compose.material.icons.filled.Quiz
import androidx.compose.material3.Icon
import androidx.compose.material3.MaterialTheme
import androidx.compose.material3.Text
import androidx.compose.runtime.Composable
import androidx.compose.ui.Alignment
import androidx.compose.ui.Modifier
import androidx.compose.ui.graphics.Color
import androidx.compose.ui.graphics.vector.ImageVector
import androidx.compose.ui.unit.dp
import com.aitutor.app.domain.model.ExamMode
import com.aitutor.app.ui.navigation.Routes
import com.aitutor.app.ui.theme.DuoBlue
import com.aitutor.app.ui.theme.DuoGreen
import com.aitutor.app.ui.theme.DuoOrange
import com.aitutor.app.ui.theme.DuoPurple
import com.aitutor.app.ui.theme.DuoYellow

private data class SkillCard(
    val title: String,
    val description: String,
    val color: Color,
    val icon: ImageVector,
    val route: String
)

@Composable
fun SkillsScreen(
    examMode: ExamMode?,
    onOpenSkill: (String) -> Unit
) {
    val cards = listOf(
        SkillCard(
            title = "Reading",
            description = "Passages with comprehension questions",
            color = DuoGreen,
            icon = Icons.Default.MenuBook,
            route = Routes.READING
        ),
        SkillCard(
            title = "Listening",
            description = "Lectures, dialogues, audio comprehension",
            color = DuoBlue,
            icon = Icons.Default.Headphones,
            route = Routes.LISTENING
        ),
        SkillCard(
            title = "Writing",
            description = if (examMode == ExamMode.TOEFL) "Independent + Integrated tasks" else "Task 1 (chart) + Task 2 (essay)",
            color = DuoOrange,
            icon = Icons.Default.Edit,
            route = Routes.WRITING
        ),
        SkillCard(
            title = "Speaking",
            description = "Real-time AI conversation",
            color = DuoPurple,
            icon = Icons.Default.Mic,
            route = Routes.SPEAKING
        ),
        SkillCard(
            title = "Level Test",
            description = "CEFR placement (A1–C1)",
            color = DuoYellow,
            icon = Icons.Default.Quiz,
            route = Routes.LEVEL_TEST
        )
    )

    LazyColumn(
        modifier = Modifier
            .fillMaxSize()
            .padding(horizontal = 16.dp),
        verticalArrangement = Arrangement.spacedBy(12.dp),
        contentPadding = androidx.compose.foundation.layout.PaddingValues(vertical = 16.dp)
    ) {
        item {
            Text(
                text = "All skills",
                style = MaterialTheme.typography.headlineMedium
            )
            Spacer(Modifier.size(4.dp))
            Text(
                text = examMode?.let { "Tuned for ${it.displayName}" } ?: "",
                style = MaterialTheme.typography.bodyMedium,
                color = MaterialTheme.colorScheme.onSurfaceVariant
            )
            Spacer(Modifier.size(8.dp))
        }
        items(cards.size) { i ->
            val card = cards[i]
            Row(
                modifier = Modifier
                    .fillMaxWidth()
                    .background(MaterialTheme.colorScheme.surfaceContainer, RoundedCornerShape(20.dp))
                    .clickable { onOpenSkill(card.route) }
                    .padding(16.dp),
                verticalAlignment = Alignment.CenterVertically
            ) {
                Box(
                    modifier = Modifier
                        .size(56.dp)
                        .background(card.color, CircleShape),
                    contentAlignment = Alignment.Center
                ) {
                    Icon(card.icon, null, tint = Color.White)
                }
                Spacer(Modifier.size(16.dp))
                Column(Modifier.weight(1f)) {
                    Text(card.title, style = MaterialTheme.typography.titleLarge)
                    Text(
                        card.description,
                        style = MaterialTheme.typography.bodyMedium,
                        color = MaterialTheme.colorScheme.onSurfaceVariant
                    )
                }
            }
        }
    }
}
