import SwiftUI

extension Theme.Typography {
    // Replace with Nunito / Feather Bold once those font assets land in the
    // bundle. Until then SF Pro at the requested weights is close enough.

    static let displayLarge = Font.system(size: 36, weight: .heavy, design: .rounded)
    static let displayMedium = Font.system(size: 28, weight: .heavy, design: .rounded)
    static let displaySmall = Font.system(size: 24, weight: .bold, design: .rounded)

    static let headlineLarge = Font.system(size: 26, weight: .heavy, design: .rounded)
    static let headlineMedium = Font.system(size: 22, weight: .bold, design: .rounded)
    static let headlineSmall = Font.system(size: 18, weight: .bold, design: .rounded)

    static let titleLarge = Font.system(size: 20, weight: .bold, design: .rounded)
    static let titleMedium = Font.system(size: 16, weight: .semibold, design: .rounded)
    static let titleSmall = Font.system(size: 14, weight: .semibold, design: .rounded)

    static let bodyLarge = Font.system(size: 16, weight: .regular)
    static let bodyMedium = Font.system(size: 14, weight: .regular)
    static let bodySmall = Font.system(size: 12, weight: .regular)

    static let labelLarge = Font.system(size: 16, weight: .bold, design: .rounded)
    static let labelMedium = Font.system(size: 14, weight: .bold, design: .rounded)
    static let labelSmall = Font.system(size: 12, weight: .bold, design: .rounded)
}
