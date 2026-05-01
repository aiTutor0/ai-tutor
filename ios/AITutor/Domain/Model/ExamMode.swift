import SwiftUI

/// Which exam the user is currently preparing for. Drives content selection
/// (topic banks, scoring rubrics, task types) across all skill modules.
/// Persisted in `UserPreferences`.
enum ExamMode: String, CaseIterable, Identifiable, Codable {
    case ielts = "IELTS"
    case toefl = "TOEFL"

    var id: String { rawValue }

    var displayName: String {
        switch self {
        case .ielts: return "IELTS"
        case .toefl: return "TOEFL iBT"
        }
    }

    var tagline: String {
        switch self {
        case .ielts: return "Academic & General • 0–9 band"
        case .toefl: return "Academic • 0–120 total"
        }
    }

    var brandColor: Color {
        switch self {
        case .ielts: return Theme.Colors.ieltsBlue
        case .toefl: return Theme.Colors.toeflRed
        }
    }

    var scoreLabel: String {
        switch self {
        case .ielts: return "Band"
        case .toefl: return "Score"
        }
    }

    var maxScore: Double {
        switch self {
        case .ielts: return 9.0
        case .toefl: return 120.0
        }
    }

    static func fromName(_ name: String?) -> ExamMode? {
        guard let name else { return nil }
        return ExamMode(rawValue: name.uppercased())
    }
}
