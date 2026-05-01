package com.aitutor.app.ui.screens.auth

import androidx.compose.foundation.background
import androidx.compose.foundation.layout.Arrangement
import androidx.compose.foundation.layout.Box
import androidx.compose.foundation.layout.Column
import androidx.compose.foundation.layout.Spacer
import androidx.compose.foundation.layout.fillMaxSize
import androidx.compose.foundation.layout.height
import androidx.compose.foundation.layout.size
import androidx.compose.foundation.shape.CircleShape
import androidx.compose.material3.CircularProgressIndicator
import androidx.compose.material3.MaterialTheme
import androidx.compose.material3.Text
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
import androidx.lifecycle.ViewModel
import androidx.lifecycle.viewModelScope
import com.aitutor.app.data.local.UserPreferences
import com.aitutor.app.domain.model.AuthState
import com.aitutor.app.domain.repository.AuthRepository
import com.aitutor.app.ui.theme.DuoGreen
import com.aitutor.app.ui.theme.DuoGreenDark
import dagger.hilt.android.lifecycle.HiltViewModel
import kotlinx.coroutines.flow.SharingStarted
import kotlinx.coroutines.flow.combine
import kotlinx.coroutines.flow.first
import kotlinx.coroutines.flow.stateIn
import kotlinx.coroutines.launch
import javax.inject.Inject

/** What the splash should do once auth/prefs settle. */
sealed interface SplashDecision {
    data object Loading : SplashDecision
    data object GoLogin : SplashDecision
    data object GoExamSelect : SplashDecision
    data object GoMain : SplashDecision
}

@HiltViewModel
class SplashViewModel @Inject constructor(
    authRepository: AuthRepository,
    userPreferences: UserPreferences
) : ViewModel() {
    val decision = combine(
        authRepository.authState,
        userPreferences.examMode
    ) { auth, exam ->
        when (auth) {
            AuthState.Unknown -> SplashDecision.Loading
            AuthState.SignedOut -> SplashDecision.GoLogin
            is AuthState.SignedIn -> if (exam == null) SplashDecision.GoExamSelect else SplashDecision.GoMain
        }
    }.stateIn(viewModelScope, SharingStarted.Eagerly, SplashDecision.Loading)
}

@Composable
fun SplashScreen(
    onDecided: (SplashDecision) -> Unit,
    viewModel: SplashViewModel = hiltViewModel()
) {
    val decision by viewModel.decision.collectAsState()

    LaunchedEffect(decision) {
        if (decision !is SplashDecision.Loading) onDecided(decision)
    }

    Box(
        modifier = Modifier
            .fillMaxSize()
            .background(DuoGreen),
        contentAlignment = Alignment.Center
    ) {
        Column(horizontalAlignment = Alignment.CenterHorizontally) {
            Box(
                Modifier
                    .size(96.dp)
                    .background(Color.White, CircleShape),
                contentAlignment = Alignment.Center
            ) {
                Text("AT", style = MaterialTheme.typography.displayMedium, color = DuoGreenDark)
            }
            Spacer(Modifier.height(20.dp))
            Text(
                "AITutor",
                style = MaterialTheme.typography.displayLarge,
                color = Color.White
            )
            Spacer(Modifier.height(8.dp))
            Text(
                "IELTS · TOEFL · Speak fluently",
                style = MaterialTheme.typography.titleMedium,
                color = Color.White.copy(alpha = 0.85f)
            )
            Spacer(Modifier.height(32.dp))
            CircularProgressIndicator(color = Color.White, strokeWidth = 3.dp)
        }
    }
}
