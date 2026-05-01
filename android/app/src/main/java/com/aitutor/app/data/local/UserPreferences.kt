package com.aitutor.app.data.local

import android.content.Context
import androidx.datastore.preferences.core.booleanPreferencesKey
import androidx.datastore.preferences.core.edit
import androidx.datastore.preferences.core.intPreferencesKey
import androidx.datastore.preferences.core.longPreferencesKey
import androidx.datastore.preferences.core.stringPreferencesKey
import androidx.datastore.preferences.preferencesDataStore
import com.aitutor.app.domain.model.ExamMode
import dagger.hilt.android.qualifiers.ApplicationContext
import kotlinx.coroutines.flow.Flow
import kotlinx.coroutines.flow.map
import javax.inject.Inject
import javax.inject.Singleton

private val Context.dataStore by preferencesDataStore(name = "user_prefs")

/**
 * Local key/value store for user preferences:
 * - selected exam (IELTS / TOEFL)
 * - onboarding completion
 * - daily goal, streak, gamification state
 */
@Singleton
class UserPreferences @Inject constructor(
    @ApplicationContext private val context: Context
) {
    private object Keys {
        val EXAM_MODE = stringPreferencesKey("exam_mode")
        val ONBOARDING_DONE = booleanPreferencesKey("onboarding_done")
        val DAILY_GOAL_XP = intPreferencesKey("daily_goal_xp")
        val CURRENT_STREAK = intPreferencesKey("current_streak")
        val LAST_PRACTICE_DAY = longPreferencesKey("last_practice_day")
        val HEARTS = intPreferencesKey("hearts")
        val TOTAL_XP = intPreferencesKey("total_xp")
    }

    val examMode: Flow<ExamMode?> = context.dataStore.data.map { prefs ->
        ExamMode.fromName(prefs[Keys.EXAM_MODE])
    }

    val onboardingDone: Flow<Boolean> = context.dataStore.data.map {
        it[Keys.ONBOARDING_DONE] ?: false
    }

    val dailyGoalXp: Flow<Int> = context.dataStore.data.map {
        it[Keys.DAILY_GOAL_XP] ?: DEFAULT_DAILY_GOAL_XP
    }

    val currentStreak: Flow<Int> = context.dataStore.data.map {
        it[Keys.CURRENT_STREAK] ?: 0
    }

    val hearts: Flow<Int> = context.dataStore.data.map {
        it[Keys.HEARTS] ?: MAX_HEARTS
    }

    val totalXp: Flow<Int> = context.dataStore.data.map {
        it[Keys.TOTAL_XP] ?: 0
    }

    suspend fun setExamMode(mode: ExamMode) {
        context.dataStore.edit { it[Keys.EXAM_MODE] = mode.name }
    }

    suspend fun setOnboardingDone(done: Boolean) {
        context.dataStore.edit { it[Keys.ONBOARDING_DONE] = done }
    }

    suspend fun setDailyGoal(xp: Int) {
        context.dataStore.edit { it[Keys.DAILY_GOAL_XP] = xp }
    }

    suspend fun addXp(delta: Int) {
        context.dataStore.edit {
            val current = it[Keys.TOTAL_XP] ?: 0
            it[Keys.TOTAL_XP] = current + delta
        }
    }

    suspend fun loseHeart() {
        context.dataStore.edit {
            val current = it[Keys.HEARTS] ?: MAX_HEARTS
            it[Keys.HEARTS] = (current - 1).coerceAtLeast(0)
        }
    }

    suspend fun refillHearts() {
        context.dataStore.edit { it[Keys.HEARTS] = MAX_HEARTS }
    }

    suspend fun bumpStreakIfNeeded(today: Long) {
        context.dataStore.edit { prefs ->
            val last = prefs[Keys.LAST_PRACTICE_DAY] ?: 0L
            val streak = prefs[Keys.CURRENT_STREAK] ?: 0
            val daysSince = (today - last) / DAY_MILLIS
            prefs[Keys.CURRENT_STREAK] = when {
                last == 0L -> 1
                daysSince == 0L -> streak       // already practiced today
                daysSince == 1L -> streak + 1   // consecutive day
                else -> 1                       // streak broken
            }
            prefs[Keys.LAST_PRACTICE_DAY] = today
        }
    }

    companion object {
        const val MAX_HEARTS = 5
        const val DEFAULT_DAILY_GOAL_XP = 30
        private const val DAY_MILLIS = 24L * 60 * 60 * 1000
    }
}
