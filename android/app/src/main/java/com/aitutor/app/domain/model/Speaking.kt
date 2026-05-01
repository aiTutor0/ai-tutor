package com.aitutor.app.domain.model

import kotlinx.serialization.Serializable

/** Speaking practice modes — mirror the OpenAI Realtime instructions in the proxy. */
enum class SpeakingMode(val displayName: String, val description: String, val wire: String) {
    ACADEMIC(
        "Academic",
        "Formal practice for IELTS Speaking parts 2/3 and TOEFL Independent Speaking",
        "academic"
    ),
    CASUAL(
        "Casual",
        "Friendly chat for everyday fluency practice",
        "native"
    )
}

@Serializable
data class SpeakingTurn(
    val role: Role,
    val content: String
) {
    enum class Role { USER, ASSISTANT }
}
