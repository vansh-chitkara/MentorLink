/**
 * SIGNUP PAGE JAVASCRIPT
 * Handles:
 * 1. Toggle between Sign In and Sign Up forms
 * 2. User registration (call to /api/auth/register)
 * 3. User login (call to /api/auth/login)
 * 4. Store JWT token in localStorage
 */

const container = document.getElementById("container");
const registerbtn = document.getElementById("register");
const loginbtn = document.getElementById("login");
const registerForm = document.getElementById("registerForm");
const loginForm = document.getElementById("loginForm");
const passwordToggles = document.querySelectorAll(".toggle-password");
const forgotPasswordLink = document.getElementById("forgotPasswordLink");
const forgotPasswordPanel = document.getElementById("forgotPasswordPanel");
const resetPasswordBtn = document.getElementById("resetPasswordBtn");
const resetOtpInput = document.getElementById("resetOtp");
const resetNewPasswordInput = document.getElementById("resetNewPassword");
const forgotStatus = document.getElementById("forgotStatus");

const setForgotStatus = (message, type = "") => {
  if (!forgotStatus) return;
  forgotStatus.textContent = message || "";
  forgotStatus.classList.remove("error", "success");
  if (type) {
    forgotStatus.classList.add(type);
  }
};

const getApiErrorMessage = (data, fallbackMessage) => {
  if (!data) return fallbackMessage;

  if (Array.isArray(data.errors) && data.errors.length) {
    return data.errors.map((error) => error.message).join(" | ");
  }

  return data.message || fallbackMessage;
};

const applyOAuthErrorBanner = () => {
  const params = new URLSearchParams(window.location.search);
  const error = params.get("error");
  if (!error) return;

  const loginMessage = document.getElementById("loginMessage");
  if (!loginMessage) return;

  const messages = {
    google_not_configured: "Google login is not configured yet. Add Google API credentials in .env.",
    google_auth_failed: "Google sign-in failed. Please try again.",
    google: "Google sign-in failed. Please try again."
  };

  loginMessage.textContent = `❌ ${messages[error] || "Unable to sign in with Google right now."}`;
  loginMessage.classList.remove("success");
  loginMessage.classList.add("error");

  container.classList.remove("active");
  window.history.replaceState({}, document.title, "/signup");
};

applyOAuthErrorBanner();

// Do not auto-redirect from /signup.
// Users may intentionally open this page to switch accounts.

/**
 * Toggle between Sign In and Sign Up panels
 */
registerbtn.addEventListener("click", () => {
  container.classList.add("active");
});

loginbtn.addEventListener("click", () => {
  container.classList.remove("active");
});

passwordToggles.forEach((toggle) => {
  toggle.addEventListener("click", () => {
    const inputId = toggle.getAttribute("data-target");
    const input = document.getElementById(inputId);
    if (!input) return;

    const isPassword = input.type === "password";
    input.type = isPassword ? "text" : "password";
    toggle.textContent = isPassword ? "Hide" : "Show";
  });
});

/**
 * Handle User Registration
 * POST /api/auth/register
 */
registerForm.addEventListener("submit", async (e) => {
  e.preventDefault();

  const name = document.getElementById("registerName").value.trim();
  const email = document.getElementById("registerEmail").value.trim().toLowerCase();
  const password = document.getElementById("registerPassword").value;
  const role = document.getElementById("registerRole").value;
  const messageDiv = document.getElementById("registerMessage");

  try {
    messageDiv.textContent = "Registering...";
    messageDiv.classList.remove("error", "success");

    const response = await fetch("/api/auth/register", {
      method: "POST",
      headers: {
        "Content-Type": "application/json"
      },
      body: JSON.stringify({ name, email, password, role })
    });

    const data = await response.json();

    if (response.ok) {
      // Registration successful
      messageDiv.textContent = "✅ Registration successful! Redirecting...";
      messageDiv.classList.add("success");

      // Store token in both scopes to keep all pages in sync.
      localStorage.setItem("token", data.token);
      localStorage.setItem("user", JSON.stringify(data.user));
      sessionStorage.setItem("token", data.token);
      sessionStorage.setItem("user", JSON.stringify(data.user));

      // Redirect after 2 seconds
      setTimeout(() => {
        window.location.href = "/dashboard-page";
      }, 2000);
    } else {
      // Registration failed
      messageDiv.textContent = `❌ ${getApiErrorMessage(data, "Unable to register")}`;
      messageDiv.classList.add("error");
    }
  } catch (error) {
    messageDiv.textContent = `❌ Error: ${error.message}`;
    messageDiv.classList.add("error");
  }
});

/**
 * Handle User Login
 * POST /api/auth/login
 */
loginForm.addEventListener("submit", async (e) => {
  e.preventDefault();

  const email = document.getElementById("loginEmail").value.trim().toLowerCase();
  const password = document.getElementById("loginPassword").value;
  const messageDiv = document.getElementById("loginMessage");

  try {
    messageDiv.textContent = "Signing in...";
    messageDiv.classList.remove("error", "success");

    const response = await fetch("/api/auth/login", {
      method: "POST",
      headers: {
        "Content-Type": "application/json"
      },
      body: JSON.stringify({ email, password })
    });

    const data = await response.json();

    if (response.ok) {
      // Login successful
      messageDiv.textContent = "✅ Login successful! Redirecting...";
      messageDiv.classList.add("success");

      // Store token in both scopes to keep all pages in sync.
      localStorage.setItem("token", data.token);
      localStorage.setItem("user", JSON.stringify(data.user));
      sessionStorage.setItem("token", data.token);
      sessionStorage.setItem("user", JSON.stringify(data.user));

      // Redirect after 2 seconds
      setTimeout(() => {
        window.location.href = "/dashboard-page";
      }, 2000);
    } else {
      // Login failed
      messageDiv.textContent = `❌ ${getApiErrorMessage(data, "Unable to sign in")}`;
      messageDiv.classList.add("error");
    }
  } catch (error) {
    messageDiv.textContent = `❌ Error: ${error.message}`;
    messageDiv.classList.add("error");
  }
});

if (forgotPasswordLink) {
  forgotPasswordLink.addEventListener("click", async (event) => {
    event.preventDefault();

    const messageDiv = document.getElementById("loginMessage");
    const emailInput = document.getElementById("loginEmail");
    const email = (emailInput?.value || "").trim().toLowerCase();

    if (!messageDiv) {
      return;
    }

    if (!email) {
      messageDiv.textContent = "❌ Enter your email first, then click Forgot password.";
      messageDiv.classList.remove("success");
      messageDiv.classList.add("error");
      setForgotStatus("");
      return;
    }

    try {
      messageDiv.textContent = "Sending OTP request...";
      messageDiv.classList.remove("error", "success");

      const forgotResponse = await fetch("/api/auth/forgot-password", {
        method: "POST",
        headers: {
          "Content-Type": "application/json"
        },
        body: JSON.stringify({ email })
      });

      const forgotData = await forgotResponse.json();

      if (!forgotResponse.ok) {
        if (forgotResponse.status === 429 && forgotData?.canUseExistingOtp) {
          if (forgotPasswordPanel) {
            forgotPasswordPanel.hidden = false;
          }
          if (resetOtpInput) {
            resetOtpInput.focus();
          }
          messageDiv.textContent = `❌ ${getApiErrorMessage(forgotData, "Please wait before requesting another OTP.")} You can still use the OTP already sent.`;
          messageDiv.classList.add("error");
          setForgotStatus("You can still enter the OTP received earlier.", "success");
          return;
        }

        messageDiv.textContent = `❌ ${getApiErrorMessage(forgotData, "Unable to request OTP")}`;
        messageDiv.classList.add("error");
        setForgotStatus("");
        return;
      }

      if (forgotPasswordPanel) {
        forgotPasswordPanel.hidden = false;
      }

      if (resetOtpInput) {
        resetOtpInput.focus();
      }

      messageDiv.textContent = "✅ OTP sent to your email. Enter OTP and your new password below.";
      messageDiv.classList.add("success");
      setForgotStatus("OTP sent. Fill OTP and new password, then click Reset Password.", "success");
    } catch (error) {
      messageDiv.textContent = `❌ Error: ${error.message}`;
      messageDiv.classList.add("error");
      setForgotStatus("");
    }
  });
}

if (resetPasswordBtn) {
  resetPasswordBtn.addEventListener("click", async () => {
    const messageDiv = document.getElementById("loginMessage");
    const emailInput = document.getElementById("loginEmail");
    const email = (emailInput?.value || "").trim().toLowerCase();
    const otp = (resetOtpInput?.value || "").trim();
    const newPassword = resetNewPasswordInput?.value || "";

    if (!messageDiv) {
      return;
    }

    if (!email) {
      messageDiv.textContent = "❌ Enter your email in Sign In first.";
      messageDiv.classList.remove("success");
      messageDiv.classList.add("error");
      setForgotStatus("Enter email first.", "error");
      return;
    }

    if (!/^\d{6}$/.test(otp)) {
      messageDiv.textContent = "❌ Enter a valid 6-digit OTP.";
      messageDiv.classList.remove("success");
      messageDiv.classList.add("error");
      setForgotStatus("OTP must be exactly 6 digits.", "error");
      return;
    }

    if (!newPassword) {
      messageDiv.textContent = "❌ Enter your new password.";
      messageDiv.classList.remove("success");
      messageDiv.classList.add("error");
      setForgotStatus("Enter a new password.", "error");
      return;
    }

    const strongPasswordPattern = /^(?=.*[a-z])(?=.*[A-Z])(?=.*\d).{8,}$/;
    if (!strongPasswordPattern.test(newPassword)) {
      messageDiv.textContent = "❌ New password must be 8+ chars with uppercase, lowercase, and number.";
      messageDiv.classList.remove("success");
      messageDiv.classList.add("error");
      setForgotStatus("Use example like: Vanshu21A", "error");
      return;
    }

    try {
      messageDiv.textContent = "Resetting password...";
      messageDiv.classList.remove("error", "success");
      setForgotStatus("Reset request in progress...", "success");

      resetPasswordBtn.disabled = true;
      resetPasswordBtn.textContent = "Please wait...";

      const resetResponse = await fetch("/api/auth/reset-password", {
        method: "POST",
        headers: {
          "Content-Type": "application/json"
        },
        body: JSON.stringify({
          email,
          otp: otp.trim(),
          newPassword
        })
      });

      const resetData = await resetResponse.json();

      if (!resetResponse.ok) {
        messageDiv.textContent = `❌ ${getApiErrorMessage(resetData, "Unable to reset password")}`;
        messageDiv.classList.add("error");
        setForgotStatus(getApiErrorMessage(resetData, "Unable to reset password"), "error");
        return;
      }

      messageDiv.textContent = "✅ Password reset successful. Sign in with your new password.";
      messageDiv.classList.add("success");
      setForgotStatus("Password reset successful.", "success");
      if (forgotPasswordPanel) {
        forgotPasswordPanel.hidden = true;
      }
      if (resetOtpInput) {
        resetOtpInput.value = "";
      }
      if (resetNewPasswordInput) {
        resetNewPasswordInput.value = "";
      }
    } catch (error) {
      messageDiv.textContent = `❌ Error: ${error.message}`;
      messageDiv.classList.add("error");
      setForgotStatus(error.message, "error");
    } finally {
      resetPasswordBtn.disabled = false;
      resetPasswordBtn.textContent = "Reset Password";
    }
  });
}

/**
 * Helper: Get token from localStorage
 * Usage: const token = getToken(); (for API calls)
 */
function getToken() {
  return localStorage.getItem("token");
}

/**
 * Helper: Get user from localStorage
 * Usage: const user = getUser();
 */
function getUser() {
  const userJson = localStorage.getItem("user");
  return userJson ? JSON.parse(userJson) : null;
}

/**
 * Helper: Logout user
 * Usage: logout(); (removes token and user)
 */
function logout() {
  localStorage.removeItem("token");
  localStorage.removeItem("user");
  sessionStorage.removeItem("token");
  sessionStorage.removeItem("user");
  window.location.href = "/signup";
}

/**
 * Check if user is authenticated
 * Redirect to login if token missing
 */
function checkAuth() {
  const token = getToken() || sessionStorage.getItem("token");
  if (!token) {
    window.location.href = "/signup";
  }
  return token;
}
