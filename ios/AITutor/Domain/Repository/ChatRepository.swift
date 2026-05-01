import Foundation

protocol ChatRepository: AnyObject {
    /// Ask the AI tutor for a reply given the running conversation.
    func ask(mode: TutorMode, history: [ChatMessage], userText: String) async throws -> String
}
