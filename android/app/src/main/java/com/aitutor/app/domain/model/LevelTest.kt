package com.aitutor.app.domain.model

/** CEFR level estimated from the placement test. */
enum class CefrLevel(val code: String, val description: String) {
    A1("A1", "Beginner — basic phrases and survival English"),
    A2("A2", "Elementary — familiar everyday topics"),
    B1("B1", "Intermediate — main ideas of clear standard input"),
    B2("B2", "Upper-Intermediate — complex texts and abstract topics"),
    C1("C1", "Advanced — fluent and spontaneous expression"),
    C2("C2", "Mastery — near-native proficiency");

    companion object {
        fun fromScorePercentage(percent: Int): CefrLevel = when {
            percent >= 95 -> C2
            percent >= 85 -> C1
            percent >= 70 -> B2
            percent >= 55 -> B1
            percent >= 35 -> A2
            else -> A1
        }
    }
}

data class LevelTestQuestion(
    val id: Int,
    val level: CefrLevel,
    val question: String,
    val options: List<String>,
    val correctIndex: Int
) {
    val correctLetter: String get() = ('A' + correctIndex).toString()
}
