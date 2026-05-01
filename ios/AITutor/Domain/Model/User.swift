import Foundation

/// App-side user model. Avoid leaking Supabase types past the data layer.
struct AppUser: Equatable, Identifiable {
    let id: String
    let email: String?
    var displayName: String?
    var avatarUrl: String?
}

enum AuthState: Equatable {
    case unknown          // still loading session
    case signedOut
    case signedIn(AppUser)
}
