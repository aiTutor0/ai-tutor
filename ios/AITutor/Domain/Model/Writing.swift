import Foundation

/// Writing-task taxonomy across the two exams.
///
/// IELTS:
///   - Academic Task 1 (chart description, ~150 words)
///   - Task 2 (essay, ~250 words)
/// TOEFL iBT:
///   - Independent (essay on personal opinion, ~300 words)
///   - Integrated (read + listen + write, ~150–225 words)
enum WritingTaskType: String, CaseIterable, Identifiable {
    case ieltsTask1 = "IELTS_TASK_1"
    case ieltsTask2 = "IELTS_TASK_2"
    case toeflIndependent = "TOEFL_INDEPENDENT"
    case toeflIntegrated = "TOEFL_INTEGRATED"

    var id: String { rawValue }

    var displayName: String {
        switch self {
        case .ieltsTask1: return "IELTS Task 1 — Chart"
        case .ieltsTask2: return "IELTS Task 2 — Essay"
        case .toeflIndependent: return "TOEFL Independent"
        case .toeflIntegrated: return "TOEFL Integrated"
        }
    }

    var examMode: ExamMode {
        switch self {
        case .ieltsTask1, .ieltsTask2: return .ielts
        case .toeflIndependent, .toeflIntegrated: return .toefl
        }
    }

    var targetWords: Int {
        switch self {
        case .ieltsTask1: return 150
        case .ieltsTask2: return 250
        case .toeflIndependent: return 300
        case .toeflIntegrated: return 200
        }
    }

    var timeLimitMinutes: Int {
        switch self {
        case .ieltsTask1: return 20
        case .ieltsTask2: return 40
        case .toeflIndependent: return 30
        case .toeflIntegrated: return 20
        }
    }

    static func forExam(_ mode: ExamMode) -> [WritingTaskType] {
        Self.allCases.filter { $0.examMode == mode }
    }
}

struct WritingTopic: Codable, Equatable {
    let taskType: String
    let prompt: String
    /// For Task 1 / Integrated: brief description of the source material.
    let sourceMaterial: String?

    init(taskType: String, prompt: String, sourceMaterial: String? = nil) {
        self.taskType = taskType
        self.prompt = prompt
        self.sourceMaterial = sourceMaterial
    }
}

struct WritingEvaluation: Codable, Equatable {
    struct GrammarError: Codable, Equatable {
        let original: String
        let corrected: String
        let explanation: String

        init(original: String = "", corrected: String = "", explanation: String = "") {
            self.original = original
            self.corrected = corrected
            self.explanation = explanation
        }
    }

    struct ImprovedSentence: Codable, Equatable {
        let original: String
        let improved: String

        init(original: String = "", improved: String = "") {
            self.original = original
            self.improved = improved
        }
    }

    let bandScore: Double
    let taskAchievement: Double
    let coherenceCohesion: Double
    let lexicalResource: Double
    let grammarAccuracy: Double
    let feedback: String
    let strengths: [String]
    let weaknesses: [String]
    let suggestions: [String]
    let grammarErrors: [GrammarError]
    let improvedSentences: [ImprovedSentence]
    let wordCount: Int

    init(
        bandScore: Double = 0.0,
        taskAchievement: Double = 0.0,
        coherenceCohesion: Double = 0.0,
        lexicalResource: Double = 0.0,
        grammarAccuracy: Double = 0.0,
        feedback: String = "",
        strengths: [String] = [],
        weaknesses: [String] = [],
        suggestions: [String] = [],
        grammarErrors: [GrammarError] = [],
        improvedSentences: [ImprovedSentence] = [],
        wordCount: Int = 0
    ) {
        self.bandScore = bandScore
        self.taskAchievement = taskAchievement
        self.coherenceCohesion = coherenceCohesion
        self.lexicalResource = lexicalResource
        self.grammarAccuracy = grammarAccuracy
        self.feedback = feedback
        self.strengths = strengths
        self.weaknesses = weaknesses
        self.suggestions = suggestions
        self.grammarErrors = grammarErrors
        self.improvedSentences = improvedSentences
        self.wordCount = wordCount
    }

    /// Convert IELTS band → TOEFL approximate equivalent.
    func toeflEquivalent() -> Int {
        switch bandScore {
        case 8.5...: return 30
        case 8.0..<8.5: return 28
        case 7.5..<8.0: return 26
        case 7.0..<7.5: return 24
        case 6.5..<7.0: return 22
        case 6.0..<6.5: return 20
        case 5.5..<6.0: return 18
        case 5.0..<5.5: return 16
        case 4.5..<5.0: return 14
        default: return 10
        }
    }
}
