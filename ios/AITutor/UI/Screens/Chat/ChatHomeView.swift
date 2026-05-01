import SwiftUI

/// Placeholder Tutor tab. The full chat experience will mirror
/// `ChatHomeScreen.kt` from Android — TutorMode picker → ChatMessageList +
/// composer wired to `ChatRepository.ask`. To be ported next.
struct ChatHomeView: View {
    var body: some View {
        ScrollView {
            VStack(spacing: 16) {
                Image(systemName: "bubble.left.and.bubble.right.fill")
                    .font(.system(size: 56))
                    .foregroundColor(Theme.Colors.duoBlue)
                    .padding(.top, 48)

                Text("Tutor chat")
                    .font(Theme.Typography.displaySmall)

                Text("Pick a tutor mode and start practicing. Coming next port — same shape as the Android ChatHomeScreen.")
                    .font(Theme.Typography.bodyMedium)
                    .foregroundColor(Theme.Colors.onSurfaceVariant)
                    .multilineTextAlignment(.center)
                    .padding(.horizontal, 24)

                ForEach(TutorMode.allCases) { mode in
                    HStack(alignment: .top, spacing: 12) {
                        Image(systemName: "sparkles")
                            .foregroundColor(Theme.Colors.duoYellow)
                        VStack(alignment: .leading, spacing: 4) {
                            Text(mode.displayName).font(Theme.Typography.titleSmall)
                            Text(mode.modeDescription)
                                .font(Theme.Typography.bodySmall)
                                .foregroundColor(Theme.Colors.onSurfaceVariant)
                        }
                        Spacer()
                    }
                    .padding(16)
                    .frame(maxWidth: .infinity)
                    .background(
                        RoundedRectangle(cornerRadius: Theme.Shape.medium)
                            .fill(Theme.Colors.surfaceVariant)
                    )
                    .padding(.horizontal, 16)
                }
            }
            .padding(.bottom, 24)
        }
    }
}
