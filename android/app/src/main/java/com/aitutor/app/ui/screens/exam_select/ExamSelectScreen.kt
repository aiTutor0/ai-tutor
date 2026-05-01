package com.aitutor.app.ui.screens.exam_select

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
import androidx.compose.foundation.shape.CircleShape
import androidx.compose.foundation.shape.RoundedCornerShape
import androidx.compose.material.icons.Icons
import androidx.compose.material.icons.filled.Check
import androidx.compose.material3.Icon
import androidx.compose.material3.MaterialTheme
import androidx.compose.material3.Text
import androidx.compose.runtime.Composable
import androidx.compose.runtime.getValue
import androidx.compose.runtime.mutableStateOf
import androidx.compose.runtime.remember
import androidx.compose.runtime.setValue
import androidx.compose.ui.Alignment
import androidx.compose.ui.Modifier
import androidx.compose.ui.graphics.Color
import androidx.compose.ui.text.font.FontWeight
import androidx.compose.ui.unit.dp
import androidx.hilt.navigation.compose.hiltViewModel
import androidx.lifecycle.ViewModel
import androidx.lifecycle.viewModelScope
import com.aitutor.app.data.local.UserPreferences
import com.aitutor.app.domain.model.ExamMode
import com.aitutor.app.ui.components.DuoButton
import dagger.hilt.android.lifecycle.HiltViewModel
import kotlinx.coroutines.launch
import javax.inject.Inject

@HiltViewModel
class ExamSelectViewModel @Inject constructor(
    private val userPreferences: UserPreferences
) : ViewModel() {
    fun confirm(mode: ExamMode, onDone: () -> Unit) {
        viewModelScope.launch {
            userPreferences.setExamMode(mode)
            userPreferences.setOnboardingDone(true)
            onDone()
        }
    }
}

@Composable
fun ExamSelectScreen(
    onConfirmed: () -> Unit,
    viewModel: ExamSelectViewModel = hiltViewModel()
) {
    var selected by remember { mutableStateOf<ExamMode?>(null) }

    Column(
        modifier = Modifier
            .fillMaxSize()
            .padding(24.dp),
        horizontalAlignment = Alignment.CenterHorizontally
    ) {
        Spacer(Modifier.height(40.dp))
        Text("Which exam?", style = MaterialTheme.typography.displayMedium)
        Spacer(Modifier.height(8.dp))
        Text(
            "Pick the exam you're preparing for. You can switch any time.",
            style = MaterialTheme.typography.bodyLarge,
            color = MaterialTheme.colorScheme.onSurfaceVariant
        )
        Spacer(Modifier.height(40.dp))

        ExamMode.entries.forEach { mode ->
            ExamCard(
                mode = mode,
                selected = selected == mode,
                onClick = { selected = mode }
            )
            Spacer(Modifier.height(16.dp))
        }

        Spacer(Modifier.weight(1f))

        DuoButton(
            text = if (selected == null) "Choose an exam" else "Continue with ${selected?.displayName}",
            onClick = { selected?.let { viewModel.confirm(it, onConfirmed) } },
            enabled = selected != null,
            modifier = Modifier.fillMaxWidth()
        )
    }
}

@Composable
private fun ExamCard(mode: ExamMode, selected: Boolean, onClick: () -> Unit) {
    val borderColor = if (selected) mode.brandColor else MaterialTheme.colorScheme.outline
    Row(
        modifier = Modifier
            .fillMaxWidth()
            .border(
                width = if (selected) 3.dp else 2.dp,
                color = borderColor,
                shape = RoundedCornerShape(20.dp)
            )
            .background(
                if (selected) mode.brandColor.copy(alpha = 0.06f)
                else MaterialTheme.colorScheme.surface,
                RoundedCornerShape(20.dp)
            )
            .clickable(onClick = onClick)
            .padding(20.dp),
        verticalAlignment = Alignment.CenterVertically
    ) {
        Box(
            Modifier
                .size(56.dp)
                .background(mode.brandColor, CircleShape),
            contentAlignment = Alignment.Center
        ) {
            Text(
                mode.displayName.take(1),
                color = Color.White,
                style = MaterialTheme.typography.headlineMedium,
                fontWeight = FontWeight.ExtraBold
            )
        }
        Spacer(Modifier.size(16.dp))
        Column(Modifier.weight(1f)) {
            Text(
                mode.displayName,
                style = MaterialTheme.typography.headlineSmall
            )
            Spacer(Modifier.height(2.dp))
            Text(
                mode.tagline,
                style = MaterialTheme.typography.bodyMedium,
                color = MaterialTheme.colorScheme.onSurfaceVariant
            )
        }
        if (selected) {
            Box(
                Modifier
                    .size(28.dp)
                    .background(mode.brandColor, CircleShape),
                contentAlignment = Alignment.Center
            ) {
                Icon(
                    Icons.Default.Check,
                    contentDescription = null,
                    tint = Color.White,
                    modifier = Modifier.size(18.dp)
                )
            }
        }
    }
}
