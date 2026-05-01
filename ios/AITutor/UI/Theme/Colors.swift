import SwiftUI

extension Theme.Colors {
    // MARK: Duolingo-inspired palette ─────────────────────────────────────

    // Primary brand
    static let duoGreen = Color(red: 0x58 / 255, green: 0xCC / 255, blue: 0x02 / 255)
    static let duoGreenDark = Color(red: 0x58 / 255, green: 0xA7 / 255, blue: 0x00 / 255)
    static let duoGreenPressed = Color(red: 0x46 / 255, green: 0xA3 / 255, blue: 0x02 / 255)

    // Accents
    static let duoYellow = Color(red: 0xFF / 255, green: 0xC8 / 255, blue: 0x00 / 255)
    static let duoYellowDark = Color(red: 0xE0 / 255, green: 0xA9 / 255, blue: 0x00 / 255)
    static let duoBlue = Color(red: 0x1C / 255, green: 0xB0 / 255, blue: 0xF6 / 255)
    static let duoBlueDark = Color(red: 0x0F / 255, green: 0x8F / 255, blue: 0xCC / 255)
    static let duoRed = Color(red: 0xFF / 255, green: 0x4B / 255, blue: 0x4B / 255)
    static let duoRedDark = Color(red: 0xE5 / 255, green: 0x39 / 255, blue: 0x35 / 255)
    static let duoPurple = Color(red: 0xCE / 255, green: 0x82 / 255, blue: 0xFF / 255)
    static let duoOrange = Color(red: 0xFF / 255, green: 0x96 / 255, blue: 0x00 / 255)

    // Neutrals (light)
    static let snow = Color.white
    static let paleGrey = Color(red: 0xF7 / 255, green: 0xF7 / 255, blue: 0xF7 / 255)
    static let gray100 = Color(red: 0xE5 / 255, green: 0xE5 / 255, blue: 0xE5 / 255)
    static let gray200 = Color(red: 0xCC / 255, green: 0xCC / 255, blue: 0xCC / 255)
    static let gray400 = Color(red: 0xAF / 255, green: 0xAF / 255, blue: 0xAF / 255)
    static let gray700 = Color(red: 0x77 / 255, green: 0x77 / 255, blue: 0x77 / 255)
    static let eel = Color(red: 0x4B / 255, green: 0x4B / 255, blue: 0x4B / 255)

    // Neutrals (dark — Duolingo dark mode tones)
    static let duoDarkBg = Color(red: 0x13 / 255, green: 0x1F / 255, blue: 0x24 / 255)
    static let duoDarkSurface = Color(red: 0x1F / 255, green: 0x2D / 255, blue: 0x33 / 255)
    static let duoDarkSurfaceVariant = Color(red: 0x2B / 255, green: 0x3D / 255, blue: 0x45 / 255)
    static let duoDarkOutline = Color(red: 0x37 / 255, green: 0x46 / 255, blue: 0x4F / 255)
    static let duoDarkText = Color.white
    static let duoDarkTextSecondary = Color(red: 0xAF / 255, green: 0xAF / 255, blue: 0xAF / 255)

    // Semantic for IELTS/TOEFL tagging
    static let ieltsBlue = Color(red: 0x0F / 255, green: 0x4C / 255, blue: 0x81 / 255)
    static let toeflRed = Color(red: 0xB3 / 255, green: 0x13 / 255, blue: 0x13 / 255)
}

/// Adaptive semantic colors that pick the right tone for light/dark mode.
extension Theme.Colors {
    static var background: Color {
        Color(uiColor: .init { trait in
            trait.userInterfaceStyle == .dark
                ? UIColor(Self.duoDarkBg)
                : UIColor(Self.snow)
        })
    }

    static var surface: Color {
        Color(uiColor: .init { trait in
            trait.userInterfaceStyle == .dark
                ? UIColor(Self.duoDarkSurface)
                : UIColor(Self.snow)
        })
    }

    static var surfaceVariant: Color {
        Color(uiColor: .init { trait in
            trait.userInterfaceStyle == .dark
                ? UIColor(Self.duoDarkSurfaceVariant)
                : UIColor(Self.paleGrey)
        })
    }

    static var onBackground: Color {
        Color(uiColor: .init { trait in
            trait.userInterfaceStyle == .dark
                ? UIColor(Self.duoDarkText)
                : UIColor(Self.eel)
        })
    }

    static var onSurfaceVariant: Color {
        Color(uiColor: .init { trait in
            trait.userInterfaceStyle == .dark
                ? UIColor(Self.duoDarkTextSecondary)
                : UIColor(Self.gray700)
        })
    }

    static var outline: Color {
        Color(uiColor: .init { trait in
            trait.userInterfaceStyle == .dark
                ? UIColor(Self.duoDarkOutline)
                : UIColor(Self.gray200)
        })
    }

    static var outlineVariant: Color {
        Color(uiColor: .init { trait in
            trait.userInterfaceStyle == .dark
                ? UIColor(Self.duoDarkOutline)
                : UIColor(Self.gray100)
        })
    }
}
