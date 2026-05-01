package com.aitutor.app.ui.screens.group_chat

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
import androidx.compose.foundation.lazy.LazyColumn
import androidx.compose.foundation.lazy.rememberLazyListState
import androidx.compose.foundation.shape.RoundedCornerShape
import androidx.compose.material.icons.Icons
import androidx.compose.material.icons.automirrored.filled.ArrowBack
import androidx.compose.material.icons.automirrored.filled.Send
import androidx.compose.material.icons.filled.Add
import androidx.compose.material3.AlertDialog
import androidx.compose.material3.Icon
import androidx.compose.material3.IconButton
import androidx.compose.material3.MaterialTheme
import androidx.compose.material3.OutlinedTextField
import androidx.compose.material3.Text
import androidx.compose.material3.TextButton
import androidx.compose.runtime.Composable
import androidx.compose.runtime.LaunchedEffect
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
import com.aitutor.app.domain.model.GroupMessage
import com.aitutor.app.domain.model.Room
import com.aitutor.app.ui.components.DuoButton
import com.aitutor.app.ui.theme.DuoBlue
import com.aitutor.app.ui.theme.DuoGreen

@Composable
fun GroupChatScreen(
    onBack: () -> Unit,
    viewModel: GroupChatViewModel = hiltViewModel()
) {
    val state by viewModel.state.collectAsState()
    val active = state.activeRoom

    if (active == null) {
        RoomList(
            state = state,
            onPickRoom = viewModel::enterRoom,
            onCreateRoom = viewModel::createRoom,
            onRefresh = viewModel::refreshRooms,
            onBack = onBack,
            onClearError = viewModel::clearError
        )
    } else {
        RoomChat(
            room = active,
            messages = state.messages,
            onSend = viewModel::send,
            onLeave = viewModel::leaveRoom
        )
    }
}

@Composable
private fun RoomList(
    state: GroupChatState,
    onPickRoom: (Room) -> Unit,
    onCreateRoom: (String) -> Unit,
    onRefresh: () -> Unit,
    onBack: () -> Unit,
    onClearError: () -> Unit
) {
    var showDialog by remember { mutableStateOf(false) }

    Column(
        Modifier
            .fillMaxSize()
            .padding(16.dp)
    ) {
        Row(verticalAlignment = Alignment.CenterVertically) {
            IconButton(onClick = onBack) {
                Icon(Icons.AutoMirrored.Filled.ArrowBack, "Back")
            }
            Text("Group rooms", style = MaterialTheme.typography.headlineMedium)
            Spacer(Modifier.weight(1f))
            IconButton(
                onClick = { showDialog = true },
                modifier = Modifier.background(DuoGreen, RoundedCornerShape(50))
            ) {
                Icon(Icons.Default.Add, "Create room", tint = Color.White)
            }
        }
        Spacer(Modifier.height(8.dp))
        if (state.errorMessage != null) {
            Text(
                state.errorMessage,
                color = MaterialTheme.colorScheme.error,
                style = MaterialTheme.typography.bodySmall,
                modifier = Modifier.clickable { onClearError() }
            )
        }
        if (state.rooms.isEmpty() && !state.isLoading) {
            Box(Modifier.fillMaxSize(), contentAlignment = Alignment.Center) {
                Column(horizontalAlignment = Alignment.CenterHorizontally) {
                    Text("No rooms yet", style = MaterialTheme.typography.titleMedium)
                    Spacer(Modifier.height(8.dp))
                    DuoButton("Create the first room", onClick = { showDialog = true })
                }
            }
        } else {
            LazyColumn(verticalArrangement = Arrangement.spacedBy(8.dp)) {
                items(state.rooms.size) { i ->
                    val r = state.rooms[i]
                    Row(
                        Modifier
                            .fillMaxWidth()
                            .background(MaterialTheme.colorScheme.surfaceContainer, RoundedCornerShape(14.dp))
                            .clickable { onPickRoom(r) }
                            .padding(16.dp)
                    ) {
                        Text(r.name, style = MaterialTheme.typography.titleMedium)
                    }
                }
            }
        }
    }

    if (showDialog) {
        var newName by remember { mutableStateOf("") }
        AlertDialog(
            onDismissRequest = { showDialog = false },
            title = { Text("New room") },
            text = {
                OutlinedTextField(
                    value = newName, onValueChange = { newName = it },
                    label = { Text("Room name") },
                    singleLine = true
                )
            },
            confirmButton = {
                TextButton(onClick = {
                    onCreateRoom(newName.trim())
                    showDialog = false
                }) { Text("Create") }
            },
            dismissButton = {
                TextButton(onClick = { showDialog = false }) { Text("Cancel") }
            }
        )
    }
}

@Composable
private fun RoomChat(
    room: Room,
    messages: List<GroupMessage>,
    onSend: (String) -> Unit,
    onLeave: () -> Unit
) {
    var input by remember { mutableStateOf("") }
    val listState = rememberLazyListState()

    LaunchedEffect(messages.size) {
        if (messages.isNotEmpty()) listState.animateScrollToItem(messages.size - 1)
    }

    Column(Modifier.fillMaxSize()) {
        Row(
            Modifier.padding(8.dp),
            verticalAlignment = Alignment.CenterVertically
        ) {
            IconButton(onClick = onLeave) {
                Icon(Icons.AutoMirrored.Filled.ArrowBack, "Leave")
            }
            Text(room.name, style = MaterialTheme.typography.titleLarge)
        }
        LazyColumn(
            state = listState,
            modifier = Modifier
                .weight(1f)
                .padding(horizontal = 12.dp),
            verticalArrangement = Arrangement.spacedBy(6.dp)
        ) {
            items(messages.size) { i ->
                val m = messages[i]
                MessageBubble(m)
            }
        }
        Row(
            Modifier
                .fillMaxWidth()
                .padding(8.dp),
            verticalAlignment = Alignment.CenterVertically
        ) {
            OutlinedTextField(
                value = input,
                onValueChange = { input = it },
                placeholder = { Text("Type a message…") },
                modifier = Modifier.weight(1f),
                shape = RoundedCornerShape(28.dp)
            )
            IconButton(
                onClick = {
                    if (input.isNotBlank()) {
                        onSend(input.trim()); input = ""
                    }
                },
                modifier = Modifier
                    .padding(start = 6.dp)
                    .background(DuoBlue, RoundedCornerShape(50))
            ) {
                Icon(Icons.AutoMirrored.Filled.Send, "Send", tint = Color.White)
            }
        }
    }
}

@Composable
private fun MessageBubble(msg: GroupMessage) {
    Column(Modifier.padding(vertical = 2.dp)) {
        Text(
            msg.displayName ?: "Anonymous",
            style = MaterialTheme.typography.labelSmall,
            color = MaterialTheme.colorScheme.onSurfaceVariant
        )
        Box(
            Modifier
                .background(MaterialTheme.colorScheme.surfaceContainer, RoundedCornerShape(14.dp))
                .padding(horizontal = 12.dp, vertical = 8.dp)
        ) {
            Text(msg.content, style = MaterialTheme.typography.bodyLarge)
        }
    }
}
