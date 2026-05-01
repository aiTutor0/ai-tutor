package com.aitutor.app.ui.navigation

import androidx.compose.foundation.layout.fillMaxSize
import androidx.compose.runtime.Composable
import androidx.compose.ui.Modifier
import androidx.navigation.NavHostController
import androidx.navigation.compose.NavHost
import androidx.navigation.compose.composable
import com.aitutor.app.domain.model.ExamMode
import com.aitutor.app.ui.screens.auth.LoginScreen
import com.aitutor.app.ui.screens.auth.RegisterScreen
import com.aitutor.app.ui.screens.auth.SplashDecision
import com.aitutor.app.ui.screens.auth.SplashScreen
import com.aitutor.app.ui.screens.exam_select.ExamSelectScreen
import com.aitutor.app.ui.screens.group_chat.GroupChatScreen
import com.aitutor.app.ui.screens.home.MainScaffold
import com.aitutor.app.ui.screens.level_test.LevelTestScreen
import com.aitutor.app.ui.screens.listening.ListeningScreen
import com.aitutor.app.ui.screens.reading.ReadingScreen
import com.aitutor.app.ui.screens.schedule.ScheduleScreen
import com.aitutor.app.ui.screens.speaking.SpeakingScreen
import com.aitutor.app.ui.screens.writing.WritingScreen

/**
 * Top-level navigation graph.
 *
 * Flow:
 *   Splash → (signed-out) Login ⇄ Register
 *          → (signed-in, no exam picked) ExamSelect
 *          → (signed-in, exam picked) Main (bottom-nav with 4 tabs)
 *
 * Skill modules (Reading/Listening/Writing/Speaking/LevelTest) are pushed on
 * top of Main so the bottom nav disappears during a session.
 */
@Composable
fun AITutorNavGraph(
    navController: NavHostController,
    currentExam: ExamMode?
) {
    NavHost(
        navController = navController,
        startDestination = Routes.SPLASH,
        modifier = Modifier.fillMaxSize()
    ) {
        composable(Routes.SPLASH) {
            SplashScreen(onDecided = { decision ->
                val target = when (decision) {
                    SplashDecision.GoLogin -> Routes.LOGIN
                    SplashDecision.GoExamSelect -> Routes.EXAM_SELECT
                    SplashDecision.GoMain -> Routes.MAIN
                    SplashDecision.Loading -> return@SplashScreen
                }
                navController.navigate(target) {
                    popUpTo(Routes.SPLASH) { inclusive = true }
                }
            })
        }

        composable(Routes.LOGIN) {
            LoginScreen(
                onSignedIn = {
                    val target = if (currentExam == null) Routes.EXAM_SELECT else Routes.MAIN
                    navController.navigate(target) {
                        popUpTo(Routes.LOGIN) { inclusive = true }
                    }
                },
                onGoRegister = { navController.navigate(Routes.REGISTER) }
            )
        }

        composable(Routes.REGISTER) {
            RegisterScreen(
                onRegistered = {
                    navController.navigate(Routes.EXAM_SELECT) {
                        popUpTo(Routes.LOGIN) { inclusive = true }
                    }
                },
                onGoLogin = { navController.popBackStack() }
            )
        }

        composable(Routes.EXAM_SELECT) {
            ExamSelectScreen(onConfirmed = {
                navController.navigate(Routes.MAIN) {
                    popUpTo(Routes.EXAM_SELECT) { inclusive = true }
                }
            })
        }

        composable(Routes.MAIN) {
            MainScaffold(
                onOpenSkill = { skillRoute -> navController.navigate(skillRoute) },
                onOpenGroups = { navController.navigate(Routes.GROUP_CHAT) },
                onOpenSchedule = { navController.navigate(Routes.SCHEDULE) },
                onChangeExam = { navController.navigate(Routes.EXAM_SELECT) },
                onSignedOut = {
                    navController.navigate(Routes.LOGIN) {
                        popUpTo(Routes.MAIN) { inclusive = true }
                    }
                }
            )
        }

        composable(Routes.GROUP_CHAT) {
            GroupChatScreen(onBack = { navController.popBackStack() })
        }
        composable(Routes.SCHEDULE) {
            ScheduleScreen(onBack = { navController.popBackStack() })
        }

        // Skill module destinations (pushed above MAIN — bottom nav hidden)
        composable(Routes.READING) {
            ReadingScreen(examMode = currentExam, onBack = { navController.popBackStack() })
        }
        composable(Routes.LISTENING) {
            ListeningScreen(examMode = currentExam, onBack = { navController.popBackStack() })
        }
        composable(Routes.WRITING) {
            WritingScreen(examMode = currentExam, onBack = { navController.popBackStack() })
        }
        composable(Routes.SPEAKING) {
            SpeakingScreen(examMode = currentExam, onBack = { navController.popBackStack() })
        }
        composable(Routes.LEVEL_TEST) {
            LevelTestScreen(onBack = { navController.popBackStack() })
        }
    }
}
