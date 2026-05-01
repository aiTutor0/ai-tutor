import Foundation

/// Placeholder implementations for the skill repositories. Each one will be
/// replaced by a real Supabase-backed impl as we port the corresponding
/// screen across from Android. Until then they throw so any accidental call
/// surfaces immediately rather than silently no-oping.

struct NotImplementedError: LocalizedError {
    let feature: String
    var errorDescription: String? { "\(feature) is not implemented yet on iOS." }
}

final class ChatRepositoryImpl: ChatRepository {
    func ask(mode: TutorMode, history: [ChatMessage], userText: String) async throws -> String {
        throw NotImplementedError(feature: "ChatRepository.ask")
    }
}

final class ReadingRepositoryImpl: ReadingRepository {
    func generatePassage(examMode: ExamMode) async throws -> ReadingPassage {
        throw NotImplementedError(feature: "ReadingRepository.generatePassage")
    }

    func saveSession(
        examMode: ExamMode,
        passage: ReadingPassage,
        userAnswers: [String],
        result: ReadingResult,
        timeLimitSeconds: Int
    ) async throws {
        throw NotImplementedError(feature: "ReadingRepository.saveSession")
    }
}

final class ListeningRepositoryImpl: ListeningRepository {
    func generateContent(examMode: ExamMode) async throws -> ListeningContent {
        throw NotImplementedError(feature: "ListeningRepository.generateContent")
    }

    func saveSession(
        examMode: ExamMode,
        content: ListeningContent,
        userAnswers: [String],
        result: ReadingResult
    ) async throws {
        throw NotImplementedError(feature: "ListeningRepository.saveSession")
    }
}

final class WritingRepositoryImpl: WritingRepository {
    func randomTopic(taskType: WritingTaskType) -> WritingTopic {
        // A safe default until the real topic bank lands.
        WritingTopic(
            taskType: taskType.rawValue,
            prompt: "Write a \(taskType.targetWords)-word response on a topic of your choice.",
            sourceMaterial: nil
        )
    }

    func evaluate(topic: WritingTopic, essay: String) async throws -> WritingEvaluation {
        throw NotImplementedError(feature: "WritingRepository.evaluate")
    }

    func saveEssay(
        taskType: WritingTaskType,
        topic: WritingTopic,
        essay: String,
        evaluation: WritingEvaluation
    ) async throws {
        throw NotImplementedError(feature: "WritingRepository.saveEssay")
    }
}

final class ScheduleRepositoryImpl: ScheduleRepository {
    func upcoming() async throws -> [StudySession] { [] }
    func add(title: String, notes: String?, scheduledForIso: String) async throws -> StudySession {
        throw NotImplementedError(feature: "ScheduleRepository.add")
    }
    func remove(id: String) async throws {
        throw NotImplementedError(feature: "ScheduleRepository.remove")
    }
}

final class GroupChatRepositoryImpl: GroupChatRepository {
    func listRooms() async throws -> [Room] { [] }
    func createRoom(name: String) async throws -> Room {
        throw NotImplementedError(feature: "GroupChatRepository.createRoom")
    }
    func joinRoom(roomId: String) async throws {
        throw NotImplementedError(feature: "GroupChatRepository.joinRoom")
    }
    func observeMessages(roomId: String) -> AsyncStream<[GroupMessage]> {
        AsyncStream { continuation in continuation.finish() }
    }
    func sendMessage(roomId: String, content: String) async throws {
        throw NotImplementedError(feature: "GroupChatRepository.sendMessage")
    }
}
