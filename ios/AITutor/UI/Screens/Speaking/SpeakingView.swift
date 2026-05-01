import SwiftUI

struct SpeakingView: View {
    let examMode: ExamMode?

    var body: some View {
        ComingSoonView(
            symbol: "mic.fill",
            title: "Speaking",
            subtitle: "Realtime voice chat with the AI tutor (OpenAI Realtime via WebRTC). iOS port pending — needs an SPM-friendly WebRTC binary."
        )
    }
}
