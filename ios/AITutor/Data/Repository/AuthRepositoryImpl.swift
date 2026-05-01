import Foundation
import Auth
import Supabase

final class AuthRepositoryImpl: AuthRepository {
    private let provider: SupabaseProvider

    init(provider: SupabaseProvider = .shared) {
        self.provider = provider
    }

    private var auth: AuthClient { provider.client.auth }

    var authState: AsyncStream<AuthState> {
        AsyncStream { continuation in
            let task = Task { [auth] in
                continuation.yield(.unknown)
                for await change in auth.authStateChanges {
                    let mapped: AuthState
                    switch change.event {
                    case .signedIn, .tokenRefreshed, .userUpdated, .initialSession:
                        if let session = change.session {
                            mapped = .signedIn(Self.mapUser(session.user))
                        } else {
                            mapped = .signedOut
                        }
                    case .signedOut, .userDeleted:
                        mapped = .signedOut
                    case .passwordRecovery, .mfaChallengeVerified:
                        // Recovery flow keeps the user on whatever screen they were on.
                        if let session = change.session {
                            mapped = .signedIn(Self.mapUser(session.user))
                        } else {
                            mapped = .signedOut
                        }
                    @unknown default:
                        mapped = .signedOut
                    }
                    continuation.yield(mapped)
                }
                continuation.finish()
            }
            continuation.onTermination = { _ in task.cancel() }
        }
    }

    func signInWithEmail(email: String, password: String) async throws {
        _ = try await auth.signIn(email: email, password: password)
    }

    func signUpWithEmail(email: String, password: String, displayName: String?) async throws {
        if let displayName, !displayName.isEmpty {
            _ = try await auth.signUp(
                email: email,
                password: password,
                data: ["display_name": .string(displayName)]
            )
        } else {
            _ = try await auth.signUp(email: email, password: password)
        }
    }

    func signInWithGoogle() async throws {
        try await auth.signInWithOAuth(
            provider: .google,
            redirectTo: URL(string: "aitutor://auth-callback")
        )
    }

    func signOut() async throws {
        try await auth.signOut()
    }

    func sendPasswordReset(email: String) async throws {
        try await auth.resetPasswordForEmail(email)
    }

    private static func mapUser(_ user: Auth.User) -> AppUser {
        let meta = user.userMetadata
        let displayName = meta["display_name"]?.stringValue
        let avatar = meta["avatar_url"]?.stringValue
        return AppUser(
            id: user.id.uuidString,
            email: user.email,
            displayName: displayName,
            avatarUrl: avatar
        )
    }
}

private extension AnyJSON {
    var stringValue: String? {
        if case let .string(s) = self { return s }
        return nil
    }
}
