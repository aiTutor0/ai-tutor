import SwiftUI

@MainActor
final class RegisterViewModel: ObservableObject {
    @Published var displayName = ""
    @Published var email = ""
    @Published var password = ""
    @Published var isLoading = false
    @Published var errorMessage: String?

    private let authRepository: AuthRepository

    init(authRepository: AuthRepository) {
        self.authRepository = authRepository
    }

    func register() async {
        let trimmedEmail = email.trimmingCharacters(in: .whitespaces)
        guard !trimmedEmail.isEmpty, !password.isEmpty else {
            errorMessage = "Email and password are required"
            return
        }
        guard password.count >= 6 else {
            errorMessage = "Password must be at least 6 characters"
            return
        }
        isLoading = true
        errorMessage = nil
        do {
            try await authRepository.signUpWithEmail(
                email: trimmedEmail,
                password: password,
                displayName: displayName.trimmingCharacters(in: .whitespaces).nilIfEmpty
            )
        } catch {
            errorMessage = error.localizedDescription
        }
        isLoading = false
    }
}

struct RegisterView: View {
    @EnvironmentObject private var container: AppContainer
    @Environment(\.dismiss) private var dismiss
    @StateObject private var viewModel: RegisterViewModel

    init() {
        _viewModel = StateObject(wrappedValue: RegisterViewModel(
            authRepository: AppContainer.shared.authRepository
        ))
    }

    var body: some View {
        VStack(spacing: 12) {
            Spacer()

            Text("Create account")
                .font(Theme.Typography.displayMedium)
                .multilineTextAlignment(.center)
            Text("Start your IELTS & TOEFL journey")
                .font(Theme.Typography.titleMedium)
                .foregroundColor(Theme.Colors.onSurfaceVariant)
                .multilineTextAlignment(.center)

            Spacer().frame(height: 16)

            TextField("Display name (optional)", text: $viewModel.displayName)
                .textFieldStyle(.roundedBorder)

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
                title: viewModel.isLoading ? "Creating…" : "Create account",
                action: { Task { await viewModel.register() } },
                enabled: !viewModel.isLoading,
                containerColor: Theme.Colors.duoGreen,
                shadowColor: Theme.Colors.duoGreenDark
            )

            Button("Already have an account? Log in") { dismiss() }
                .font(Theme.Typography.bodyMedium)
                .foregroundColor(Theme.Colors.duoBlue)
                .padding(.top, 8)

            Spacer()
        }
        .padding(.horizontal, 24)
        .navigationBarTitleDisplayMode(.inline)
    }
}

private extension String {
    var nilIfEmpty: String? { isEmpty ? nil : self }
}
