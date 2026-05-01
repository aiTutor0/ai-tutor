import Foundation

struct Room: Codable, Equatable, Identifiable {
    let id: String
    let name: String
    let createdBy: String
    let createdAt: String?

    enum CodingKeys: String, CodingKey {
        case id, name
        case createdBy = "created_by"
        case createdAt = "created_at"
    }
}

struct GroupMessage: Codable, Equatable, Identifiable {
    let id: String
    let roomId: String
    let userId: String
    let content: String
    let displayName: String?
    let createdAt: String?

    enum CodingKeys: String, CodingKey {
        case id, content
        case roomId = "room_id"
        case userId = "user_id"
        case displayName = "display_name"
        case createdAt = "created_at"
    }
}
