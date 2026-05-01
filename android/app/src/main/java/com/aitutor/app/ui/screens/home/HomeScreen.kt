package com.aitutor.app.ui.screens.home

import androidx.compose.foundation.background
import androidx.compose.foundation.clickable
import androidx.compose.foundation.layout.Arrangement
import androidx.compose.foundation.layout.Box
import androidx.compose.foundation.layout.Column
import androidx.compose.foundation.layout.Spacer
import androidx.compose.foundation.layout.fillMaxSize
import androidx.compose.foundation.layout.fillMaxWidth
import androidx.compose.foundation.layout.height
import androidx.compose.foundation.layout.padding
import androidx.compose.foundation.layout.size
import androidx.compose.foundation.lazy.LazyColumn
import androidx.compose.foundation.shape.CircleShape
import androidx.compose.material.icons.Icons
import androidx.compose.material.icons.filled.Lock
import androidx.compose.material.icons.filled.PlayArrow
import androidx.compose.material.icons.filled.Star
import androidx.compose.material3.Icon
import androidx.compose.material3.MaterialTheme
import androidx.compose.material3.Text
import androidx.compose.runtime.Composable
import androidx.compose.ui.Alignment
import androidx.compose.ui.Modifier
import androidx.compose.ui.graphics.Color
import androidx.compose.ui.unit.dp
import com.aitutor.app.domain.model.ExamMode
import com.aitutor.app.ui.navigation.Routes
import com.aitutor.app.ui.theme.DuoBlue
import com.aitutor.app.ui.theme.DuoGreen
import com.aitutor.app.ui.theme.DuoOrange
import com.aitutor.app.ui.theme.DuoPurple
import com.aitutor.app.ui.theme.DuoYellow

private data class SkillNode(
    val title: String,
    val subtitle: String,
    val color: Color,
    val route: String,
    val locked: Boolean = false,
    val stars: Int = 0
)

private fun ieltsTree() = listOf(
    SkillNode("Reading 1", "True/False/NG", DuoGreen, Routes.READING, stars = 3),
    SkillNode("Listening 1", "Lecture", DuoBlue, Routes.LISTENING, stars = 2),
    SkillNode("Writing — Task 1", "Charts", DuoOrange, Routes.WRITING, stars = 1),
    SkillNode("Writing — Task 2", "Essay", DuoOrange, Routes.WRITING, stars = 0),
    SkillNode("Speaking — Part 1", "Free chat", DuoPurple, Routes.SPEAKING, locked = true),
    SkillNode("Reading 2", "Multiple choice", DuoGreen, Routes.READING, locked = true),
    SkillNode("Level Test", "CEFR", DuoYellow, Routes.LEVEL_TEST)
)

private fun toeflTree() = listOf(
    SkillNode("Reading 1", "Academic passage", DuoGreen, Routes.READING, stars = 3),
    SkillNode("Listening 1", "Lecture", DuoBlue, Routes.LISTENING, stars = 1),
    SkillNode("Speaking 1", "Independent task", DuoPurple, Routes.SPEAKING, locked = true),
    SkillNode("Writing — Independent", "Essay", DuoOrange, Routes.WRITING),
    SkillNode("Writing — Integrated", "Read+Listen", DuoOrange, Routes.WRITING, locked = true),
    SkillNode("Reading 2", "Inference", DuoGreen, Routes.READING, locked = true),
    SkillNode("Level Test", "CEFR", DuoYellow, Routes.LEVEL_TEST)
)

@Composable
fun HomeScreen(
    examMode: ExamMode?,
    onOpenSkill: (String) -> Unit
) {
    val nodes = when (examMode) {
        ExamMode.IELTS -> ieltsTree()
        ExamMode.TOEFL -> toeflTree()
        null -> emptyList()
    }

    LazyColumn(
        modifier = Modifier
            .fillMaxSize()
            .padding(horizontal = 16.dp),
        verticalArrangement = Arrangement.spacedBy(20.dp),
        contentPadding = androidx.compose.foundation.layout.PaddingValues(vertical = 24.dp)
    ) {
        item {
            Text(
                text = "Section 1 — Foundations",
                style = MaterialTheme.typography.titleMedium,
                color = MaterialTheme.colorScheme.onSurfaceVariant
            )
        }
        items(nodes.size) { i ->
            val node = nodes[i]
            // Stagger the path slightly left/right like Duolingo's vine
            val offsetDp = ((i % 4) - 1) * 32
            SkillTreeNode(
                node = node,
                onClick = { if (!node.locked) onOpenSkill(node.route) },
                modifier = Modifier
                    .fillMaxWidth()
                    .padding(start = (offsetDp.coerceAtLeast(0)).dp, end = ((-offsetDp).coerceAtLeast(0)).dp)
            )
        }
    }
}

@Composable
private fun SkillTreeNode(
    node: SkillNode,
    onClick: () -> Unit,
    modifier: Modifier = Modifier
) {
    Column(
        modifier = modifier,
        horizontalAlignment = Alignment.CenterHorizontally
    ) {
        Box(
            modifier = Modifier
                .size(80.dp)
                .background(
                    if (node.locked) MaterialTheme.colorScheme.surfaceVariant else node.color,
                    CircleShape
                )
                .clickable(enabled = !node.locked, onClick = onClick),
            contentAlignment = Alignment.Center
        ) {
            Icon(
                imageVector = if (node.locked) Icons.Default.Lock else Icons.Default.PlayArrow,
                contentDescription = null,
                tint = Color.White,
                modifier = Modifier.size(36.dp)
            )
        }
        Spacer(Modifier.height(6.dp))
        Text(
            text = node.title,
            style = MaterialTheme.typography.titleSmall
        )
        Text(
            text = node.subtitle,
            style = MaterialTheme.typography.bodySmall,
            color = MaterialTheme.colorScheme.onSurfaceVariant
        )
        if (!node.locked && node.stars > 0) {
            Spacer(Modifier.height(2.dp))
            androidx.compose.foundation.layout.Row {
                repeat(3) { i ->
                    Icon(
                        Icons.Default.Star,
                        contentDescription = null,
                        tint = if (i < node.stars) DuoYellow else MaterialTheme.colorScheme.outlineVariant,
                        modifier = Modifier.size(14.dp)
                    )
                }
            }
        }
    }
}
