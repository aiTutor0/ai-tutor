package com.aitutor.app.data.repository

import com.aitutor.app.data.remote.SupabaseProvider
import com.aitutor.app.domain.model.AppUser
import com.aitutor.app.domain.model.AuthState
import com.aitutor.app.domain.repository.AuthRepository
import io.github.jan.supabase.auth.auth
import io.github.jan.supabase.auth.providers.Google
import io.github.jan.supabase.auth.providers.builtin.Email
import io.github.jan.supabase.auth.status.SessionStatus
import io.github.jan.supabase.auth.user.UserInfo
import kotlinx.coroutines.flow.Flow
import kotlinx.coroutines.flow.map
import kotlinx.serialization.json.JsonObject
import kotlinx.serialization.json.JsonPrimitive
import kotlinx.serialization.json.contentOrNull
import kotlinx.serialization.json.jsonPrimitive
import javax.inject.Inject
import javax.inject.Singleton

@Singleton
class AuthRepositoryImpl @Inject constructor(
    supabase: SupabaseProvider
) : AuthRepository {

    private val auth = supabase.client.auth

    override val authState: Flow<AuthState> = auth.sessionStatus.map { status ->
        when (status) {
            is SessionStatus.Authenticated -> AuthState.SignedIn(status.session.user.toAppUser())
            is SessionStatus.NotAuthenticated -> AuthState.SignedOut
            else -> AuthState.Unknown   // LoadingFromStorage / NetworkError
        }
    }

    override suspend fun signInWithEmail(email: String, password: String): Result<Unit> =
        runCatching {
            auth.signInWith(Email) {
                this.email = email
                this.password = password
            }
        }

    override suspend fun signUpWithEmail(
        email: String,
        password: String,
        displayName: String?
    ): Result<Unit> = runCatching {
        auth.signUpWith(Email) {
            this.email = email
            this.password = password
            if (!displayName.isNullOrBlank()) {
                data = JsonObject(mapOf("display_name" to JsonPrimitive(displayName)))
            }
        }
    }

    override suspend fun signInWithGoogle(): Result<Unit> = runCatching {
        auth.signInWith(Google)
    }

    override suspend fun signOut(): Result<Unit> = runCatching { auth.signOut() }

    override suspend fun sendPasswordReset(email: String): Result<Unit> = runCatching {
        auth.resetPasswordForEmail(email)
    }

    private fun UserInfo?.toAppUser(): AppUser {
        require(this != null) { "UserInfo is null" }
        val meta = userMetadata
        val name = meta?.get("display_name")?.jsonPrimitive?.contentOrNull
        val avatar = meta?.get("avatar_url")?.jsonPrimitive?.contentOrNull
        return AppUser(
            id = id,
            email = email,
            displayName = name,
            avatarUrl = avatar
        )
    }
}
