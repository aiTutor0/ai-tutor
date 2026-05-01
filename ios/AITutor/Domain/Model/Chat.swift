import Foundation

/// The "tool" the AI tutor adopts for a given conversation. Mirrors the
/// `toolMode` switch in the OpenAI proxy edge function.
enum TutorMode: String, CaseIterable, Identifiable {
    case chat
    case interview
    case grammar
    case tutor
    case translate

    var id: String { rawValue }

    var displayName: String {
        switch self {
        case .chat: return "Free chat"
        case .interview: return "Mock interview"
        case .grammar: return "Grammar fixer"
        case .tutor: return "Topic explainer"
        case .translate: return "Translate"
        }
    }

    var modeDescription: String {
        switch self {
        case .chat: return "Casual practice with corrections"
        case .interview: return "Realistic interview rehearsal"
        case .grammar: return "Get your text corrected with explanations"
        case .tutor: return "Ask about grammar rules or vocabulary"
        case .translate: return "Turkish ⇄ English"
        }
    }

    var toolMode: String { rawValue }
}

struct ChatMessage: Identifiable, Codable, Equatable {
    enum Role: String, Codable { case user, assistant }

    let id: String
    let role: Role
    let content: String
    let timestamp: Date

    init(id: String = UUID().uuidString, role: Role, content: String, timestamp: Date = Date()) {
        self.id = id
        self.role = role
        self.content = content
        self.timestamp = timestamp
    }
}
