import Foundation

// Copy this file to Secrets.swift and fill in real values.
// Secrets.swift is gitignored — never commit your live keys.
//
// Find these in your Supabase project: Settings → API.
enum Secrets {
    static let supabaseURL = URL(string: "https://your-project-ref.supabase.co")!
    static let supabaseAnonKey = "your-anon-key-here"
}
