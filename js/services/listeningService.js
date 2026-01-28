// js/services/listeningService.js
// Service for Academic Listening feature

import { supabase } from "../config/supabaseClient.js";
import { OPENAI_PROXY_URL } from "../config/env.js";

// ======================================
// LISTENING CONTENT GENERATION
// ======================================

export async function generateListeningContent(topic = null, mode = 'academic') {
    const response = await fetch(OPENAI_PROXY_URL, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
            toolMode: "listening_generate",
            userText: topic || `Generate a random ${mode} listening topic`
        })
    });

    if (!response.ok) {
        const errText = await response.text();
        throw new Error(`Listening content generation failed: ${errText}`);
    }

    const data = await response.json();

    try {
        const result = typeof data.text === 'string' ? JSON.parse(data.text) : data.text;
        return result;
    } catch (e) {
        throw new Error("Failed to parse listening data");
    }
}

// ======================================
// ANSWER CHECKING
// ======================================

export function checkListeningAnswers(questions, userAnswers) {
    let correctCount = 0;
    const results = [];

    questions.forEach((q, index) => {
        const userAnswer = userAnswers[index];
        let isCorrect = false;

        // Normalize answers for comparison
        const normalizeAnswer = (ans) => ans?.toString().toLowerCase().trim() || '';

        if (q.type === 'multiple_choice') {
            isCorrect = normalizeAnswer(userAnswer) === normalizeAnswer(q.correctAnswer);
        } else if (q.type === 'fill_blank') {
            // More lenient matching for fill-in-the-blank
            const correctNorm = normalizeAnswer(q.correctAnswer);
            const userNorm = normalizeAnswer(userAnswer);
            isCorrect = userNorm === correctNorm || userNorm.includes(correctNorm) || correctNorm.includes(userNorm);
        } else if (q.type === 'true_false') {
            isCorrect = normalizeAnswer(userAnswer) === normalizeAnswer(q.correctAnswer);
        }

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

export async function saveListeningSession(sessionData) {
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) throw new Error("User not authenticated");

    const { data, error } = await supabase
        .from("listening_sessions")
        .insert({
            user_id: user.id,
            mode: sessionData.mode,
            topic: sessionData.topic,
            transcript: sessionData.transcript,
            audio_url: sessionData.audioUrl,
            questions: sessionData.questions,
            user_answers: sessionData.userAnswers,
            score: sessionData.correctCount,
            total_questions: sessionData.totalQuestions,
            score_percentage: sessionData.scorePercentage,
            time_taken_seconds: sessionData.timeTaken,
            completed_at: new Date().toISOString()
        })
        .select()
        .single();

    if (error) throw error;

    // Update statistics
    await updateListeningStatistics(user.id, sessionData);

    return data;
}

export async function getListeningHistory(limit = 10) {
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return { data: [], error: null };

    const { data, error } = await supabase
        .from("listening_sessions")
        .select("*")
        .eq("user_id", user.id)
        .order("created_at", { ascending: false })
        .limit(limit);

    return { data, error };
}

// ======================================
// STATISTICS
// ======================================

async function updateListeningStatistics(userId, sessionData) {
    const { data: existing } = await supabase
        .from("listening_statistics")
        .select("*")
        .eq("user_id", userId)
        .single();

    if (existing) {
        const totalSessions = existing.total_sessions + 1;
        const avgScore = ((existing.average_score || 0) * existing.total_sessions + sessionData.scorePercentage) / totalSessions;
        const bestScore = Math.max(existing.best_score || 0, sessionData.scorePercentage);

        await supabase
            .from("listening_statistics")
            .update({
                total_sessions: totalSessions,
                average_score: Math.round(avgScore * 100) / 100,
                best_score: bestScore,
                total_time_seconds: existing.total_time_seconds + sessionData.timeTaken,
                last_practice_at: new Date().toISOString(),
                updated_at: new Date().toISOString()
            })
            .eq("user_id", userId);
    } else {
        await supabase
            .from("listening_statistics")
            .insert({
                user_id: userId,
                total_sessions: 1,
                average_score: sessionData.scorePercentage,
                best_score: sessionData.scorePercentage,
                total_time_seconds: sessionData.timeTaken,
                last_practice_at: new Date().toISOString()
            });
    }
}

export async function getListeningStatistics() {
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return { data: null, error: null };

    const { data, error } = await supabase
        .from("listening_statistics")
        .select("*")
        .eq("user_id", user.id)
        .single();

    return { data, error };
}
