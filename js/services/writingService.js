// js/services/writingService.js
// Service for Essay Writing feature

import { supabase } from "../config/supabaseClient.js";
import { OPENAI_PROXY_URL } from "../config/env.js";

// ======================================
// ESSAY TOPICS
// ======================================

const IELTS_ESSAY_TOPICS = [
    "Some people believe that technology has made our lives too complex, and the solution is to lead a simpler life without technology. To what extent do you agree or disagree?",
    "In many countries, the gap between the rich and the poor is increasing. What problems does this cause? What solutions can you suggest?",
    "Some people think that the government should provide free university education. Others believe students should pay for their own education. Discuss both views and give your opinion.",
    "Climate change is a major global challenge. Should individuals or governments take more responsibility for addressing this issue?",
    "Many people believe that social media has a negative impact on individuals and society. To what extent do you agree or disagree?",
    "Some argue that competitive sports teach children important life skills. Others believe it puts unnecessary pressure on young people. Discuss both views.",
    "In some countries, young people are encouraged to work or travel for a year between finishing high school and starting university. Discuss the advantages and disadvantages.",
    "The rise of artificial intelligence will cause more problems than it solves. To what extent do you agree or disagree?",
    "Some people think that parents should teach children how to be good members of society. Others believe school is the best place for this. Discuss both views.",
    "Many cities are now banning cars from their centers. What are the advantages and disadvantages of this policy?"
];

export function getRandomEssayTopic() {
    const index = Math.floor(Math.random() * IELTS_ESSAY_TOPICS.length);
    return IELTS_ESSAY_TOPICS[index];
}

export function getAllTopics() {
    return IELTS_ESSAY_TOPICS;
}

// ======================================
// ESSAY EVALUATION
// ======================================

export async function evaluateEssay(topic, essayContent) {
    const wordCount = essayContent.trim().split(/\s+/).filter(w => w.length > 0).length;

    const response = await fetch(OPENAI_PROXY_URL, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
            toolMode: "essay_evaluate",
            userText: JSON.stringify({ topic, essay: essayContent, wordCount })
        })
    });

    if (!response.ok) {
        const errText = await response.text();
        throw new Error(`Essay evaluation failed: ${errText}`);
    }

    const data = await response.json();

    // Parse the AI response (should be JSON)
    try {
        const evaluation = typeof data.text === 'string' ? JSON.parse(data.text) : data.text;
        return {
            ...evaluation,
            wordCount
        };
    } catch (e) {
        // If parsing fails, return raw text as feedback
        return {
            bandScore: 5.0,
            feedback: data.text,
            wordCount
        };
    }
}

// ======================================
// SUPABASE OPERATIONS
// ======================================

export async function saveEssay(essayData) {
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) throw new Error("User not authenticated");

    const { data, error } = await supabase
        .from("writing_essays")
        .insert({
            user_id: user.id,
            topic: essayData.topic,
            essay_content: essayData.essayContent,
            word_count: essayData.wordCount,
            band_score: essayData.bandScore,
            task_achievement: essayData.taskAchievement,
            coherence_cohesion: essayData.coherenceCohesion,
            lexical_resource: essayData.lexicalResource,
            grammar_accuracy: essayData.grammarAccuracy,
            ai_feedback: essayData.feedback,
            grammar_errors: essayData.grammarErrors,
            suggestions: essayData.suggestions
        })
        .select()
        .single();

    if (error) throw error;

    // Update statistics
    await updateWritingStatistics(user.id, essayData);

    return data;
}

export async function getEssayHistory(limit = 10) {
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return { data: [], error: null };

    const { data, error } = await supabase
        .from("writing_essays")
        .select("*")
        .eq("user_id", user.id)
        .order("created_at", { ascending: false })
        .limit(limit);

    return { data, error };
}

export async function getEssayById(id) {
    const { data, error } = await supabase
        .from("writing_essays")
        .select("*")
        .eq("id", id)
        .single();

    return { data, error };
}

// ======================================
// STATISTICS
// ======================================

async function updateWritingStatistics(userId, essayData) {
    // Get current statistics
    const { data: existing } = await supabase
        .from("writing_statistics")
        .select("*")
        .eq("user_id", userId)
        .single();

    if (existing) {
        // Update existing statistics
        const totalEssays = existing.total_essays + 1;
        const totalWords = existing.total_words_written + essayData.wordCount;
        const avgScore = ((existing.average_band_score || 0) * existing.total_essays + essayData.bandScore) / totalEssays;
        const bestScore = Math.max(existing.best_band_score || 0, essayData.bandScore);

        await supabase
            .from("writing_statistics")
            .update({
                total_essays: totalEssays,
                total_words_written: totalWords,
                average_band_score: Math.round(avgScore * 10) / 10,
                best_band_score: bestScore,
                essays_this_week: existing.essays_this_week + 1,
                last_practice_at: new Date().toISOString(),
                updated_at: new Date().toISOString()
            })
            .eq("user_id", userId);
    } else {
        // Create new statistics
        await supabase
            .from("writing_statistics")
            .insert({
                user_id: userId,
                total_essays: 1,
                total_words_written: essayData.wordCount,
                average_band_score: essayData.bandScore,
                best_band_score: essayData.bandScore,
                essays_this_week: 1,
                last_practice_at: new Date().toISOString()
            });
    }
}

export async function getWritingStatistics() {
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return { data: null, error: null };

    const { data, error } = await supabase
        .from("writing_statistics")
        .select("*")
        .eq("user_id", user.id)
        .single();

    return { data, error };
}

// ======================================
// TASK RESPONSE (CHART DESCRIPTION)
// ======================================

const CHART_TYPES = ['bar', 'line', 'pie', 'table'];

export function generateChartData() {
    const type = CHART_TYPES[Math.floor(Math.random() * CHART_TYPES.length)];

    const topics = [
        { title: "Internet Usage by Age Group (2020-2023)", unit: "percentage" },
        { title: "Global CO2 Emissions by Country", unit: "million tonnes" },
        { title: "University Enrollment by Subject", unit: "thousands of students" },
        { title: "Mobile Phone Sales by Brand", unit: "units sold (millions)" },
        { title: "Average Temperature Changes", unit: "degrees Celsius" },
        { title: "Employment Rate by Sector", unit: "percentage" }
    ];

    const topic = topics[Math.floor(Math.random() * topics.length)];

    let chartData = { type, title: topic.title, unit: topic.unit };

    if (type === 'bar' || type === 'line') {
        chartData.categories = ['2020', '2021', '2022', '2023'];
        chartData.series = [
            { name: 'Category A', data: [65, 72, 78, 85] },
            { name: 'Category B', data: [45, 52, 48, 55] },
            { name: 'Category C', data: [30, 35, 42, 50] }
        ];
    } else if (type === 'pie') {
        chartData.data = [
            { name: 'Asia', value: 45 },
            { name: 'Europe', value: 25 },
            { name: 'Americas', value: 20 },
            { name: 'Africa', value: 10 }
        ];
    } else if (type === 'table') {
        chartData.headers = ['Year', 'Product A', 'Product B', 'Product C'];
        chartData.rows = [
            ['2020', '1200', '850', '650'],
            ['2021', '1450', '920', '700'],
            ['2022', '1650', '980', '780'],
            ['2023', '1800', '1050', '850']
        ];
    }

    return chartData;
}

export async function evaluateTaskResponse(chartData, responseText) {
    const wordCount = responseText.trim().split(/\s+/).filter(w => w.length > 0).length;

    const response = await fetch(OPENAI_PROXY_URL, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
            toolMode: "task_response_evaluate",
            userText: JSON.stringify({ chartData, response: responseText, wordCount })
        })
    });

    if (!response.ok) {
        const errText = await response.text();
        throw new Error(`Task response evaluation failed: ${errText}`);
    }

    const data = await response.json();

    try {
        const evaluation = typeof data.text === 'string' ? JSON.parse(data.text) : data.text;
        return { ...evaluation, wordCount };
    } catch (e) {
        return {
            bandScore: 5.0,
            feedback: data.text,
            wordCount
        };
    }
}

export async function saveTaskResponse(taskData) {
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) throw new Error("User not authenticated");

    const { data, error } = await supabase
        .from("writing_tasks")
        .insert({
            user_id: user.id,
            chart_type: taskData.chartType,
            chart_data: taskData.chartData,
            user_response: taskData.responseText,
            word_count: taskData.wordCount,
            band_score: taskData.bandScore,
            task_achievement: taskData.taskAchievement,
            coherence_cohesion: taskData.coherenceCohesion,
            lexical_resource: taskData.lexicalResource,
            grammar_accuracy: taskData.grammarAccuracy,
            ai_feedback: taskData.feedback
        })
        .select()
        .single();

    if (error) throw error;

    await updateTaskResponseStatistics(user.id, taskData);

    return data;
}

export async function getTaskResponseHistory(limit = 10) {
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return { data: [], error: null };

    const { data, error } = await supabase
        .from("writing_tasks")
        .select("*")
        .eq("user_id", user.id)
        .order("created_at", { ascending: false })
        .limit(limit);

    return { data, error };
}

async function updateTaskResponseStatistics(userId, taskData) {
    const { data: existing } = await supabase
        .from("writing_statistics")
        .select("*")
        .eq("user_id", userId)
        .single();

    if (existing) {
        const totalTasks = (existing.total_task_responses || 0) + 1;
        const totalWords = existing.total_words_written + taskData.wordCount;
        const avgTaskScore = existing.average_task_score
            ? ((existing.average_task_score * (totalTasks - 1)) + taskData.bandScore) / totalTasks
            : taskData.bandScore;

        await supabase
            .from("writing_statistics")
            .update({
                total_task_responses: totalTasks,
                total_words_written: totalWords,
                average_task_score: Math.round(avgTaskScore * 10) / 10,
                last_practice_at: new Date().toISOString(),
                updated_at: new Date().toISOString()
            })
            .eq("user_id", userId);
    } else {
        await supabase
            .from("writing_statistics")
            .insert({
                user_id: userId,
                total_task_responses: 1,
                total_words_written: taskData.wordCount,
                average_task_score: taskData.bandScore,
                last_practice_at: new Date().toISOString()
            });
    }
}
