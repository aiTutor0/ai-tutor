import SwiftUI

struct ExamSelectView: View {
    @EnvironmentObject private var preferences: UserPreferences
    @Environment(\.dismiss) private var dismiss

    let showsBackButton: Bool

    @State private var pendingChoice: ExamMode?

    init(showsBackButton: Bool = true) {
        self.showsBackButton = showsBackButton
    }

    var body: some View {
        VStack(spacing: 16) {
            Spacer().frame(height: 32)

            Text("Choose your exam")
                .font(Theme.Typography.displayMedium)
            Text("You can switch later from the top bar.")
                .font(Theme.Typography.bodyMedium)
                .foregroundColor(Theme.Colors.onSurfaceVariant)

            Spacer().frame(height: 16)

            ForEach(ExamMode.allCases) { mode in
                ExamCard(
                    mode: mode,
                    selected: pendingChoice == mode,
                    onTap: { pendingChoice = mode }
                )
            }

            Spacer()

            DuoButton(
                title: "Confirm",
                action: confirm,
                enabled: pendingChoice != nil,
                containerColor: Theme.Colors.duoGreen,
                shadowColor: Theme.Colors.duoGreenDark
            )

            if showsBackButton {
                Button("Cancel") { dismiss() }
                    .font(Theme.Typography.bodyMedium)
                    .foregroundColor(Theme.Colors.onSurfaceVariant)
            }
        }
        .padding(.horizontal, 24)
        .padding(.bottom, 24)
        .onAppear { pendingChoice = preferences.examMode }
    }

    private func confirm() {
        guard let pendingChoice else { return }
        preferences.setExamMode(pendingChoice)
        if showsBackButton { dismiss() }
    }
}

private struct ExamCard: View {
    let mode: ExamMode
    let selected: Bool
    let onTap: () -> Void

    var body: some View {
        Button(action: onTap) {
            HStack(alignment: .top, spacing: 16) {
                Circle()
                    .fill(mode.brandColor)
                    .frame(width: 48, height: 48)
                    .overlay(
                        Text(String(mode.displayName.prefix(1)))
                            .font(Theme.Typography.titleLarge)
                            .foregroundColor(.white)
                    )

                VStack(alignment: .leading, spacing: 4) {
                    Text(mode.displayName)
                        .font(Theme.Typography.titleLarge)
                    Text(mode.tagline)
                        .font(Theme.Typography.bodyMedium)
                        .foregroundColor(Theme.Colors.onSurfaceVariant)
                    Text("\(mode.scoreLabel) up to \(formatted(mode.maxScore))")
                        .font(Theme.Typography.bodySmall)
                        .foregroundColor(Theme.Colors.onSurfaceVariant)
                }

                Spacer()

                if selected {
                    Image(systemName: "checkmark.circle.fill")
                        .foregroundColor(mode.brandColor)
                        .imageScale(.large)
                }
            }
            .padding(16)
            .background(
                RoundedRectangle(cornerRadius: Theme.Shape.medium)
                    .fill(Theme.Colors.surfaceVariant)
            )
            .overlay(
                RoundedRectangle(cornerRadius: Theme.Shape.medium)
                    .stroke(selected ? mode.brandColor : Color.clear, lineWidth: 2)
            )
        }
        .buttonStyle(.plain)
    }

    private func formatted(_ value: Double) -> String {
        value.truncatingRemainder(dividingBy: 1) == 0
            ? "\(Int(value))"
            : String(format: "%.1f", value)
    }
}
