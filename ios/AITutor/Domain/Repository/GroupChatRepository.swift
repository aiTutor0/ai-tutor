import Foundation

protocol GroupChatRepository: AnyObject {
    func listRooms() async throws -> [Room]
    func createRoom(name: String) async throws -> Room
    func joinRoom(roomId: String) async throws

    /// Async stream of message snapshots for a room. Cancelling the iterator
    /// closes the realtime channel.
    func observeMessages(roomId: String) -> AsyncStream<[GroupMessage]>

    func sendMessage(roomId: String, content: String) async throws
}
