import Foundation

/// Question types supported by the AI generator + grader.
enum QuestionType: String, Codable {
    case multipleChoice = "multiple_choice"
    case trueFalseNG = "true_false_ng"
    case trueFalse = "true_false"
    case fillBlank = "fill_blank"
    /// TOEFL-specific: pick best paraphrase / inference.
    case inference
    /// TOEFL-specific: pick three statements that summarize the passage.
    case summary

    static func fromWire(_ raw: String?) -> QuestionType {
        guard let raw else { return .multipleChoice }
        return QuestionType(rawValue: raw.lowercased()) ?? .multipleChoice
    }
}

struct ReadingQuestion: Identifiable, Codable, Equatable {
    let id: Int
    private let type: String?
    let question: String
    let options: [String]
    let correctAnswer: String
    let explanation: String?

    var questionType: QuestionType { QuestionType.fromWire(type) }

    init(
        id: Int,
        type: String? = nil,
        question: String,
        options: [String] = [],
        correctAnswer: String,
        explanation: String? = nil
    ) {
        self.id = id
        self.type = type
        self.question = question
        self.options = options
        self.correctAnswer = correctAnswer
        self.explanation = explanation
    }
}

struct ReadingPassage: Codable, Equatable {
    let title: String
    let passage: String
    let wordCount: Int
    let questions: [ReadingQuestion]
}

/// Per-question grading result.
struct GradedAnswer: Equatable {
    let questionIndex: Int
    let userAnswer: String
    let correctAnswer: String
    let isCorrect: Bool
    let explanation: String?
}

struct ReadingResult: Equatable {
    let correctCount: Int
    let totalQuestions: Int
    let scorePercentage: Int
    let timeTakenSeconds: Int
    let wordsPerMinute: Int
    let perQuestion: [GradedAnswer]

    var xpEarned: Int { correctCount * 5 }

    var starsEarned: Int {
        switch scorePercentage {
        case 90...: return 3
        case 70..<90: return 2
        case 50..<70: return 1
        default: return 0
        }
    }
}
