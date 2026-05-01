import SwiftUI

/// Flat grid of every skill module — alternative entry point to the home
/// "vine". Filtered by current exam mode.
struct SkillsView: View {
    let examMode: ExamMode?
    let onOpenSkill: (SkillRoute) -> Void

    private let columns = [GridItem(.flexible()), GridItem(.flexible())]

    var body: some View {
        ScrollView {
            LazyVGrid(columns: columns, spacing: 16) {
                ForEach(skills) { tile in
                    Button { onOpenSkill(tile.route) } label: {
                        VStack(spacing: 12) {
                            Image(systemName: tile.symbol)
                                .font(.system(size: 32, weight: .bold))
                                .foregroundColor(.white)
                                .frame(width: 64, height: 64)
                                .background(Circle().fill(tile.color))
                            Text(tile.title)
                                .font(Theme.Typography.titleSmall)
                                .foregroundColor(Theme.Colors.onBackground)
                            Text(tile.subtitle)
                                .font(Theme.Typography.bodySmall)
                                .foregroundColor(Theme.Colors.onSurfaceVariant)
                                .multilineTextAlignment(.center)
                        }
                        .padding()
                        .frame(maxWidth: .infinity, minHeight: 160)
                        .background(
                            RoundedRectangle(cornerRadius: Theme.Shape.medium)
                                .fill(Theme.Colors.surfaceVariant)
                        )
                    }
                    .buttonStyle(.plain)
                }
            }
            .padding(16)
        }
    }

    private var skills: [SkillTile] {
        [
            SkillTile(.reading, "Reading", "Comprehension drills", "book.fill", Theme.Colors.duoGreen),
            SkillTile(.listening, "Listening", "Audio + questions", "ear.fill", Theme.Colors.duoBlue),
            SkillTile(.writing, "Writing", "Essays & evaluation", "pencil", Theme.Colors.duoOrange),
            SkillTile(.speaking, "Speaking", "Realtime AI", "mic.fill", Theme.Colors.duoPurple),
            SkillTile(.levelTest, "Level Test", "Find your CEFR", "chart.bar.fill", Theme.Colors.duoYellow)
        ]
    }

    private struct SkillTile: Identifiable {
        let id: SkillRoute
        let route: SkillRoute
        let title: String
        let subtitle: String
        let symbol: String
        let color: Color

        init(_ route: SkillRoute, _ title: String, _ subtitle: String, _ symbol: String, _ color: Color) {
            self.id = route
            self.route = route
            self.title = title
            self.subtitle = subtitle
            self.symbol = symbol
            self.color = color
        }
    }
}
