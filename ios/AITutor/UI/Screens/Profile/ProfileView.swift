import SwiftUI

struct ProfileView: View {
    let onOpenGroups: () -> Void
    let onOpenSchedule: () -> Void
    let onSignOut: () -> Void

    @EnvironmentObject private var auth: AuthViewModel
    @EnvironmentObject private var preferences: UserPreferences

    var body: some View {
        ScrollView {
            VStack(spacing: 16) {
                AvatarHeader(user: currentUser)
                    .padding(.top, 24)

                StatsRow(
                    streak: preferences.currentStreak,
                    xp: preferences.totalXp,
                    hearts: preferences.hearts
                )

                VStack(spacing: 0) {
                    ProfileRow(systemImage: "person.3.fill", title: "Group chat", action: onOpenGroups)
                    Divider()
                    ProfileRow(systemImage: "calendar", title: "Study schedule", action: onOpenSchedule)
                }
                .background(
                    RoundedRectangle(cornerRadius: Theme.Shape.medium)
                        .fill(Theme.Colors.surfaceVariant)
                )
                .padding(.horizontal, 16)

                Button(role: .destructive, action: onSignOut) {
                    Text("Sign out")
                        .font(Theme.Typography.labelLarge)
                        .frame(maxWidth: .infinity)
                        .padding(.vertical, 14)
                        .background(
                            RoundedRectangle(cornerRadius: Theme.Shape.medium)
                                .fill(Theme.Colors.duoRed.opacity(0.12))
                        )
                        .foregroundColor(Theme.Colors.duoRed)
                }
                .padding(.horizontal, 16)
                .padding(.top, 16)
            }
        }
    }

    private var currentUser: AppUser? {
        if case let .signedIn(user) = auth.state { return user }
        return nil
    }
}

private struct AvatarHeader: View {
    let user: AppUser?

    var body: some View {
        VStack(spacing: 8) {
            ZStack {
                Circle()
                    .fill(Theme.Colors.duoGreen)
                    .frame(width: 96, height: 96)
                Text(initials)
                    .font(Theme.Typography.displayMedium)
                    .foregroundColor(.white)
            }
            Text(user?.displayName ?? user?.email ?? "—")
                .font(Theme.Typography.titleLarge)
            if let email = user?.email, user?.displayName != nil {
                Text(email)
                    .font(Theme.Typography.bodySmall)
                    .foregroundColor(Theme.Colors.onSurfaceVariant)
            }
        }
    }

    private var initials: String {
        let source = user?.displayName ?? user?.email ?? "?"
        let parts = source.split(separator: " ")
        if parts.count >= 2, let first = parts.first?.first, let second = parts.dropFirst().first?.first {
            return "\(first)\(second)".uppercased()
        }
        return String(source.prefix(2)).uppercased()
    }
}

private struct StatsRow: View {
    let streak: Int
    let xp: Int
    let hearts: Int

    var body: some View {
        HStack(spacing: 12) {
            Stat(icon: "flame.fill", value: "\(streak)", label: "day streak", tint: Theme.Colors.duoOrange)
            Stat(icon: "bolt.fill", value: "\(xp)", label: "XP", tint: Theme.Colors.duoYellow)
            Stat(icon: "heart.fill", value: "\(hearts)", label: "hearts", tint: Theme.Colors.duoRed)
        }
        .padding(.horizontal, 16)
    }

    private struct Stat: View {
        let icon: String, value: String, label: String, tint: Color
        var body: some View {
            VStack(spacing: 4) {
                Image(systemName: icon).foregroundColor(tint)
                Text(value).font(Theme.Typography.titleLarge)
                Text(label).font(Theme.Typography.bodySmall)
                    .foregroundColor(Theme.Colors.onSurfaceVariant)
            }
            .frame(maxWidth: .infinity)
            .padding(.vertical, 16)
            .background(
                RoundedRectangle(cornerRadius: Theme.Shape.medium)
                    .fill(Theme.Colors.surfaceVariant)
            )
        }
    }
}

private struct ProfileRow: View {
    let systemImage: String
    let title: String
    let action: () -> Void

    var body: some View {
        Button(action: action) {
            HStack(spacing: 14) {
                Image(systemName: systemImage)
                    .frame(width: 24)
                    .foregroundColor(Theme.Colors.duoBlue)
                Text(title).font(Theme.Typography.bodyLarge)
                Spacer()
                Image(systemName: "chevron.right")
                    .foregroundColor(Theme.Colors.onSurfaceVariant)
            }
            .padding(.horizontal, 16)
            .padding(.vertical, 14)
            .contentShape(Rectangle())
        }
        .buttonStyle(.plain)
    }
}
