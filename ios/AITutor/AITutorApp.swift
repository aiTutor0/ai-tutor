import SwiftUI

@main
struct AITutorApp: App {
    @StateObject private var container = AppContainer.shared

    var body: some Scene {
        WindowGroup {
            RootView()
                .environmentObject(container)
                .environmentObject(container.authViewModel)
                .environmentObject(container.preferences)
                .preferredColorScheme(nil)
        }
    }
}
