import Foundation
import Combine

/// Owns the long-lived auth subscription so individual screens don't have to
/// manage cancellation. Exposed at the app root via `@EnvironmentObject`.
@MainActor
final class AuthViewModel: ObservableObject {
    @Published private(set) var state: AuthState = .unknown

    private let authRepository: AuthRepository
    private var listenerTask: Task<Void, Never>?

    init(authRepository: AuthRepository) {
        self.authRepository = authRepository
        startListening()
    }

    deinit { listenerTask?.cancel() }

    private func startListening() {
        listenerTask?.cancel()
        listenerTask = Task { [weak self] in
            guard let self else { return }
            for await newState in authRepository.authState {
                if Task.isCancelled { break }
                self.state = newState
            }
        }
    }

    func signOut() async {
        do { try await authRepository.signOut() } catch { /* Surface via UI later */ }
    }
}
