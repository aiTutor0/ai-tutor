import Foundation

protocol ScheduleRepository: AnyObject {
    func upcoming() async throws -> [StudySession]
    func add(title: String, notes: String?, scheduledForIso: String) async throws -> StudySession
    func remove(id: String) async throws
}
