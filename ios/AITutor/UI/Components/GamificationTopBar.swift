import SwiftUI

/// Top bar with the Duolingo-style streak / hearts / XP chips and the current
/// exam mode pill on the left. Sits above each tab screen.
struct GamificationTopBar: View {
    let examMode: ExamMode?
    let streakDays: Int
    let hearts: Int
    let totalXp: Int
    let onExamTap: () -> Void

    var body: some View {
        HStack(spacing: 8) {
            if let mode = examMode {
                ExamPill(mode: mode, action: onExamTap)
            }
            Spacer()
            StatChip(systemImage: "flame.fill", value: "\(streakDays)", tint: Theme.Colors.duoOrange)
            StatChip(systemImage: "heart.fill", value: "\(hearts)", tint: Theme.Colors.duoRed)
            StatChip(systemImage: "bolt.fill", value: "\(totalXp)", tint: Theme.Colors.duoYellow)
        }
        .padding(.horizontal, 16)
        .padding(.vertical, 8)
    }
}

private struct ExamPill: View {
    let mode: ExamMode
    let action: () -> Void

    var body: some View {
        Button(action: action) {
            HStack(spacing: 6) {
                Circle()
                    .fill(mode.brandColor)
                    .frame(width: 8, height: 8)
                Text(mode.displayName)
                    .font(Theme.Typography.labelMedium)
                    .foregroundColor(mode.brandColor)
            }
            .padding(.horizontal, 12)
            .padding(.vertical, 6)
            .background(
                Capsule().fill(mode.brandColor.opacity(0.15))
            )
        }
        .buttonStyle(.plain)
    }
}

private struct StatChip: View {
    let systemImage: String
    let value: String
    let tint: Color

    var body: some View {
        HStack(spacing: 4) {
            Image(systemName: systemImage).foregroundColor(tint)
            Text(value)
                .font(Theme.Typography.labelLarge)
                .foregroundColor(tint)
        }
    }
}
