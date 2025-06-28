import { $, createElement, escapeHTML } from "./utils.js";

const mainContentArea = $(".js-main-content-area");
const pageTitleElement = document.querySelector("title");
const siteTitleBase = "256.1"; // Define your site's base title
const commentsComponent = $("comments-section"); // Get reference to comments component

let siteRoutesConfig = {}; // To be loaded from routes.json
let sitePostsForHomepage = []; // Derived from routesConfig for the homepage
const contentCache = new Map(); // Cache for fetched content

async function loadInitialData() {
  try {
    // Use a cache-busting query param for routes.json
    const routesResponse = await fetch("/js/routes.json?t=" + Date.now());
    if (!routesResponse.ok) {
      throw new Error(`HTTP error! status: ${routesResponse.status}`);
    }
    siteRoutesConfig = await routesResponse.json();
    derivePostsForHomepage(); // Process routes to get posts for homepage
  } catch (error) {
    console.error("Failed to load routes.json:", error);
    if (mainContentArea)
      mainContentArea.innerHTML =
        "<article><h2>Initialization Error</h2><p>Could not load site navigation data. Please try refreshing.</p></article>";
    siteRoutesConfig = {}; // Ensure it's an empty object on failure
    sitePostsForHomepage = []; // Ensure empty array on failure
  }
}

function derivePostsForHomepage() {
  sitePostsForHomepage = []; // Reset
  if (!siteRoutesConfig || Object.keys(siteRoutesConfig).length === 0) return;

  const tempPosts = [];
  for (const pathKey in siteRoutesConfig) {
    const routeInfo = siteRoutesConfig[pathKey];
    // Check for 'post' type, numeric key format, and ensure it's not an alias
    if (
      routeInfo.type === "post" &&
      pathKey.match(/^\/\d+$/) && // e.g. /1, /23
      parseInt(pathKey.substring(1)) > 0 && // Numeric key > 0
      !routeInfo.isAlias // Explicitly check if it's not marked as an alias
    ) {
      tempPosts.push({
        numericKey: parseInt(pathKey.substring(1)),
        title: routeInfo.title,
        date: routeInfo.date, // Expecting YYYY-MM-DD
        url: routeInfo.namedPath || pathKey, // Prefer namedPath for the link
        file: routeInfo.file,
      });
    }
  }
  // Sort posts: newest first (by date), then by numericKey ascending as a tie-breaker
  tempPosts.sort((a, b) => {
    if (a.date && b.date) {
      const dateComparison = new Date(b.date) - new Date(a.date); // Descending date
      if (dateComparison !== 0) return dateComparison;
    }
    return a.numericKey - b.numericKey; // Ascending numeric key
  });
  sitePostsForHomepage = tempPosts;
}

async function fetchContent(filePath) {
  const cacheKey = filePath;
  if (contentCache.has(cacheKey)) {
    return contentCache.get(cacheKey);
  }
  try {
    const response = await fetch(filePath + "?t=" + Date.now()); // Cache-bust content files too
    if (!response.ok) {
      console.warn(`Failed to fetch ${filePath}, attempting 404 page.`);
      // If a specific format fails, try falling back to the default format.
      if (filePath.includes(".4x4x4.") || filePath.includes(".4x2x2.")) {
        const defaultFilePath = filePath.replace(
          /\.(4x4x4|4x2x2)\.html$/,
          ".html"
        );
        console.warn(`Attempting fallback to default file: ${defaultFilePath}`);
        return await fetchContent(defaultFilePath); // Recursive call to fetch default
      }
      return await fetchContentForErrorPage(); // If default also fails, show 404
    }
    const text = await response.text();
    // Check if the fetched content is a full HTML page or just a fragment
    const isFullHtmlPage =
      text.trim().toLowerCase().startsWith("<!doctype") ||
      text.trim().toLowerCase().startsWith("<html");

    if (isFullHtmlPage) {
      // Attempt to extract <article>, <main>, or first <body> child
      const tempDiv = document.createElement("div");
      tempDiv.innerHTML = text;
      const articleContent = tempDiv.querySelector("article");
      const mainContent = tempDiv.querySelector("main"); // Standard main tag
      const bodyDivContent = tempDiv.querySelector("body > div:first-of-type"); // Common pattern for simple pages

      let extractedContent =
        articleContent?.outerHTML ||
        mainContent?.innerHTML ||
        bodyDivContent?.innerHTML ||
        tempDiv.querySelector("body")?.innerHTML || // Last resort: full body content
        "<p>Error: Could not extract meaningful content from full HTML page.</p>";

      contentCache.set(cacheKey, extractedContent);
      return extractedContent;
    } else {
      // Assume it's an HTML fragment (e.g., just the <article> content)
      contentCache.set(cacheKey, text);
      return text;
    }
  } catch (error) {
    console.error(`Failed to fetch content for ${filePath}:`, error);
    return await fetchContentForErrorPage(); // Fetch and return 404 content on any error
  }
}

async function fetchContentForErrorPage() {
  const errorRouteInfo = siteRoutesConfig["/404"];
  const errorPageFile = errorRouteInfo ? errorRouteInfo.file : "/0x/404.html"; // Default fallback
  const cacheKey = errorPageFile; // Cache the 404 page itself

  if (contentCache.has(cacheKey)) {
    return contentCache.get(cacheKey);
  }
  try {
    const response = await fetch(errorPageFile + "?t=" + Date.now());
    if (!response.ok)
      throw new Error("404 page itself not found at " + errorPageFile);
    const text = await response.text();
    // Extract content from the 404 HTML page similarly
    const tempDiv = document.createElement("div");
    tempDiv.innerHTML = text;
    const articleContent = tempDiv.querySelector("article"); // Prefer article
    const extracted =
      articleContent?.outerHTML ||
      tempDiv.querySelector("body")?.innerHTML || // Fallback to body
      "<p>Error: Could not extract error page content.</p>";
    contentCache.set(cacheKey, extracted);
    return extracted;
  } catch (e) {
    console.error("Failed to fetch designated 404 page:", e);
    return "<article><h2>Error Loading Content</h2><p>Sorry, the requested content could not be loaded, and the error page is also unavailable.</p></article>";
  }
}

function updatePageTitle(routeInfo, pathForLookup) {
  if (!pageTitleElement) return;
  let titleToDisplay = siteTitleBase;

  if (routeInfo && routeInfo.title) {
    if (routeInfo.type === "homepage") {
      // Or pathForLookup === "/"
      titleToDisplay = routeInfo.title; // Homepage title might be different
    } else {
      titleToDisplay = `${routeInfo.title} | ${siteTitleBase}`;
    }
  } else if (pathForLookup === "/") {
    // Explicit check for homepage if routeInfo is somehow null for "/"
    titleToDisplay = siteRoutesConfig["/"]?.title || siteTitleBase;
  } else {
    // If no routeInfo, assume 404
    titleToDisplay = `Page Not Found | ${siteTitleBase}`;
  }
  pageTitleElement.textContent = titleToDisplay;
}

function renderHomepagePostList() {
  if (!sitePostsForHomepage || sitePostsForHomepage.length === 0) {
    return "<article><h2>Welcome!</h2><p>No posts yet. Check back soon!</p></article>";
  }

  const listHtml = sitePostsForHomepage
    .map((post) => {
      const dateHtml = post.date
        ? `<p class="post-meta"><time datetime="${escapeHTML(
            post.date
          )}">${escapeHTML(
            new Date(post.date + "T00:00:00").toLocaleDateString("en-US", {
              // Ensure correct date parsing
              year: "numeric",
              month: "long",
              day: "numeric",
            })
          )}</time></p>`
        : "";
      return `
        <li class="homepage-post-item">
            <h3><a href="${escapeHTML(post.url)}" data-route>${escapeHTML(
        post.title
      )}</a></h3>
            ${dateHtml}
            <div class="format-links">
                View: 
                <a href="${escapeHTML(post.url)}" data-route>8x8x4 (Full)</a>
                <a href="${escapeHTML(
                  post.url
                )}?format=medium" data-route>4x4x4 (Medium)</a>
                <a href="${escapeHTML(
                  post.url
                )}?format=quick" data-route>4x2x2 (Quick)</a>
            </div>
        </li>`;
    })
    .join("");

  return `
        <section class="homepage-list">
            <h2>Latest Posts</h2>
            <ul class="homepage-post-list">
                ${listHtml}
            </ul>
        </section>
    `;
}

function createFormatSelectorHTML(basePath, activeFormat) {
  const formats = [
    { key: "full", label: "8x8x4 (Full)", href: basePath },
    {
      key: "medium",
      label: "4x4x4 (Medium)",
      href: `${basePath}?format=medium`,
    },
    { key: "quick", label: "4x2x2 (Quick)", href: `${basePath}?format=quick` },
  ];

  const linksHTML = formats
    .map((format) => {
      if (format.key === activeFormat) {
        return `<span class="active-format">${escapeHTML(format.label)}</span>`;
      }
      return `<a href="${escapeHTML(format.href)}" data-route>${escapeHTML(
        format.label
      )}</a>`;
    })
    .join("\n");

  return `
    <div class="format-selector">
        <strong>View Format:</strong>
        ${linksHTML}
    </div>
    `;
}

function constructFormattedFilePath(baseFile, format) {
  if (format === "full" || !baseFile || !baseFile.endsWith(".html")) {
    return baseFile;
  }
  const formatMap = {
    medium: "4x4x4",
    quick: "4x2x2",
  };
  const formatString = formatMap[format];
  if (!formatString) {
    return baseFile; // Fallback to default if format is unknown
  }
  return baseFile.replace(/\.html$/, `.${formatString}.html`);
}

async function loadPage(path) {
  // Normalize path and extract format
  const url = new URL(path, window.location.origin);
  let pathForLookup = url.pathname;
  if (pathForLookup.length > 1 && pathForLookup.endsWith("/")) {
    pathForLookup = pathForLookup.slice(0, -1);
  }
  pathForLookup = pathForLookup || "/";
  const format = url.searchParams.get("format") || "full";

  if (mainContentArea) mainContentArea.style.opacity = "0"; // Start fade out
  if (commentsComponent) {
    commentsComponent.hidden = true;
    commentsComponent.pageId = "";
  }

  let htmlContent;
  const routeInfo = siteRoutesConfig[pathForLookup];
  let currentRouteInfoForTitle = routeInfo;
  let effectivePageIdForComments = pathForLookup;

  if (pathForLookup === "/") {
    htmlContent = renderHomepagePostList();
  } else if (routeInfo && routeInfo.file) {
    const formattedFilePath = constructFormattedFilePath(
      routeInfo.file,
      format
    );
    htmlContent = await fetchContent(formattedFilePath);

    // Add format selector to the top of the article
    const formatSelectorHTML = createFormatSelectorHTML(pathForLookup, format);
    htmlContent = formatSelectorHTML + htmlContent;

    if (
      routeInfo.type === "post" &&
      routeInfo.namedPath &&
      pathForLookup !== routeInfo.namedPath
    ) {
      const newUrl = new URL(routeInfo.namedPath, window.location.origin);
      newUrl.search = url.search; // Preserve format query parameter
      window.history.replaceState(
        { path: newUrl.pathname + newUrl.search },
        "",
        newUrl.toString()
      );
      currentRouteInfoForTitle =
        siteRoutesConfig[routeInfo.namedPath] || routeInfo;
      effectivePageIdForComments = routeInfo.namedPath;
    } else if (
      routeInfo.type === "post" &&
      !routeInfo.namedPath &&
      pathForLookup.match(/^\/\d+$/)
    ) {
      for (const pKey in siteRoutesConfig) {
        if (
          siteRoutesConfig[pKey].file === routeInfo.file &&
          siteRoutesConfig[pKey].type === "post" &&
          !pKey.match(/^\/\d+$/)
        ) {
          effectivePageIdForComments = pKey;
          currentRouteInfoForTitle = siteRoutesConfig[pKey];
          break;
        }
      }
    }
  } else {
    htmlContent = await fetchContentForErrorPage();
    currentRouteInfoForTitle = siteRoutesConfig["/404"];
    effectivePageIdForComments = "/404";
  }

  setTimeout(() => {
    if (mainContentArea) {
      mainContentArea.innerHTML = htmlContent;
      updatePageTitle(currentRouteInfoForTitle, pathForLookup);
      mainContentArea.style.opacity = "1";
      document.dispatchEvent(new CustomEvent("onRouteChange"));
    }

    if (commentsComponent) {
      const isArticlePage =
        currentRouteInfoForTitle && currentRouteInfoForTitle.type === "post";
      commentsComponent.hidden = !isArticlePage;
      if (isArticlePage) {
        commentsComponent.pageId = effectivePageIdForComments;
      }
    }
    window.scrollTo(0, 0);
  }, 120);
}

function handleNavigation(event) {
  const anchor = event.target.closest("a");

  if (
    !anchor ||
    (anchor.origin !== window.location.origin &&
      !anchor.hasAttribute("data-route")) ||
    event.metaKey ||
    event.ctrlKey ||
    anchor.target === "_blank" ||
    anchor.hasAttribute("download") ||
    anchor.getAttribute("rel") === "external"
  ) {
    return;
  }

  const href = anchor.getAttribute("href");

  if (!href || href.startsWith("#")) {
    return;
  }

  event.preventDefault();

  const targetUrl = new URL(href, window.location.origin);
  const targetPath = targetUrl.pathname + targetUrl.search + targetUrl.hash;
  const currentPath =
    window.location.pathname + window.location.search + window.location.hash;

  if (targetPath === currentPath) {
    return;
  }

  window.history.pushState({ path: targetPath }, "", targetPath);
  loadPage(targetPath);
}

function handlePopState(event) {
  const path =
    event.state?.path || window.location.pathname + window.location.search;
  loadPage(path);
}

async function initializeRouter() {
  await loadInitialData();
  document.body.addEventListener("click", handleNavigation);
  window.addEventListener("popstate", handlePopState);
  const initialPath = window.location.pathname + window.location.search;
  loadPage(initialPath);
}

export { initializeRouter };
