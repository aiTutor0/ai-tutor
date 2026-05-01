package com.aitutor.app.data.local

import com.aitutor.app.domain.model.CefrLevel
import com.aitutor.app.domain.model.LevelTestQuestion

/**
 * Static 10-question CEFR placement test (A1 → C1, 2 per level).
 * Mirrors the questions from `_reference/js/ui/levelTest.js` in spirit.
 *
 * The correct option index is 0-based.
 */
object LevelTestBank {

    fun questions(): List<LevelTestQuestion> = listOf(
        LevelTestQuestion(1, CefrLevel.A1,
            "She ___ a teacher.",
            listOf("are", "is", "am", "be"), 1),
        LevelTestQuestion(2, CefrLevel.A1,
            "I have ___ apple.",
            listOf("a", "an", "the", "—"), 1),
        LevelTestQuestion(3, CefrLevel.A2,
            "Yesterday I ___ to the cinema.",
            listOf("go", "going", "went", "gone"), 2),
        LevelTestQuestion(4, CefrLevel.A2,
            "There ___ many people at the concert.",
            listOf("was", "were", "is", "be"), 1),
        LevelTestQuestion(5, CefrLevel.B1,
            "If it rains tomorrow, we ___ stay home.",
            listOf("will", "would", "are", "have"), 0),
        LevelTestQuestion(6, CefrLevel.B1,
            "She has lived here ___ five years.",
            listOf("since", "for", "from", "ago"), 1),
        LevelTestQuestion(7, CefrLevel.B2,
            "By the time we arrived, the film ___ already started.",
            listOf("has", "had", "was", "is"), 1),
        LevelTestQuestion(8, CefrLevel.B2,
            "I wish I ___ more time to study.",
            listOf("have", "had", "would have", "having"), 1),
        LevelTestQuestion(9, CefrLevel.C1,
            "Hardly ___ the room when the lights went out.",
            listOf("I had entered", "had I entered", "I entered", "did I enter"), 1),
        LevelTestQuestion(10, CefrLevel.C1,
            "The proposal was ultimately rejected, ___ to widespread opposition.",
            listOf("owing", "due", "thanks", "regarding"), 0)
    )
}
