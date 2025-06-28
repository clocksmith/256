import {
  getAuth,
  createUserWithEmailAndPassword,
  signInWithEmailAndPassword,
  signOut,
  onAuthStateChanged,
  sendPasswordResetEmail,
  deleteUser,
} from "https://www.gstatic.com/firebasejs/10.12.2/firebase-auth.js";
import {
  getFirestore,
  doc,
  getDoc,
  setDoc,
  updateDoc,
  serverTimestamp,
  writeBatch,
} from "https://www.gstatic.com/firebasejs/10.12.2/firebase-firestore.js";

const authManagerTemplate = document.createElement("template");
authManagerTemplate.innerHTML = `
  <style>
    .modal-overlay {
      position: fixed; top: 0; left: 0; width: 100%; height: 100%;
      background-color: rgba(0, 0, 0, 0.6); display: flex;
      justify-content: center; align-items: center; z-index: 1050;
      opacity: 0; visibility: hidden;
      transition: opacity var(--transition-duration-medium, 0.3s) ease, visibility 0s linear var(--transition-duration-medium, 0.3s);
    }
    .modal-overlay.visible {
      opacity: 1; visibility: visible;
      transition-delay: 0s;
    }
    .auth-modal-content {
      background-color: var(--bg-color-secondary, #2a2a2a);
      padding: var(--padding-large, 1.5rem);
      border-radius: var(--border-radius-medium, 0.5rem);
      box-shadow: 0 5px 15px rgba(0, 0, 0, 0.3);
      width: clamp(300px, 90vw, 450px);
      position: relative;
      transform: scale(0.95);
      transition: transform var(--transition-duration-medium, 0.3s) ease;
    }
    .modal-overlay.visible .auth-modal-content {
      transform: scale(1);
    }
    .modal-close-button {
      position: absolute; top: var(--padding-small, 0.5rem); right: var(--padding-medium, 1rem);
      background: none; border: none; font-size: 1.8rem; line-height: 1;
      color: var(--text-color-low-emphasis, #999); cursor: pointer;
    }
    .modal-close-button:hover { color: var(--text-color, #e0e0e0); }

    form { display: flex; flex-direction: column; gap: var(--margin-medium, 1rem); }
    h2 { text-align: center; margin-bottom: var(--margin-large, 1.5rem); font-size: 1.3rem; }
    label { font-weight: 500; font-size: 0.9rem; margin-bottom: -0.75rem; }
    input[type="email"], input[type="password"], input[type="text"] {
      width: 100%; padding: 0.7em 0.9em; background-color: var(--input-bg, #333);
      border: 1px solid var(--input-border, #555); color: var(--text-color, #e0e0e0);
      border-radius: var(--border-radius-small, 0.25rem); font-family: inherit; font-size: 1rem;
    }
    button[type="submit"] {
      padding: 0.8em 1.5em;
      background-image: linear-gradient(90deg, var(--accent-gradient-current-start, #0CF), var(--accent-gradient-current-end, #D27));
      background-size: 200% auto;
      color: var(--bg-color, #1a1a1a); border: none;
      border-radius: var(--border-radius-small, 0.25rem); cursor: pointer;
      font-size: 1rem; font-weight: 500;
      transition: background-position var(--transition-duration-medium, 0.3s) ease, transform var(--transition-duration-fast, 0.16s) ease;
      margin-top: var(--margin-small, 0.5rem);
    }
    button[type="submit"]:hover:not(:disabled) { background-position: right center; transform: translateY(-1px); }
    button[type="submit"]:disabled { opacity: 0.6; cursor: not-allowed; background-image: none; background-color: var(--text-color-low-emphasis, #999); }
    form p { text-align: center; font-size: 0.9rem; margin-top: var(--margin-small, 0.5rem); }
    .link-button { 
        background: none; border: none;
        color: var(--link-color-solid, #0CF); cursor: pointer; padding: 0;
        font-size: inherit; font-family: inherit; display: inline; line-height: inherit;
        text-decoration: underline;
    }
    .link-button:hover { color: var(--link-hover-color-solid, #0AF); }
    .error-message, .success-message {
        padding: 0.8em 1em; border-radius: var(--border-radius-small, 0.25rem);
        font-size: 0.9rem; margin-bottom: var(--margin-small, 0.5rem);
    }
    .error-message { color: var(--error-color, #f47174); background-color: var(--error-bg, rgba(244,113,116,0.1)); border: 1px solid var(--error-border, rgba(244,113,116,0.3)); }
    .success-message { color: var(--success-color, #0CF); background-color: var(--success-bg, rgba(0,204,255,0.2)); border: 1px solid var(--success-border, rgba(0,204,255,0.3)); }
    [hidden] { display: none !important; }
  </style>
  <div class="modal-overlay js-auth-modal" hidden>
    <div class="auth-modal-content">
      <button class="modal-close-button js-auth-modal-close" aria-label="Close">×</button>
      <div class="auth-container js-auth-container">
        <form class="login-form js-login-form">
          <h2>Login</h2>
          <div class="error-message js-login-error" hidden></div>
          <label for="login-username-input">Username:</label>
          <input type="text" id="login-username-input" class="js-login-username" required autocomplete="username"/>
          <label for="login-password-input">Password:</label>
          <input type="password" id="login-password-input" class="js-login-password" required autocomplete="current-password"/>
          <button type="submit">Login</button>
          <p><button type="button" class="link-button js-forgot-password-show-button">Forgot Password?</button></p>
          <p>Don't have an account? <button type="button" class="link-button js-signup-show-button">Sign Up</button></p>
        </form>
        <form class="signup-form js-signup-form" hidden>
          <h2>Sign Up</h2>
          <div class="error-message js-signup-error" hidden></div>
          <label for="signup-username-input">Username (publicly visible):</label>
          <input type="text" id="signup-username-input" class="js-signup-username" required minlength="3" maxlength="30" pattern="^[a-zA-Z0-9_]+$" title="Username can only contain letters, numbers, and underscores." autocomplete="username"/>
          <label for="signup-email-input">Email (private, for password recovery):</label>
          <input type="email" id="signup-email-input" class="js-signup-email" required autocomplete="email"/>
          <label for="signup-password-input">Password:</label>
          <input type="password" id="signup-password-input" class="js-signup-password" required minlength="6" autocomplete="new-password"/>
          <button type="submit">Sign Up</button>
          <p>Already have an account? <button type="button" class="link-button js-login-show-from-signup-button">Login</button></p>
        </form>
        <form class="forgot-password-form js-forgot-password-form" hidden>
          <h2>Reset Password</h2>
          <div class="error-message js-forgot-password-error" hidden></div>
          <div class="success-message js-forgot-password-success" hidden></div>
          <label for="forgot-password-email-input">Enter your account email:</label>
          <input type="email" id="forgot-password-email-input" class="js-forgot-password-email" required autocomplete="email"/>
          <button type="submit">Send Reset Link</button>
          <p>Remembered your password? <button type="button" class="link-button js-login-show-from-forgot-button">Login</button></p>
        </form>
        <form class="set-alias-form js-set-alias-form" hidden>
          <h2>Set Your Public Alias</h2>
          <div class="error-message js-set-alias-error" hidden></div>
          <p>Please set a unique public alias (username) to continue.</p>
          <label for="set-alias-username-input">Alias:</label>
          <input type="text" id="set-alias-username-input" class="js-set-alias-username" required minlength="3" maxlength="30" pattern="^[a-zA-Z0-9_]+$" title="Alias can only contain letters, numbers, and underscores."/>
          <button type="submit">Set Alias</button>
        </form>
      </div>
    </div>
  </div>
`;

class AuthManager extends HTMLElement {
  constructor() {
    super();
    this.attachShadow({ mode: "open" });
    this.shadowRoot.appendChild(authManagerTemplate.content.cloneNode(true));

    this._auth = null;
    this._db = null;
    this._currentUserProfile = null;

    this._modal = this.shadowRoot.querySelector(".js-auth-modal");
    this._modalClose = this.shadowRoot.querySelector(".js-auth-modal-close");
    this._loginForm = this.shadowRoot.querySelector(".js-login-form");
    this._signupForm = this.shadowRoot.querySelector(".js-signup-form");
    this._forgotPasswordForm = this.shadowRoot.querySelector(
      ".js-forgot-password-form"
    );
    this._setAliasForm = this.shadowRoot.querySelector(".js-set-alias-form");

    this._loginError = this._loginForm.querySelector(".js-login-error");
    this._signupError = this._signupForm.querySelector(".js-signup-error");
    this._forgotPasswordError = this._forgotPasswordForm.querySelector(
      ".js-forgot-password-error"
    );
    this._forgotPasswordSuccess = this._forgotPasswordForm.querySelector(
      ".js-forgot-password-success"
    );
    this._setAliasError = this._setAliasForm.querySelector(
      ".js-set-alias-error"
    );
  }

  _initializeFirebaseServices() {
    if (!this._auth) {
      this._auth = getAuth();
    }
    if (!this._db) {
      this._db = getFirestore();
    }
  }

  connectedCallback() {
    this._initializeFirebaseServices();
    this._setupEventListeners();
    onAuthStateChanged(this._auth, this._onAuthStateChangedHandler.bind(this));
    // This global listener is now in app.js
    // document.addEventListener("showAuthModal", (e) => this.showModal(e.detail?.form));
  }

  disconnectedCallback() {
    // document.removeEventListener("showAuthModal", (e) => this.showModal(e.detail?.form));
  }

  showModal(activeForm = "login") {
    if (!this._modal) return;
    this._loginError.hidden = true;
    this._signupError.hidden = true;
    this._forgotPasswordError.hidden = true;
    this._forgotPasswordSuccess.hidden = true;
    this._setAliasError.hidden = true;

    this._loginForm.hidden = activeForm !== "login";
    this._signupForm.hidden = activeForm !== "signup";
    this._forgotPasswordForm.hidden = activeForm !== "forgotPassword";
    this._setAliasForm.hidden = activeForm !== "setAlias";

    this._modal.classList.add("visible");
    this._modal.hidden = false;
    const firstFocusable = this._modal.querySelector(
      "input:not([hidden]), button:not([hidden])"
    );
    firstFocusable?.focus();
  }

  _hideModal() {
    if (!this._modal) return;
    this._modal.classList.remove("visible");
    this._modal.hidden = true;
    this._loginForm.reset();
    this._signupForm.reset();
    this._forgotPasswordForm.reset();
    this._setAliasForm.reset();
  }

  _displayAuthError(element, error) {
    if (!element) return;
    let message = error.message || "An unknown error occurred.";
    if (message.startsWith("Firebase:")) {
      const match = message.match(/\(([^)]+)\)/);
      if (match && match[1]) message = match[1];
      message = message.replace(/^auth\//, "").replace(/-/g, " ");
      message = message.charAt(0).toUpperCase() + message.slice(1);
      if (!message.endsWith(".")) message += ".";
    }
    element.textContent = message;
    element.hidden = false;
  }

  async _isAliasTaken(alias) {
    if (!this._db) this._initializeFirebaseServices();
    const aliasLower = alias.toLowerCase();
    const aliasDocRef = doc(this._db, "usernames", aliasLower);
    const aliasDocSnap = await getDoc(aliasDocRef);
    return aliasDocSnap.exists();
  }

  async _getUserProfile(userId) {
    if (!this._db) this._initializeFirebaseServices();
    try {
      const userDocRef = doc(this._db, "users", userId);
      const docSnap = await getDoc(userDocRef);
      return docSnap.exists() ? docSnap.data() : null;
    } catch (error) {
      console.error("Error fetching user profile:", error);
      return null;
    }
  }

  async _createUserProfile(userId, email, username) {
    if (!this._db) this._initializeFirebaseServices();
    const usernameLower = username.toLowerCase();
    const userDocRef = doc(this._db, "users", userId);
    const usernameDocRef = doc(this._db, "usernames", usernameLower);

    try {
      const usernameDocSnap = await getDoc(usernameDocRef);
      if (usernameDocSnap.exists()) throw new Error("Username already taken.");

      const batch = writeBatch(this._db);
      const initialProfileData = {
        email, // Storing email here is fine, but be mindful of Firebase rules for access
        username,
        createdAt: serverTimestamp(),
      };
      batch.set(userDocRef, initialProfileData);
      batch.set(usernameDocRef, { uid: userId });
      await batch.commit();
      return initialProfileData;
    } catch (error) {
      // Attempt to clean up Firebase Auth user if Firestore profile creation fails
      const firebaseUser = this._auth.currentUser;
      if (firebaseUser && firebaseUser.uid === userId) {
        try {
          await deleteUser(firebaseUser);
        } catch (deleteError) {
          console.error(
            "Failed to delete Firebase auth user after profile creation error:",
            deleteError
          );
        }
      }
      throw error; // Re-throw original error
    }
  }

  async _updateUserAlias(userId, alias) {
    if (!this._db) this._initializeFirebaseServices();
    const newAliasLower = alias.toLowerCase();
    const userDocRef = doc(this._db, "users", userId);
    const newAliasDocRef = doc(this._db, "usernames", newAliasLower);
    const oldProfile = await this._getUserProfile(userId); // Get current profile to remove old alias if different
    const batch = writeBatch(this._db);

    // If an old alias exists and is different from the new one, prepare to delete its mapping
    if (
      oldProfile?.username &&
      oldProfile.username.toLowerCase() !== newAliasLower
    ) {
      const oldAliasDocRef = doc(
        this._db,
        "usernames",
        oldProfile.username.toLowerCase()
      );
      // Ensure we are only deleting our own old alias mapping
      const oldAliasSnap = await getDoc(oldAliasDocRef);
      if (oldAliasSnap.exists() && oldAliasSnap.data().uid === userId) {
        batch.delete(oldAliasDocRef);
      }
    }
    // Check if new alias is taken by someone else
    const newAliasSnap = await getDoc(newAliasDocRef);
    if (newAliasSnap.exists() && newAliasSnap.data().uid !== userId) {
      throw new Error("Alias already taken by another user.");
    }

    batch.update(userDocRef, { username: alias });
    batch.set(newAliasDocRef, { uid: userId }); // Set new alias mapping
    await batch.commit();
    // Update local cache if current user
    if (this._currentUserProfile && this._currentUserProfile.uid === userId) {
      this._currentUserProfile.username = alias;
    }
    return true;
  }

  _emitAuthStateChange(user, profile) {
    this.dispatchEvent(
      new CustomEvent("authStateChanged", {
        detail: { user, profile },
        bubbles: true,
        composed: true,
      })
    );
  }

  async _onAuthStateChangedHandler(user) {
    if (!this._auth || !this._db) this._initializeFirebaseServices(); // Ensure services are initialized

    if (user) {
      const profile = await this._getUserProfile(user.uid);
      if (profile && !profile.username) {
        // User exists in Auth, profile exists in Firestore but no username set
        this._currentUserProfile = {
          uid: user.uid,
          email: user.email,
          ...profile,
        };
        this._emitAuthStateChange(user, this._currentUserProfile);
        this.showModal("setAlias"); // Prompt to set alias
      } else if (profile && profile.username) {
        // User and full profile exist
        this._currentUserProfile = {
          uid: user.uid,
          email: user.email,
          ...profile,
        };
        this._emitAuthStateChange(user, this._currentUserProfile);
      } else if (!profile) {
        // User exists in Auth, but no profile in Firestore (e.g., during signup race or error)
        // This typically means signup process was interrupted or needs completion.
        // Forcing signup form might be too aggressive if it was a temporary glitch.
        // A more robust solution might involve checking if a signup attempt was recent.
        // For now, assume they need to complete signup if profile is missing.
        this._currentUserProfile = null;
        this._emitAuthStateChange(user, null); // Emit with null profile
        // Depending on app flow, might show signup or an error/prompt.
        // If this state is reached, it's likely an incomplete registration.
        // For simplicity, let's assume this is part of the signup flow.
        // this.showModal("signup");
        // this._displayAuthError(this._signupError, { message: "Please complete your registration by setting a username." });
        // OR, could just wait for a setAlias prompt if that's the intended flow.
        // If email is verified, it's more likely they need to set alias.
        // If it's a new user without profile, they likely need to go through signup to create it.
        // Given current logic, if profile is null, the signup form logic handles profile creation.
        // So, just emitting auth state change might be enough and app.js/comments.js will react.
      }
    } else {
      // User is signed out
      this._currentUserProfile = null;
      this._emitAuthStateChange(null, null);
    }
  }

  _setupEventListeners() {
    this._modalClose.addEventListener("click", () => this._hideModal());
    this._modal.addEventListener("click", (e) => {
      if (e.target === this._modal) this._hideModal();
    });

    this.shadowRoot
      .querySelector(".js-signup-show-button")
      ?.addEventListener("click", () => this.showModal("signup"));
    this.shadowRoot
      .querySelector(".js-login-show-from-signup-button")
      ?.addEventListener("click", () => this.showModal("login"));
    this.shadowRoot
      .querySelector(".js-forgot-password-show-button")
      ?.addEventListener("click", () => this.showModal("forgotPassword"));
    this.shadowRoot
      .querySelector(".js-login-show-from-forgot-button")
      ?.addEventListener("click", () => this.showModal("login"));

    this._loginForm.addEventListener("submit", async (e) => {
      e.preventDefault();
      if (!this._auth || !this._db) this._initializeFirebaseServices();
      this._loginError.hidden = true;
      const username = this._loginForm
        .querySelector(".js-login-username")
        .value.trim();
      const password =
        this._loginForm.querySelector(".js-login-password").value;
      if (!username || !password) {
        return this._displayAuthError(this._loginError, {
          message: "Username and password are required.",
        });
      }

      try {
        // Fetch email associated with the username
        const aliasDocRef = doc(this._db, "usernames", username.toLowerCase());
        const aliasDocSnap = await getDoc(aliasDocRef);
        let userEmail = null;
        if (aliasDocSnap.exists()) {
          const userProfileSnap = await getDoc(
            doc(this._db, "users", aliasDocSnap.data().uid)
          );
          if (userProfileSnap.exists()) {
            userEmail = userProfileSnap.data().email;
          }
        }
        if (!userEmail) {
          return this._displayAuthError(this._loginError, {
            message: "Invalid username or password.",
          });
        }

        await signInWithEmailAndPassword(this._auth, userEmail, password);
        this._hideModal();
      } catch (error) {
        this._displayAuthError(this._loginError, error);
      }
    });

    this._signupForm.addEventListener("submit", async (e) => {
      e.preventDefault();
      if (!this._auth || !this._db) this._initializeFirebaseServices();
      this._signupError.hidden = true;
      const username = this._signupForm
        .querySelector(".js-signup-username")
        .value.trim();
      const email = this._signupForm
        .querySelector(".js-signup-email")
        .value.trim();
      const password = this._signupForm.querySelector(
        ".js-signup-password"
      ).value;

      if (!/^[a-zA-Z0-9_]{3,30}$/.test(username)) {
        return this._displayAuthError(this._signupError, {
          message:
            "Username must be 3-30 chars (letters, numbers, underscores).",
        });
      }
      if (password.length < 6) {
        return this._displayAuthError(this._signupError, {
          message: "Password must be at least 6 characters.",
        });
      }
      if (await this._isAliasTaken(username)) {
        return this._displayAuthError(this._signupError, {
          message: "Username already taken.",
        });
      }

      try {
        const userCredential = await createUserWithEmailAndPassword(
          this._auth,
          email,
          password
        );
        // Create profile immediately after auth user creation
        await this._createUserProfile(userCredential.user.uid, email, username);
        // onAuthStateChanged will handle UI updates and emitting authStateChanged event
        this._hideModal();
      } catch (error) {
        this._displayAuthError(this._signupError, error);
      }
    });

    this._forgotPasswordForm.addEventListener("submit", async (e) => {
      e.preventDefault();
      if (!this._auth) this._initializeFirebaseServices();
      this._forgotPasswordError.hidden = true;
      this._forgotPasswordSuccess.hidden = true;
      const email = this._forgotPasswordForm.querySelector(
        ".js-forgot-password-email"
      ).value;
      try {
        await sendPasswordResetEmail(this._auth, email);
        this._forgotPasswordSuccess.textContent =
          "Password reset email sent. Please check your inbox.";
        this._forgotPasswordSuccess.hidden = false;
        this._forgotPasswordForm.reset();
      } catch (error) {
        this._displayAuthError(this._forgotPasswordError, error);
      }
    });

    this._setAliasForm.addEventListener("submit", async (e) => {
      e.preventDefault();
      if (!this._auth || !this._db) this._initializeFirebaseServices();
      this._setAliasError.hidden = true;
      const alias = this._setAliasForm
        .querySelector(".js-set-alias-username")
        .value.trim();
      const user = this._auth.currentUser;
      if (!user) {
        return this._displayAuthError(this._setAliasError, {
          message: "No user logged in.",
        });
      }
      if (!/^[a-zA-Z0-9_]{3,30}$/.test(alias)) {
        return this._displayAuthError(this._setAliasError, {
          message: "Alias must be 3-30 chars (letters, numbers, underscores).",
        });
      }

      try {
        if (await this._isAliasTaken(alias)) {
          return this._displayAuthError(this._setAliasError, {
            message: "Alias already taken.",
          });
        }
        await this._updateUserAlias(user.uid, alias);
        const updatedProfile = await this._getUserProfile(user.uid);
        this._emitAuthStateChange(user, updatedProfile); // Emit change so UI updates
        this._hideModal();
      } catch (error) {
        this._displayAuthError(this._setAliasError, error);
      }
    });
  }

  getCurrentUserProfile() {
    return this._currentUserProfile;
  }

  async doSignOut() {
    if (!this._auth) this._initializeFirebaseServices();
    try {
      await signOut(this._auth);
      // onAuthStateChanged will handle UI updates and emitting event
    } catch (error) {
      console.error("Logout failed:", error);
      // Potentially show a global error message if needed
      alert("Logout failed. Please try again.");
    }
  }

  showLoginModal() {
    this.showModal("login");
  }
}

customElements.define("auth-manager", AuthManager);

export function initializeAuth() {
  // Ensure the component is defined. It might be defined already if script runs multiple times.
  if (!customElements.get("auth-manager")) {
    customElements.define("auth-manager", AuthManager);
  }
}
