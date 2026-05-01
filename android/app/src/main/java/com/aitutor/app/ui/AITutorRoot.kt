package com.aitutor.app.ui

import androidx.compose.runtime.Composable
import androidx.compose.runtime.collectAsState
import androidx.compose.runtime.getValue
import androidx.hilt.navigation.compose.hiltViewModel
import androidx.lifecycle.ViewModel
import androidx.lifecycle.viewModelScope
import androidx.navigation.compose.rememberNavController
import com.aitutor.app.data.local.UserPreferences
import com.aitutor.app.domain.model.ExamMode
import com.aitutor.app.ui.navigation.AITutorNavGraph
import dagger.hilt.android.lifecycle.HiltViewModel
import kotlinx.coroutines.flow.SharingStarted
import kotlinx.coroutines.flow.stateIn
import javax.inject.Inject

@HiltViewModel
class RootViewModel @Inject constructor(
    userPreferences: UserPreferences
) : ViewModel() {
    val currentExam = userPreferences.examMode.stateIn(
        viewModelScope, SharingStarted.Eagerly, null
    )
}

@Composable
fun AITutorRoot(viewModel: RootViewModel = hiltViewModel()) {
    val navController = rememberNavController()
    val currentExam: ExamMode? by viewModel.currentExam.collectAsState()
    AITutorNavGraph(navController = navController, currentExam = currentExam)
}
