package com.aitutor.app.ui.components

import androidx.compose.material.icons.Icons
import androidx.compose.material.icons.outlined.Chat
import androidx.compose.material.icons.outlined.Home
import androidx.compose.material.icons.outlined.Person
import androidx.compose.material.icons.outlined.School
import androidx.compose.material3.Icon
import androidx.compose.material3.NavigationBar
import androidx.compose.material3.NavigationBarItem
import androidx.compose.material3.NavigationBarItemDefaults
import androidx.compose.material3.Text
import androidx.compose.runtime.Composable
import androidx.compose.ui.graphics.vector.ImageVector
import com.aitutor.app.ui.navigation.Routes
import com.aitutor.app.ui.theme.DuoGreen

private data class BottomTab(
    val route: String,
    val label: String,
    val icon: ImageVector
)

private val tabs = listOf(
    BottomTab(Routes.HOME, "Learn", Icons.Outlined.Home),
    BottomTab(Routes.SKILLS, "Skills", Icons.Outlined.School),
    BottomTab(Routes.CHAT, "Tutor", Icons.Outlined.Chat),
    BottomTab(Routes.PROFILE, "Profile", Icons.Outlined.Person)
)

@Composable
fun BottomNav(
    currentRoute: String?,
    onSelect: (String) -> Unit
) {
    NavigationBar {
        tabs.forEach { tab ->
            NavigationBarItem(
                selected = currentRoute == tab.route,
                onClick = { onSelect(tab.route) },
                icon = { Icon(tab.icon, contentDescription = tab.label) },
                label = { Text(tab.label) },
                colors = NavigationBarItemDefaults.colors(
                    selectedIconColor = DuoGreen,
                    selectedTextColor = DuoGreen,
                    indicatorColor = DuoGreen.copy(alpha = 0.12f)
                )
            )
        }
    }
}
