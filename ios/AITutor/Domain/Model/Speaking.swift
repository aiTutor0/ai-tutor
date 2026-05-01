import Foundation

/// Speaking practice modes — mirror the OpenAI Realtime instructions in the proxy.
enum SpeakingMode: String, CaseIterable, Identifiable {
    case academic
    case casual = "native"

    var id: String { rawValue }

    var displayName: String {
        switch self {
        case .academic: return "Academic"
        case .casual: return "Casual"
        }
    }

    var modeDescription: String {
        switch self {
        case .academic:
            return "Formal practice for IELTS Speaking parts 2/3 and TOEFL Independent Speaking"
        case .casual:
            return "Friendly chat for everyday fluency practice"
        }
    }

    var wire: String { rawValue }
}

struct SpeakingTurn: Equatable, Identifiable {
    enum Role: String { case user, assistant }

    let id: String
    let role: Role
    let content: String

    init(id: String = UUID().uuidString, role: Role, content: String) {
        self.id = id
        self.role = role
        self.content = content
    }
}
