import Foundation
import Supabase

/// Single source of truth for the Supabase client. Other layers depend on
/// this provider (or repositories that wrap it) instead of constructing
/// clients themselves.
final class SupabaseProvider {
    static let shared = SupabaseProvider()

    let client: SupabaseClient

    private init() {
        client = SupabaseClient(
            supabaseURL: Secrets.supabaseURL,
            supabaseKey: Secrets.supabaseAnonKey,
            options: SupabaseClientOptions(
                auth: .init(
                    redirectToURL: URL(string: "aitutor://auth-callback"),
                    flowType: .pkce
                )
            )
        )
    }
}
