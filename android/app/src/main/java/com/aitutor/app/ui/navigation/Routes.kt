package com.aitutor.app.ui.navigation

/**
 * Top-level navigation destinations.
 * Each value is the route string used by Navigation Compose.
 */
object Routes {
    // Onboarding / auth flow
    const val SPLASH = "splash"
    const val LOGIN = "login"
    const val REGISTER = "register"
    const val EXAM_SELECT = "exam_select"

    // Bottom-nav root
    const val MAIN = "main"

    // Bottom-nav tabs (children of MAIN)
    const val HOME = "home"
    const val SKILLS = "skills"
    const val CHAT = "chat"
    const val PROFILE = "profile"

    // Skill modules (pushed on top of MAIN)
    const val READING = "reading"
    const val LISTENING = "listening"
    const val WRITING = "writing"
    const val SPEAKING = "speaking"
    const val LEVEL_TEST = "level_test"

    // Social
    const val GROUP_CHAT = "group_chat"
    const val SCHEDULE = "schedule"
}
