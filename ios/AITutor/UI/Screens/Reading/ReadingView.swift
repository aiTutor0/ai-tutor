import SwiftUI

/// Placeholder. Will mirror `ReadingScreen.kt` — passage rendering,
/// per-question widgets (multiple choice / TF-NG / fill-blank / inference /
/// summary), countdown, then `GradeReadingAnswersUseCase` + a results panel.
struct ReadingView: View {
    let examMode: ExamMode?

    var body: some View {
        ComingSoonView(
            symbol: "book.fill",
            title: "Reading",
            subtitle: "Generated passages with questions tuned for \(examMode?.displayName ?? "your exam")."
        )
    }
}
