import Foundation

/// Skill modules that get pushed on top of the main TabView. Mirrors the
/// non-tab routes in `AITutorNavGraph.kt` on Android.
enum SkillRoute: String, Hashable, Identifiable {
    case reading
    case listening
    case writing
    case speaking
    case levelTest
    case groupChat
    case schedule

    var id: String { rawValue }

    var title: String {
        switch self {
        case .reading: return "Reading"
        case .listening: return "Listening"
        case .writing: return "Writing"
        case .speaking: return "Speaking"
        case .levelTest: return "Level Test"
        case .groupChat: return "Groups"
        case .schedule: return "Schedule"
        }
    }
}

/// Tabs inside the logged-in `MainScaffoldView`.
enum MainTab: String, CaseIterable, Identifiable {
    case home
    case skills
    case chat
    case profile

    var id: String { rawValue }

    var title: String {
        switch self {
        case .home: return "Learn"
        case .skills: return "Skills"
        case .chat: return "Tutor"
        case .profile: return "Profile"
        }
    }

    var systemImage: String {
        switch self {
        case .home: return "house"
        case .skills: return "graduationcap"
        case .chat: return "bubble.left.and.bubble.right"
        case .profile: return "person.circle"
        }
    }
}
