import Foundation

protocol WritingRepository: AnyObject {
    func randomTopic(taskType: WritingTaskType) -> WritingTopic

    func evaluate(topic: WritingTopic, essay: String) async throws -> WritingEvaluation

    func saveEssay(
        taskType: WritingTaskType,
        topic: WritingTopic,
        essay: String,
        evaluation: WritingEvaluation
    ) async throws
}
