import SwiftUI

private struct SkillNode: Identifiable {
    let id = UUID()
    let title: String
    let subtitle: String
    let color: Color
    let route: SkillRoute
    let locked: Bool
    let stars: Int

    init(
        _ title: String,
        _ subtitle: String,
        _ color: Color,
        _ route: SkillRoute,
        locked: Bool = false,
        stars: Int = 0
    ) {
        self.title = title
        self.subtitle = subtitle
        self.color = color
        self.route = route
        self.locked = locked
        self.stars = stars
    }
}

private func ieltsTree() -> [SkillNode] {
    [
        SkillNode("Reading 1", "True/False/NG", Theme.Colors.duoGreen, .reading, stars: 3),
        SkillNode("Listening 1", "Lecture", Theme.Colors.duoBlue, .listening, stars: 2),
        SkillNode("Writing — Task 1", "Charts", Theme.Colors.duoOrange, .writing, stars: 1),
        SkillNode("Writing — Task 2", "Essay", Theme.Colors.duoOrange, .writing, stars: 0),
        SkillNode("Speaking — Part 1", "Free chat", Theme.Colors.duoPurple, .speaking, locked: true),
        SkillNode("Reading 2", "Multiple choice", Theme.Colors.duoGreen, .reading, locked: true),
        SkillNode("Level Test", "CEFR", Theme.Colors.duoYellow, .levelTest)
    ]
}

private func toeflTree() -> [SkillNode] {
    [
        SkillNode("Reading 1", "Academic passage", Theme.Colors.duoGreen, .reading, stars: 3),
        SkillNode("Listening 1", "Lecture", Theme.Colors.duoBlue, .listening, stars: 1),
        SkillNode("Speaking 1", "Independent task", Theme.Colors.duoPurple, .speaking, locked: true),
        SkillNode("Writing — Independent", "Essay", Theme.Colors.duoOrange, .writing),
        SkillNode("Writing — Integrated", "Read+Listen", Theme.Colors.duoOrange, .writing, locked: true),
        SkillNode("Reading 2", "Inference", Theme.Colors.duoGreen, .reading, locked: true),
        SkillNode("Level Test", "CEFR", Theme.Colors.duoYellow, .levelTest)
    ]
}

struct HomeView: View {
    let examMode: ExamMode?
    let onOpenSkill: (SkillRoute) -> Void

    private var nodes: [SkillNode] {
        switch examMode {
        case .ielts: return ieltsTree()
        case .toefl: return toeflTree()
        case .none: return []
        }
    }

    var body: some View {
        ScrollView {
            VStack(alignment: .leading, spacing: 20) {
                Text("Section 1 — Foundations")
                    .font(Theme.Typography.titleMedium)
                    .foregroundColor(Theme.Colors.onSurfaceVariant)
                    .padding(.top, 24)

                VStack(spacing: 28) {
                    ForEach(Array(nodes.enumerated()), id: \.element.id) { index, node in
                        let offset = CGFloat(((index % 4) - 1) * 32)
                        SkillTreeNode(node: node) {
                            if !node.locked { onOpenSkill(node.route) }
                        }
                        .frame(maxWidth: .infinity)
                        .padding(.leading, max(0, offset))
                        .padding(.trailing, max(0, -offset))
                    }
                }
            }
            .padding(.horizontal, 16)
            .padding(.bottom, 24)
        }
    }
}

private struct SkillTreeNode: View {
    let node: SkillNode
    let onTap: () -> Void

    var body: some View {
        VStack(spacing: 6) {
            Button(action: onTap) {
                ZStack {
                    Circle()
                        .fill(node.locked ? Theme.Colors.surfaceVariant : node.color)
                        .frame(width: 80, height: 80)
                    Image(systemName: node.locked ? "lock.fill" : "play.fill")
                        .font(.system(size: 28, weight: .bold))
                        .foregroundColor(.white)
                }
            }
            .buttonStyle(.plain)
            .disabled(node.locked)

            Text(node.title).font(Theme.Typography.titleSmall)
            Text(node.subtitle)
                .font(Theme.Typography.bodySmall)
                .foregroundColor(Theme.Colors.onSurfaceVariant)

            if !node.locked && node.stars > 0 {
                HStack(spacing: 2) {
                    ForEach(0..<3) { i in
                        Image(systemName: "star.fill")
                            .font(.system(size: 12))
                            .foregroundColor(i < node.stars
                                             ? Theme.Colors.duoYellow
                                             : Theme.Colors.outlineVariant)
                    }
                }
            }
        }
    }
}
