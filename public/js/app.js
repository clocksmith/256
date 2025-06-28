import { initializeApp } from "https://www.gstatic.com/firebasejs/10.12.2/firebase-app.js";
import { getAnalytics } from "https://www.gstatic.com/firebasejs/10.12.2/firebase-analytics.js";

const firebaseConfig = {
  apiKey: "AIzaSyDSvRy1Z6RHz_fKps1S3kAPumhzHfqtglw",
  authDomain: "one256.firebaseapp.com",
  projectId: "one256",
  storageBucket: "one256.firebasestorage.app",
  messagingSenderId: "683912546251",
  appId: "1:683912546251:web:854db11e0be2e88543584e",
  measurementId: "G-YB39MX1ER4",
};

const firebaseApp = initializeApp(firebaseConfig);
const analytics = getAnalytics(firebaseApp);

import "./theme.js";
import "./auth.js";
import "./comments.js";
import { initializeRouter } from "./router.js";
import { $, $$, createElement } from "./utils.js";

let bibliographySheetVisible = false;
let currentSheetCloseHandler = null;
let currentSheetScrollHandler = null;
let currentSheetKeydownHandler = null;
let bibliographySheetElement = null;

function debounce(func, wait) {
  let timeout;
  return function executedFunction(...args) {
    const later = () => {
      clearTimeout(timeout);
      func(...args);
    };
    clearTimeout(timeout);
    timeout = setTimeout(later, wait);
  };
}

function _createBibliographySheetDOM() {
  if (document.getElementById("bibliographyPreviewSheet")) {
    bibliographySheetElement = document.getElementById(
      "bibliographyPreviewSheet"
    );
    return bibliographySheetElement;
  }

  const sheet = document.createElement("div");
  sheet.className = "bibliography-preview-sheet";
  sheet.id = "bibliographyPreviewSheet";
  sheet.setAttribute("role", "dialog");
  sheet.setAttribute("aria-modal", "true");
  sheet.setAttribute("aria-hidden", "true");
  sheet.setAttribute("aria-labelledby", "bibPreviewSheetTitle");

  const contentDiv = document.createElement("div");
  contentDiv.className = "bibliography-preview-sheet-content";

  const closeButton = document.createElement("button");
  closeButton.className =
    "bibliography-preview-sheet-close js-bib-preview-close";
  closeButton.setAttribute("aria-label", "Close bibliography preview");
  closeButton.innerHTML = "×";

  const titleH3 = document.createElement("h3");
  titleH3.id = "bibPreviewSheetTitle";
  titleH3.className = "visually-hidden";
  titleH3.textContent = "Bibliography Reference";

  const itemContainer = document.createElement("div");
  itemContainer.className =
    "bibliography-preview-item-container js-bib-preview-item-container";

  contentDiv.appendChild(closeButton);
  contentDiv.appendChild(titleH3);
  contentDiv.appendChild(itemContainer);
  sheet.appendChild(contentDiv);

  document.body.appendChild(sheet);
  bibliographySheetElement = sheet;
  return sheet;
}

function getBibliographyItemContent(targetLi) {
  if (!targetLi) return null;
  const clone = targetLi.cloneNode(true);
  clone.removeAttribute("id");

  // First, find the label using textContent, which ignores the <a> tag
  const labelMatch = clone.textContent.match(/^(\s*\[\d+\]\s*)/);
  const label = labelMatch ? labelMatch[0] : "";

  // Now, use the found label to correctly split the innerHTML
  let contentHTML = clone.innerHTML;
  if (label) {
    // We need to remove the anchor AND the label from the start of the innerHTML
    const anchorAndLabelRegex = new RegExp(
      `^<a id="source-\\d+"><\\/a>\\s*${label
        .trim()
        .replace("[", "\\[")
        .replace("]", "\\]")}\\s*`
    );
    contentHTML = contentHTML.replace(anchorAndLabelRegex, "");
  }

  return { label: label.trim(), contentHTML };
}

function showBibliographyPreviewSheet(targetId) {
  if (!bibliographySheetElement) {
    _createBibliographySheetDOM(); // Ensure DOM exists
    if (!bibliographySheetElement) {
      // Double check after creation
      console.error("Bibliography preview sheet DOM could not be created.");
      return;
    }
  }

  const container = bibliographySheetElement.querySelector(
    ".js-bib-preview-item-container"
  );
  const closeButton = bibliographySheetElement.querySelector(
    ".js-bib-preview-close"
  );

  if (!container || !closeButton) {
    console.error("Bibliography preview sheet inner elements not found.");
    return;
  }

  const mainContentArea = $(".js-main-content-area");
  const pageFormat = mainContentArea.dataset.pageFormat || "full";
  const basePath = mainContentArea.dataset.basePath || "";

  const targetLi = document.querySelector(targetId);
  if (!targetLi) {
    console.warn(`Target LI element for ID ${targetId} not found.`);
    return;
  }

  container.innerHTML = "";

  const itemsToShow = [];
  const prevLi = targetLi.previousElementSibling;
  const nextLi = targetLi.nextElementSibling;

  if (prevLi && prevLi.tagName === "LI") {
    const prevContent = getBibliographyItemContent(prevLi);
    if (prevContent) itemsToShow.push({ ...prevContent, type: "context" });
  }

  const currentContent = getBibliographyItemContent(targetLi);
  if (currentContent) itemsToShow.push({ ...currentContent, type: "current" });

  if (nextLi && nextLi.tagName === "LI") {
    const nextContent = getBibliographyItemContent(nextLi);
    if (nextContent) itemsToShow.push({ ...nextContent, type: "context" });
  }

  if (itemsToShow.length === 0) return;

  itemsToShow.forEach((itemData) => {
    const itemDiv = document.createElement("div");
    itemDiv.classList.add("bib-item");
    if (itemData.type === "current") itemDiv.classList.add("current-bib-item");
    if (itemData.type === "context") itemDiv.classList.add("context-bib-item");

    let innerHTML = "";
    if (itemData.label) {
      innerHTML += `<span class="bib-item-label">${itemData.label.trim()}</span>`;
    }
    innerHTML += `<span class="bib-item-content">${itemData.contentHTML}</span>`;
    itemDiv.innerHTML = innerHTML;

    // Add contextual drill-down link
    if (itemData.type === "current" && basePath) {
      const sourceNumber = targetId.replace("#source-", "");
      let contextLink;
      if (pageFormat === "quick") {
        contextLink = createElement("a", {
          href: `${basePath}.4x4x4.html#source-${sourceNumber}`,
          textContent: "[View in Medium Article]",
          className: "context-link",
          "data-route": true, // To make the router handle it
        });
      } else if (pageFormat === "medium") {
        contextLink = createElement("a", {
          href: `${basePath}.html#source-${sourceNumber}`,
          textContent: "[View in Full Article]",
          className: "context-link",
          "data-route": true, // To make the router handle it
        });
      }
      if (contextLink) {
        itemDiv.appendChild(contextLink);
      }
    }

    container.appendChild(itemDiv);
  });

  bibliographySheetElement.classList.add("visible");
  bibliographySheetElement.setAttribute("aria-hidden", "false");
  bibliographySheetVisible = true;
  closeButton.focus();

  // Clean up old handlers before adding new ones
  if (currentSheetCloseHandler)
    document.removeEventListener("click", currentSheetCloseHandler, {
      capture: true,
    });
  if (currentSheetScrollHandler)
    window.removeEventListener("scroll", currentSheetScrollHandler);
  if (currentSheetKeydownHandler)
    document.removeEventListener("keydown", currentSheetKeydownHandler);

  currentSheetCloseHandler = (e) => {
    if (
      !bibliographySheetElement.contains(e.target) &&
      e.target !== document.querySelector(`a[href="${targetId}"]`)
    ) {
      hideBibliographyPreviewSheet();
    }
  };
  currentSheetScrollHandler = debounce(() => {
    if (bibliographySheetVisible) hideBibliographyPreviewSheet();
  }, 50);

  currentSheetKeydownHandler = (e) => {
    if (e.key === "Escape" && bibliographySheetVisible) {
      hideBibliographyPreviewSheet();
    }
  };

  setTimeout(() => {
    // Add new handlers after a brief delay to avoid immediate self-closing
    document.addEventListener("click", currentSheetCloseHandler, {
      capture: true,
    });
    window.addEventListener("scroll", currentSheetScrollHandler);
    document.addEventListener("keydown", currentSheetKeydownHandler);
  }, 0);

  closeButton.onclick = hideBibliographyPreviewSheet;
}

function hideBibliographyPreviewSheet() {
  if (!bibliographySheetElement || !bibliographySheetVisible) return;

  bibliographySheetElement.classList.remove("visible");
  bibliographySheetElement.setAttribute("aria-hidden", "true");
  bibliographySheetVisible = false;

  if (currentSheetCloseHandler)
    document.removeEventListener("click", currentSheetCloseHandler, {
      capture: true,
    });
  if (currentSheetScrollHandler)
    window.removeEventListener("scroll", currentSheetScrollHandler);
  if (currentSheetKeydownHandler)
    document.removeEventListener("keydown", currentSheetKeydownHandler);

  currentSheetCloseHandler = null;
  currentSheetScrollHandler = null;
  currentSheetKeydownHandler = null;
}

function newHandleCitationClick(e) {
  const targetLink = e.currentTarget; // Use currentTarget to ensure it's the subscribed element
  const targetId = targetLink.getAttribute("href");

  if (targetId && targetId.startsWith("#source-")) {
    e.preventDefault();

    if (!bibliographySheetElement) {
      _createBibliographySheetDOM();
    }

    // If sheet is visible and target is different, hide first, then show new
    if (
      bibliographySheetVisible &&
      bibliographySheetElement.dataset.currentTargetId !== targetId
    ) {
      hideBibliographyPreviewSheet();
      // Use a short timeout to ensure hide transition completes before show
      setTimeout(() => {
        if (bibliographySheetElement)
          bibliographySheetElement.dataset.currentTargetId = targetId;
        showBibliographyPreviewSheet(targetId);
      }, 50); // A small delay, adjust if needed
    } else if (!bibliographySheetVisible) {
      // If sheet is not visible, just show it
      if (bibliographySheetElement)
        bibliographySheetElement.dataset.currentTargetId = targetId;
      showBibliographyPreviewSheet(targetId);
    }
    // If sheet is visible and target is the same, do nothing (it's already showing the correct one)
  }
}

function setFooterYear() {
  const yearSpan = $(".js-current-year");
  if (yearSpan) {
    yearSpan.textContent = new Date().getFullYear();
  }
}

function updateIframeThemes() {
  const currentTheme = document.body.classList.contains("light-mode")
    ? "light"
    : "dark";
  $$("iframe.js-component-iframe").forEach((iframe) => {
    const currentSrc = iframe.getAttribute("src");
    if (!currentSrc) return;
    try {
      const url = new URL(currentSrc, window.location.origin);
      url.searchParams.set("theme", currentTheme);
      if (iframe.getAttribute("src") !== url.pathname + url.search) {
        iframe.setAttribute("src", url.pathname + url.search);
      }
    } catch (e) {
      console.error("Error updating iframe theme URL:", e, currentSrc);
    }
  });
}

function observeContentChangesAndInitializePageScripts() {
  const mainContentArea = $(".js-main-content-area");
  if (!mainContentArea) return;

  const runPageSpecificScripts = () => {
    updateIframeThemes();
    initializeCitationLinkHighlighter();
  };

  runPageSpecificScripts(); // Run once on initial load

  const observer = new MutationObserver((mutationsList) => {
    for (let mutation of mutationsList) {
      if (mutation.type === "childList" && mutation.addedNodes.length > 0) {
        runPageSpecificScripts(); // Re-run when content changes
        break;
      }
    }
  });
  observer.observe(mainContentArea, { childList: true, subtree: true });
}

function initializeCitationLinkHighlighter() {
  const mainContentArea = $(".js-main-content-area");
  if (!mainContentArea) return;

  // Detach old listeners before attaching new ones to prevent duplicates
  const oldCitationLinks = mainContentArea.querySelectorAll(
    'article a[href^="#source-"].js-bib-link-processed'
  );
  oldCitationLinks.forEach((link) => {
    link.removeEventListener("click", newHandleCitationClick);
    link.classList.remove("js-bib-link-processed");
  });

  const citationLinks = mainContentArea.querySelectorAll(
    'article a[href^="#source-"]:not(.js-bib-link-processed)'
  );
  citationLinks.forEach((link) => {
    link.addEventListener("click", newHandleCitationClick);
    link.classList.add("js-bib-link-processed");
  });

  const oldTocLinks = mainContentArea.querySelectorAll(
    'article .toc a[href^="#"].js-toc-link-processed'
  );
  oldTocLinks.forEach((link) => {
    link.removeEventListener("click", handleTocClick);
    link.classList.remove("js-toc-link-processed");
  });

  const tocLinks = mainContentArea.querySelectorAll(
    'article .toc a[href^="#"]:not(.js-toc-link-processed)'
  );
  tocLinks.forEach((link) => {
    link.addEventListener("click", handleTocClick);
    link.classList.add("js-toc-link-processed");
  });
}

function handleTocClick(e) {
  e.preventDefault();
  const targetId = this.getAttribute("href");
  const targetElement = document.querySelector(targetId);
  if (targetElement) {
    const headerOffset =
      parseFloat(
        getComputedStyle(document.documentElement).getPropertyValue(
          "--header-height"
        )
      ) || 60;
    const elementPosition = targetElement.getBoundingClientRect().top;
    const offsetPosition =
      elementPosition + window.pageYOffset - headerOffset - 10; // Added 10px padding
    window.scrollTo({ top: offsetPosition, behavior: "smooth" });
  }
}

function setupGlobalEventListeners() {
  const authStatusMessage = $(".js-auth-status-message");
  const userDisplayAliasElement = $(".js-user-display-alias");
  const loginShowButton = $(".js-login-show-button");
  const logoutButton = $(".js-logout-button");

  const authManager = document.querySelector("auth-manager");

  loginShowButton?.addEventListener("click", () => {
    if (authManager && typeof authManager.showLoginModal === "function") {
      authManager.showLoginModal();
    } else {
      console.error("auth-manager not ready or showLoginModal not available");
    }
  });

  logoutButton?.addEventListener("click", async () => {
    if (authManager && typeof authManager.doSignOut === "function") {
      await authManager.doSignOut();
    } else {
      console.error("auth-manager not ready or doSignOut not available");
    }
  });

  document.addEventListener("authStateChanged", (e) => {
    const { user, profile } = e.detail;
    if (
      authStatusMessage &&
      userDisplayAliasElement &&
      logoutButton &&
      loginShowButton
    ) {
      if (user && profile && profile.username) {
        userDisplayAliasElement.textContent = `Logged in as ${profile.username}`;
        userDisplayAliasElement.hidden = false;
        authStatusMessage.hidden = true;
        logoutButton.hidden = false;
      } else {
        userDisplayAliasElement.hidden = true;
        authStatusMessage.hidden = false;
        logoutButton.hidden = true;
      }
    }
    const commentsSection = document.querySelector("comments-section");
    if (
      commentsSection &&
      typeof commentsSection._handleAuthStateChange === "function"
    ) {
      commentsSection._handleAuthStateChange(e);
    }
  });

  document.addEventListener("themeChanged", () => {
    updateIframeThemes();
  });

  // Listen for custom event to show auth modal (e.g., from comments section)
  document.addEventListener("showAuthModal", (e) => {
    if (authManager && typeof authManager.showModal === "function") {
      authManager.showModal(e.detail?.form || "login");
    } else {
      console.error(
        "auth-manager not ready or showModal not available for custom event"
      );
    }
  });

  // Listen for custom event to update user alias (e.g., from comments section first comment)
  document.addEventListener("updateUserAliasAttempt", async (e) => {
    const { uid, alias } = e.detail;
    if (
      authManager &&
      typeof authManager._updateUserAlias === "function" &&
      typeof authManager._getUserProfile === "function" &&
      typeof authManager._emitAuthStateChange === "function" &&
      authManager._auth // Check if _auth exists
    ) {
      try {
        await authManager._updateUserAlias(uid, alias);
        const updatedProfile = await authManager._getUserProfile(uid);
        if (authManager._auth.currentUser) {
          // Check if currentUser exists
          authManager._emitAuthStateChange(
            authManager._auth.currentUser,
            updatedProfile
          );
        }
      } catch (error) {
        console.error(
          "Failed to update alias from app.js via auth-manager:",
          error
        );
        // Optionally, notify the comments section of the failure
        const commentsSection = document.querySelector("comments-section");
        if (
          commentsSection &&
          typeof commentsSection._displayCommentError === "function"
        ) {
          commentsSection._displayCommentError(
            error.message ||
              "Could not save alias from app.js. Please try again."
          );
        }
      }
    } else {
      console.error(
        "AuthManager or required methods/_auth instance not available for alias update."
      );
    }
  });
}

document.addEventListener("DOMContentLoaded", () => {
  initializeRouter();
  setFooterYear();
  _createBibliographySheetDOM();
  observeContentChangesAndInitializePageScripts();
  setupGlobalEventListeners();
});

document.addEventListener("onRouteChange", () => {
  // These need to run *after* new content is loaded by the router
  initializeCitationLinkHighlighter();
  updateIframeThemes();
});