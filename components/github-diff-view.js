const DIFF_RENDER_STYLES = `
<link href="https://fonts.googleapis.com/css2?family=Material+Icons+Round" rel="stylesheet" />
<style>
.change-diff {
    --color-border-subtle: #1f232826;
    --color-bg-subtle: #f6f8fa;
    --color-bg-default: #ffffff;
    --color-fg-default: #1f2328;
    --color-fg-active: #218bff;
    --color-fg-muted: #656d76;
    --color-diff-add: #1f883d;
    --color-diff-del: #cf222e;

    --size-padding-code: 4px;
    --size-padding-default: 8px;
    --size-padding-large: 24px;
    --size-border-default: 1px;
    --size-border-radius-container: 8px;
    --size-diff-line-num: 88px;
    --size-diff-line-height: 24px;

    font-family: monospace;
    font-size: 1em;
    background: var(--color-bg-default);
    color: var(--color-fg-default);
    border-radius: var(--size-border-radius-container);
    border: solid var(--size-border-default) var(--color-border-subtle);
    overflow: hidden;

    .diff-header {
        display: flex;
        align-items: center;
        justify-content: start;
        padding: var(--size-padding-default) var(--size-padding-large);
        gap: var(--size-padding-default);
        background: var(--color-bg-subtle);
        color: var(--color-fg-muted);
        cursor: default;
        border-bottom: solid var(--size-border-default) var(--color-border-subtle);

        .material-icons-round {
            font-size: 1em;
            font-weight: 900;
        }

        .diff-summary-count {
            font-weight: 900;
        }

        .diff-filename, .copy-filename {
            color: var(--color-fg-default);
            cursor: pointer;

            &:hover {
                color: var(--color-fg-active);
            }
        }

        .diff-filename {
            padding: var(--size-padding-code);

            &:hover {
                text-decoration: underline;
            }
        }

        .copy-filename {
            opacity: 1;
            transition: opacity 0.3s ease-in-out;
        }

        .diff-summary-bar {
            display: flex;
            align-items: center;
            justify-content: center;
            font-size: 0.5em;
            gap: 0.1em;

            .material-icons-round {
                color: var(--color-bg-subtle);
                background: var(--color-border-subtle);
                border-radius: 0.2em;
                scale: 0.9;
                margin: -0.05em;
            }

            .diff-line-add, .diff-line-del {
                scale: 1;
                margin: 0;
            }

            .diff-line-del {
                color: var(--color-diff-del);
            }

            .diff-line-add {
                color: var(--color-diff-add);
            }

            .diff-line-del {
                color: var(--color-diff-del);
                scale: 1;
            }
        }
    }

    .diff-line {
        display: flex;
        align-items: center;
        justify-content: start;
        min-height: var(--size-diff-line-height);
        max-height: var(--size-diff-line-height);

        &.diff-line-del {
            background: color-mix(in srgb, var(--color-diff-del) 20%, transparent);
        }

        &.diff-line-add {
            background: color-mix(in srgb, var(--color-diff-add) 20%, transparent);
        }

        &.diff-line-sum {
            background: color-mix(in srgb, var(--color-fg-active) 20%, transparent);
        }

        &:active, &:focus {
            font-weight: 900;
            outline: 0;

            .diff-line-nil {
                font-weight: 900;
            }
        }

        .code-line {
            margin: 0;
            font-size: 0.8em;
            padding: var(--size-padding-code);
            display: flex;
            align-items: center;
            justify-content: left;
            height: var(--size-diff-line-height);

            &.diff-line-nil {
                color: var(--color-diff-del);
                font-size: 1.2em;
            }
        }

        .diff-line-num {
            background: color-mix(in srgb, var(--color-bg-subtle) 50%, transparent);
            padding: 0 var(--size-padding-code);
            user-select: none;
            cursor: pointer;
            display: flex;
            align-items: center;
            justify-content: space-between;
            gap: calc(var(--size-padding-code) / 2);
            height: var(--size-diff-line-height);
            max-width: var(--size-diff-line-num);
            min-width: var(--size-diff-line-num);

            .line-num-base, .line-num-head {
                display: flex;
                max-width: calc(var(--size-diff-line-num) / 2 - var(--size-padding-code) / 4);
                min-width: calc(var(--size-diff-line-num) / 2 - var(--size-padding-code) / 4);
                text-overflow: ellipsis;
                overflow: auto hidden;
                padding: 0;
                text-align: end;
                justify-content: end;
                align-items: center;
            }
        }
    }
}
</style>
`;

// Define the web component
class DiffView extends HTMLElement {
  static NAME = "github-diff-view";
  static DEPS = {
    // https://github.com/octokit/octokit.js#usage
    "https://esm.sh/octokit": { Octokit: "Octokit" },
  };
  static RENDER = {
    CHANGEBAR_STOPS: 5,
    CLS_ICON_SET: "material-icons-round",
    CLS_COPY_BTN: "copy-filename",
    CLS_LINE_ADD: "diff-line-add",
    CLS_LINE_DEL: "diff-line-del",
    CLS_LINE_NIL: "diff-line-nil",
    CLS_LINE_SUM: "diff-line-sum",
    TOKEN_LINE_ADD: "+",
    TOKEN_LINE_DEL: "-",
    TOKEN_LINE_NIL: "\\ No newline at end of file",
    TEXT_COPY_BTN: "filter_none",
  };

  /* Required attributes */
  static ATTR_HEAD = "head";
  static ATTR_BASE = "base";
  static ATTR_FILE = "file";
  static ATTR_REPO = "repo";
  /* Optional attributes */
  /** Github auth token used when present */
  static ATTR_AUTH = "auth";

  constructor() {
    super();
    this._deps = Promise.all(
      Object.entries(DiffView.DEPS).map(async ([scriptUrl, shimImports]) => {
        const module = await import(scriptUrl);
        Object.entries(shimImports).forEach(([sourceKey, targetValue]) => {
          Object.defineProperty(window, targetValue, {
            value: module[sourceKey],
          });
        });
      })
    );
  }

  get params() {
    const urlParams = new URLSearchParams(window.location.search);
    const attrParams = {
      auth:
        this.getAttribute(DiffView.ATTR_AUTH) ??
        urlParams.get(DiffView.ATTR_AUTH) ??
        undefined,
      repo:
        this.getAttribute(DiffView.ATTR_REPO) ??
        urlParams.get(DiffView.ATTR_REPO),
      file:
        this.getAttribute(DiffView.ATTR_FILE) ??
        urlParams.get(DiffView.ATTR_FILE),
      head:
        this.getAttribute(DiffView.ATTR_HEAD) ??
        urlParams.get(DiffView.ATTR_HEAD),
      base:
        this.getAttribute(DiffView.ATTR_BASE) ??
        urlParams.get(DiffView.ATTR_BASE),
    };
    return {
      ...attrParams,
      compareUrlPath: `${attrParams.repo}/compare/${attrParams.head}...${attrParams.base}`,
    };
  }

  connectedCallback() {
    let hasRequiredAttributes = true;
    const { ...requiredAttrs } = this.params;
    delete requiredAttrs.auth;
    const component = document.createElement(DiffView.NAME);
    Object.entries(requiredAttrs).forEach(([key, value]) => {
      if (!value) return (hasRequiredAttributes = false);
      component.setAttribute(key, value);
    });
    this._componentCode = component.outerHTML;

    if (hasRequiredAttributes) {
      this.render();
    } else {
      const prettyJson = JSON.stringify(requiredAttrs, null, 2);
      this.innerHTML = `<p>Missing some parameters</p><pre><code>${prettyJson}</code><pre>`;
    }
  }

  /**
   * Fetch and render the diff
   */
  async render() {
    const { auth, file, compareUrlPath } = this.params;
    const diffApiUrl = `https://api.github.com/repos/${compareUrlPath}`;

    await this._deps;
    /** @ts-expect-error Octokit is fetched from the linked {@link DiffView.DEPS} */
    const octokit = new Octokit({ auth });
    octokit
      .request(`GET ${diffApiUrl}`)
      .then(
        (
          /** @type {{ data: { files: { filename: string; patch: string }[]; }}} */ {
            data,
          }
        ) => {
          const diffPatch = data.files.filter((f) => f.filename === file)[0]
            ?.patch;
          if (file && diffPatch) {
            this.innerHTML = DIFF_RENDER_STYLES; // clear existing diff
            this.appendChild(this.convertDiffToHtml(file, diffPatch));
          } else {
            throw `Missing '${file}' diff: ${diffApiUrl}`;
          }
        }
      )
      .catch((/** @type {Error} */ error) => {
        console.error(error);
        this.innerHTML = `<p>Error loading diff</p>`;
      });
  }

  /**
   * Convert patch string to html elements that can be rendered.
   * @param {string} filename relative file path
   * @param {string} patch git diff patch string
   */
  convertDiffToHtml(filename, patch) {
    // patch lines
    const [summary, ...diffLines] = patch.split("\n");
    const lineNumStart = Number(summary.match(/\+(\d+)/)?.[1]);
    let lineCountBase = 0;
    let lineCountHead = 0;
    let lineCountSkip = 0;

    // code diff line elements
    const lineDiffRenders = diffLines.map((line) => {
      let lineNumBase = 0;
      let lineNumHead = 0;
      if (line.startsWith(DiffView.RENDER.TOKEN_LINE_DEL)) {
        lineNumBase = lineNumStart + lineCountSkip + lineCountBase;
        lineCountBase += 1;
      } else if (line.startsWith(DiffView.RENDER.TOKEN_LINE_ADD)) {
        lineNumHead = lineNumStart + lineCountSkip + lineCountHead;
        lineCountHead += 1;
      } else {
        lineNumBase = lineNumStart + lineCountSkip + lineCountBase;
        lineNumHead = lineNumStart + lineCountSkip + lineCountHead;
        lineCountSkip += 1;
      }
      return this.createDiffLine(line, lineNumBase, lineNumHead);
    });
    // prepend code summary diff line
    lineDiffRenders.unshift(this.createDiffLine(summary));

    // view header elems
    const lineCountDiff = lineCountBase + lineCountHead;
    const lineCountTotal = lineCountDiff + lineCountSkip;
    const changeStopScale = DiffView.RENDER.CHANGEBAR_STOPS / lineCountTotal;
    const changeSummaryCountDel = Math.round(changeStopScale * lineCountBase);
    const changeSummaryCountAdd = Math.round(changeStopScale * lineCountHead);
    const compareLink = `https://github.com/${this.params.compareUrlPath}/#${filename}`;
    const headerElems = [
      `<div class="diff-header">`,
      `<span class="diff-summary-count">${lineCountDiff}</span>`,
      `<span class="diff-summary-bar">`,
      ...Array(DiffView.RENDER.CHANGEBAR_STOPS)
        .fill(null)
        .map((_, i) => {
          return `<span class="${
            DiffView.RENDER.CLS_ICON_SET
          } change-bar-stop-${i} ${
            i < changeSummaryCountAdd
              ? DiffView.RENDER.CLS_LINE_ADD
              : i - changeSummaryCountAdd < changeSummaryCountDel
              ? DiffView.RENDER.CLS_LINE_DEL
              : DiffView.RENDER.CLS_LINE_NIL
          }">square</span>`;
        }),
      `</span>`,
      `<a class="diff-filename" title="Open in github comparison" tabindex="0" href=${compareLink} target="_blank">${filename}</a>`,
      `<span class="${DiffView.RENDER.CLS_COPY_BTN} ${DiffView.RENDER.CLS_ICON_SET}" title="Copy component code">${DiffView.RENDER.TEXT_COPY_BTN}</span>`,
      `</div>`,
    ];

    // wrapper elem
    const diffHtml = document.createElement("div");
    diffHtml.className = "change-diff";
    diffHtml.innerHTML = [...headerElems, ...lineDiffRenders].join("");

    this.setupCopyButton(
      diffHtml.querySelector(`.${DiffView.RENDER.CLS_COPY_BTN}`)
    );

    return diffHtml;
  }

  createDiffLine(
    /** @type {string} */ lineContent,
    /** @type {number} */ lineNumBase = 0,
    /** @type {number} */ lineNumHead = 0
  ) {
    const isEmptyLine = lineContent.startsWith(DiffView.RENDER.TOKEN_LINE_NIL);
    const lineClass =
      Boolean(lineNumBase) === Boolean(lineNumHead)
        ? lineNumBase
          ? DiffView.RENDER.CLS_LINE_NIL
          : DiffView.RENDER.CLS_LINE_SUM
        : lineNumBase
        ? DiffView.RENDER.CLS_LINE_DEL
        : DiffView.RENDER.CLS_LINE_ADD;

    // use native inner text escape to handle possible html code insertion
    const codeContainer = document.createElement("pre");
    codeContainer.className = "code-line";
    if (isEmptyLine)
      codeContainer.classList.add(
        DiffView.RENDER.CLS_ICON_SET,
        DiffView.RENDER.CLS_LINE_NIL
      );
    codeContainer.innerText =
      (isEmptyLine && "remove_circle_outline") ||
      lineContent.replace(/(.)/, (s) => `${s} `);

    return `
<div class="diff-line ${lineClass}" tabindex="0">
  <span class="diff-line-num">
      <span class="line-num-base">${(!isEmptyLine && lineNumBase) || ""}</span>
      <span class="line-num-head">${(!isEmptyLine && lineNumHead) || ""}</span>
  </span>
  ${codeContainer.outerHTML}
</div>
`;
  }

  /**
   * Copy component code to clipboard when element is clicked
   * @param {HTMLElement | null} copyButton
   * @returns
   */
  setupCopyButton(copyButton) {
    if (!copyButton) return;

    const copyButtonTextDefault = DiffView.RENDER.TEXT_COPY_BTN;
    const copyButtonTextSuccess = "done";
    const copyButtonTextFailure = "close";

    copyButton?.addEventListener("click", () => {
      if (!this._componentCode)
        throw `Component code missing: ${this._componentCode}`;

      const setButtonText = (/** @type {string | null} */ buttonText) => {
        copyButton.setAttribute("style", "opacity: 0"),
          setTimeout(() => {
            copyButton.textContent = buttonText;
            copyButton.setAttribute("style", "opacity: 1");
          }, 200);
      };
      const setButtonSuccess = () => setButtonText(copyButtonTextSuccess);
      const setButtonFailure = (/** @type {unknown} */ e) => {
        console.error(e);
        setButtonText(copyButtonTextFailure);
      };
      const resetButtonText = () =>
        setTimeout(() => setButtonText(copyButtonTextDefault), 700);

      try {
        if (navigator.clipboard?.writeText) {
          navigator.clipboard
            .writeText(this._componentCode)
            .then(setButtonSuccess)
            .catch(setButtonFailure)
            .finally(resetButtonText);
        } else {
          // Fallback for browsers without Clipboard API support
          const copyTextHolderId = "copy-text-holder";
          const textarea =
            Array.from(document.getElementsByTagName("textarea")).find(
              (elem) => elem.id === copyTextHolderId
            ) ?? document.createElement("textarea");
          textarea.id = copyTextHolderId;
          textarea.value = this._componentCode;
          textarea.style.visibility = "invisible";
          document.body.appendChild(textarea);
          textarea.select();
          document.execCommand("copy");
          setButtonSuccess();
          document.body.removeChild(textarea);
        }
      } catch (e) {
        setButtonFailure(e);
      } finally {
        resetButtonText();
      }
    });
  }
}

// Define the custom element
customElements.define(DiffView.NAME, DiffView);
