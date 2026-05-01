import Foundation
import Combine

/// Local key/value store for user preferences:
/// - selected exam (IELTS / TOEFL)
/// - onboarding completion
/// - daily goal, streak, gamification state
///
/// SwiftUI views observe via `@EnvironmentObject` / `@ObservedObject`. The
/// underlying store is `UserDefaults` — for richer types we'd switch to a
/// file-backed store later.
@MainActor
final class UserPreferences: ObservableObject {
    static let maxHearts = 5
    static let defaultDailyGoalXp = 30
    private static let dayMillis: TimeInterval = 24 * 60 * 60

    private enum Keys {
        static let examMode = "exam_mode"
        static let onboardingDone = "onboarding_done"
        static let dailyGoalXp = "daily_goal_xp"
        static let currentStreak = "current_streak"
        static let lastPracticeDay = "last_practice_day"
        static let hearts = "hearts"
        static let totalXp = "total_xp"
    }

    private let defaults: UserDefaults

    @Published private(set) var examMode: ExamMode?
    @Published private(set) var onboardingDone: Bool
    @Published private(set) var dailyGoalXp: Int
    @Published private(set) var currentStreak: Int
    @Published private(set) var hearts: Int
    @Published private(set) var totalXp: Int

    init(defaults: UserDefaults = .standard) {
        self.defaults = defaults
        self.examMode = ExamMode.fromName(defaults.string(forKey: Keys.examMode))
        self.onboardingDone = defaults.bool(forKey: Keys.onboardingDone)
        self.dailyGoalXp = defaults.object(forKey: Keys.dailyGoalXp) as? Int ?? Self.defaultDailyGoalXp
        self.currentStreak = defaults.integer(forKey: Keys.currentStreak)
        self.hearts = defaults.object(forKey: Keys.hearts) as? Int ?? Self.maxHearts
        self.totalXp = defaults.integer(forKey: Keys.totalXp)
    }

    func setExamMode(_ mode: ExamMode) {
        examMode = mode
        defaults.set(mode.rawValue, forKey: Keys.examMode)
    }

    func setOnboardingDone(_ done: Bool) {
        onboardingDone = done
        defaults.set(done, forKey: Keys.onboardingDone)
    }

    func setDailyGoal(_ xp: Int) {
        dailyGoalXp = xp
        defaults.set(xp, forKey: Keys.dailyGoalXp)
    }

    func addXp(_ delta: Int) {
        totalXp = max(0, totalXp + delta)
        defaults.set(totalXp, forKey: Keys.totalXp)
    }

    func loseHeart() {
        hearts = max(0, hearts - 1)
        defaults.set(hearts, forKey: Keys.hearts)
    }

    func refillHearts() {
        hearts = Self.maxHearts
        defaults.set(hearts, forKey: Keys.hearts)
    }

    /// Bump the streak by one if the user practiced today, or yesterday;
    /// reset to 1 if more than a day has passed.
    func bumpStreakIfNeeded(today: Date = Date()) {
        let lastTimestamp = defaults.double(forKey: Keys.lastPracticeDay)
        let last = lastTimestamp > 0 ? Date(timeIntervalSince1970: lastTimestamp) : nil
        let calendar = Calendar.current
        let todayStart = calendar.startOfDay(for: today)

        let newStreak: Int
        if let last {
            let lastStart = calendar.startOfDay(for: last)
            let days = calendar.dateComponents([.day], from: lastStart, to: todayStart).day ?? 0
            switch days {
            case 0: newStreak = currentStreak               // already practiced today
            case 1: newStreak = currentStreak + 1           // consecutive day
            default: newStreak = 1                          // streak broken
            }
        } else {
            newStreak = 1
        }

        currentStreak = newStreak
        defaults.set(newStreak, forKey: Keys.currentStreak)
        defaults.set(today.timeIntervalSince1970, forKey: Keys.lastPracticeDay)
    }
}
