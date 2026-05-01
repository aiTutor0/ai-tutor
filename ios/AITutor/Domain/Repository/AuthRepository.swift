import Foundation

protocol AuthRepository: AnyObject {
    /// Async stream of session changes — emits .unknown while loading, then
    /// .signedIn / .signedOut as auth state mutates.
    var authState: AsyncStream<AuthState> { get }

    func signInWithEmail(email: String, password: String) async throws
    func signUpWithEmail(email: String, password: String, displayName: String?) async throws
    func signInWithGoogle() async throws
    func signOut() async throws
    func sendPasswordReset(email: String) async throws
}
