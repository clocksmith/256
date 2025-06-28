export const $ = (selector, parent = document) =>
  parent.querySelector(selector);

export const $$ = (selector, parent = document) =>
  Array.from(parent.querySelectorAll(selector));

export const clamp = (num, min, max) => Math.min(Math.max(num, min), max);

export const oklchToCss = (l, c, h) => `oklch(${l * 100}% ${c} ${h})`; // l is 0-1

export function createElement(tag, options = {}) {
  const el = document.createElement(tag);
  Object.entries(options).forEach(([key, value]) => {
    if (key === "textContent") el.textContent = value;
    else if (key === "innerHTML") el.innerHTML = value;
    else if (key === "className") el.className = value;
    else if (key === "id") el.id = value;
    else if (key === "children" && Array.isArray(value)) {
      value.forEach((child) => child && el.appendChild(child));
    } else if (key === "style" && typeof value === "object") {
      Object.assign(el.style, value);
    } else if (key === "dataset" && typeof value === "object") {
      Object.entries(value).forEach(
        ([dataKey, dataValue]) => (el.dataset[dataKey] = dataValue)
      );
    } else if (key === "aria" && typeof value === "object") {
      // For aria attributes
      Object.entries(value).forEach(([ariaKey, ariaValue]) =>
        el.setAttribute(`aria-${ariaKey}`, ariaValue)
      );
    }
    // Handle boolean attributes correctly
    else if (typeof value === "boolean" && value) el.setAttribute(key, "");
    else if (
      value !== null &&
      value !== undefined &&
      typeof value !== "boolean" &&
      key !== "aria" // Ensure aria isn't doubly processed
    ) {
      el.setAttribute(key, value);
    }
    // Attributes with false boolean value should not be set (unless explicitly needed, which is rare)
  });
  return el;
}

export function debounce(func, wait) {
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

export function escapeHTML(str) {
  if (str === null || typeof str === "undefined") return "";
  if (typeof str !== "string") str = String(str);

  return str.replace(/[&<>"']/g, function (match) {
    switch (match) {
      case "&":
        return "&amp;";
      case "<":
        return "&lt;";
      case ">":
        return "&gt;";
      case '"':
        return "&quot;";
      case "'":
        return "&#39;"; // or &apos;
      default:
        return match;
    }
  });
}
