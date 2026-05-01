import Foundation

protocol ListeningRepository: AnyObject {
    func generateContent(examMode: ExamMode) async throws -> ListeningContent

    func saveSession(
        examMode: ExamMode,
        content: ListeningContent,
        userAnswers: [String],
        result: ReadingResult
    ) async throws
}
