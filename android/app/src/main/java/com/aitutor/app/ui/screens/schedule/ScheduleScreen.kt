package com.aitutor.app.ui.screens.schedule

import androidx.compose.foundation.background
import androidx.compose.foundation.layout.Arrangement
import androidx.compose.foundation.layout.Box
import androidx.compose.foundation.layout.Column
import androidx.compose.foundation.layout.Row
import androidx.compose.foundation.layout.Spacer
import androidx.compose.foundation.layout.fillMaxSize
import androidx.compose.foundation.layout.fillMaxWidth
import androidx.compose.foundation.layout.padding
import androidx.compose.foundation.lazy.LazyColumn
import androidx.compose.foundation.shape.RoundedCornerShape
import androidx.compose.material.icons.Icons
import androidx.compose.material.icons.automirrored.filled.ArrowBack
import androidx.compose.material.icons.filled.Add
import androidx.compose.material.icons.filled.Delete
import androidx.compose.material3.AlertDialog
import androidx.compose.material3.Icon
import androidx.compose.material3.IconButton
import androidx.compose.material3.MaterialTheme
import androidx.compose.material3.OutlinedTextField
import androidx.compose.material3.Text
import androidx.compose.material3.TextButton
import androidx.compose.runtime.Composable
import androidx.compose.runtime.collectAsState
import androidx.compose.runtime.getValue
import androidx.compose.runtime.mutableStateOf
import androidx.compose.runtime.remember
import androidx.compose.runtime.setValue
import androidx.compose.ui.Alignment
import androidx.compose.ui.Modifier
import androidx.compose.ui.graphics.Color
import androidx.compose.ui.unit.dp
import androidx.hilt.navigation.compose.hiltViewModel
import com.aitutor.app.ui.theme.DuoOrange
import java.time.Instant
import java.time.LocalDateTime
import java.time.ZoneId
import java.time.format.DateTimeFormatter

@Composable
fun ScheduleScreen(
    onBack: () -> Unit,
    viewModel: ScheduleViewModel = hiltViewModel()
) {
    val state by viewModel.state.collectAsState()
    var showAddDialog by remember { mutableStateOf(false) }

    Column(Modifier.fillMaxSize().padding(16.dp)) {
        Row(verticalAlignment = Alignment.CenterVertically) {
            IconButton(onClick = onBack) {
                Icon(Icons.AutoMirrored.Filled.ArrowBack, "Back")
            }
            Text("Schedule", style = MaterialTheme.typography.headlineMedium)
            Spacer(Modifier.weight(1f))
            IconButton(
                onClick = { showAddDialog = true },
                modifier = Modifier.background(DuoOrange, RoundedCornerShape(50))
            ) {
                Icon(Icons.Default.Add, "Add session", tint = Color.White)
            }
        }
        Spacer(Modifier.padding(top = 8.dp))
        if (state.errorMessage != null) {
            Text(
                state.errorMessage,
                color = MaterialTheme.colorScheme.error,
                style = MaterialTheme.typography.bodySmall
            )
        }
        if (state.sessions.isEmpty()) {
            Box(Modifier.fillMaxSize(), contentAlignment = Alignment.Center) {
                Text(
                    "No upcoming sessions. Tap + to schedule one.",
                    style = MaterialTheme.typography.bodyLarge,
                    color = MaterialTheme.colorScheme.onSurfaceVariant
                )
            }
        } else {
            LazyColumn(verticalArrangement = Arrangement.spacedBy(8.dp)) {
                items(state.sessions.size) { i ->
                    val s = state.sessions[i]
                    SessionRow(
                        title = s.title,
                        notes = s.notes,
                        scheduledFor = s.scheduledFor,
                        onDelete = { viewModel.remove(s.id) }
                    )
                }
            }
        }
    }

    if (showAddDialog) {
        AddSessionDialog(
            onDismiss = { showAddDialog = false },
            onConfirm = { title, notes, iso ->
                viewModel.add(title, notes, iso)
                showAddDialog = false
            }
        )
    }
}

@Composable
private fun SessionRow(
    title: String,
    notes: String?,
    scheduledFor: String,
    onDelete: () -> Unit
) {
    Row(
        Modifier
            .fillMaxWidth()
            .background(MaterialTheme.colorScheme.surfaceContainer, RoundedCornerShape(14.dp))
            .padding(14.dp),
        verticalAlignment = Alignment.CenterVertically
    ) {
        Column(Modifier.weight(1f)) {
            Text(title, style = MaterialTheme.typography.titleMedium)
            Text(
                formatIsoFriendly(scheduledFor),
                style = MaterialTheme.typography.bodySmall,
                color = MaterialTheme.colorScheme.onSurfaceVariant
            )
            if (!notes.isNullOrBlank()) {
                Spacer(Modifier.padding(top = 4.dp))
                Text(notes, style = MaterialTheme.typography.bodyMedium)
            }
        }
        IconButton(onClick = onDelete) {
            Icon(Icons.Default.Delete, "Delete", tint = MaterialTheme.colorScheme.error)
        }
    }
}

@Composable
private fun AddSessionDialog(
    onDismiss: () -> Unit,
    onConfirm: (title: String, notes: String?, iso: String) -> Unit
) {
    var title by remember { mutableStateOf("") }
    var notes by remember { mutableStateOf("") }
    var dateString by remember {
        mutableStateOf(LocalDateTime.now().plusDays(1).withMinute(0).withSecond(0).withNano(0)
            .format(DateTimeFormatter.ofPattern("yyyy-MM-dd HH:mm")))
    }

    AlertDialog(
        onDismissRequest = onDismiss,
        title = { Text("Schedule a session") },
        text = {
            Column {
                OutlinedTextField(
                    value = title, onValueChange = { title = it },
                    label = { Text("Title") }, singleLine = true,
                    modifier = Modifier.fillMaxWidth()
                )
                Spacer(Modifier.padding(top = 8.dp))
                OutlinedTextField(
                    value = notes, onValueChange = { notes = it },
                    label = { Text("Notes (optional)") },
                    modifier = Modifier.fillMaxWidth()
                )
                Spacer(Modifier.padding(top = 8.dp))
                OutlinedTextField(
                    value = dateString, onValueChange = { dateString = it },
                    label = { Text("Date & time (yyyy-MM-dd HH:mm)") },
                    singleLine = true,
                    modifier = Modifier.fillMaxWidth()
                )
            }
        },
        confirmButton = {
            TextButton(onClick = {
                runCatching {
                    val ldt = LocalDateTime.parse(
                        dateString,
                        DateTimeFormatter.ofPattern("yyyy-MM-dd HH:mm")
                    )
                    val iso = ldt.atZone(ZoneId.systemDefault()).toInstant().toString()
                    if (title.isNotBlank()) {
                        onConfirm(title.trim(), notes.trim().takeIf { it.isNotEmpty() }, iso)
                    }
                }
            }) { Text("Add") }
        },
        dismissButton = {
            TextButton(onClick = onDismiss) { Text("Cancel") }
        }
    )
}

private fun formatIsoFriendly(iso: String): String =
    runCatching {
        val instant = Instant.parse(iso)
        val ldt = instant.atZone(ZoneId.systemDefault()).toLocalDateTime()
        ldt.format(DateTimeFormatter.ofPattern("EEE, MMM d • HH:mm"))
    }.getOrDefault(iso)
