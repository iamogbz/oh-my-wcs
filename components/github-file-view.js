const FILE_RENDER_STYLES = `
<link href="https://fonts.googleapis.com/css2?family=Material+Icons+Round" rel="stylesheet" />
<style>
.file-wrapper {
    --color-border-subtle: #1f232826;
    --color-bg-subtle: #f6f8fa;
    --color-bg-default: #ffffff;
    --color-fg-default: #1f2328;
    --color-fg-active: #218bff;
    --color-fg-muted: #656d76;
    --color-file-add: #1f883d;
    --color-file-del: #cf222e;

    --size-padding-code: 4px;
    --size-padding-default: 8px;
    --size-padding-large: 24px;
    --size-border-default: 1px;
    --size-border-radius-container: 8px;
    --size-file-line-num: 88px;
    --size-file-line-height: 24px;

    font-family: monospace;
    font-size: 1em;
    background: var(--color-bg-default);
    color: var(--color-fg-default);
    border-radius: var(--size-border-radius-container);
    border: solid var(--size-border-default) var(--color-border-subtle);
    overflow: hidden;

    .file-header {
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

        .file-summary-count {
            font-weight: 900;
        }

        .file-filename, .copy-filename {
            color: var(--color-fg-default);
            cursor: pointer;

            &:hover {
                color: var(--color-fg-active);
            }
        }

        .file-filename {
            padding: var(--size-padding-code);

            &:hover {
                text-decoration: underline;
            }
        }

        .copy-filename {
            opacity: 1;
            transition: opacity 0.3s ease-in-out;
        }
    }

    .file-line {
        display: flex;
        align-items: center;
        justify-content: start;
        min-height: var(--size-file-line-height);
        max-height: var(--size-file-line-height);

        &.file-line-del {
            background: color-mix(in srgb, var(--color-file-del) 20%, transparent);
        }

        &.file-line-add {
            background: color-mix(in srgb, var(--color-file-add) 20%, transparent);
        }

        &.file-line-sum {
            background: color-mix(in srgb, var(--color-fg-active) 20%, transparent);
        }

        &:active, &:focus {
            font-weight: 900;
            outline: 0;

            .file-line-nil {
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
            height: var(--size-file-line-height);

            &.file-line-nil {
                color: var(--color-file-del);
                font-size: 1.2em;
            }
        }

        .file-line-num {
            background: color-mix(in srgb, var(--color-bg-subtle) 50%, transparent);
            padding: 0 var(--size-padding-code);
            user-select: none;
            cursor: pointer;
            display: flex;
            align-items: center;
            justify-content: space-between;
            gap: calc(var(--size-padding-code) / 2);
            height: var(--size-file-line-height);
            max-width: var(--size-file-line-num);
            min-width: var(--size-file-line-num);

            .line-num-base, .line-num-head {
                display: flex;
                max-width: calc(var(--size-file-line-num) / 2 - var(--size-padding-code) / 4);
                min-width: calc(var(--size-file-line-num) / 2 - var(--size-padding-code) / 4);
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
class FileView extends HTMLElement {
  static NAME = "github-file-view";
  static DEPS = {
    // https://github.com/octokit/octokit.js#usage
    "https://esm.sh/octokit": { Octokit: "Octokit" },
  };
  static RENDER = {
    CLS_ICON_SET: "material-icons-round",
    CLS_COPY_BTN: "copy-filename",
    CLS_LINE_ADD: "file-line-add",
    CLS_LINE_DEL: "file-line-del",
    CLS_LINE_NIL: "file-line-nil",
    CLS_LINE_SUM: "file-line-sum",
    TOKEN_LINE_ADD: "+",
    TOKEN_LINE_DEL: "-",
    TOKEN_LINE_NIL: "\\ No newline at end of file",
    TEXT_COPY_BTN: "filter_none",
  };

  /* Required attributes */
  static ATTR_REF = "ref";
  static ATTR_LINES = "lines";
  static ATTR_FILE = "file";
  static ATTR_REPO = "repo";
  /* Optional attributes */
  /** Github auth token used when present */
  static ATTR_AUTH = "auth";

  constructor() {
    super();
    this._deps = Promise.all(
      Object.entries(FileView.DEPS).map(async ([scriptUrl, shimImports]) => {
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
        this.getAttribute(FileView.ATTR_AUTH) ??
        urlParams.get(FileView.ATTR_AUTH) ??
        undefined,
      repo:
        this.getAttribute(FileView.ATTR_REPO) ??
        urlParams.get(FileView.ATTR_REPO),
      ref:
        this.getAttribute(FileView.ATTR_REF) ??
        urlParams.get(FileView.ATTR_REF),
      file:
        this.getAttribute(FileView.ATTR_FILE) ??
        urlParams.get(FileView.ATTR_FILE),
      lines:
        this.getAttribute(FileView.ATTR_LINES) ??
        urlParams.get(FileView.ATTR_LINES),
    };
    return {
      ...attrParams,
      // fileUrlPath: `${attrParams.repo}/blob/${attrParams.ref}/${attrParams.file}#${attrParams.lines ?? ''}`
    };
  }

  connectedCallback() {
    let hasRequiredAttributes = true;
    const { ...requiredAttrs } = this.params;
    delete requiredAttrs.auth;
    Object.values(requiredAttrs).forEach((value) => {
      if (!value) return (hasRequiredAttributes = false);
    });

    if (hasRequiredAttributes) {
      this.render();
    } else {
      const prettyJson = JSON.stringify(requiredAttrs, null, 2);
      this.innerHTML = `<p>Missing some parameters</p><pre><code>${prettyJson}</code><pre>`;
    }
  }

  /**
   * Fetch and render the file
   */
  async render() {
    const { auth, file, repo, ref, lines } = this.params;
    const fileApiUrl = `https://api.github.com/repos/${repo}/contents/${file}?ref=${ref}`;

    await this._deps;
    /** @ts-expect-error Octokit is fetched from the linked {@link FileView.DEPS} */
    const octokit = new Octokit({ auth });
    octokit
      .request(`GET ${fileApiUrl}`)
      .then(
        (
          /** @type {{ data: Record<'content'|'name'|'path'|'html_url'|'type', string>}}} */ {
            data,
          }
        ) => {
          if (data.type == "file") {
            this.innerHTML = FILE_RENDER_STYLES; // clear existing file
            const [from, to] = lines
              ?.split("-")
              .map((l) => Number(l.match(/L(d+)/)?.[1])) ?? [
                0,
                Number.POSITIVE_INFINITY,
              ];
            this.appendChild(this.convertFileToHtml(data, { from, to }));
          } else {
            throw `No file found '${file}': ${fileApiUrl}`;
          }
        }
      )
      .catch((/** @type {Error} */ error) => {
        console.error(error);
        this.innerHTML = `<p>Error loading file</p>`;
      });
  }

  /**
   * Convert patch string to html elements that can be rendered.
   * @param {Record<'content'|'name'|'path'|'html_url'|'type', string>} data file api response data
   * @param {{ from: number, to: number }} lineNum start to end render
   */
  convertFileToHtml(data, lineNum) {
    // patch lines
    const fileContent = atob(data.content);
    const fileLines = fileContent.split("\n");
    const fileLinesVisible = fileLines.filter(
      (_, i) => i + 1 >= lineNum.from && i < lineNum.to
    );
    this._componentCode = fileLinesVisible.join("\n");
    // code file line elements
    const lineFileRenders = fileLinesVisible.map((line, i) =>
      this.createFileLine(line, lineNum.from + i, lineNum.from + i)
    );

    const fileLinesVisibleCount = fileLinesVisible.length;
    const fileLinesVisibleIncrement = Math.floor(fileLinesVisibleCount / 2);

    // prepend more code above line
    const fileLinesAboveStart =
      lineNum.from - Math.min(lineNum.from, fileLinesVisibleIncrement);
    if (fileLinesAboveStart) {
      const fileLinesAboveEnd = lineNum.from - 1;
      lineFileRenders.unshift(
        this.createFileLine(
          `L${fileLinesAboveStart}-L${fileLinesAboveEnd}`,
          fileLinesAboveStart,
          fileLinesAboveEnd
        )
      );
    }
    // append more code below line
    const fileLinesBelowEnd =
      lineNum.to +
      Math.min(fileLines.length - lineNum.to, fileLinesVisibleIncrement);
    if (fileLinesBelowEnd) {
      const fileLinesBelowStart = lineNum.to + 1;
      lineFileRenders.push(
        this.createFileLine(
          `L${fileLinesBelowStart}-L${fileLinesBelowEnd}`,
          fileLinesBelowStart,
          fileLinesBelowEnd
        )
      );
    }

    // view header elems
    const headerElems = [
      `<div class="file-header">`,
      `<span class="file-summary-count">${fileLines.length} total line${fileLines.length === 1 ? "" : "s"
      }</span>`,
      `<a class="file-filename" tabindex="0" href=${data.html_url} target="_blank">${data.name}</a>`,
      `<span class="${FileView.RENDER.CLS_COPY_BTN} ${FileView.RENDER.CLS_ICON_SET}" title="Copy file lines">${FileView.RENDER.TEXT_COPY_BTN}</span>`,
      `</div>`,
    ];

    // wrapper elem
    const diffHtml = document.createElement("div");
    diffHtml.className = "file-wrapper";
    diffHtml.innerHTML = [...headerElems, ...lineFileRenders].join("");

    this.setupCopyButton(
      diffHtml.querySelector(`.${FileView.RENDER.CLS_COPY_BTN}`)
    );

    return diffHtml;
  }

  createFileLine(
    /** @type {string} */ lineContent,
    /** @type {number} */ lineNumBase = 0,
    /** @type {number} */ lineNumHead = 0
  ) {
    const isEmptyLine = lineContent.startsWith(FileView.RENDER.TOKEN_LINE_NIL);
    const lineClass =
      Boolean(lineNumBase) === Boolean(lineNumHead)
        ? lineNumBase
          ? FileView.RENDER.CLS_LINE_NIL
          : FileView.RENDER.CLS_LINE_SUM
        : lineNumBase
          ? FileView.RENDER.CLS_LINE_DEL
          : FileView.RENDER.CLS_LINE_ADD;

    // use native inner text escape to handle possible html code insertion
    const codeContainer = document.createElement("pre");
    codeContainer.className = "code-line";
    if (isEmptyLine)
      codeContainer.classList.add(
        FileView.RENDER.CLS_ICON_SET,
        FileView.RENDER.TOKEN_LINE_NIL
      );
    codeContainer.innerText =
      (isEmptyLine && "remove_circle_outline") ||
      lineContent.replace(/(.)/, (s) => `${s} `);

    return `
<div class="file-line ${lineClass}" tabindex="0">
  <span class="file-line-num">
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

    const copyButtonTextDefault = FileView.RENDER.TEXT_COPY_BTN;
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
customElements.define(FileView.NAME, FileView);
