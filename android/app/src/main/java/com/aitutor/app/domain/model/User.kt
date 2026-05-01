package com.aitutor.app.domain.model

/**
 * App-side user model. Avoid leaking Supabase types past the data layer.
 */
data class AppUser(
    val id: String,
    val email: String?,
    val displayName: String? = null,
    val avatarUrl: String? = null
)

sealed interface AuthState {
    data object Unknown : AuthState               // still loading session
    data object SignedOut : AuthState
    data class SignedIn(val user: AppUser) : AuthState
}
