import Foundation
import Combine

/// Lightweight DI container that mirrors what Hilt does on the Android side.
/// Exposed via `@EnvironmentObject` so any view can pull the dependencies it
/// needs without the parent having to plumb them through.
@MainActor
final class AppContainer: ObservableObject {
    static let shared = AppContainer()

    // ── Singletons ───────────────────────────────────────────────────────
    let preferences: UserPreferences
    let supabase: SupabaseProvider
    let aiProxy: AiProxyApi

    // ── Repositories (protocol-typed so screens stay testable) ───────────
    let authRepository: AuthRepository
    let chatRepository: ChatRepository
    let readingRepository: ReadingRepository
    let listeningRepository: ListeningRepository
    let writingRepository: WritingRepository
    let scheduleRepository: ScheduleRepository
    let groupChatRepository: GroupChatRepository

    // ── Long-lived view models that have to outlive a single screen ──────
    let authViewModel: AuthViewModel

    private init() {
        self.preferences = UserPreferences()
        self.supabase = SupabaseProvider.shared
        self.aiProxy = AiProxyApi(provider: supabase)

        self.authRepository = AuthRepositoryImpl(provider: supabase)
        self.chatRepository = ChatRepositoryImpl()
        self.readingRepository = ReadingRepositoryImpl()
        self.listeningRepository = ListeningRepositoryImpl()
        self.writingRepository = WritingRepositoryImpl()
        self.scheduleRepository = ScheduleRepositoryImpl()
        self.groupChatRepository = GroupChatRepositoryImpl()

        self.authViewModel = AuthViewModel(authRepository: authRepository)
    }
}
