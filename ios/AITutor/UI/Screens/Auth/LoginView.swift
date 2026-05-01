import SwiftUI

@MainActor
final class LoginViewModel: ObservableObject {
    @Published var email = ""
    @Published var password = ""
    @Published var isLoading = false
    @Published var errorMessage: String?

    private let authRepository: AuthRepository

    init(authRepository: AuthRepository) {
        self.authRepository = authRepository
    }

    func signIn() async {
        let trimmed = email.trimmingCharacters(in: .whitespaces)
        guard !trimmed.isEmpty, !password.isEmpty else {
            errorMessage = "Email and password are required"
            return
        }
        isLoading = true
        errorMessage = nil
        do {
            try await authRepository.signInWithEmail(email: trimmed, password: password)
        } catch {
            errorMessage = error.localizedDescription
        }
        isLoading = false
    }

    func signInWithGoogle() async {
        isLoading = true
        errorMessage = nil
        do {
            try await authRepository.signInWithGoogle()
        } catch {
            errorMessage = error.localizedDescription
        }
        isLoading = false
    }
}

struct LoginView: View {
    @EnvironmentObject private var container: AppContainer
    @StateObject private var viewModel: LoginViewModel

    init() {
        // The real repo is injected at first body evaluation by overriding the
        // initial state. We give a placeholder here that never gets used.
        _viewModel = StateObject(wrappedValue: LoginViewModel(
            authRepository: AppContainer.shared.authRepository
        ))
    }

    var body: some View {
        VStack(spacing: 12) {
            Spacer()

            Text("Welcome back")
                .font(Theme.Typography.displayMedium)
                .multilineTextAlignment(.center)
            Text("Practice IELTS & TOEFL with your AI tutor")
                .font(Theme.Typography.titleMedium)
                .foregroundColor(Theme.Colors.onSurfaceVariant)
                .multilineTextAlignment(.center)

            Spacer().frame(height: 16)

            TextField("Email", text: $viewModel.email)
                .textFieldStyle(.roundedBorder)
                .textInputAutocapitalization(.never)
                .autocorrectionDisabled()
                .keyboardType(.emailAddress)

            SecureField("Password", text: $viewModel.password)
                .textFieldStyle(.roundedBorder)

            if let error = viewModel.errorMessage {
                Text(error)
                    .font(Theme.Typography.bodySmall)
                    .foregroundColor(Theme.Colors.duoRed)
                    .frame(maxWidth: .infinity, alignment: .leading)
            }

            DuoButton(
                title: viewModel.isLoading ? "Signing in…" : "Log in",
                action: { Task { await viewModel.signIn() } },
                enabled: !viewModel.isLoading,
                containerColor: Theme.Colors.duoGreen,
                shadowColor: Theme.Colors.duoGreenDark
            )

            DuoButton(
                title: "Continue with Google",
                action: { Task { await viewModel.signInWithGoogle() } },
                enabled: !viewModel.isLoading,
                containerColor: Theme.Colors.duoBlue,
                shadowColor: Theme.Colors.duoBlueDark
            )

            NavigationLink {
                RegisterView()
            } label: {
                Text("New to AITutor? Create an account")
                    .font(Theme.Typography.bodyMedium)
                    .foregroundColor(Theme.Colors.duoBlue)
            }
            .padding(.top, 8)

            Spacer()
        }
        .padding(.horizontal, 24)
        .navigationBarHidden(true)
    }
}
