package com.aitutor.app.ui.screens.home

import androidx.compose.foundation.layout.PaddingValues
import androidx.compose.foundation.layout.fillMaxSize
import androidx.compose.foundation.layout.padding
import androidx.compose.material3.Scaffold
import androidx.compose.runtime.Composable
import androidx.compose.runtime.collectAsState
import androidx.compose.runtime.getValue
import androidx.compose.ui.Modifier
import androidx.hilt.navigation.compose.hiltViewModel
import androidx.lifecycle.ViewModel
import androidx.lifecycle.viewModelScope
import androidx.navigation.NavHostController
import androidx.navigation.compose.NavHost
import androidx.navigation.compose.composable
import androidx.navigation.compose.currentBackStackEntryAsState
import androidx.navigation.compose.rememberNavController
import com.aitutor.app.data.local.UserPreferences
import com.aitutor.app.domain.model.ExamMode
import com.aitutor.app.domain.repository.AuthRepository
import com.aitutor.app.ui.components.BottomNav
import com.aitutor.app.ui.components.GamificationTopBar
import com.aitutor.app.ui.navigation.Routes
import com.aitutor.app.ui.screens.chat.ChatHomeScreen
import com.aitutor.app.ui.screens.profile.ProfileScreen
import com.aitutor.app.ui.screens.skills.SkillsScreen
import dagger.hilt.android.lifecycle.HiltViewModel
import kotlinx.coroutines.flow.SharingStarted
import kotlinx.coroutines.flow.combine
import kotlinx.coroutines.flow.stateIn
import kotlinx.coroutines.launch
import javax.inject.Inject

data class MainTopBarState(
    val examMode: ExamMode? = null,
    val streak: Int = 0,
    val hearts: Int = 5,
    val xp: Int = 0
)

@HiltViewModel
class MainScaffoldViewModel @Inject constructor(
    private val userPreferences: UserPreferences,
    private val authRepository: AuthRepository
) : ViewModel() {

    val topBarState = combine(
        userPreferences.examMode,
        userPreferences.currentStreak,
        userPreferences.hearts,
        userPreferences.totalXp
    ) { exam, streak, hearts, xp ->
        MainTopBarState(exam, streak, hearts, xp)
    }.stateIn(viewModelScope, SharingStarted.Eagerly, MainTopBarState())

    fun signOut(onSignedOut: () -> Unit) {
        viewModelScope.launch {
            authRepository.signOut()
            onSignedOut()
        }
    }
}

/**
 * Logged-in home: top exam/streak/hearts/XP bar + bottom nav between
 * Learn / Skills / Tutor / Profile.
 *
 * Skill modules (Reading/Listening/Writing/Speaking/LevelTest) live above
 * this scaffold in the parent NavGraph and are pushed on top when the user
 * starts a session.
 */
@Composable
fun MainScaffold(
    onOpenSkill: (skillRoute: String) -> Unit,
    onOpenGroups: () -> Unit,
    onOpenSchedule: () -> Unit,
    onChangeExam: () -> Unit,
    onSignedOut: () -> Unit,
    viewModel: MainScaffoldViewModel = hiltViewModel()
) {
    val nav = rememberNavController()
    val currentRoute = nav.currentBackStackEntryAsState().value?.destination?.route
    val topBar by viewModel.topBarState.collectAsState()

    Scaffold(
        topBar = {
            GamificationTopBar(
                examMode = topBar.examMode,
                streakDays = topBar.streak,
                hearts = topBar.hearts,
                totalXp = topBar.xp,
                onExamClick = onChangeExam
            )
        },
        bottomBar = {
            BottomNav(
                currentRoute = currentRoute,
                onSelect = { route ->
                    if (route != currentRoute) {
                        nav.navigate(route) {
                            popUpTo(Routes.HOME) { saveState = true }
                            launchSingleTop = true
                            restoreState = true
                        }
                    }
                }
            )
        }
    ) { padding ->
        InnerNav(
            navController = nav,
            padding = padding,
            examMode = topBar.examMode,
            onOpenSkill = onOpenSkill,
            onOpenGroups = onOpenGroups,
            onOpenSchedule = onOpenSchedule,
            onSignOut = { viewModel.signOut(onSignedOut) }
        )
    }
}

@Composable
private fun InnerNav(
    navController: NavHostController,
    padding: PaddingValues,
    examMode: ExamMode?,
    onOpenSkill: (String) -> Unit,
    onOpenGroups: () -> Unit,
    onOpenSchedule: () -> Unit,
    onSignOut: () -> Unit
) {
    NavHost(
        navController = navController,
        startDestination = Routes.HOME,
        modifier = Modifier
            .fillMaxSize()
            .padding(padding)
    ) {
        composable(Routes.HOME) { HomeScreen(examMode = examMode, onOpenSkill = onOpenSkill) }
        composable(Routes.SKILLS) { SkillsScreen(examMode = examMode, onOpenSkill = onOpenSkill) }
        composable(Routes.CHAT) { ChatHomeScreen() }
        composable(Routes.PROFILE) {
            ProfileScreen(
                onOpenGroups = onOpenGroups,
                onOpenSchedule = onOpenSchedule,
                onSignOut = onSignOut
            )
        }
    }
}
