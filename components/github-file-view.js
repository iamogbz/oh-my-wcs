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
    --size-file-line-num: 44px;
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
        justify-content: space-between;
        padding: var(--size-padding-default) var(--size-padding-large);
        gap: calc(var(--size-padding-default) * 2);
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
            cursor: pointer;
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
            justify-content: flex-end;
            gap: 0;
            height: var(--size-file-line-height);
            max-width: var(--size-file-line-num);
            min-width: var(--size-file-line-num);

            .line-num-head {
                display: flex;
                text-overflow: ellipsis;
                overflow: auto hidden;
                padding: 0;
                text-align: end;
                justify-content: end;
                align-items: center;
            }

            .line-num-base {
              display: none;
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
    CLS_EXPAND_LINE: "expand-line",
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
    return {
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
  }

  get paramLines() {
    const minFrom = 1;
    const maxTo = Number.POSITIVE_INFINITY;
    const [from, to] = this.params.lines
      ?.split("-")
      .map((l) =>
        Math.min(Math.max(Number(l.match(/L?(\d+)/)?.[1]), minFrom), maxTo)
      ) ?? [minFrom, maxTo];
    return { from, to };
  }

  get lines() {
    if (!this._lines) this._lines = this.paramLines;
    return this._lines;
  }

  connectedCallback() {
    let hasRequiredAttributes = true;
    const { ...requiredAttrs } = this.params;
    delete requiredAttrs.auth;
    Object.values(requiredAttrs).forEach((value) => {
      if (!value) return (hasRequiredAttributes = false);
    });

    if (hasRequiredAttributes) {
      this.fetchRender();
    } else {
      const prettyJson = JSON.stringify(requiredAttrs, null, 2);
      this.innerHTML = `<p>Missing some parameters</p><pre><code>${prettyJson}</code><pre>`;
    }
  }

  /**
   * Fetch and render the file
   */
  async fetchRender() {
    const { auth, file, repo, ref } = this.params;
    const fileApiUrl = `https://api.github.com/repos/${repo}/contents/${file}?ref=${ref}`;

    await this._deps;
    /** @ts-expect-error Octokit is fetched from the linked {@link FileView.DEPS} */
    const octokit = new Octokit({ auth });
    octokit
      .request(`GET ${fileApiUrl}`)
      .then(this.renderFrom.bind(this))
      .catch((/** @type {Error} */ error) => {
        console.error(error);
        this.innerHTML = `<p>Error loading file</p>`;
      });
  }

  /**
   * @param {{ data: Record<"content" | "name" | "path" | "html_url" | "type", string> | undefined}} apiResponse
   */
  renderFrom({ data }) {
    if (!data) return;
    this._data = data;

    const { file, repo, ref } = this.params;
    const { from, to } = this.lines;

    const fileApiUrl = `https://api.github.com/repos/${repo}/contents/${file}?ref=${ref}`;

    if (
      data.type == "file" &&
      Number.isSafeInteger(from) &&
      Number.isSafeInteger(to)
    ) {
      this.innerHTML = FILE_RENDER_STYLES; // clear existing file
      this.appendChild(this.convertFileToHtml(data, { from, to }));
    } else {
      throw `Unable to render file '${file}' L'${from}'-L'${to}': ${fileApiUrl}`;
    }
  }

  /**
   * Convert patch string to html elements that can be rendered.
   * @param {Record<'content'|'name'|'path'|'html_url'|'type', string>} data file api response data
   * @param {{ from: number, to: number }} lineNum start to end render
   */
  convertFileToHtml(data, lineNum) {
    // patch lines
    const tokenNL = "\n";
    const fileContent = atob(data.content);
    const fileLines = fileContent.split(tokenNL);
    if (fileContent.endsWith(tokenNL)) fileLines.pop();
    const fileLinesCount = fileLines.length;

    const fileLinesVisible = fileLines.filter(
      (_, i) => i + 1 >= lineNum.from && i < lineNum.to
    );
    this._componentCode = fileLinesVisible.join(tokenNL);

    const fileLinesVisibleCount = fileLinesVisible.length;
    const fileLinesVisibleIncrement = Math.floor(fileLinesVisibleCount / 2);

    // code file line elements
    const lineFileRenders = fileLinesVisible.map((line, i) => {
      const codeLineNum = lineNum.from + i;
      return this.createFileLine(line, codeLineNum, codeLineNum);
    });

    // prepend more code above line
    const fileLinesAboveEnd = Math.max(lineNum.from - 1, 0);
    const fileLinesAboveStart =
      lineNum.from - Math.min(fileLinesAboveEnd, fileLinesVisibleIncrement);
    const createExpandCodeLine = (
      /** @type {number} */ from,
      /** @type {number} */ to
    ) => {
      return this.createFileLine(
        `Expand lines ${from} to ${to}`,
        0,
        0,
        FileView.RENDER.CLS_EXPAND_LINE,
        `data-line-from=${from} data-line-to=${to}`
      );
    };
    if (fileLinesAboveEnd) {
      lineFileRenders.unshift(
        createExpandCodeLine(fileLinesAboveStart, fileLinesAboveEnd)
      );
    }
    // append more code below line
    const fileLinesBelowStart = lineNum.to + 1;
    const fileLinesBelowEnd =
      fileLinesBelowStart +
      Math.min(fileLinesCount - fileLinesBelowStart, fileLinesVisibleIncrement);

    if (fileLinesBelowStart < fileLinesCount) {
      lineFileRenders.push(
        createExpandCodeLine(fileLinesBelowStart, fileLinesBelowEnd)
      );
    } else if (!fileContent.endsWith(tokenNL)) {
      lineFileRenders.push(
        this.createFileLine(
          FileView.RENDER.TOKEN_LINE_NIL,
          fileLinesBelowEnd,
          fileLinesBelowEnd
        )
      );
    }

    // view header elems
    const fileUrl = `${data.html_url}#L${lineNum.from}-L${lineNum.to}`;
    const headerElems = [
      `<div class="file-header">`,
      `<span class="${FileView.RENDER.CLS_COPY_BTN} ${FileView.RENDER.CLS_ICON_SET}" title="Copy visible lines">${FileView.RENDER.TEXT_COPY_BTN}</span>`,
      `<span class="file-summary-count">Viewing ${fileLinesVisibleCount} of ${
        fileLines.length
      } line${fileLines.length === 1 ? "" : "s"}</span>`,
      `<a class="file-filename" title="Open file in github" tabindex="0" href="${fileUrl}" target="_blank">${data.name}</a>`,
      `</div>`,
    ];

    // wrapper elem
    const lineHtml = document.createElement("div");
    lineHtml.className = "file-wrapper";
    lineHtml.innerHTML = [...headerElems, ...lineFileRenders].join("");

    this.setupCopyButton(
      lineHtml.querySelector(`.${FileView.RENDER.CLS_COPY_BTN}`)
    );

    this.setupExpandLines(
      lineHtml.querySelectorAll(`.${FileView.RENDER.CLS_EXPAND_LINE}`)
    );

    return lineHtml;
  }

  createFileLine(
    /** @type {string} */ lineContent,
    /** @type {number} */ lineNumBase = 0,
    /** @type {number} */ lineNumHead = 0,
    /** @type {string?} */ lineClasses = "",
    /** @type {string?} */ attrHtml = ""
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
        FileView.RENDER.CLS_LINE_NIL
      );
    codeContainer.innerText =
      (isEmptyLine && "remove_circle_outline") || " " + lineContent;

    return `
<div tabindex="0" class="file-line ${lineClass} ${lineClasses}" ${attrHtml}>
  <span class="file-line-num">
      <span class="line-num-base">${
        isEmptyLine ? "" : (lineNumBase || "...")
      }</span>
      <span class="line-num-head">${
        isEmptyLine ? "" : (lineNumHead || "...")
      }</span>
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

  /**
   * @param {NodeListOf<HTMLElement>} expandLineElements
   */
  setupExpandLines(expandLineElements) {
    expandLineElements.forEach((elem) => {
      elem.addEventListener("click", (e) => {
        e.preventDefault();
        const lineFrom = Number(elem.dataset.lineFrom);
        const lineTo = Number(elem.dataset.lineTo);
        if (lineFrom < this.lines.from) {
          this.lines.from = lineFrom;
          this.renderFrom({ data: this._data });
        } else if (lineTo > this.lines.to) {
          this.lines.to = lineTo;
          this.renderFrom({ data: this._data });
        }
      });
    });
  }
}

// Define the custom element
customElements.define(FileView.NAME, FileView);
