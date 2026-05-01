import SwiftUI

/// Friendly placeholder used by skill screens until they're ported from Android.
struct ComingSoonView: View {
    let symbol: String
    let title: String
    let subtitle: String

    var body: some View {
        VStack(spacing: 16) {
            Spacer()
            Image(systemName: symbol)
                .font(.system(size: 56))
                .foregroundColor(Theme.Colors.duoBlue)
            Text(title)
                .font(Theme.Typography.displaySmall)
            Text(subtitle)
                .font(Theme.Typography.bodyMedium)
                .foregroundColor(Theme.Colors.onSurfaceVariant)
                .multilineTextAlignment(.center)
                .padding(.horizontal, 32)
            Text("Coming next port.")
                .font(Theme.Typography.labelSmall)
                .foregroundColor(Theme.Colors.duoYellowDark)
                .padding(.top, 8)
            Spacer()
        }
        .frame(maxWidth: .infinity, maxHeight: .infinity)
    }
}
