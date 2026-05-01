package com.aitutor.app.domain.repository

import com.aitutor.app.domain.model.AuthState
import kotlinx.coroutines.flow.Flow

interface AuthRepository {
    val authState: Flow<AuthState>

    suspend fun signInWithEmail(email: String, password: String): Result<Unit>
    suspend fun signUpWithEmail(email: String, password: String, displayName: String?): Result<Unit>
    suspend fun signInWithGoogle(): Result<Unit>
    suspend fun signOut(): Result<Unit>
    suspend fun sendPasswordReset(email: String): Result<Unit>
}
