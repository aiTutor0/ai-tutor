import Foundation

/// Compares user answers against the correct ones, returning a per-question
/// breakdown plus aggregate score / WPM. Pure logic — no I/O — so it lives in
/// the domain layer and is easy to unit-test.
struct GradeReadingAnswersUseCase {
    func callAsFunction(
        passage: ReadingPassage,
        userAnswers: [String],
        timeTakenSeconds: Int
    ) -> ReadingResult {
        let perQuestion: [GradedAnswer] = passage.questions.enumerated().map { index, question in
            let userAnswer = index < userAnswers.count ? userAnswers[index] : ""
            let isCorrect = userAnswer.trimmingCharacters(in: .whitespacesAndNewlines)
                .compare(question.correctAnswer.trimmingCharacters(in: .whitespacesAndNewlines), options: .caseInsensitive) == .orderedSame
            return GradedAnswer(
                questionIndex: index,
                userAnswer: userAnswer,
                correctAnswer: question.correctAnswer,
                isCorrect: isCorrect,
                explanation: question.explanation
            )
        }

        let correctCount = perQuestion.filter(\.isCorrect).count
        let total = passage.questions.count
        let scorePct = total > 0 ? Int((Double(correctCount) / Double(total)) * 100) : 0

        let minutes = max(Double(timeTakenSeconds) / 60.0, 0.01)
        let wpm = Int(Double(passage.wordCount) / minutes)

        return ReadingResult(
            correctCount: correctCount,
            totalQuestions: total,
            scorePercentage: scorePct,
            timeTakenSeconds: timeTakenSeconds,
            wordsPerMinute: wpm,
            perQuestion: perQuestion
        )
    }
}
