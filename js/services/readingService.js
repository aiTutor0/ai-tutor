// js/services/readingService.js
// Service for Academic Reading feature

import { supabase } from "../config/supabaseClient.js";
import { OPENAI_PROXY_URL } from "../config/env.js";

// ======================================
// PASSAGE GENERATION
// ======================================

export async function generateReadingPassage(topic = null) {
    const response = await fetch(OPENAI_PROXY_URL, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
            toolMode: "reading_generate",
            userText: topic || "Generate a random academic topic"
        })
    });

    if (!response.ok) {
        const errText = await response.text();
        throw new Error(`Passage generation failed: ${errText}`);
    }

    const data = await response.json();

    try {
        const result = typeof data.text === 'string' ? JSON.parse(data.text) : data.text;
        return result;
    } catch (e) {
        throw new Error("Failed to parse passage data");
    }
}

// ======================================
// ANSWER CHECKING
// ======================================

export function checkAnswers(questions, userAnswers) {
    let correctCount = 0;
    const results = [];

    questions.forEach((q, index) => {
        const userAnswer = userAnswers[index];
        const isCorrect = userAnswer?.toLowerCase().trim() === q.correctAnswer.toLowerCase().trim();

        if (isCorrect) correctCount++;

        results.push({
            questionIndex: index,
            userAnswer: userAnswer,
            correctAnswer: q.correctAnswer,
            isCorrect: isCorrect,
            explanation: q.explanation
        });
    });

    return {
        correctCount,
        totalQuestions: questions.length,
        scorePercentage: Math.round((correctCount / questions.length) * 100),
        results
    };
}

// ======================================
// SUPABASE OPERATIONS
// ======================================

export async function saveReadingSession(sessionData) {
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) throw new Error("User not authenticated");

    const { data, error } = await supabase
        .from("reading_sessions")
        .insert({
            user_id: user.id,
            mode: sessionData.mode,
            passage_title: sessionData.passageTitle,
            passage_content: sessionData.passageContent,
            passage_word_count: sessionData.wordCount,
            questions: sessionData.questions,
            user_answers: sessionData.userAnswers,
            correct_answers: sessionData.correctCount,
            total_questions: sessionData.totalQuestions,
            score_percentage: sessionData.scorePercentage,
            time_taken_seconds: sessionData.timeTaken,
            time_limit_seconds: sessionData.timeLimit,
            wpm: sessionData.wpm,
            completed_at: new Date().toISOString()
        })
        .select()
        .single();

    if (error) throw error;

    // Update statistics
    await updateReadingStatistics(user.id, sessionData);

    return data;
}

export async function getReadingHistory(limit = 10) {
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return { data: [], error: null };

    const { data, error } = await supabase
        .from("reading_sessions")
        .select("*")
        .eq("user_id", user.id)
        .order("created_at", { ascending: false })
        .limit(limit);

    return { data, error };
}

// ======================================
// STATISTICS
// ======================================

async function updateReadingStatistics(userId, sessionData) {
    const { data: existing } = await supabase
        .from("reading_statistics")
        .select("*")
        .eq("user_id", userId)
        .single();

    if (existing) {
        const totalSessions = existing.total_sessions + 1;
        const avgScore = ((existing.average_score || 0) * existing.total_sessions + sessionData.scorePercentage) / totalSessions;
        const bestScore = Math.max(existing.best_score || 0, sessionData.scorePercentage);

        await supabase
            .from("reading_statistics")
            .update({
                total_sessions: totalSessions,
                total_passages_read: existing.total_passages_read + 1,
                average_score: Math.round(avgScore * 100) / 100,
                best_score: bestScore,
                total_time_seconds: existing.total_time_seconds + sessionData.timeTaken,
                last_practice_at: new Date().toISOString(),
                updated_at: new Date().toISOString()
            })
            .eq("user_id", userId);
    } else {
        await supabase
            .from("reading_statistics")
            .insert({
                user_id: userId,
                total_sessions: 1,
                total_passages_read: 1,
                average_score: sessionData.scorePercentage,
                best_score: sessionData.scorePercentage,
                total_time_seconds: sessionData.timeTaken,
                last_practice_at: new Date().toISOString()
            });
    }
}

export async function getReadingStatistics() {
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return { data: null, error: null };

    const { data, error } = await supabase
        .from("reading_statistics")
        .select("*")
        .eq("user_id", user.id)
        .single();

    return { data, error };
}
