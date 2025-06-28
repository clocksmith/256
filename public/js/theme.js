const themeToggleButtonTemplate = document.createElement("template");
themeToggleButtonTemplate.innerHTML = `
  <style>
    :host {
      display: inline-block;
    }
    button {
      background-color: transparent;
      color: var(--text-color, #e0e0e0); /* Fallback color */
      border: 1px solid var(--border-color, #4d4d4d); /* Fallback border */
      border-radius: var(--border-radius-medium, 0.5rem);
      width: 30px;
      height: 30px;
      font-size: 1rem;
      display: flex;
      align-items: center;
      justify-content: center;
      cursor: pointer;
      padding: 0;
      transition: transform var(--transition-duration-fast, 0.16s) ease,
        background-color var(--transition-duration-slow, 0.5s) ease,
        color var(--transition-duration-slow, 0.5s) ease,
        border-color var(--transition-duration-slow, 0.5s) ease;
      overflow: hidden;
      position: relative;
      flex-shrink: 0;
    }
    button:hover {
      border-color: var(--accent-gradient-current-start, #0CF); /* Fallback accent */
      color: var(--accent-gradient-current-start, #0CF);
    }
    button:focus-visible {
        outline: 2px solid transparent;
        outline-offset: 2px;
        box-shadow: var(--focus-ring, 0 0 0 3px rgba(0, 255, 0, 0.5)); /* Fallback focus */
        border-radius: var(--border-radius-small, 0.25rem);
        border-color: var(--accent-gradient-current-start, #0CF);
    }
    span {
      display: inline-block;
      transition: transform var(--transition-duration-medium, 0.3s) ease,
        opacity var(--transition-duration-medium, 0.3s) ease;
    }
    .icon-light, .icon-dark {
      position: absolute;
    }
    .icon-light {
      transform: translateY(-150%);
      opacity: 0;
    }
    .icon-dark {
      transform: translateY(0);
      opacity: 1;
    }
    :host([theme="light"]) .icon-light {
      transform: translateY(0);
      opacity: 1;
    }
    :host([theme="light"]) .icon-dark {
      transform: translateY(150%);
      opacity: 0;
    }
  </style>
  <button aria-label="Toggle theme" aria-pressed="false">
    <span class="icon-light" aria-hidden="true">☼</span>
    <span class="icon-dark" aria-hidden="true">☾</span>
  </button>
`;

class ThemeToggleButton extends HTMLElement {
  constructor() {
    super();
    this.attachShadow({ mode: "open" });
    this.shadowRoot.appendChild(
      themeToggleButtonTemplate.content.cloneNode(true)
    );
    this._button = this.shadowRoot.querySelector("button");
  }

  connectedCallback() {
    this._button.addEventListener("click", this._toggleTheme.bind(this));
    this._initializeTheme();
  }

  disconnectedCallback() {
    this._button.removeEventListener("click", this._toggleTheme.bind(this));
  }

  _setTheme(theme) {
    const isLight = theme === "light";
    document.body.classList.toggle("light-mode", isLight);
    document.body.classList.toggle("dark-mode", !isLight); // Ensure dark-mode is off if light is on
    this.setAttribute("theme", theme); // Reflect state on the custom element
    this._button.setAttribute("aria-pressed", isLight.toString());
    this._button.setAttribute(
      "aria-label",
      isLight ? "Switch to Dark Mode" : "Switch to Light Mode"
    );
    localStorage.setItem("theme", theme);
    // Dispatch event for other components (like iframes, ia-grid) to listen to
    document.dispatchEvent(
      new CustomEvent("themeChanged", { detail: { theme } })
    );
  }

  _toggleTheme() {
    const currentTheme = document.body.classList.contains("light-mode")
      ? "dark" // If light, switch to dark
      : "light"; // If dark (or no theme class), switch to light
    this._setTheme(currentTheme);
  }

  _initializeTheme() {
    const savedTheme = localStorage.getItem("theme");
    const prefersLight =
      window.matchMedia?.("(prefers-color-scheme: light)")?.matches ?? false;
    // Default to dark unless saved or prefers light
    const initialTheme = savedTheme || (prefersLight ? "light" : "dark");
    this._setTheme(initialTheme);
  }
}

customElements.define("theme-toggle-button", ThemeToggleButton);

// Exporting this function allows app.js to ensure the component is defined before use if needed,
// though defining it here should make it available globally.
export function initializeTheme() {
  if (!customElements.get("theme-toggle-button")) {
    customElements.define("theme-toggle-button", ThemeToggleButton);
  }
}
