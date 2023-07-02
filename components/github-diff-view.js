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
      this.innerHTML = `<p>Missing some parameters</p><pre><code type="json">${JSON.stringify(
        { repo, file, head, base },
        null,
        2
      )}</code><pre>`;
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
        const diffPatch = data.files.filter((/** @type {{ filename: string; }} */ f) => f.filename === file)[0]
          ?.patch;
        if (diffPatch) {
          this.innerHTML = this.convertDiffToHtml(diffPatch);
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
   * @param {string} patch git diff patch string
   */
  convertDiffToHtml(patch) {
    return `<pre>${patch}</pre>`;
  }
}

// Define the custom element
customElements.define(DiffView.NAME, DiffView);
