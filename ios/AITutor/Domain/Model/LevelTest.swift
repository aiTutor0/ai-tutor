import Foundation

/// CEFR level estimated from the placement test.
enum CefrLevel: String, CaseIterable, Codable {
    case a1 = "A1"
    case a2 = "A2"
    case b1 = "B1"
    case b2 = "B2"
    case c1 = "C1"
    case c2 = "C2"

    var code: String { rawValue }

    var levelDescription: String {
        switch self {
        case .a1: return "Beginner — basic phrases and survival English"
        case .a2: return "Elementary — familiar everyday topics"
        case .b1: return "Intermediate — main ideas of clear standard input"
        case .b2: return "Upper-Intermediate — complex texts and abstract topics"
        case .c1: return "Advanced — fluent and spontaneous expression"
        case .c2: return "Mastery — near-native proficiency"
        }
    }

    static func fromScorePercentage(_ percent: Int) -> CefrLevel {
        switch percent {
        case 95...: return .c2
        case 85..<95: return .c1
        case 70..<85: return .b2
        case 55..<70: return .b1
        case 35..<55: return .a2
        default: return .a1
        }
    }
}

struct LevelTestQuestion: Identifiable, Equatable {
    let id: Int
    let level: CefrLevel
    let question: String
    let options: [String]
    let correctIndex: Int

    var correctLetter: String {
        let scalar = Unicode.Scalar(UInt8(65 + correctIndex))
        return String(Character(scalar))
    }
}
