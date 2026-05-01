import SwiftUI

/// Top-level switcher driven by auth + exam-mode state.
/// Mirrors `AITutorRoot` + `AITutorNavGraph` on Android, but leans on
/// SwiftUI's state-driven view swap rather than an imperative NavController.
struct RootView: View {
    @EnvironmentObject private var auth: AuthViewModel
    @EnvironmentObject private var preferences: UserPreferences

    var body: some View {
        Group {
            switch auth.state {
            case .unknown:
                SplashView()
            case .signedOut:
                AuthFlowView()
            case .signedIn:
                if preferences.examMode == nil {
                    ExamSelectView(showsBackButton: false)
                } else {
                    MainScaffoldView()
                }
            }
        }
        .animation(.easeInOut(duration: 0.2), value: auth.state)
        .animation(.easeInOut(duration: 0.2), value: preferences.examMode)
    }
}
