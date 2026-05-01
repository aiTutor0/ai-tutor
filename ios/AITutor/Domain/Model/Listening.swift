import Foundation

struct ListeningContent: Codable, Equatable {
    let title: String
    let topic: String?
    let transcript: String
    let wordCount: Int
    let duration: String?
    let questions: [ReadingQuestion]

    init(
        title: String,
        topic: String? = nil,
        transcript: String,
        wordCount: Int = 0,
        duration: String? = nil,
        questions: [ReadingQuestion]
    ) {
        self.title = title
        self.topic = topic
        self.transcript = transcript
        self.wordCount = wordCount
        self.duration = duration
        self.questions = questions
    }
}
