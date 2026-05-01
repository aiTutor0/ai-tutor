import SwiftUI

struct WritingView: View {
    let examMode: ExamMode?

    var body: some View {
        ComingSoonView(
            symbol: "pencil",
            title: "Writing",
            subtitle: "Pick a task type, draft, then get a band-score evaluation with rewrites."
        )
    }
}
