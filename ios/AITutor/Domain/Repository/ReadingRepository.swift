import Foundation

protocol ReadingRepository: AnyObject {
    /// Generate a passage + questions tuned to the given exam mode.
    func generatePassage(examMode: ExamMode) async throws -> ReadingPassage

    /// Persist a finished session and roll up statistics. Best-effort.
    func saveSession(
        examMode: ExamMode,
        passage: ReadingPassage,
        userAnswers: [String],
        result: ReadingResult,
        timeLimitSeconds: Int
    ) async throws
}
