import { $, $$, createElement, clamp, oklchToCss, debounce } from "./utils.js";

const iaGridTemplate = document.createElement("template");

// CSS is now injected directly via string literal in connectedCallback from js/ia-grid.css content

class IaGrid extends HTMLElement {
  static config = {
    gridDimension: 16,
    baseFrequency: 110, // A2 note
    defaultUrlBase: "https://256.one/char/", // Placeholder for default links
    audioVolume: 0.08,
    specialLinkVolumeBoost: 1.3,
    pentatonicScale: [0, 2, 4, 7, 9], // C, D, E, G, A
    previewTypes: {
      github: { icon: "♯", hasDesc: true }, // Using musical sharp as placeholder
      medium: { icon: "☵", hasDesc: true }, // Trigram for water/abyss (flow of text)
      scholar: { icon: "♞", hasDesc: true }, // Knight for strategy/knowledge
      vimeo: { icon: "♬", hasDesc: true }, // Musical notes for video/art
      image: { icon: "☻", hasDesc: true }, // Smiley for general image
      iframe: { icon: "⛋", hasDesc: false }, // Intersecting squares for embedded frame
      placeholder: { icon: "★", hasDesc: false }, // Star for placeholder/default
      link: { icon: "☌", hasDesc: true }, // Conjunction symbol for general link
    },
    placeholderImageUrl: (asciiCode) =>
      `https://via.placeholder.com/200/cccccc/000000/?text=${asciiCode}`,
    modalViewportMargin: 12, // px
    dragThreshold: 5, // px
  };

  static workData = [
    {
      ascii: "0", // Code 48
      title: "Simulatte World: Quantum Pixel Zenith",
      url: "https://simulatte.world/0",
      description:
        "Exploration of pixel-based quantum phenomena and emergent realities. The foundational layer of digital existence.",
      previewType: "iframe", // Changed to iframe to showcase a different type
      imageUrl: null,
    },
    {
      ascii: "2", // Code 50
      title: "Simulatte World: Digital Phase Shift",
      url: "https://simulatte.world/2",
      description:
        "Investigating phase transitions in complex digital systems and their impact on information integrity.",
      previewType: "iframe",
      imageUrl: null,
    },
    {
      ascii: "4", // Code 52
      title: "Simulatte World: Tensor Processing Unification",
      url: "https://simulatte.world/4",
      description:
        "Conceptual framework for unifying tensor processing across diverse computational architectures.",
      previewType: "iframe",
      imageUrl: null,
    },
    {
      ascii: "C", // Code 67
      title: "Configure MK8 (Archived)",
      url: "https://apksos.com/app/configure-mk8", // Example external link
      description:
        "Legacy Android application for device configuration. Maintained for historical reference.",
      previewType: "link",
      imageUrl: null, // No specific image, will use default icon
    },
    {
      ascii: "D", // Code 68
      title: "d4da: Data For Data Analytics",
      url: "https://d4da.com", // Assumed to be a placeholder or conceptual site
      description:
        "A conceptual hub for data-driven insights and analytical tool development. Exploring the meta-structure of data.",
      previewType: "link", // Default for unknown specific content
    },
    {
      ascii: "G", // Code 71
      title: "Clocksmith on GitHub",
      url: "https://github.com/clocksmith/",
      description:
        "Primary repository for open-source projects, code experiments, and contributions to the tech community.",
      previewType: "github",
    },
    {
      ascii: "M", // Code 77
      title: "Clocksmith on Medium",
      url: "https://medium.com/@clocksmith",
      description:
        "Collection of articles on technology, software development, and philosophical musings on digital existence.",
      previewType: "medium",
    },
    {
      ascii: "R", // Code 82
      title: "Reploid Systems: AI Dream Weavers",
      url: "https://replo.id", // Conceptual
      description:
        "Hypothetical venture into advanced AI companions and dream-state emulators. Where silicon meets sentience.",
      previewType: "link",
    },
    {
      ascii: "S", // Code 83
      title: "Clocksmith - Google Scholar",
      url: "https://scholar.google.com/citations?user=E7mH-A4AAAAJ&hl=en",
      description:
        "Index of academic publications, research papers, and citations in various scientific fields.",
      previewType: "scholar",
    },
    {
      ascii: "V", // Code 86
      title: "Video Art Showcase",
      url: "https://vimeo.com/showcase/11026793",
      description:
        "Curated collection of experimental video art, exploring themes of time, perception, and digital media.",
      previewType: "vimeo",
    },
    {
      ascii: "Z", // Code 90
      title: "SlamZoom Photo Animator (Archived)",
      url: "https://apkpure.com/slamzoom-animate-your-photos/com.slamzoom.android", // Example external link
      description:
        "Early Android application for creating simple photo animations. Preserved for portfolio history.",
      previewType: "link",
      imageUrl: null,
    },
  ];

  static encodingDefinitions = {
    baseControlChars: {
      0: { display: "NUL", desc: "Null" },
      1: { display: "SOH", desc: "Start of Heading" },
      2: { display: "STX", desc: "Start of Text" },
      3: { display: "ETX", desc: "End of Text" },
      4: { display: "EOT", desc: "End of Transmission" },
      5: { display: "ENQ", desc: "Enquiry" },
      6: { display: "ACK", desc: "Acknowledge" },
      7: { display: "BEL", desc: "Bell" },
      8: { display: "BS", desc: "Backspace" },
      9: { display: "HT", desc: "Horizontal Tab" },
      10: { display: "LF", desc: "Line Feed" },
      11: { display: "VT", desc: "Vertical Tab" },
      12: { display: "FF", desc: "Form Feed" },
      13: { display: "CR", desc: "Carriage Return" },
      14: { display: "SO", desc: "Shift Out" },
      15: { display: "SI", desc: "Shift In" },
      16: { display: "DLE", desc: "Data Link Escape" },
      17: { display: "DC1", desc: "Device Control 1 (XON)" },
      18: { display: "DC2", desc: "Device Control 2" },
      19: { display: "DC3", desc: "Device Control 3 (XOFF)" },
      20: { display: "DC4", desc: "Device Control 4" },
      21: { display: "NAK", desc: "Negative Acknowledge" },
      22: { display: "SYN", desc: "Synchronous Idle" },
      23: { display: "ETB", desc: "End of Transmission Block" },
      24: { display: "CAN", desc: "Cancel" },
      25: { display: "EM", desc: "End of Medium" },
      26: { display: "SUB", desc: "Substitute" },
      27: { display: "ESC", desc: "Escape" },
      28: { display: "FS", desc: "File Separator" },
      29: { display: "GS", desc: "Group Separator" },
      30: { display: "RS", desc: "Record Separator" },
      31: { display: "US", desc: "Unit Separator" },
      127: { display: "DEL", desc: "Delete" },
      32: { display: "\u00A0", desc: "Space" }, // Non-breaking space for visual consistency
    },
    basePrintableAsciiDesc: {
      33: "Exclamation mark",
      34: "Double quotes",
      35: "Number sign",
      36: "Dollar",
      37: "Percent sign",
      38: "Ampersand",
      39: "Single quote",
      40: "Open parenthesis",
      41: "Close parenthesis",
      42: "Asterisk",
      43: "Plus",
      44: "Comma",
      45: "Hyphen-minus",
      46: "Period",
      47: "Slash",
      48: "Zero",
      49: "One",
      50: "Two",
      51: "Three",
      52: "Four",
      53: "Five",
      54: "Six",
      55: "Seven",
      56: "Eight",
      57: "Nine",
      58: "Colon",
      59: "Semicolon",
      60: "Less than",
      61: "Equals",
      62: "Greater than",
      63: "Question mark",
      64: "At sign",
      65: "Uppercase A",
      66: "Uppercase B",
      67: "Uppercase C",
      68: "Uppercase D",
      69: "Uppercase E",
      70: "Uppercase F",
      71: "Uppercase G",
      72: "Uppercase H",
      73: "Uppercase I",
      74: "Uppercase J",
      75: "Uppercase K",
      76: "Uppercase L",
      77: "Uppercase M",
      78: "Uppercase N",
      79: "Uppercase O",
      80: "Uppercase P",
      81: "Uppercase Q",
      82: "Uppercase R",
      83: "Uppercase S",
      84: "Uppercase T",
      85: "Uppercase U",
      86: "Uppercase V",
      87: "Uppercase W",
      88: "Uppercase X",
      89: "Uppercase Y",
      90: "Uppercase Z",
      91: "Opening bracket",
      92: "Backslash",
      93: "Closing bracket",
      94: "Caret",
      95: "Underscore",
      96: "Grave accent",
      97: "Lowercase a",
      98: "Lowercase b",
      99: "Lowercase c",
      100: "Lowercase d",
      101: "Lowercase e",
      102: "Lowercase f",
      103: "Lowercase g",
      104: "Lowercase h",
      105: "Lowercase i",
      106: "Lowercase j",
      107: "Lowercase k",
      108: "Lowercase l",
      109: "Lowercase m",
      110: "Lowercase n",
      111: "Lowercase o",
      112: "Lowercase p",
      113: "Lowercase q",
      114: "Lowercase r",
      115: "Lowercase s",
      116: "Lowercase t",
      117: "Lowercase u",
      118: "Lowercase v",
      119: "Lowercase w",
      120: "Lowercase x",
      121: "Lowercase y",
      122: "Lowercase z",
      123: "Opening brace",
      124: "Vertical bar",
      125: "Closing brace",
      126: "Tilde",
    },
    "windows-1252": {
      // Only include differences from Unicode 0-255 for this range for brevity if needed elsewhere
      128: { display: "€", desc: "Euro sign" },
      129: { display: "\u0081", desc: "Undefined (CP1252 U+0081)" }, // Placeholder for non-Unicode
      130: { display: "‚", desc: "Single low-9 quotation mark" },
      131: { display: "ƒ", desc: "Latin small letter f with hook" },
      132: { display: "„", desc: "Double low-9 quotation mark" },
      133: { display: "…", desc: "Horizontal ellipsis" },
      134: { display: "†", desc: "Dagger" },
      135: { display: "‡", desc: "Double dagger" },
      136: { display: "ˆ", desc: "Modifier letter circumflex accent" },
      137: { display: "‰", desc: "Per mille sign" },
      138: { display: "Š", desc: "Latin capital letter S with caron" },
      139: { display: "‹", desc: "Single left-pointing angle quotation mark" },
      140: { display: "Œ", desc: "Latin capital ligature OE" },
      141: { display: "\u008D", desc: "Undefined (CP1252 U+008D)" },
      142: { display: "Ž", desc: "Latin capital letter Z with caron" },
      143: { display: "\u008F", desc: "Undefined (CP1252 U+008F)" },
      144: { display: "\u0090", desc: "Undefined (CP1252 U+0090)" },
      145: { display: "‘", desc: "Left single quotation mark" },
      146: { display: "’", desc: "Right single quotation mark" },
      147: { display: "“", desc: "Left double quotation mark" },
      148: { display: "”", desc: "Right double quotation mark" },
      149: { display: "•", desc: "Bullet" },
      150: { display: "–", desc: "En dash" },
      151: { display: "—", desc: "Em dash" },
      152: { display: "˜", desc: "Small tilde" },
      153: { display: "™", desc: "Trade mark sign" },
      154: { display: "š", desc: "Latin small letter s with caron" },
      155: { display: "›", desc: "Single right-pointing angle quotation mark" },
      156: { display: "œ", desc: "Latin small ligature oe" },
      157: { display: "\u009D", desc: "Undefined (CP1252 U+009D)" },
      158: { display: "ž", desc: "Latin small letter z with caron" },
      159: { display: "Ÿ", desc: "Latin capital letter Y with diaeresis" },
      // 160-255 are same as Unicode Latin-1 Supplement, so basePrintableAsciiDesc and direct String.fromCharCode works
    },
    "unicode-0-255": {}, // Will use String.fromCharCode and base control/printable for descriptions
    "ascii-7bit": {}, // Will use String.fromCharCode for 33-126, mirror for 128+
  };

  constructor() {
    super();
    this.attachShadow({ mode: "open" });
    this.state = {
      drawing: false,
      selectedCellsCount: 0,
      colorMode: "rgb", // Default color mode
      soundMode: "harmony", // Default sound mode
      currentEncoding: "unicode-0-255", // Default encoding
      activePreviewCellElement: null,
      isLinksTableVisible: false,
      isAudioInitialized: false,
      audioContext: null,
      noiseBuffer: null,
      pointerDownCell: null,
      isDragging: false,
      pointerDownX: 0,
      pointerDownY: 0,
      lastHoveredCellIndex: -1,
    };
    this.workDataMap = new Map(
      IaGrid.workData.map((item) => [item.ascii, item])
    );
    this.workDataUrls = new Set(IaGrid.workData.map((item) => item.url));
    this.cellDataStore = new Map();

    // Bind event handlers
    this._handlePointerDown = this._handlePointerDown.bind(this);
    this._handlePointerMove = this._handlePointerMove.bind(this);
    this._handlePointerUp = this._handlePointerUp.bind(this);
    this._handleCellClick = this._handleCellClick.bind(this); // Ensure click handler is bound
    this._handleDocumentClick = this._handleDocumentClick.bind(this);
    this._handleDocumentKeydown = this._handleDocumentKeydown.bind(this);
    this._handleWindowResize = debounce(
      this._handleWindowResize.bind(this),
      150
    );
    this._cssText = ""; // To store fetched CSS
  }

  async _fetchCSS() {
    if (this._cssText) return this._cssText;
    try {
      const response = await fetch("/js/ia-grid.css");
      if (!response.ok)
        throw new Error(`HTTP error! status: ${response.status}`);
      this._cssText = await response.text();
      return this._cssText;
    } catch (error) {
      console.error("Failed to fetch ia-grid.css:", error);
      return "<p>Error loading styles for ia-grid component.</p>"; // Fallback content
    }
  }

  async connectedCallback() {
    const cssOrError = await this._fetchCSS();
    const template = document.createElement("template");
    if (cssOrError.startsWith("<p>Error")) {
      template.innerHTML = cssOrError;
    } else {
      template.innerHTML = `
          <style>${cssOrError}</style>
          <div class="controls-container js-controls-container">
            <select class="js-encoding-select" aria-label="Select Encoding">
              <option value="unicode-0-255" selected>Unicode (0-255)</option>
              <option value="windows-1252">Windows-1252</option>
              <option value="ascii-7bit">ASCII (7-bit + Mirrored)</option>
            </select>
            <select class="js-color-mode-select" aria-label="Select Color Mode">
              <option value="monochrome">Monochrome</option>
              <option value="rgb" selected>RGB</option>
              <option value="oklch">OKLCH Dynamic</option>
              <option value="grayscale">Grayscale Dynamic</option>
            </select>
            <select class="js-sound-mode-select" aria-label="Select Sound Mode">
              <option value="tones">Tones</option>
              <option value="harmony" selected>Harmony</option>
              <option value="chords">Chords</option>
              <option value="fifths">Fifths</option>
            </select>
          </div>
          <div class="controls-container js-controls-container">
            <button class="js-reset-button">Reset Grid</button>
            <button class="js-toggle-links-button" aria-haspopup="true" aria-expanded="false">Show Links</button>
          </div>
          <div class="grid-container js-grid-container" role="grid" aria-label="Interactive Unicode Grid"></div>
          <div class="preview-modal js-preview-modal" role="dialog" aria-modal="true" aria-hidden="true" aria-labelledby="preview-title-label">
              <div class="preview-modal-header">
                  <button class="preview-modal-close-button js-preview-modal-close-button" aria-label="Close Preview">×</button>
              </div>
              <div class="preview-modal-main js-preview-modal-main"></div>
              <div class="preview-modal-footer js-preview-modal-footer"></div>
          </div>
          <div class="links-table-container js-links-table-container" role="dialog" aria-modal="true" aria-hidden="true" aria-labelledby="links-table-title-label">
              <div class="links-table-header">
                  <h2 id="links-table-title-label" style="margin: 0 0 10px 0; font-size: 1.1em;">Links Reference</h2>
                  <button class="links-table-close-button js-links-table-close-button" aria-label="Close Links Table">×</button>
              </div>
              <div class="links-table-body-wrapper">
                  <table class="links-table js-links-table">
                      <colgroup>
                          <col class="col-char"><col class="col-title"><col class="col-url"><col class="col-desc">
                      </colgroup>
                      <thead><tr><th>Char</th><th>Title</th><th>URL</th><th>Description</th></tr></thead>
                      <tbody class="js-links-table-body"></tbody>
                  </table>
              </div>
          </div>`;
    }
    this.shadowRoot.appendChild(template.content.cloneNode(true));
    this._cacheDomElements();

    if (!this.dom.gridContainer) {
      // Check if essential elements are missing
      console.error(
        "IA-Grid: Essential DOM elements not found after template append."
      );
      return;
    }

    // Initialize state from select elements if they exist
    this.state.currentEncoding =
      this.dom.encodingSelect?.value || "unicode-0-255";
    this.state.colorMode = this.dom.colorModeSelect?.value || "rgb";
    this.state.soundMode = this.dom.soundModeSelect?.value || "harmony";

    this._generateCellData();
    this._populateLinksTable();
    this._createGrid();
    this._initializeAudio(); // Attempt to initialize audio
    this._setupEventListeners();
    this._applyInitialTheme(); // Apply theme based on body class
  }

  _applyInitialTheme() {
    const bodyIsLightMode = document.body.classList.contains("light-mode");
    this.classList.toggle("light-mode", bodyIsLightMode);
    // Listen for theme changes on the body
    const themeObserver = new MutationObserver((mutations) => {
      mutations.forEach((mutation) => {
        if (mutation.attributeName === "class") {
          const isLight = document.body.classList.contains("light-mode");
          this.classList.toggle("light-mode", isLight);
          this._applyColorModeStyle(); // Re-apply colors if needed
        }
      });
    });
    themeObserver.observe(document.body, { attributes: true });
  }

  disconnectedCallback() {
    document.removeEventListener("pointerup", this._handlePointerUp);
    document.removeEventListener("pointerleave", this._handlePointerUp);
    this.dom.gridContainer?.removeEventListener(
      "pointermove",
      this._handlePointerMove
    );
    document.removeEventListener("click", this._handleDocumentClick, true);
    document.removeEventListener("keydown", this._handleDocumentKeydown);
    window.removeEventListener("resize", this._handleWindowResize);
    if (this.state.audioContext && this.state.audioContext.state !== "closed") {
      this.state.audioContext.close().catch(console.warn);
    }
  }

  _cacheDomElements() {
    this.dom = {
      gridContainer: this.shadowRoot.querySelector(".js-grid-container"),
      previewModal: this.shadowRoot.querySelector(".js-preview-modal"),
      previewModalMain: this.shadowRoot.querySelector(".js-preview-modal-main"),
      previewModalFooter: this.shadowRoot.querySelector(
        ".js-preview-modal-footer"
      ),
      previewModalCloseButton: this.shadowRoot.querySelector(
        ".js-preview-modal-close-button"
      ),
      encodingSelect: this.shadowRoot.querySelector(".js-encoding-select"),
      colorModeSelect: this.shadowRoot.querySelector(".js-color-mode-select"),
      soundModeSelect: this.shadowRoot.querySelector(".js-sound-mode-select"),
      resetButton: this.shadowRoot.querySelector(".js-reset-button"),
      toggleLinksButton: this.shadowRoot.querySelector(
        ".js-toggle-links-button"
      ),
      linksTableContainer: this.shadowRoot.querySelector(
        ".js-links-table-container"
      ),
      linksTableBody: this.shadowRoot.querySelector(".js-links-table-body"),
      linksTableCloseButton: this.shadowRoot.querySelector(
        ".js-links-table-close-button"
      ),
    };
  }
  _createWhiteNoiseBuffer(audioCtx) {
    const bufferSize = audioCtx.sampleRate * 0.1; // 100ms of noise
    const buffer = audioCtx.createBuffer(1, bufferSize, audioCtx.sampleRate);
    const output = buffer.getChannelData(0);
    for (let i = 0; i < bufferSize; i++) output[i] = Math.random() * 2 - 1; // White noise
    return buffer;
  }
  _playWhiteNoise() {
    const audioCtx = this.state.audioContext;
    const noiseBuffer = this.state.noiseBuffer;
    if (!audioCtx || !noiseBuffer || audioCtx.state === "suspended") return;
    try {
      const source = audioCtx.createBufferSource();
      source.buffer = noiseBuffer;
      const gain = audioCtx.createGain();
      const now = audioCtx.currentTime;
      gain.gain.setValueAtTime(0.02, now); // Start quiet
      gain.gain.exponentialRampToValueAtTime(0.0001, now + 0.1); // Quick fade out
      source.connect(gain);
      gain.connect(audioCtx.destination);
      source.start(now);
      source.stop(now + 0.1); // Stop after 100ms
    } catch (e) {
      console.error("Error playing white noise:", e);
    }
  }
  _initializeAudio() {
    if (this.state.isAudioInitialized) return true;
    if (!window.AudioContext && !window.webkitAudioContext) {
      console.warn("Web Audio API not supported.");
      return false;
    }
    try {
      this.state.audioContext = new (window.AudioContext ||
        window.webkitAudioContext)();
      // Attempt to resume context if it's suspended (common in some browsers before user interaction)
      if (this.state.audioContext.state !== "running") {
        this.state.audioContext
          .resume()
          .catch((e) => console.warn("AudioContext resume failed:", e));
      }
      this.state.noiseBuffer = this._createWhiteNoiseBuffer(
        this.state.audioContext
      );
      this.state.isAudioInitialized = true;
      return true;
    } catch (e) {
      console.error("Failed to initialize AudioContext:", e);
      this.state.isAudioInitialized = false;
      this.state.audioContext = null;
      return false;
    }
  }
  _attemptAudioResume() {
    if (!this.state.isAudioInitialized && !this._initializeAudio()) {
      // Try to init if not already
      return;
    }
    if (
      this.state.audioContext &&
      this.state.audioContext.state === "suspended"
    ) {
      this.state.audioContext
        .resume()
        .catch((e) => console.warn("AudioContext.resume() failed:", e));
    }
  }

  _getEncodingData(code, encoding) {
    const fallbackDesc = `Code ${code}`;
    let fallbackDisplay = String.fromCharCode(code);
    // Ensure fallback for truly non-printable (0-31, 127-159) that String.fromCharCode might make invisible
    if (
      (code >= 0 && code <= 31 && ![9, 10, 13].includes(code)) ||
      (code >= 127 && code <= 159)
    ) {
      fallbackDisplay = `[${code}]`;
    }

    const baseControl = IaGrid.encodingDefinitions.baseControlChars[code];
    if (baseControl) return { ...baseControl, targetFlipped: false };

    if (encoding === "ascii-7bit") {
      if (code >= 33 && code <= 126) {
        // Standard printable ASCII
        return {
          display: String.fromCharCode(code),
          desc:
            IaGrid.encodingDefinitions.basePrintableAsciiDesc[code] ||
            fallbackDesc,
          targetFlipped: false,
        };
      }
      if (code >= 128 && code <= 255) {
        // Mirrored range
        const sourceCode = code - 128;
        let sourceDisplayChar;
        let sourceDesc;

        const sourceBaseControl =
          IaGrid.encodingDefinitions.baseControlChars[sourceCode];
        if (sourceBaseControl) {
          sourceDisplayChar = sourceBaseControl.display;
          sourceDesc = sourceBaseControl.desc;
        } else if (sourceCode >= 33 && sourceCode <= 126) {
          sourceDisplayChar = String.fromCharCode(sourceCode);
          sourceDesc =
            IaGrid.encodingDefinitions.basePrintableAsciiDesc[sourceCode] ||
            `Code ${sourceCode}`;
        } else {
          // Mirrored non-printable or unassigned ASCII
          sourceDisplayChar = `[${sourceCode}]`;
          sourceDesc = `Code ${sourceCode}`;
        }
        return {
          display: sourceDisplayChar,
          desc: `(Mirrored) ${sourceDesc}`,
          targetFlipped: true,
        };
      }
      // For codes 0-31, 127 in ascii-7bit mode (not mirrored part)
      return {
        display: fallbackDisplay,
        desc: fallbackDesc,
        targetFlipped: false,
      };
    }

    // For "unicode-0-255" and "windows-1252"
    let displayChar = String.fromCharCode(code);
    let charDesc =
      IaGrid.encodingDefinitions.basePrintableAsciiDesc[code] ||
      `Unicode U+${code.toString(16).padStart(4, "0").toUpperCase()}`;

    if (
      encoding === "windows-1252" &&
      IaGrid.encodingDefinitions["windows-1252"][code]
    ) {
      const winDef = IaGrid.encodingDefinitions["windows-1252"][code];
      displayChar = winDef.display; // This might be like "[129]" for undefined CP1252 points
      charDesc = winDef.desc;
    }

    // If String.fromCharCode resulted in a replacement character for valid Unicode points, use fallback.
    // Or if displayChar is one of those bracketed undefineds from CP1252.
    if (
      (displayChar.charCodeAt(0) === 0xfffd && code !== 0xfffd) ||
      displayChar.startsWith("[")
    ) {
      // Check if it was meant to be a control char first
      if (!baseControl) displayChar = fallbackDisplay;
    }
    // For truly non-printable characters (e.g. C0 controls not HT, LF, CR) ensure bracketed display
    if (
      (code >= 0 && code <= 31 && ![9, 10, 13].includes(code)) ||
      code === 127
    ) {
      if (!baseControl) displayChar = `[${code}]`; // ensure baseControl definition takes precedence
    }
    if (
      encoding === "windows-1252" &&
      code >= 128 &&
      code <= 159 &&
      !IaGrid.encodingDefinitions["windows-1252"][code]
    ) {
      displayChar = `[${code}]`; // Explicitly mark unused CP1252 C1 controls
      charDesc = `Undefined (CP1252 ${code})`;
    }

    return { display: displayChar, desc: charDesc, targetFlipped: false };
  }

  _generateCellData() {
    this.cellDataStore.clear();
    const numCells = IaGrid.config.gridDimension * IaGrid.config.gridDimension;
    const currentEncoding = this.state.currentEncoding;
    for (let i = 0; i < numCells; i++) {
      const asciiCode = i;
      const {
        display: displayChar,
        desc: asciiDesc,
        targetFlipped,
      } = this._getEncodingData(asciiCode, currentEncoding);
      // For workDataMap key, always use the standard ASCII uppercase char if applicable, regardless of encoding's display
      const charKeyForWorkData =
        asciiCode >= 65 && asciiCode <= 90
          ? String.fromCharCode(asciiCode)
          : null;
      const existingData = charKeyForWorkData
        ? this.workDataMap.get(charKeyForWorkData)
        : null;

      const defaultUrl = `${IaGrid.config.defaultUrlBase}${asciiCode}`;
      const url = existingData?.url || defaultUrl;
      const isSpecialLink = this.workDataUrls.has(url) && url !== defaultUrl;

      let previewType =
        existingData?.previewType || (isSpecialLink ? "link" : "placeholder");
      const typeLookupKey = IaGrid.config.previewTypes[previewType]
        ? previewType
        : isSpecialLink
        ? "link"
        : "placeholder";

      this.cellDataStore.set(i, {
        index: i,
        ascii: displayChar,
        asciiCode: asciiCode,
        title: existingData?.title || asciiDesc,
        url: url,
        description:
          existingData?.description || `Default link for ${asciiDesc}.`,
        previewType: previewType,
        typeInfo: IaGrid.config.previewTypes[typeLookupKey],
        imageUrl: existingData?.imageUrl,
        isSpecialLink: isSpecialLink,
        targetFlipped: targetFlipped, // Store this per cell
        element: null, // Will be set in _createGrid
        bin: asciiCode.toString(2).padStart(8, "0"),
        hex: asciiCode.toString(16).padStart(2, "0").toUpperCase(),
        asciiDesc: asciiDesc,
      });
    }
  }
  _populateLinksTable() {
    if (!this.dom.linksTableBody) return;
    this.dom.linksTableBody.innerHTML = ""; // Clear existing rows
    const fragment = document.createDocumentFragment();
    const allData = Array.from(this.cellDataStore.values());
    // Sort special links first, then by ASCII code
    const specialLinks = allData
      .filter((d) => d.isSpecialLink)
      .sort((a, b) => a.asciiCode - b.asciiCode);
    const defaultLinks = allData
      .filter((d) => !d.isSpecialLink)
      .sort((a, b) => a.asciiCode - b.asciiCode);
    const sortedData = [...specialLinks, ...defaultLinks];

    sortedData.forEach((data) => {
      const row = createElement("tr", {
        className: data.isSpecialLink ? "" : "default-link-row",
      });
      row.appendChild(createElement("td", { textContent: data.ascii }));
      row.appendChild(createElement("td", { textContent: data.title }));
      const linkCell = createElement("td");
      const link = createElement("a", {
        href: data.url,
        target: "_blank",
        rel: "noopener noreferrer",
        textContent: data.url,
      });
      linkCell.appendChild(link);
      row.appendChild(linkCell);
      row.appendChild(createElement("td", { textContent: data.description }));
      fragment.appendChild(row);
    });
    this.dom.linksTableBody.appendChild(fragment);
  }
  _createGrid() {
    if (!this.dom.gridContainer) return;
    this.dom.gridContainer.innerHTML = ""; // Clear previous grid
    this.dom.gridContainer.className = `grid-container js-grid-container encoding-${this.state.currentEncoding} ${this.state.colorMode}`; // Update class for encoding

    const fragment = document.createDocumentFragment();
    this.cellDataStore.forEach((data, i) => {
      const cellClasses = ["grid-cell"];
      if (data.isSpecialLink) cellClasses.push("has-special-link");

      const cell = createElement("div", {
        className: cellClasses.join(" "),
        role: "gridcell",
        tabIndex: 0,
        "aria-label": `${data.asciiDesc || `Character ${data.ascii}`} (Code ${
          data.asciiCode
        })`,
        dataset: {
          index: i,
          asciiCode: data.asciiCode,
          isTargetFlipped: data.targetFlipped ? "true" : "false", // Add this dataset property
        },
      });

      const asciiClasses = ["ascii-char"];
      // Check for non-printable based on common ranges and specific exclusions, or if display is bracketed
      if (
        (data.asciiCode >= 0 &&
          data.asciiCode <= 31 &&
          ![9, 10, 13].includes(
            data.asciiCode
          )) /* C0 controls except Tab, LF, CR */ ||
        data.asciiCode === 127 /* DEL */ ||
        (this.state.currentEncoding === "windows-1252" &&
          data.asciiCode >= 128 &&
          data.asciiCode <= 159 &&
          !IaGrid.encodingDefinitions["windows-1252"][
            data.asciiCode
          ]?.display.startsWith(
            "["
          )) /* Undefined CP1252 C1, but not those explicitly defined with brackets */ ||
        (data.ascii.startsWith("[") &&
          data.ascii.endsWith(
            "]"
          )) /* Explicitly bracketed by _getEncodingData */ ||
        (data.ascii.charCodeAt(0) === 0xfffd &&
          data.asciiCode !== 0xfffd) /* Unicode Replacement Character */
      ) {
        asciiClasses.push("non-printable");
      }

      const asciiDisplay = createElement("span", {
        className: asciiClasses.join(" "),
        textContent: data.ascii,
        "aria-hidden": "true",
      });
      cell.appendChild(asciiDisplay);
      fragment.appendChild(cell);
      data.element = cell; // Store reference to the DOM element
      this._addCellEventListeners(cell); // Add event listeners
    });
    this.dom.gridContainer.appendChild(fragment);
    this._applyColorModeStyle(); // Apply colors based on current mode
  }
  _createRipple(event, targetCell) {
    if (!targetCell || targetCell.querySelector(".ripple")) return; // Avoid multiple ripples

    const ripple = createElement("span", { className: "ripple" });
    const rect = targetCell.getBoundingClientRect();
    const size = Math.max(rect.width, rect.height, 30) * 1.5; // Ripple size
    // Calculate position relative to the cell, considering scroll for pageX/Y
    const x =
      (event.clientX ?? rect.left + rect.width / 2) - rect.left - size / 2;
    const y =
      (event.clientY ?? rect.top + rect.height / 2) - rect.top - size / 2;

    ripple.style.width = ripple.style.height = `${size}px`;
    ripple.style.left = `${x}px`;
    ripple.style.top = `${y}px`;

    targetCell.appendChild(ripple);
    ripple.addEventListener("animationend", () => ripple.remove(), {
      once: true,
    });
  }

  _addCellEventListeners(cell) {
    cell.addEventListener("click", this._handleCellClick);
    cell.addEventListener("mouseover", (e) =>
      this._handleCellHover(e.currentTarget, true)
    );
    cell.addEventListener("mouseleave", (e) =>
      this._handleCellHover(e.currentTarget, false)
    );
    cell.addEventListener("focus", (e) =>
      this._handleCellHover(e.currentTarget, true)
    );
    cell.addEventListener("blur", (e) =>
      this._handleCellHover(e.currentTarget, false)
    );
    cell.addEventListener("keydown", (e) => {
      if (e.key === "Enter" || e.key === " ") {
        e.preventDefault();
        const cellElement = e.currentTarget;
        const index = parseInt(cellElement.dataset.index);
        const data = this.cellDataStore.get(index);
        if (data) {
          this._createRipple(e, cellElement); // Create ripple on keyboard activation
          this._handleCellInteraction(cellElement, data, true); // Show preview
        }
      } else if (e.key === "Escape" && this.state.activePreviewCellElement) {
        this._closePreviewModal();
      }
    });
  }

  _setupEventListeners() {
    if (!this.dom.gridContainer) return; // Guard against missing elements

    this.dom.gridContainer.addEventListener(
      "pointerdown",
      this._handlePointerDown
    );
    // Pointerup and pointerleave are on document to catch events even if pointer leaves grid
    document.addEventListener("pointerup", this._handlePointerUp);
    document.addEventListener("pointerleave", this._handlePointerUp); // Handles mouse leaving the window

    this.dom.encodingSelect?.addEventListener("change", () =>
      this._setEncoding(this.dom.encodingSelect.value)
    );
    this.dom.colorModeSelect?.addEventListener("change", () =>
      this._setColorMode(this.dom.colorModeSelect.value)
    );
    this.dom.soundModeSelect?.addEventListener("change", () =>
      this._setSoundMode(this.dom.soundModeSelect.value)
    );
    this.dom.resetButton?.addEventListener("click", () => this._resetGrid());
    this.dom.toggleLinksButton?.addEventListener("click", () =>
      this._setLinksTableVisibility(!this.state.isLinksTableVisible)
    );
    this.dom.linksTableCloseButton?.addEventListener("click", () =>
      this._setLinksTableVisibility(false)
    );
    this.dom.previewModalCloseButton?.addEventListener("click", () =>
      this._closePreviewModal()
    );

    // Document-level click for closing modals if click is outside
    document.addEventListener("click", this._handleDocumentClick, true); // Use capture phase
    document.addEventListener("keydown", this._handleDocumentKeydown);

    this.dom.previewModalMain?.addEventListener("click", (e) => {
      if (this.state.activePreviewCellElement) {
        const index = parseInt(
          this.state.activePreviewCellElement.dataset.index
        );
        const data = this.cellDataStore.get(index);
        if (data?.url) {
          window.open(data.url, "_blank", "noopener,noreferrer");
        }
      }
      e.stopPropagation(); // Prevent document click handler from closing modal
    });
    window.addEventListener("resize", this._handleWindowResize);
  }

  _handleCellClick(event) {
    if (this.state.isDragging) return; // Don't process click if it was part of a drag
    const cell = event.currentTarget;
    const index = parseInt(cell.dataset.index);
    const data = this.cellDataStore.get(index);
    if (data) {
      this._createRipple(event, cell);
      this._handleCellInteraction(cell, data, true); // True to show preview on simple click
    }
  }

  _handleCellHover(cell, isHovering) {
    const index = parseInt(cell.dataset.index);
    const data = this.cellDataStore.get(index);
    if (!data) return;

    if (isHovering) {
      this._attemptAudioResume();
      const params = this._getSoundParamsForMode(index);
      const volumeMultiplier = data.isSpecialLink
        ? IaGrid.config.specialLinkVolumeBoost
        : 1;
      this._playSound(
        index,
        0.1,
        params.waveform,
        params.volume * 0.4 * volumeMultiplier,
        params.detune
      );
      if (
        data.isSpecialLink &&
        this.state.isAudioInitialized &&
        this.state.noiseBuffer
      ) {
        this._playWhiteNoise();
      }
      this.state.lastHoveredCellIndex = index;
    } else {
      // Only clear if this was indeed the last cell hovered (relevant for focus/blur vs mouse)
      if (this.state.lastHoveredCellIndex === index) {
        this.state.lastHoveredCellIndex = -1;
      }
    }
  }

  _handleCellInteraction(cell, data, showPreview = false) {
    this._attemptAudioResume();
    const index = data.index;
    const params = this._getSoundParamsForMode(index);
    this._playSoundComplex(index, params);

    if (!cell.classList.contains("clicked")) {
      cell.classList.add("clicked");
      this.state.selectedCellsCount++;
    }
    this._applyColorToCell(cell, index);

    if (showPreview) {
      this._showPreviewModal(cell, data);
    }
  }
  _handlePointerDown(event) {
    // Only respond to primary button for mouse, or any touch/pen
    if (event.button !== 0 && event.pointerType === "mouse") return;
    this._attemptAudioResume(); // Ensure audio context is active
    const targetCell = event.target.closest(".grid-cell");
    if (!targetCell) return;

    this.state.drawing = true;
    this.state.pointerDownCell = targetCell; // Store the cell where pointerdown occurred
    this.state.isDragging = false; // Reset dragging state
    this.state.pointerDownX = event.clientX;
    this.state.pointerDownY = event.clientY;
    // Add move listener to the grid container itself for better control during drag
    this.dom.gridContainer.addEventListener(
      "pointermove",
      this._handlePointerMove
    );

    // Handle initial interaction for the pressed cell (without showing preview yet)
    const index = parseInt(targetCell.dataset.index);
    const data = this.cellDataStore.get(index);
    if (data) {
      this._createRipple(event, targetCell);
      this._handleCellInteraction(targetCell, data, false); // false: don't show preview on pointer down
    }
  }
  _handlePointerMove(event) {
    if (!this.state.drawing) return; // Only if drawing (pointer is down)

    const dx = event.clientX - this.state.pointerDownX;
    const dy = event.clientY - this.state.pointerDownY;

    if (
      !this.state.isDragging &&
      (Math.abs(dx) > IaGrid.config.dragThreshold ||
        Math.abs(dy) > IaGrid.config.dragThreshold)
    ) {
      this.state.isDragging = true;
      // If a preview was about to show from a quick click, hide it if drag starts
      if (this.dom.previewModal.classList.contains("ready-to-show")) {
        this.dom.previewModal.classList.remove("ready-to-show", "visible");
      }
    }

    if (this.state.isDragging) {
      // Use elementFromPoint on the shadowRoot to get the cell under the current pointer position
      const targetElement = this.shadowRoot.elementFromPoint(
        event.clientX,
        event.clientY
      );
      if (targetElement?.classList.contains("grid-cell")) {
        const index = parseInt(targetElement.dataset.index);
        const data = this.cellDataStore.get(index);
        // Apply interaction if it's a new cell and not already clicked during this drag
        if (data && !targetElement.classList.contains("clicked")) {
          this._createRipple(event, targetElement);
          this._handleCellInteraction(targetElement, data, false); // false: no preview during drag
        }
        // Handle hover sound for the current cell under pointer
        if (index !== this.state.lastHoveredCellIndex) {
          this._handleCellHover(targetElement, true);
        }
      } else if (this.state.lastHoveredCellIndex !== -1) {
        // If pointer moves off the grid, stop hover sound for the last hovered cell
        const lastCell = this.cellDataStore.get(
          this.state.lastHoveredCellIndex
        )?.element;
        if (lastCell) this._handleCellHover(lastCell, false);
      }
    }
  }
  _handlePointerUp(event) {
    // Remove move listener from grid container regardless of where pointerup occurs
    this.dom.gridContainer?.removeEventListener(
      "pointermove",
      this._handlePointerMove
    );

    if (!this.state.drawing) return; // If not drawing, nothing to do

    // If it wasn't a drag and a cell was pressed, show its preview
    if (!this.state.isDragging && this.state.pointerDownCell) {
      const index = parseInt(this.state.pointerDownCell.dataset.index);
      const data = this.cellDataStore.get(index);
      if (data) {
        this._showPreviewModal(this.state.pointerDownCell, data);
      }
    }

    // Reset drawing states
    this.state.drawing = false;
    this.state.pointerDownCell = null;
    this.state.isDragging = false; // Important to reset for next interaction
    this.state.lastHoveredCellIndex = -1; // Reset last hovered cell
  }
  _handleDocumentClick(event) {
    const path = event.composedPath();
    // Close links table if click is outside
    if (
      this.state.isLinksTableVisible &&
      !path.includes(this.dom.linksTableContainer) &&
      !path.includes(this.dom.toggleLinksButton)
    ) {
      this._setLinksTableVisibility(false);
    }
    // Close preview modal if click is outside of it and not on a grid cell (which would open a new one)
    const previewModalClicked = path.includes(this.dom.previewModal);
    const gridCellClicked = path.some((el) =>
      el.classList?.contains("grid-cell")
    );

    if (
      this.state.activePreviewCellElement &&
      !previewModalClicked &&
      !gridCellClicked
    ) {
      this._closePreviewModal();
    }
  }
  _handleDocumentKeydown(event) {
    if (event.key === "Escape") {
      if (this.state.isLinksTableVisible) {
        event.preventDefault();
        this._setLinksTableVisibility(false);
      } else if (this.state.activePreviewCellElement) {
        // Check if preview modal is active
        event.preventDefault();
        this._closePreviewModal();
      }
    }
  }
  _handleWindowResize() {
    this._applyColorModeStyle(); // Re-apply colors as viewport-dependent units might change
    if (this.state.activePreviewCellElement) {
      this._positionPreviewModal(this.state.activePreviewCellElement);
    }
  }
  _calculateFrequency(index) {
    const scale = IaGrid.config.pentatonicScale; // e.g., [0, 2, 4, 7, 9] (semitones from root)
    const scaleSteps = scale.length; // 5
    // Map 256 cells to roughly 4 octaves of the pentatonic scale
    const octave = Math.floor(index / (scaleSteps * 4)) % 4; // Spread over 4 "sub-octaves" within the 4 main octaves
    const stepInScale = index % scaleSteps;
    // Add a slight offset within the octave based on progression through the grid section
    const degreeOffset = Math.floor(index / scaleSteps) % 4; // Creates 4 groups within each main octave block

    const semitones = scale[stepInScale] + octave * 12 + degreeOffset * 1.5; // Small chromatic shift
    return IaGrid.config.baseFrequency * Math.pow(2, semitones / 12);
  }
  _playSound(
    index,
    duration = 0.3,
    waveform = "sine",
    volume = IaGrid.config.audioVolume,
    detune = 0
  ) {
    const audioCtx = this.state.audioContext;
    if (
      !this.state.isAudioInitialized ||
      !audioCtx ||
      audioCtx.state !== "running"
    ) {
      // console.warn("Audio not ready or context suspended.");
      return;
    }
    try {
      const freq = this._calculateFrequency(index);
      const osc = audioCtx.createOscillator();
      const gain = audioCtx.createGain();
      const now = audioCtx.currentTime;

      gain.gain.setValueAtTime(0, now); // Start from 0 volume
      gain.gain.linearRampToValueAtTime(volume, now + 0.01); // Quick attack
      gain.gain.exponentialRampToValueAtTime(volume * 0.01, now + duration); // Exponential decay

      osc.type = waveform;
      osc.frequency.setValueAtTime(freq, now);
      osc.detune.setValueAtTime(detune, now); // For vibrato or chorus like effects
      osc.connect(gain);
      gain.connect(audioCtx.destination);
      osc.start(now);
      osc.stop(now + duration + 0.05); // Add a bit more time for ramp down
    } catch (e) {
      console.error("Error playing sound:", e);
    }
  }
  _getSoundParamsForMode(index) {
    const base = {
      duration: 0.3,
      waveform: "sine",
      volume: IaGrid.config.audioVolume,
      detune: 0,
    };
    switch (this.state.soundMode) {
      case "harmony":
        return {
          ...base,
          duration: 0.4,
          waveform: "triangle",
          volume: IaGrid.config.audioVolume * 0.8,
          detune: Math.sin(index * 0.4) * 8,
        };
      case "chords":
        return {
          ...base,
          duration: 0.6,
          waveform: "sawtooth",
          volume: IaGrid.config.audioVolume * 0.6,
        };
      case "fifths":
        return {
          ...base,
          duration: 0.5,
          waveform: "square",
          volume: IaGrid.config.audioVolume * 0.7,
        };
      case "tones": // Simple tones
      default:
        return base;
    }
  }
  _playSoundComplex(index, params) {
    const audioCtx = this.state.audioContext;
    if (
      !this.state.isAudioInitialized ||
      !audioCtx ||
      audioCtx.state !== "running"
    )
      return;

    this._playSound(
      index,
      params.duration,
      params.waveform,
      params.volume,
      params.detune
    );

    const numCells = IaGrid.config.gridDimension * IaGrid.config.gridDimension;
    if (this.state.soundMode === "chords") {
      // Play a major chord (root, M3, P5)
      this._playSound(
        (index + 4) % numCells,
        params.duration * 0.9,
        params.waveform,
        params.volume * 0.7,
        params.detune
      ); // Major third-ish
      this._playSound(
        (index + 7) % numCells,
        params.duration * 0.8,
        params.waveform,
        params.volume * 0.6,
        params.detune
      ); // Perfect fifth-ish
    } else if (this.state.soundMode === "fifths") {
      // Play root and fifth
      this._playSound(
        (index + 7) % numCells,
        params.duration * 0.9,
        params.waveform,
        params.volume * 0.8,
        params.detune
      );
    }
    // "harmony" mode might add subtle detuned unison or octave, handled by its detune param in _getSoundParamsForMode
  }

  _applyColorToCell(cell, index) {
    if (!cell || !cell.classList.contains("clicked")) return;
    const currentStyle = getComputedStyle(cell); // Get current computed style of the cell itself
    const numCells = IaGrid.config.gridDimension * IaGrid.config.gridDimension;

    // Helper to reset dynamic color properties
    const resetDynamicColors = () => {
      cell.style.removeProperty("--color-oklch-dynamic");
      cell.style.removeProperty("--color-grayscale-dynamic");
      // Only clear explicit background if it was set by JS for RGB mode and we are changing modes
      if (cell.style.backgroundColor && this.state.colorMode !== "rgb") {
        cell.style.backgroundColor = ""; // Reset to CSS default
      }
    };

    switch (this.state.colorMode) {
      case "oklch": {
        const lBase = parseFloat(
          currentStyle.getPropertyValue("--color-oklch-clicked-l").trim()
        );
        const lRange = parseFloat(
          currentStyle.getPropertyValue("--color-oklch-clicked-l-range").trim()
        );
        const lightness = lBase + (index / (numCells - 1)) * lRange; // Normalized index for lightness
        const chroma =
          0.15 + 0.1 * Math.sin(index / 12 + performance.now() / 1200); // Dynamic chroma
        const hue = (performance.now() / 60 + index * 1.5) % 360; // Dynamic hue
        const finalLightness = clamp(lightness, 0, 1); // Ensure lightness is within [0, 1]
        cell.style.setProperty(
          "--color-oklch-dynamic",
          oklchToCss(finalLightness, chroma, hue)
        );
        cell.style.removeProperty("--color-grayscale-dynamic"); // Clear other dynamic color props
        cell.style.backgroundColor = ""; // Ensure CSS class applies
        break;
      }
      case "grayscale": {
        const baseGray = parseInt(
          currentStyle.getPropertyValue("--color-grayscale-clicked-base").trim()
        );
        const rangeGray = parseInt(
          currentStyle
            .getPropertyValue("--color-grayscale-clicked-range")
            .trim()
        );
        const grayValue = clamp(
          Math.round(baseGray + (index / (numCells - 1)) * rangeGray),
          0,
          255
        );
        cell.style.setProperty(
          "--color-grayscale-dynamic",
          `rgb(${grayValue}, ${grayValue}, ${grayValue})`
        );
        cell.style.removeProperty("--color-oklch-dynamic");
        cell.style.backgroundColor = "";
        break;
      }
      case "rgb": {
        // Simple RGB mapping based on row and column
        const row = Math.floor(index / IaGrid.config.gridDimension);
        const col = index % IaGrid.config.gridDimension;
        const r = Math.round(col * (255 / (IaGrid.config.gridDimension - 1)));
        const g = Math.round(row * (255 / (IaGrid.config.gridDimension - 1)));
        const b = 128; // Constant blue component for this mode
        cell.style.backgroundColor = `rgb(${r}, ${g}, ${b})`;
        resetDynamicColors(); // Clear OKLCH/Grayscale vars
        break;
      }
      case "monochrome":
      default:
        resetDynamicColors(); // Clear all dynamic color vars
        cell.style.backgroundColor = ""; // Let CSS class '.clicked' and its variable handle it
        break;
    }
  }

  _applyColorModeStyle() {
    if (!this.dom.gridContainer) return;
    this.dom.gridContainer.className = `grid-container js-grid-container encoding-${this.state.currentEncoding} ${this.state.colorMode}`;
    // Re-apply colors to already clicked cells
    this.cellDataStore.forEach((data, index) => {
      if (data.element) {
        // Check if element exists
        if (data.element.classList.contains("clicked")) {
          this._applyColorToCell(data.element, index);
        } else {
          // Ensure non-clicked cells revert to their base style from CSS
          data.element.style.backgroundColor = "";
          data.element.style.removeProperty("--color-oklch-dynamic");
          data.element.style.removeProperty("--color-grayscale-dynamic");
        }
      }
    });
  }

  _createPreviewElement(data) {
    const typeInfo = data.typeInfo || IaGrid.config.previewTypes["link"]; // Fallback to link type info
    let mainElement;

    try {
      switch (data.previewType) {
        case "iframe":
          mainElement = createElement("iframe", {
            src: data.url,
            loading: "lazy",
            // Consider more restrictive sandbox if content is untrusted:
            // sandbox: "allow-scripts allow-same-origin", // Example
            title: data.title || "Embedded Content",
          });
          break;
        case "image":
          mainElement = createElement("img", {
            src:
              data.imageUrl ||
              IaGrid.config.placeholderImageUrl(data.asciiCode),
            alt: data.title || `Image for code ${data.asciiCode}`,
            loading: "lazy",
          });
          break;
        case "vimeo": // Example for specific handling, could be iframe too
        case "github":
        case "medium":
        case "scholar":
        case "link":
        case "placeholder": // Fallthrough for text-based previews
        default: {
          const children = [];
          if (typeInfo.icon) {
            children.push(
              createElement("span", {
                className: "preview-link-icon",
                textContent: typeInfo.icon,
                "aria-hidden": "true",
              })
            );
          }
          children.push(
            createElement("div", {
              id: "preview-title-label",
              className: "preview-title",
              textContent: data.title,
            })
          );
          if (typeInfo.hasDesc && data.description) {
            children.push(
              createElement("div", {
                className: "preview-desc",
                textContent: data.description,
              })
            );
          }
          // If no specific title/desc but it's a link, show URL
          if (
            !data.title &&
            !data.description &&
            data.url !== `${IaGrid.config.defaultUrlBase}${data.asciiCode}`
          ) {
            children.push(
              createElement("div", {
                className: "preview-desc",
                textContent: `Link to: ${data.url}`,
              })
            );
          }
          mainElement = createElement("div", {
            className: "preview-text-wrapper",
            children: children,
          });
          break;
        }
      }
    } catch (error) {
      console.error("Error creating preview element:", error);
      mainElement = createElement("div", {
        className: "preview-text-wrapper",
        textContent: "Error loading preview.",
      });
    }
    const footerHtml = `<strong>${data.ascii || ""}</strong><span>|</span>${
      data.asciiDesc || ""
    }<span>|</span>Dec: ${data.asciiCode}<span>|</span>Hex: ${
      data.hex || ""
    }<span>|</span>Bin: ${data.bin || ""}`;
    return { mainElement, footerHtml };
  }

  _positionPreviewModal(cellElement) {
    if (!cellElement || !this.dom.previewModal) return;
    const modal = this.dom.previewModal;
    const cellRect = cellElement.getBoundingClientRect(); // Cell position relative to viewport

    // Modal dimensions (use offsetWidth/Height as it's rendered but may be invisible)
    const modalW = modal.offsetWidth || parseInt(getComputedStyle(modal).width);
    const modalH =
      modal.offsetHeight || parseInt(getComputedStyle(modal).height);

    // Viewport dimensions
    const vpW = document.documentElement.clientWidth;
    const vpH = document.documentElement.clientHeight;
    const margin = IaGrid.config.modalViewportMargin;

    // Ideal position: centered over the cell
    let idealTop = cellRect.top + cellRect.height / 2 - modalH / 2;
    let idealLeft = cellRect.left + cellRect.width / 2 - modalW / 2;

    // Adjust if modal goes off-screen
    idealTop = clamp(idealTop, margin, vpH - modalH - margin);
    idealLeft = clamp(idealLeft, margin, vpW - modalW - margin);

    modal.style.top = `${Math.round(idealTop)}px`;
    modal.style.left = `${Math.round(idealLeft)}px`;
  }

  _showPreviewModal(cellElement, cellData) {
    // If another preview is already showing for a different cell, close it first immediately
    if (
      this.state.activePreviewCellElement &&
      this.state.activePreviewCellElement !== cellElement &&
      this.dom.previewModal.classList.contains("visible")
    ) {
      this._closePreviewModal(true); // true for immediate close
    }
    this.state.activePreviewCellElement = cellElement; // Set current active cell

    const { mainElement, footerHtml } = this._createPreviewElement(cellData);
    this.dom.previewModalMain.innerHTML = ""; // Clear previous content
    this.dom.previewModalMain.appendChild(mainElement);
    this.dom.previewModalFooter.innerHTML = footerHtml;

    // Update modal class based on encoding for potential specific styling (like text mirroring)
    this.dom.previewModal.className = `preview-modal js-preview-modal encoding-${this.state.currentEncoding}`;
    // Position it first (while potentially invisible)
    this._positionPreviewModal(cellElement);

    // Use rAF to ensure positioning is applied before making it visible for smooth transition
    requestAnimationFrame(() => {
      this.dom.previewModal.classList.add("ready-to-show"); // Mark as ready (styles might depend on this)
      requestAnimationFrame(() => {
        // Second rAF to trigger transition
        this.dom.previewModal.classList.add("visible");
        this.dom.previewModal.setAttribute("aria-hidden", "false");
        // Focus management: focus the close button after transition
        const focusCloseButton = () => {
          // Check if modal is still visible before focusing (it might have been closed quickly)
          if (this.dom.previewModal.classList.contains("visible")) {
            this.dom.previewModalCloseButton.focus();
          }
        };
        // Delay focus until after CSS transition
        setTimeout(
          focusCloseButton,
          IaGrid.config.transitionDurationMedium * 1000 + 50
        );
      });
    });
  }

  _closePreviewModal(immediate = false) {
    if (
      !this.state.activePreviewCellElement &&
      !this.dom.previewModal.classList.contains("visible")
    )
      return;

    const elementToFocus = this.state.activePreviewCellElement; // Cell that triggered the modal

    if (immediate) {
      this.dom.previewModal.style.transition = "none"; // Disable transition for immediate close
    }

    this.dom.previewModal.classList.remove("visible");

    // Cleanup function to be called after transition or immediately
    const cleanup = () => {
      this.dom.previewModal.classList.remove("ready-to-show");
      this.dom.previewModal.setAttribute("aria-hidden", "true");
      // Reset transform for mirrored text if it was applied, or any other dynamic style
      this.dom.previewModal.style.removeProperty("--preview-transform");
      this.state.activePreviewCellElement = null;

      // Only move off-screen if it's truly not visible, to prevent flicker if re-opened quickly
      if (!this.dom.previewModal.classList.contains("visible")) {
        this.dom.previewModal.style.top = "-9999px"; // Move off-screen
        this.dom.previewModal.style.left = "-9999px";
      }

      if (immediate) {
        // Restore transition if it was disabled
        void this.dom.previewModal.offsetWidth; // Force reflow
        this.dom.previewModal.style.transition = "";
      }
      this.dom.previewModal.removeEventListener("transitionend", cleanup); // Clean self
    };

    // If not immediate and opacity transition is happening, wait for it
    if (!immediate && getComputedStyle(this.dom.previewModal).opacity !== "0") {
      this.dom.previewModal.addEventListener("transitionend", cleanup, {
        once: true,
      });
    } else {
      cleanup(); // Otherwise, cleanup immediately
    }

    // Return focus to the cell that opened the modal, if it's still part of the shadow DOM
    if (
      elementToFocus &&
      this.shadowRoot.contains(elementToFocus) &&
      document.activeElement !== elementToFocus
    ) {
      elementToFocus.focus();
    }
    // Fallback to ensure modal is hidden if transitionend doesn't fire for some reason
    setTimeout(() => {
      if (
        !this.dom.previewModal.classList.contains("visible") &&
        this.dom.previewModal.style.top !== "-9999px"
      ) {
        cleanup();
      }
    }, IaGrid.config.transitionDurationMedium * 1000 + 100); // Slightly longer than transition
  }

  _setEncoding(encoding) {
    if (this.state.currentEncoding === encoding) return;
    this.state.currentEncoding = encoding;
    this._generateCellData(); // Regenerate cell data based on new encoding
    this._populateLinksTable(); // Update links table with new characters/descriptions
    this._createGrid(); // Recreate the grid display
    if (this.state.activePreviewCellElement) {
      // If a preview was open, close it
      this._closePreviewModal(true); // Close immediately
    }
  }

  _setColorMode(mode) {
    if (this.state.colorMode === mode) return;
    this.state.colorMode = mode;
    this._applyColorModeStyle(); // This will update grid container class and re-apply colors to clicked cells
  }

  _setSoundMode(sound) {
    this.state.soundMode = sound;
    // No immediate visual change, but will affect next sound played
  }

  _resetGrid() {
    // Iterate over all cells and remove 'clicked' class and any inline styles for color
    $$(".grid-cell.clicked", this.shadowRoot).forEach((cell) => {
      cell.classList.remove("clicked");
      cell.style.backgroundColor = ""; // Reset to default from CSS
      cell.style.removeProperty("--color-oklch-dynamic"); // Remove OKLCH var
      cell.style.removeProperty("--color-grayscale-dynamic"); // Remove Grayscale var
    });
    this.state.selectedCellsCount = 0;
    this._closePreviewModal(true); // Close any open preview immediately
    this._applyColorModeStyle(); // Ensure grid container class is correct for monochrome reset
  }

  _setLinksTableVisibility(visible) {
    if (this.state.isLinksTableVisible === visible) return;
    this.state.isLinksTableVisible = visible;
    this.dom.linksTableContainer.classList.toggle("visible", visible);
    this.dom.linksTableContainer.setAttribute(
      "aria-hidden",
      (!visible).toString()
    );
    this.dom.toggleLinksButton.setAttribute(
      "aria-expanded",
      visible.toString()
    );
    this.dom.toggleLinksButton.textContent = visible
      ? "Hide Links"
      : "Show Links";

    if (visible) {
      // Focus management: focus the close button after transition
      const focusCloseButton = () => {
        if (this.dom.linksTableContainer.classList.contains("visible")) {
          // Check if still visible
          this.dom.linksTableCloseButton.focus();
        }
      };
      setTimeout(
        focusCloseButton,
        IaGrid.config.transitionDurationTable * 1000 + 50
      ); // Delay focus
    } else {
      // If focus was inside the table, return it to the toggle button
      if (
        this.dom.linksTableContainer.contains(
          this.shadowRoot.activeElement || document.activeElement
        )
      ) {
        this.dom.toggleLinksButton.focus();
      }
    }
  }
}

customElements.define("ia-grid", IaGrid);
