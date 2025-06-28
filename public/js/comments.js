import { $, $$, createElement, escapeHTML } from "./utils.js";
import {
  getFirestore,
  collection,
  addDoc,
  query,
  where,
  orderBy,
  onSnapshot,
  serverTimestamp,
} from "https://www.gstatic.com/firebasejs/10.12.2/firebase-firestore.js";

const commentsSectionTemplate = document.createElement("template");
commentsSectionTemplate.innerHTML = `
  <style>
    :host {
      display: block;
      max-width: var(--content-max-width, 1024px);
      margin: var(--margin-large, 1.5rem) auto;
      padding: var(--padding-medium, 1rem);
      background-color: var(--bg-color-secondary, #2a2a2a);
      border-radius: var(--border-radius-medium, 0.5rem);
      border: 1px solid var(--border-color, #4d4d4d);
      transition: background-color var(--transition-duration-slow, 0.5s) ease,
                  border-color var(--transition-duration-slow, 0.5s) ease;
    }
    :host([hidden]) {
        display: none !important;
    }
    h2 {
      margin-top: 0;
      font-size: 1.4rem;
      color: var(--text-color, #e0e0e0);
    }
    .comments-list .comment {
      border-bottom: 1px solid var(--border-color, #4d4d4d);
      padding: var(--padding-medium, 1rem) 0;
      margin-bottom: var(--padding-medium, 1rem);
    }
    .comments-list .comment:last-child {
      border-bottom: none;
      margin-bottom: 0;
    }
    .comment-meta {
      margin-bottom: var(--margin-small, 0.5rem);
    }
    .comment-author {
      font-weight: bold;
      color: var(--text-color, #e0e0e0);
    }
    .comment-date {
      font-size: 0.8rem;
      color: var(--text-color-low-emphasis, #999);
      margin-left: var(--margin-small, 0.5rem);
    }
    .comment-text {
      white-space: pre-wrap;
      word-wrap: break-word;
      color: var(--text-color, #e0e0e0);
    }
    .comment-form {
      margin-top: var(--margin-large, 1.5rem);
      padding-top: var(--padding-large, 1.5rem);
      border-top: 1px solid var(--border-color, #4d4d4d);
    }
    .comment-form h3 {
      margin-bottom: var(--margin-medium, 1rem);
      margin-top: 0;
      font-size: 1.2rem;
      color: var(--text-color, #e0e0e0);
    }
    .form-field {
      display: flex;
      flex-direction: column;
      gap: 0.3rem;
      margin-bottom: var(--margin-medium, 1rem);
    }
    .comment-form label {
      display: block;
      margin-bottom: 0.3rem;
      font-weight: 500;
      color: var(--text-color, #e0e0e0);
    }
    .comment-form input[type="text"],
    .comment-form textarea {
      width: 100%;
      padding: 0.6em 0.8em;
      background-color: var(--input-bg, #333);
      border: 1px solid var(--input-border, #555);
      color: var(--text-color, #e0e0e0);
      border-radius: var(--border-radius-small, 0.25rem);
      font-family: inherit;
      font-size: 1rem;
    }
    .comment-form textarea {
      resize: vertical;
      min-height: 80px;
    }
    .comment-form button[type="submit"] {
      padding: 0.7em 1.5em;
      background-image: linear-gradient(90deg, var(--accent-gradient-current-start, #0CF), var(--accent-gradient-current-end, #D27) 50%, var(--accent-gradient-current-start, #0CF) 100%);
      background-size: 200% auto;
      color: var(--bg-color, #1a1a1a);
      border: none;
      border-radius: var(--border-radius-small, 0.25rem);
      cursor: pointer;
      font-size: 1rem;
      font-weight: 500;
      transition: background-position var(--transition-duration-medium, 0.3s) ease, transform var(--transition-duration-fast, 0.16s) ease, opacity 0.2s ease;
    }
    .comment-form button[type="submit"]:disabled {
      opacity: 0.6;
      cursor: not-allowed;
      background-image: none;
      background-color: var(--text-color-low-emphasis, #999);
    }
    .comment-form button[type="submit"]:hover:not(:disabled) {
      background-position: right center;
      transform: translateY(-1px);
    }
    .form-field small {
      font-size: 0.8rem;
      color: var(--text-color-low-emphasis, #999);
      margin-top: -0.1rem;
    }
    .login-prompt {
      text-align: center;
      margin-top: var(--margin-large, 1.5rem);
      padding-top: var(--padding-large, 1.5rem);
      border-top: 1px dashed var(--border-color, #4d4d4d);
      color: var(--text-color-low-emphasis, #999);
    }
    .login-prompt .link-button {
        color: var(--link-color-solid, #0CF);
    }
     .error-message {
        padding: 0.8em 1em; border-radius: var(--border-radius-small, 0.25rem);
        font-size: 0.9rem; margin-bottom: var(--margin-small, 0.5rem);
        color: var(--error-color, #f47174); background-color: var(--error-bg, rgba(244,113,116,0.1)); border: 1px solid var(--error-border, rgba(244,113,116,0.3));
    }
  </style>
  <h2 id="comments-heading-label">Comments</h2>
  <div class="comments-list js-comments-list"></div>
  <form class="comment-form js-comment-form" hidden>
    <h3>Leave a Comment</h3>
    <div class="error-message js-comment-error" hidden></div>
    <div class="form-field js-comment-name-field" hidden>
      <label for="comment-name-input">Display Name:</label>
      <input type="text" id="comment-name-input" class="js-comment-name" required minlength="3" maxlength="30" pattern="^[a-zA-Z0-9_]+$" title="Display name can only contain letters, numbers, and underscores."/>
      <small>Choose a display name (3-30 chars). This will be saved.</small>
    </div>
    <div class="form-field">
      <label for="comment-text-input">Comment:</label>
      <textarea id="comment-text-input" class="js-comment-text" rows="4" required></textarea>
    </div>
    <button type="submit">Submit Comment</button>
  </form>
  <div class="login-prompt js-comment-login-prompt" hidden>
    <p>
      <button type="button" class="link-button js-login-prompt-button">Log in</button>
      to leave a comment.
    </p>
  </div>
`;

class CommentsSection extends HTMLElement {
  static get observedAttributes() {
    return ["page-id", "hidden"];
  }

  constructor() {
    super();
    this.attachShadow({ mode: "open" });
    this.shadowRoot.appendChild(
      commentsSectionTemplate.content.cloneNode(true)
    );

    this._db = null;
    this._commentsCollection = null;
    this._currentUserProfile = null;
    this._currentCommentsListener = null;
    this._currentPageId = "";

    this._commentsList = this.shadowRoot.querySelector(".js-comments-list");
    this._commentForm = this.shadowRoot.querySelector(".js-comment-form");
    this._commentNameField = this.shadowRoot.querySelector(
      ".js-comment-name-field"
    );
    this._nameInput = this.shadowRoot.querySelector(".js-comment-name");
    this._textInput = this.shadowRoot.querySelector(".js-comment-text");
    this._submitButton = this.shadowRoot.querySelector('button[type="submit"]');
    this._commentError = this.shadowRoot.querySelector(".js-comment-error");
    this._commentLoginPrompt = this.shadowRoot.querySelector(
      ".js-comment-login-prompt"
    );
    this._loginPromptButton = this.shadowRoot.querySelector(
      ".js-login-prompt-button"
    );
  }

  _initializeFirebaseServices() {
    if (!this._db) {
      this._db = getFirestore();
      this._commentsCollection = collection(this._db, "comments");
    }
  }

  connectedCallback() {
    this._initializeFirebaseServices();
    this._commentForm.addEventListener(
      "submit",
      this._handleCommentSubmit.bind(this)
    );
    this._loginPromptButton.addEventListener(
      "click",
      this._handleLoginPromptClick.bind(this)
    );
    // Auth state changes are now handled by a global listener in app.js
    // which will then call _handleAuthStateChange on this component instance if it exists.

    const initialPageId = this.getAttribute("page-id");
    if (initialPageId) {
      this._loadCommentsForPage(initialPageId);
    }
    this._updateFormAccess(); // Initial check
  }

  disconnectedCallback() {
    if (this._currentCommentsListener) {
      this._currentCommentsListener(); // Unsubscribe
    }
    // Global event listener removal is handled by app.js or if this element is removed from DOM
  }

  attributeChangedCallback(name, oldValue, newValue) {
    if (name === "page-id" && oldValue !== newValue && newValue) {
      this._loadCommentsForPage(newValue);
    }
    if (name === "hidden") {
      const isHidden = this.hasAttribute("hidden");
      if (isHidden && this._currentCommentsListener) {
        this._currentCommentsListener(); // Unsubscribe
        this._currentCommentsListener = null;
        if (this._commentsList) this._commentsList.innerHTML = ""; // Clear comments
        this._currentPageId = ""; // Reset pageId when hidden
      } else if (
        !isHidden &&
        this._currentPageId &&
        !this._currentCommentsListener
      ) {
        // If unhidden and had a pageId but no listener (e.g. was hidden before)
        this._loadCommentsForPage(this._currentPageId);
      }
    }
  }

  _handleAuthStateChange(event) {
    // This method is now called by app.js
    const { user, profile } = event.detail;
    this._currentUserProfile =
      user && profile ? { uid: user.uid, email: user.email, ...profile } : null;
    this._updateFormAccess();
  }

  _handleLoginPromptClick() {
    // Dispatch an event that app.js (or auth-manager directly if preferred) can listen to
    this.dispatchEvent(
      new CustomEvent("showAuthModal", {
        detail: { form: "login" }, // Request login form
        bubbles: true,
        composed: true,
      })
    );
  }

  _disableCommentForm(message = "Loading...") {
    if (
      !this._commentError ||
      !this._nameInput ||
      !this._textInput ||
      !this._submitButton
    )
      return;
    this._commentError.hidden = true;
    this._nameInput.disabled = true;
    this._textInput.disabled = true;
    this._submitButton.disabled = true;
    this._submitButton.textContent = message;
  }

  _enableCommentForm() {
    // Ensure all elements are cached and available
    if (
      !this._commentForm ||
      !this._commentLoginPrompt ||
      !this._commentNameField ||
      !this._nameInput ||
      !this._textInput ||
      !this._submitButton ||
      !this._commentError
    )
      return;

    if (!this._currentUserProfile) {
      // User not logged in
      this._commentForm.hidden = true;
      this._commentLoginPrompt.hidden = false;
      return;
    }

    // User logged in, but no username (alias) set yet
    if (this._currentUserProfile && !this._currentUserProfile.username) {
      this._commentForm.hidden = false;
      this._commentLoginPrompt.hidden = true;
      this._commentNameField.hidden = false; // Show alias input field
      this._nameInput.required = true;
      this._nameInput.disabled = false;
      this._nameInput.value = ""; // Clear any previous value
      this._textInput.disabled = false;
      this._submitButton.disabled = false;
      this._submitButton.textContent = "Set Alias & Submit";
      return;
    }

    // User logged in and has a username
    if (this._currentUserProfile && this._currentUserProfile.username) {
      this._commentForm.hidden = false;
      this._commentLoginPrompt.hidden = true;
      this._commentNameField.hidden = true; // Hide alias input, it's set
      this._nameInput.required = false;
      this._nameInput.disabled = true;
      this._nameInput.value = this._currentUserProfile.username; // Pre-fill for consistency if ever shown
      this._textInput.disabled = false;
      this._textInput.value = ""; // Clear comment text area
      this._submitButton.disabled = false;
      this._submitButton.textContent = "Submit Comment";
    }
  }

  _updateFormAccess() {
    if (this.hasAttribute("hidden")) return; // Don't update if component is hidden
    this._enableCommentForm(); // Logic is now consolidated here
  }

  _getUserDisplayName(commentData) {
    return escapeHTML(commentData.username || "Anonymous");
  }

  _formatFirebaseTimestamp(firebaseTimestamp) {
    if (!firebaseTimestamp) return "Date unavailable";
    try {
      // Check if it's already a Date object (e.g., from optimistic update)
      if (firebaseTimestamp instanceof Date) {
        return firebaseTimestamp.toLocaleString();
      }
      // Otherwise, assume it's a Firebase Timestamp object
      return firebaseTimestamp.toDate().toLocaleString();
    } catch (e) {
      // Fallback for potential invalid timestamps or if toDate() fails
      console.warn("Error formatting timestamp:", e, firebaseTimestamp);
      return "Processing date...";
    }
  }

  _renderCommentElement(commentData) {
    const formattedDate = this._formatFirebaseTimestamp(commentData.timestamp);
    const displayName = this._getUserDisplayName(commentData);
    return createElement("div", {
      className: "comment",
      children: [
        createElement("div", {
          className: "comment-meta",
          children: [
            createElement("span", {
              className: "comment-author",
              textContent: displayName,
            }),
            createElement("span", {
              className: "comment-date",
              textContent: formattedDate,
            }),
          ],
        }),
        createElement("p", {
          className: "comment-text",
          textContent: escapeHTML(commentData.text), // Ensure text content is escaped
        }),
      ],
    });
  }

  _displayCommentError(message) {
    if (!this._commentError) return;
    this._commentError.textContent = message;
    this._commentError.hidden = false;
  }

  _loadCommentsForPage(pageId) {
    if (!pageId || this.hasAttribute("hidden")) return;
    if (!this._db || !this._commentsCollection)
      this._initializeFirebaseServices();

    this._currentPageId = pageId;
    if (this._commentsList)
      this._commentsList.innerHTML = "<p>Loading comments...</p>"; // Loading state

    // Unsubscribe from previous listener if it exists
    if (this._currentCommentsListener) {
      this._currentCommentsListener();
    }

    const commentsQuery = query(
      this._commentsCollection,
      where("pageId", "==", pageId),
      orderBy("timestamp", "desc")
    );

    this._currentCommentsListener = onSnapshot(
      commentsQuery,
      (snapshot) => {
        // Check if still relevant before updating DOM
        if (
          this._currentPageId !== pageId ||
          this.hasAttribute("hidden") ||
          !this._commentsList
        )
          return;

        if (snapshot.empty) {
          this._commentsList.innerHTML =
            "<p>No comments yet. Be the first!</p>";
        } else {
          this._commentsList.innerHTML = ""; // Clear before re-rendering
          snapshot.docs.forEach((doc) => {
            this._commentsList.appendChild(
              this._renderCommentElement(doc.data())
            );
          });
        }
      },
      (error) => {
        console.error("Error fetching comments:", error);
        if (
          this._currentPageId === pageId &&
          !this.hasAttribute("hidden") &&
          this._commentsList
        ) {
          this._commentsList.innerHTML =
            "<p>Error loading comments. Please try again later.</p>";
        }
      }
    );
    this._updateFormAccess(); // Update form based on current auth state for the new page
  }

  async _handleCommentSubmit(event) {
    event.preventDefault();
    if (!this._db || !this._commentsCollection)
      this._initializeFirebaseServices();
    if (!this._commentError || !this._textInput || !this._nameInput) return;

    this._commentError.hidden = true;

    if (!this._currentUserProfile) {
      this._displayCommentError("You must be logged in to comment.");
      this._handleLoginPromptClick(); // Trigger login modal
      return;
    }
    if (!this._currentPageId) {
      this._displayCommentError("Cannot determine the page for this comment.");
      return;
    }

    let aliasToUse = this._currentUserProfile.username;
    const text = this._textInput.value.trim();

    if (!text) {
      this._displayCommentError("Please enter your comment text.");
      this._textInput.focus();
      return;
    }

    // If user is logged in but has no alias (username), and name field is visible
    if (!aliasToUse && !this._commentNameField.hidden) {
      const inputAlias = this._nameInput.value.trim();
      if (!/^[a-zA-Z0-9_]{3,30}$/.test(inputAlias)) {
        this._displayCommentError(
          "Please enter a valid alias (3-30 chars, letters, numbers, underscores)."
        );
        this._nameInput.focus();
        return;
      }
      // Attempt to set alias via custom event to auth-manager (handled in app.js)
      this._disableCommentForm("Setting alias...");
      this.dispatchEvent(
        new CustomEvent("updateUserAliasAttempt", {
          detail: { uid: this._currentUserProfile.uid, alias: inputAlias },
          bubbles: true,
          composed: true,
        })
      );
      // After event, authStateChanged should update _currentUserProfile.
      // We'll proceed with comment submission if alias is successfully set (handled by _updateFormAccess and subsequent submit).
      // This means user might need to click "Submit" again after alias is set.
      // A more seamless UX would await a confirmation event or directly call submit from auth manager.
      // For now, let's assume they need to re-submit if alias was just set.
      // A better flow: if alias set successful, then _updateFormAccess enables form correctly, then user clicks submit.
      // Or, if alias update is synchronous or returns a promise, we can chain.
      // The current event-driven model means we might need to tell user to retry submit.
      // Let's assume for now the user profile updates and they can click submit again.
      // To make it more direct:
      try {
        // This event needs to be handled by app.js which calls auth-manager
        // For directness here, we'd need a direct call or promise from auth-manager
        // This is a limitation of component communication without direct refs or event bus with callbacks.
        // For now, this event signals the intent. The user might need to click submit again.
        // If the alias update is successful, `_currentUserProfile` will update, and `_updateFormAccess` will reconfigure the form.
        // The problem is that this function might complete before `_currentUserProfile` is updated.
        // Let's assume alias must be set BEFORE trying to comment with it if it's missing.
        // So, if no alias, this handler should focus on setting alias only.
        // The _updateFormAccess should then correctly enable the form for actual comment submission.

        // Let's refine: if alias field is visible, it means we need to set it.
        // We'll dispatch the event. The actual comment submission will happen on a *subsequent* click
        // once the alias is set and the form state updates.
        // So, if we are in "Set Alias & Submit" mode, this first click is *just* for alias.
        if (this._submitButton.textContent === "Set Alias & Submit") {
          // Wait for authStateChanged or a custom event indicating alias update success
          return; // Don't submit comment yet
        }
      } catch (e) {
        this._displayCommentError(
          e.message || "Could not save alias. Please try again."
        );
        this._enableCommentForm(); // Re-enable form on failure
        return;
      }
    }
    // If we reach here, user is logged in and alias is set (either pre-existing or just set)
    aliasToUse = this._currentUserProfile.username; // Ensure we use the latest
    if (!aliasToUse) {
      this._displayCommentError(
        "Alias not set. Please set an alias and try again."
      );
      this._updateFormAccess(); // This should show the alias field
      return;
    }

    this._disableCommentForm("Submitting...");

    try {
      await addDoc(this._commentsCollection, {
        userId: this._currentUserProfile.uid,
        username: aliasToUse, // Use the confirmed alias
        text: text,
        pageId: this._currentPageId,
        timestamp: serverTimestamp(),
      });
      this._textInput.value = ""; // Clear text input on success
      this._enableCommentForm(); // Re-enable for next comment
    } catch (error) {
      console.error("Error adding comment: ", error);
      this._displayCommentError("Failed to submit comment. Please try again.");
      this._enableCommentForm(); // Re-enable form on failure
    }
  }

  set pageId(id) {
    if (id) {
      this.setAttribute("page-id", id);
    } else {
      this.removeAttribute("page-id");
    }
  }

  get pageId() {
    return this.getAttribute("page-id");
  }
}

customElements.define("comments-section", CommentsSection);

export function initializeComments() {
  // Ensure the component is defined.
  if (!customElements.get("comments-section")) {
    customElements.define("comments-section", CommentsSection);
  }
}

// This function is now primarily for app.js to call if it directly manages auth state updates to components.
export function updateCommentsUIForAuthState(user, profile) {
  const commentsSectionEl = document.querySelector("comments-section");
  if (commentsSectionEl) {
    // Pass the auth state down to the component instance
    commentsSectionEl._currentUserProfile =
      user && profile ? { uid: user.uid, email: user.email, ...profile } : null;
    commentsSectionEl._updateFormAccess();
  }
}
