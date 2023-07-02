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
                text-decoration: underline;
            }
        }

        .diff-filename {
            padding: var(--size-padding-code);
        }

        .copy-filename {
            display: none;
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
        height: 24px;

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
        }

        .code-line {
            margin: 0;
            font-size: 0.8em;
            padding: var(--size-padding-code);

            &.diff-line-del {
                color: var(--color-diff-del);
                font-size: 1.2em;
            }
        }

        .diff-line-num {
            background: color-mix(in srgb, var(--color-bg-subtle) 50%, transparent);
            padding: var(--size-padding-code);
            user-select: none;
            cursor: pointer;

            .line-num-base, .line-num-head {
                display: inline-flex;
                width: 32px;
                text-overflow: ellipsis;
                overflow: auto hidden;
                padding: 0 4px;
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

  static ATTR_HEAD = "head";
  static ATTR_BASE = "base";
  static ATTR_FILE = "file";
  static ATTR_REPO = "repo";

  constructor() {
    super();
  }

  connectedCallback() {
    const urlParams = new URLSearchParams(window.location.search);
    const repo =
      this.getAttribute(DiffView.ATTR_REPO) ??
      urlParams.get(DiffView.ATTR_REPO);
    const file =
      this.getAttribute(DiffView.ATTR_FILE) ??
      urlParams.get(DiffView.ATTR_FILE);
    const head =
      this.getAttribute(DiffView.ATTR_HEAD) ??
      urlParams.get(DiffView.ATTR_HEAD);
    const base =
      this.getAttribute(DiffView.ATTR_BASE) ??
      urlParams.get(DiffView.ATTR_BASE);

    if (repo && file && head && base) {
      this.render(repo, file, head, base);
    } else {
      const prettyJson = JSON.stringify({ repo, file, head, base }, null, 2);
      this.innerHTML = `<p>Missing some parameters</p><pre><code>${prettyJson}</code><pre>`;
    }
  }

  /**
   * Fetch and render the diff
   * @param {string} repo github project repository
   * @param {string} file git project file path
   * @param {string} head github ref
   * @param {string} base github ref
   */
  render(repo, file, head, base) {
    const commitHeadBase = `${head}...${base}`;
    const diffApiUrl = `https://api.github.com/repos/${repo}/compare/${commitHeadBase}`;
    fetch(diffApiUrl)
      .then((response) => response.json())
      .then((data) => {
        const diffPatch = data.files.filter(
          (/** @type {{ filename: string; }} */ f) => f.filename === file
        )[0]?.patch;
        if (diffPatch) {
          this.innerHTML = DIFF_RENDER_STYLES; // clear existing diff
          this.appendChild(this.convertDiffToHtml(file, diffPatch));
        } else {
          throw `Missing '${file}' diff: ${diffApiUrl}`;
        }
      })
      .catch((error) => {
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
    // render constants
    const iconClass = "material-icons-round",
      lineClassSum = "diff-line-sum",
      lineClassAdd = "diff-line-add",
      lineClassDel = "diff-line-del",
      lineClassNil = "diff-line-nil";
    const lineTokenDel = "-",
      lineTokenAdd = "+",
      lineTokenNil = "\\ No newline at end of file";
    const changeBarStops = 5;

    // patch lines
    const [summary, ...diffLines] = patch.split("\n");

    // line diff elems
    const createDiffLine = (
      /** @type {string} */ lineContent,
      /** @type {number} */ lineNumBase = 0,
      /** @type {number} */ lineNumHead = 0
    ) => {
      const isEmptyLine = lineContent.startsWith(lineTokenNil);
      const lineClass =
        Boolean(lineNumBase) === Boolean(lineNumHead)
          ? lineNumBase
            ? lineClassNil
            : lineClassSum
          : lineNumBase
          ? lineClassDel
          : lineClassAdd;

      // use native inner text escape to handle possible html code insertion
      const codeContainer = document.createElement("pre");
      codeContainer.className = "code-line";
      if (isEmptyLine) codeContainer.classList.add(iconClass, lineClassDel);
      codeContainer.innerText =
        (isEmptyLine && "remove_circle_outline") ||
        lineContent.replace(/(.)/, (s) => `${s} `);

      return `
<div class="diff-line ${lineClass}" tabindex="0">
    <span class="diff-line-num">
        <span class="line-num-base">${
          (!isEmptyLine && lineNumBase) || ""
        }</span>
        <span class="line-num-head">${
          (!isEmptyLine && lineNumHead) || ""
        }</span>
    </span>
    ${codeContainer.outerHTML}
</div>
  `;
    };
    const lineDiffRenders = [createDiffLine(summary)];
    const lineNumStart = Number(summary.match(/\+(\d+)/)?.[1]);
    let lineCountBase = 0,
      lineCountHead = 0,
      lineCountSkip = 0;
    diffLines.forEach((line) => {
      let lineNumBase = 0,
        lineNumHead = 0;
      if (line.startsWith(lineTokenDel)) {
        lineNumBase = lineNumStart + lineCountSkip + lineCountBase;
        lineCountBase += 1;
      } else if (line.startsWith(lineTokenAdd)) {
        lineNumHead = lineNumStart + lineCountSkip + lineCountHead;
        lineCountHead += 1;
      } else {
        lineNumBase = lineNumStart + lineCountSkip + lineCountBase;
        lineNumHead = lineNumStart + lineCountSkip + lineCountHead;
        lineCountSkip += 1;
      }
      lineDiffRenders.push(createDiffLine(line, lineNumBase, lineNumHead));
    });

    // summary header elems
    const lineCountDiff = lineCountBase + lineCountHead;
    const lineCountTotal = lineCountDiff + lineCountSkip;
    const changeStopScale = changeBarStops / lineCountTotal;
    const changeSummaryCountDel = Math.round(changeStopScale * lineCountBase);
    const changeSummaryCountAdd = Math.round(changeStopScale * lineCountHead);
    const headerElems = [
      `<div class="diff-header">`,
      `<span class="diff-summary-count">${lineCountDiff}</span>`,
      `<span class="diff-summary-bar">`,
      ...Array(changeBarStops)
        .fill(null)
        .map((_, i) => {
          return `<span class="${iconClass} change-bar-stop-${i} ${
            i < changeSummaryCountAdd
              ? lineClassAdd
              : i - changeSummaryCountAdd < changeSummaryCountDel
              ? lineClassDel
              : lineClassNil
          }">square</span>`;
        }),
      `</span>`,
      `<span class="diff-filename" tabindex="0">${filename}</span>`,
      `<span class="copy-filename ${iconClass}">filter_none</span>`,
      `</div>`,
    ];

    // wrapper elem
    const diffHtml = document.createElement("div");
    diffHtml.className = "change-diff";
    diffHtml.innerHTML = [...headerElems, ...lineDiffRenders].join("");
    return diffHtml;
  }
}

// Define the custom element
customElements.define(DiffView.NAME, DiffView);
