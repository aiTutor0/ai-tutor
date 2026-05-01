import Foundation

struct StudySession: Codable, Equatable, Identifiable {
    let id: String
    let title: String
    let notes: String?
    /// ISO-8601 timestamp.
    let scheduledFor: String
    let userId: String
    let createdAt: String?

    enum CodingKeys: String, CodingKey {
        case id, title, notes
        case scheduledFor = "scheduled_for"
        case userId = "user_id"
        case createdAt = "created_at"
    }
}
