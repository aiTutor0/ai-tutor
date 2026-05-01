import SwiftUI

/// Logged-in container: top exam/streak/hearts/XP bar + bottom TabView.
/// Skill modules push above the scaffold via `fullScreenCover` so the bottom
/// nav is hidden during a session (mirrors the Android NavGraph behavior).
struct MainScaffoldView: View {
    @EnvironmentObject private var preferences: UserPreferences
    @EnvironmentObject private var auth: AuthViewModel

    @State private var selectedTab: MainTab = .home
    @State private var presentedSkill: SkillRoute?
    @State private var showingExamSelect = false

    var body: some View {
        VStack(spacing: 0) {
            GamificationTopBar(
                examMode: preferences.examMode,
                streakDays: preferences.currentStreak,
                hearts: preferences.hearts,
                totalXp: preferences.totalXp,
                onExamTap: { showingExamSelect = true }
            )
            .background(Theme.Colors.surface)

            Divider()

            TabView(selection: $selectedTab) {
                HomeView(
                    examMode: preferences.examMode,
                    onOpenSkill: { presentedSkill = $0 }
                )
                .tabItem { Label(MainTab.home.title, systemImage: MainTab.home.systemImage) }
                .tag(MainTab.home)

                SkillsView(
                    examMode: preferences.examMode,
                    onOpenSkill: { presentedSkill = $0 }
                )
                .tabItem { Label(MainTab.skills.title, systemImage: MainTab.skills.systemImage) }
                .tag(MainTab.skills)

                ChatHomeView()
                    .tabItem { Label(MainTab.chat.title, systemImage: MainTab.chat.systemImage) }
                    .tag(MainTab.chat)

                ProfileView(
                    onOpenGroups: { presentedSkill = .groupChat },
                    onOpenSchedule: { presentedSkill = .schedule },
                    onSignOut: { Task { await auth.signOut() } }
                )
                .tabItem { Label(MainTab.profile.title, systemImage: MainTab.profile.systemImage) }
                .tag(MainTab.profile)
            }
            .tint(Theme.Colors.duoGreen)
        }
        .fullScreenCover(item: $presentedSkill) { route in
            SkillModuleHost(route: route, examMode: preferences.examMode)
        }
        .sheet(isPresented: $showingExamSelect) {
            ExamSelectView(showsBackButton: true)
        }
    }
}

/// Wraps each skill route so it gets a NavigationStack with a Done button.
private struct SkillModuleHost: View {
    let route: SkillRoute
    let examMode: ExamMode?
    @Environment(\.dismiss) private var dismiss

    var body: some View {
        NavigationStack {
            content
                .navigationTitle(route.title)
                .navigationBarTitleDisplayMode(.inline)
                .toolbar {
                    ToolbarItem(placement: .topBarLeading) {
                        Button("Done") { dismiss() }
                    }
                }
        }
    }

    @ViewBuilder
    private var content: some View {
        switch route {
        case .reading: ReadingView(examMode: examMode)
        case .listening: ListeningView(examMode: examMode)
        case .writing: WritingView(examMode: examMode)
        case .speaking: SpeakingView(examMode: examMode)
        case .levelTest: LevelTestView()
        case .groupChat: GroupChatView()
        case .schedule: ScheduleView()
        }
    }
}
