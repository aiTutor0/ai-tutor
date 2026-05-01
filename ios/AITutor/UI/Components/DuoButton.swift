import SwiftUI

/// Duolingo-style 3D button. The "shadow" beneath presses down on tap.
///
/// Pass any `containerColor`; the bottom shadow defaults to `containerColor`
/// darkened by ~15% unless `shadowColor` is provided.
struct DuoButton: View {
    let title: String
    let action: () -> Void

    var enabled: Bool = true
    var containerColor: Color = Theme.Colors.duoGreen
    var shadowColor: Color = Theme.Colors.duoGreenDark
    var contentColor: Color? = nil
    var cornerRadius: CGFloat = Theme.Shape.medium
    var shadowDepth: CGFloat = 4
    var leading: AnyView? = nil
    var trailing: AnyView? = nil

    @State private var isPressed = false

    private var resolvedContentColor: Color {
        contentColor ?? (containerColor.isLight ? Theme.Colors.eel : .white)
    }

    var body: some View {
        let topOffset = isPressed && enabled ? shadowDepth : 0
        let bottomShadow = isPressed && enabled ? 0 : shadowDepth

        ZStack(alignment: .top) {
            // Bottom shadow / 3D base
            RoundedRectangle(cornerRadius: cornerRadius, style: .continuous)
                .fill((enabled ? shadowColor : shadowColor.opacity(0.4)))
                .frame(minHeight: 52)
                .padding(.top, shadowDepth)

            // Top face — animates downward when pressed
            RoundedRectangle(cornerRadius: cornerRadius, style: .continuous)
                .fill(enabled ? containerColor : containerColor.opacity(0.4))
                .frame(minHeight: 52 - shadowDepth + bottomShadow)
                .padding(.top, topOffset)
                .overlay(alignment: .center) {
                    HStack(spacing: 8) {
                        leading
                        Text(title)
                            .font(Theme.Typography.labelLarge)
                            .foregroundColor(resolvedContentColor)
                        trailing
                    }
                    .padding(.top, topOffset)
                }
        }
        .frame(minHeight: 52 + shadowDepth)
        .contentShape(RoundedRectangle(cornerRadius: cornerRadius, style: .continuous))
        .onTapGesture { if enabled { action() } }
        .gesture(
            DragGesture(minimumDistance: 0)
                .onChanged { _ in
                    if !isPressed {
                        withAnimation(.easeOut(duration: 0.06)) { isPressed = true }
                    }
                }
                .onEnded { _ in
                    withAnimation(.easeOut(duration: 0.06)) { isPressed = false }
                }
        )
        .opacity(enabled ? 1.0 : 0.85)
    }
}

private extension Color {
    var isLight: Bool {
        var r: CGFloat = 0, g: CGFloat = 0, b: CGFloat = 0, a: CGFloat = 0
        UIColor(self).getRed(&r, green: &g, blue: &b, alpha: &a)
        // Rec. 709 luminance approximation
        let luminance = 0.2126 * r + 0.7152 * g + 0.0722 * b
        return luminance > 0.5
    }
}
