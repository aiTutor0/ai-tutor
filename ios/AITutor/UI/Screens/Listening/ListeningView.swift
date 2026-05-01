import SwiftUI

struct ListeningView: View {
    let examMode: ExamMode?

    var body: some View {
        ComingSoonView(
            symbol: "ear.fill",
            title: "Listening",
            subtitle: "TTS-generated lectures + comprehension questions."
        )
    }
}
