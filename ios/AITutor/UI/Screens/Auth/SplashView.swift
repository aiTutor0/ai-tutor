import SwiftUI

struct SplashView: View {
    var body: some View {
        ZStack {
            Theme.Colors.duoGreen.ignoresSafeArea()

            VStack(spacing: 20) {
                ZStack {
                    Circle()
                        .fill(Color.white)
                        .frame(width: 96, height: 96)
                    Text("AT")
                        .font(Theme.Typography.displayMedium)
                        .foregroundColor(Theme.Colors.duoGreenDark)
                }

                Text("AITutor")
                    .font(Theme.Typography.displayLarge)
                    .foregroundColor(.white)

                Text("IELTS · TOEFL · Speak fluently")
                    .font(Theme.Typography.titleMedium)
                    .foregroundColor(.white.opacity(0.85))

                ProgressView()
                    .progressViewStyle(.circular)
                    .tint(.white)
                    .padding(.top, 16)
            }
        }
    }
}
