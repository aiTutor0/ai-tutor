package com.aitutor.app.ui.screens.speaking

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
import androidx.compose.foundation.lazy.LazyColumn
import androidx.compose.foundation.shape.CircleShape
import androidx.compose.foundation.shape.RoundedCornerShape
import androidx.compose.material.icons.Icons
import androidx.compose.material.icons.filled.Mic
import androidx.compose.material.icons.filled.MicOff
import androidx.compose.material3.CircularProgressIndicator
import androidx.compose.material3.Icon
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
import com.aitutor.app.domain.model.SpeakingMode
import com.aitutor.app.domain.model.SpeakingTurn
import com.aitutor.app.ui.components.DuoButton
import com.aitutor.app.ui.theme.DuoGreen
import com.aitutor.app.ui.theme.DuoGreenDark
import com.aitutor.app.ui.theme.DuoPurple
import com.aitutor.app.ui.theme.DuoRed
import com.aitutor.app.ui.theme.DuoRedDark
import com.google.accompanist.permissions.ExperimentalPermissionsApi
import com.google.accompanist.permissions.isGranted
import com.google.accompanist.permissions.rememberPermissionState

@OptIn(ExperimentalPermissionsApi::class)
@Composable
fun SpeakingScreen(
    examMode: ExamMode?,
    onBack: () -> Unit,
    viewModel: SpeakingViewModel = hiltViewModel()
) {
    val state by viewModel.state.collectAsState()
    val mode = examMode ?: ExamMode.IELTS
    val micPermission = rememberPermissionState(android.Manifest.permission.RECORD_AUDIO)

    if (!micPermission.status.isGranted) {
        PermissionPrompt(
            onGrant = { micPermission.launchPermissionRequest() },
            onBack = onBack
        )
        return
    }

    if (!state.isConnected && !state.isConnecting) {
        Pre(
            mode = mode,
            speakingMode = state.mode,
            onModeChange = viewModel::setMode,
            onStart = { viewModel.connect(mode) },
            onBack = onBack,
            errorMessage = state.errorMessage
        )
    } else if (state.isConnecting) {
        Connecting()
    } else {
        Live(
            isAiSpeaking = state.isAiSpeaking,
            isMuted = state.isMuted,
            transcript = state.transcript,
            onToggleMute = viewModel::toggleMute,
            onEnd = {
                viewModel.disconnect()
                onBack()
            }
        )
    }
}

@Composable
private fun PermissionPrompt(onGrant: () -> Unit, onBack: () -> Unit) {
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
                .background(DuoPurple, CircleShape),
            contentAlignment = Alignment.Center
        ) {
            Icon(Icons.Default.Mic, null, tint = Color.White, modifier = Modifier.size(48.dp))
        }
        Spacer(Modifier.height(20.dp))
        Text("Microphone needed", style = MaterialTheme.typography.headlineMedium)
        Spacer(Modifier.height(8.dp))
        Text(
            "Speaking practice uses your microphone to talk live with the AI tutor.",
            style = MaterialTheme.typography.bodyLarge,
            color = MaterialTheme.colorScheme.onSurfaceVariant
        )
        Spacer(Modifier.height(24.dp))
        DuoButton("Grant access", onClick = onGrant, modifier = Modifier.fillMaxWidth())
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
private fun Pre(
    mode: ExamMode,
    speakingMode: SpeakingMode,
    onModeChange: (SpeakingMode) -> Unit,
    onStart: () -> Unit,
    onBack: () -> Unit,
    errorMessage: String?
) {
    Column(
        Modifier
            .fillMaxSize()
            .padding(24.dp)
    ) {
        Spacer(Modifier.height(24.dp))
        Text("Speaking — ${mode.displayName}", style = MaterialTheme.typography.displaySmall)
        Spacer(Modifier.height(8.dp))
        Text(
            "Pick a style and start a live conversation.",
            style = MaterialTheme.typography.bodyLarge,
            color = MaterialTheme.colorScheme.onSurfaceVariant
        )
        Spacer(Modifier.height(24.dp))

        SpeakingMode.entries.forEach { sm ->
            ModeCard(mode = sm, selected = sm == speakingMode, onClick = { onModeChange(sm) })
            Spacer(Modifier.height(12.dp))
        }

        Spacer(Modifier.weight(1f))
        errorMessage?.let {
            Text(it, color = MaterialTheme.colorScheme.error,
                style = MaterialTheme.typography.bodySmall)
            Spacer(Modifier.height(8.dp))
        }
        DuoButton(
            text = "Start session",
            onClick = onStart,
            containerColor = DuoPurple,
            shadowColor = DuoGreenDark,
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
private fun ModeCard(mode: SpeakingMode, selected: Boolean, onClick: () -> Unit) {
    Box(
        Modifier
            .fillMaxWidth()
            .background(
                if (selected) DuoPurple.copy(alpha = 0.15f)
                else MaterialTheme.colorScheme.surfaceContainer,
                RoundedCornerShape(20.dp)
            )
            .clickable(onClick = onClick)
            .padding(20.dp)
    ) {
        Column {
            Text(mode.displayName, style = MaterialTheme.typography.titleLarge)
            Spacer(Modifier.size(2.dp))
            Text(mode.description, style = MaterialTheme.typography.bodyMedium,
                color = MaterialTheme.colorScheme.onSurfaceVariant)
        }
    }
}

@Composable
private fun Connecting() {
    Column(
        Modifier
            .fillMaxSize()
            .padding(24.dp),
        verticalArrangement = Arrangement.Center,
        horizontalAlignment = Alignment.CenterHorizontally
    ) {
        CircularProgressIndicator()
        Spacer(Modifier.height(16.dp))
        Text("Connecting to your AI tutor…", style = MaterialTheme.typography.titleMedium)
    }
}

@Composable
private fun Live(
    isAiSpeaking: Boolean,
    isMuted: Boolean,
    transcript: List<SpeakingTurn>,
    onToggleMute: () -> Unit,
    onEnd: () -> Unit
) {
    Column(Modifier.fillMaxSize().padding(16.dp)) {
        Box(
            Modifier
                .fillMaxWidth()
                .padding(top = 16.dp, bottom = 8.dp),
            contentAlignment = Alignment.Center
        ) {
            Box(
                Modifier
                    .size(120.dp)
                    .background(
                        if (isAiSpeaking) DuoPurple else DuoPurple.copy(alpha = 0.4f),
                        CircleShape
                    ),
                contentAlignment = Alignment.Center
            ) {
                Text(
                    "AI",
                    color = Color.White,
                    style = MaterialTheme.typography.displayMedium
                )
            }
        }
        Text(
            if (isAiSpeaking) "Tutor is speaking…" else "Listening to you",
            style = MaterialTheme.typography.titleMedium,
            color = MaterialTheme.colorScheme.onSurfaceVariant,
            modifier = Modifier.fillMaxWidth().padding(bottom = 8.dp)
        )
        LazyColumn(
            modifier = Modifier.weight(1f),
            verticalArrangement = Arrangement.spacedBy(6.dp)
        ) {
            items(transcript.size) { i ->
                val t = transcript[i]
                Box(
                    Modifier
                        .fillMaxWidth()
                        .background(
                            if (t.role == SpeakingTurn.Role.USER)
                                MaterialTheme.colorScheme.primaryContainer
                            else MaterialTheme.colorScheme.surfaceContainer,
                            RoundedCornerShape(12.dp)
                        )
                        .padding(12.dp)
                ) {
                    Text(t.content)
                }
            }
        }
        Spacer(Modifier.height(12.dp))
        Row(Modifier.fillMaxWidth(), horizontalArrangement = Arrangement.spacedBy(8.dp)) {
            DuoButton(
                text = if (isMuted) "Unmute" else "Mute",
                onClick = onToggleMute,
                containerColor = if (isMuted) DuoRed else DuoGreen,
                shadowColor = if (isMuted) DuoRedDark else DuoGreenDark,
                leading = {
                    Icon(
                        if (isMuted) Icons.Default.MicOff else Icons.Default.Mic,
                        null,
                        tint = Color.White,
                        modifier = Modifier.size(18.dp).padding(end = 4.dp)
                    )
                },
                modifier = Modifier.weight(1f)
            )
            DuoButton(
                text = "End",
                onClick = onEnd,
                containerColor = DuoRed,
                shadowColor = DuoRedDark,
                modifier = Modifier.weight(1f)
            )
        }
    }
}
