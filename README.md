# Project 256: Article Reviews

This project hosts a series of in-depth articles, each exploring a complex technological or cognitive topic. The articles are structured with an unwavering commitment to uniformity and thematic integration, following this strict style guide to ensure consistency and a unique reading experience.

## Project Structure

- `/`: Root directory for all static assets deployed to Firebase.
  - `/0x/`: Contains the HTML files for the individual articles and their format variations.
  - `/css/`: Contains global stylesheets. All styling for the articles is handled globally from this directory.
  - `/js/`: Contains JavaScript files, including `routes.json` and scripts for interactive features.
    - `routes.json`: Manually updated to define the navigation routes for the articles.
  - `/components/`: Contains HTML snippets for iframes embedded within the articles.
    - `/components/1/`, `/components/2/`, `/components-3/`: Each of these directories corresponds to an article and contains exactly 10 subdirectories for the iframes used within that article. Each subdirectory houses an `index.html` for an interactive infographic, demonstration, or visualization.
  - `index.html`: Main landing page that dynamically loads content.
  - `README.md`: This style guide.

## Article Style Guide

All articles **MUST** adhere to the following structural, stylistic, and formatting rules without deviation.

### I. Core Philosophy: Thematic Integration

Each article topic **MUST** be built around a central, unifying metaphor. This theme dictates the tone of the writing and **MUST** be woven into section titles, taglines, and the body text to create a cohesive narrative.

-   **Purpose:** The theme acts as a narrative lens, making complex topics more accessible and creating a distinct voice for each article.
-   **Approved Themes:**
    -   **Autonomous Vehicles:** Poker / High-Stakes Strategy.
    -   **GPU/TPU Comparison:** The Silicon Orchestra / Architectural Symphony.
    -   **Déjà Vu Exploration:** Memory's Misfiring Script / The Unreliable Narrator.

### II. Article Formats (The "Three Editions" Rule)

Each article topic **MUST** exist in three distinct, stand-alone HTML files, representing different levels of depth and length.

-   **Full (8-8-4):** `article-name.html`
-   **Medium (4-4-4):** `article-name.4x4x4.html`
-   **Quick (4-2-2):** `article-name.4x2x2.html`

### III. Rhythmic Prose (Sentence & Paragraph Rules)

This is the core stylistic constraint, creating a unique cadence. Adherence **MUST** be exact.

#### A. Sentence Length Definitions

-   **Short:** 7-9 words
-   **Medium:** 14-18 words
-   **Long:** 21-27 words
-   **Longest:** 28-36 words

#### B. Paragraph Rhythmic Patterns

-   **4-Sentence Paragraphs:** **MUST** follow the `Medium - Longest - Medium - Short` word-count pattern.
-   **2-Sentence Paragraphs:** **MUST** follow the `Short - Long` word-count pattern.

#### C. Exact Character Count Constraint

Each paragraph's visible text content **MUST** adhere to a strict character limit. This count is inclusive of all letters, numbers, spaces, and punctuation, including visible citation text (e.g., `[42]`). The HTML for the citation links themselves (`<a href="...">...</a>`) is **excluded**.

-   **4-Sentence Paragraphs:** **MUST** contain **exactly 256 characters**.
-   **2-Sentence Paragraphs:** **MUST** contain **exactly 128 characters**.

### IV. Structural Blueprint (The "Anatomy of an Article")

The combination of the above rules dictates the structure for each format.

-   **Full (8-8-4):**
    -   **8** main `<h2>` sections.
    -   **8** paragraphs per section.
    -   **4** sentences per paragraph (following the `Medium - Longest - Medium - Short` rhythm).
    -   **256** characters per paragraph.
    -   **128** total citations (**2** per paragraph).

-   **Medium (4-4-4):**
    -   **4** main `<h2>` sections.
    -   **4** paragraphs per section.
    -   **4** sentences per paragraph (following the `Medium - Longest - Medium - Short` rhythm).
    -   **256** characters per paragraph.
    -   **32** total citations (**2** per paragraph).

-   **Quick (4-2-2):**
    -   **4** main `<h2>` sections.
    -   **2** paragraphs per section.
    -   **2** sentences per paragraph (following the `Short - Long` rhythm).
    -   **128** characters per paragraph.
    -   **8** total citations (**1** per paragraph).

### V. Titling, Captions, and Taglines

-   **H1 Title:** Unique and descriptive for each article topic.
-   **H2 Section Titles:** Approximately 4 words each, incorporating the article's specific theme.
-   **Taglines (`.section-tagline`)**: An 8-word (approx.) descriptive phrase that appears under each `<h2>`.
-   **Iframe Captions (`.iframe-placeholder-description`)**: Each of the 10 `<iframe>` components **MUST** be followed by a descriptive caption that is **exactly 32 words long**.

### VI. Citations & Bibliography

All citation formatting is non-negotiable and **MUST** be implemented with precision to ensure site-wide uniformity and functionality. This system uses a hybrid approach, combining an on-page pop-up with a "drill-down" navigation path between article editions.

#### A. Source Subsetting and Distribution

-   **Master List:** The Full (8-8-4) edition of an article serves as the canonical version and **MUST** contain **exactly 128 unique sources**.
-   **Subsets:** The shorter formats **MUST** contain their own bibliographies, which are strict subsets of the master list.
    -   The Medium (4-4-4) edition **MUST** cite **exactly 32 unique sources**, selected from the master list.
    -   The Quick (4-2-2) edition **MUST** cite **exactly 8 unique sources**, selected from the master list.
-   **Distribution:** Citations **MUST** be distributed evenly across all text paragraphs in an article.
    -   Full (8-8-4): **2 citations per paragraph** (64 paragraphs \* 2 = 128).
    -   Medium (4-4-4): **2 citations per paragraph** (16 paragraphs \* 2 = 32).
    -   Quick (4-2-2): **1 citation per paragraph** (8 paragraphs \* 1 = 8).

#### B. In-Text Citation Formatting

-   In-text citations **MUST** always be same-page links to allow the pop-up preview sheet to function.
-   **HTML Template:** ` <a href="#source-XX">[XX]</a>` (where `XX` is the source number).
-   **Placement:** Citations **MUST** be placed at the end of a sentence, immediately after the period, with no preceding space.

#### C. Bibliography Formatting

-   **List Format:** Each article format **MUST** have its own "Sources Cited" section using an `<ol class="sources-list">` tag.
-   **List Item (`<li>`) Golden Template:** Each `<li>` element **MUST** follow this exact structure:
    ```html
    <li><a id="source-XX"></a><strong>[XX]</strong> Author, A. A. (Year). <a href="URL_TO_SOURCE" target="_blank" rel="noopener noreferrer"><em>Title of Work</em></a>. Publisher.</li>
    ```
-   **Template Breakdown:**
    1.  **`<a id="source-XX"></a>`**: The empty target anchor for in-text links.
    2.  **`<strong>[XX]</strong>`**: The visible source number, wrapped in `<strong>` tags.
    3.  **Citation Text**: The author, year, etc., formatted in a consistent, simplified APA-like style.
    4.  **`<a href="..." ...><em>...</em></a>`**: The external hyperlink, which **MUST** wrap the italicized (`<em>`) title of the work and include `target="_blank"`.

#### D. Contextual Drill-Down Linking

To create a trail from summary to source, the pop-up "Bibliography Preview Sheet" will contain special contextual links.

-   **Functionality:** When a user clicks a citation link (`[XX]`), the pop-up sheet appears. This sheet is dynamically populated by `js/app.js`.
-   **On "Quick (4x2x2)" Articles:** The pop-up for source `[XX]` will show the source's bibliographic information. Below it, a link **MUST** be present: `[View in Medium Article]`.
    -   This link's `href` will be `article-name.4x4x4.html#source-XX`.
-   **On "Medium (4x4x4)" Articles:** The pop-up for source `[XX]` will show its info. Below it, a link **MUST** be present: `[View in Full Article]`.
    -   This link's `href` will be `article-name.html#source-XX`.
-   **On "Full (8-8-4)" Articles:** The pop-up appears as normal but contains **NO** drill-down link, as it is the final destination.

#### E. Source Numbering & Consistency

-   The numbering system for sources **MUST** be consistent across all three editions of an article. If a source is `[42]` in the Full edition, it **MUST** also be `[42]` in the Medium or Quick editions if it is cited there.

### VII. Development Workflow

-   **Styling:** All CSS styling is global and managed within the `/public/css/` directory.
-   **Routing:** Navigation routes are defined in `/public/js/routes.json`. This file **MUST** be updated manually whenever new articles or format variations are added.
-   **Local Testing:** Run `python3 -m http.server 8000` and open `http://localhost:8000`.
-   **Deployment:** Run `firebase deploy`.