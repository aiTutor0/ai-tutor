import SwiftUI

/// Wrapper for the signed-out flow so Login / Register can push with
/// NavigationStack. Auth success implicitly causes the parent `RootView` to
/// swap us out, so we don't need to call `dismiss()` ourselves.
struct AuthFlowView: View {
    var body: some View {
        NavigationStack {
            LoginView()
        }
    }
}
