package com.aitutor.app.ui.screens.profile

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
import androidx.compose.foundation.shape.CircleShape
import androidx.compose.foundation.shape.RoundedCornerShape
import androidx.compose.material.icons.Icons
import androidx.compose.material.icons.filled.CalendarMonth
import androidx.compose.material.icons.filled.Group
import androidx.compose.material3.Icon
import androidx.compose.material3.MaterialTheme
import androidx.compose.material3.Text
import androidx.compose.runtime.Composable
import androidx.compose.ui.Alignment
import androidx.compose.ui.Modifier
import androidx.compose.ui.graphics.Color
import androidx.compose.ui.graphics.vector.ImageVector
import androidx.compose.ui.unit.dp
import com.aitutor.app.ui.components.DuoButton
import com.aitutor.app.ui.theme.DuoOrange
import com.aitutor.app.ui.theme.DuoPurple
import com.aitutor.app.ui.theme.DuoRed
import com.aitutor.app.ui.theme.DuoRedDark

@Composable
fun ProfileScreen(
    onOpenGroups: () -> Unit,
    onOpenSchedule: () -> Unit,
    onSignOut: () -> Unit
) {
    Column(
        modifier = Modifier
            .fillMaxSize()
            .padding(horizontal = 24.dp, vertical = 16.dp)
    ) {
        Text("Profile", style = MaterialTheme.typography.displaySmall)
        Spacer(Modifier.height(20.dp))

        ProfileRow(
            icon = Icons.Default.Group,
            iconBg = DuoPurple,
            title = "Group rooms",
            subtitle = "Practice with other learners",
            onClick = onOpenGroups
        )
        Spacer(Modifier.height(12.dp))
        ProfileRow(
            icon = Icons.Default.CalendarMonth,
            iconBg = DuoOrange,
            title = "Study schedule",
            subtitle = "Plan and track upcoming sessions",
            onClick = onOpenSchedule
        )

        Spacer(Modifier.weight(1f))
        DuoButton(
            text = "Sign out",
            onClick = onSignOut,
            containerColor = DuoRed,
            shadowColor = DuoRedDark,
            modifier = Modifier.fillMaxWidth()
        )
    }
}

@Composable
private fun ProfileRow(
    icon: ImageVector,
    iconBg: Color,
    title: String,
    subtitle: String,
    onClick: () -> Unit
) {
    Row(
        modifier = Modifier
            .fillMaxWidth()
            .background(MaterialTheme.colorScheme.surfaceContainer, RoundedCornerShape(20.dp))
            .clickable(onClick = onClick)
            .padding(16.dp),
        verticalAlignment = Alignment.CenterVertically
    ) {
        Box(
            Modifier
                .size(48.dp)
                .background(iconBg, CircleShape),
            contentAlignment = Alignment.Center
        ) {
            Icon(icon, null, tint = Color.White)
        }
        Spacer(Modifier.size(14.dp))
        Column(Modifier.weight(1f)) {
            Text(title, style = MaterialTheme.typography.titleMedium)
            Text(
                subtitle,
                style = MaterialTheme.typography.bodyMedium,
                color = MaterialTheme.colorScheme.onSurfaceVariant
            )
        }
    }
}
