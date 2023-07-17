const MARKDOWN_RENDER_STYLES = `
<link rel="stylesheet" href="https://cdnjs.cloudflare.com/ajax/libs/github-markdown-css/5.2.0/github-markdown-light.min.css" />
`;

// Define the web component
class MarkdownView extends HTMLElement {
  static NAME = "github-md-view";
  static DEPS = [
    // https://marked.js.org/
    "https://cdn.jsdelivr.net/npm/marked/marked.min.js",
  ];

  static ATTR_FILE = "url";
  static ATTR_LINE_FROM = "from";
  static ATTR_LINE_TO = "to";

  constructor() {
    super();
    this._deps = Promise.all(
      MarkdownView.DEPS.map((scriptUrl) => import(scriptUrl))
    );
    this._root = this.attachShadow({ mode: "open" });
  }

  static get observedAttributes() {
    return [
      MarkdownView.ATTR_FILE,
      MarkdownView.ATTR_LINE_FROM,
      MarkdownView.ATTR_LINE_TO,
    ];
  }

  connectedCallback() {
    this.render();
  }

  /**
   * Handle web component watched attribute updates
   * @param {string} name
   * @param {string} oldValue
   * @param {string} newValue
   */
  attributeChangedCallback(name, oldValue, newValue) {
    if (MarkdownView.observedAttributes.includes(name) && oldValue !== newValue) {
      this.render();
    }
  }

  render() {
    const mdUrl = this.params[MarkdownView.ATTR_FILE];

    if (!mdUrl) {
      this._root.innerHTML = `<p>No URL provided</p>`;
      return;
    }

    const lineFrom =
      Number(this.params[MarkdownView.ATTR_LINE_FROM]) ||
      Number.NEGATIVE_INFINITY;
    const lineTo =
      Number(this.params[MarkdownView.ATTR_LINE_TO]) ||
      Number.POSITIVE_INFINITY;

    fetch(mdUrl)
      .then((response) => response.text())
      .then(async (data) => {
        const lineSep = "\n";
        const mdLines = data
          .split(lineSep)
          .filter((_, i) => i + 1 >= lineFrom && i < lineTo)
          .join(lineSep);
        const htmlContent = await this.convertMarkdownToHtml(mdLines);
        this._root.innerHTML = `${MARKDOWN_RENDER_STYLES}<div class="markdown-body">${htmlContent}</div>`;
      })
      .catch((error) => {
        console.error(error);
        this._root.innerHTML = `<p>Error loading markdown</p>`;
      });
  }

  get params() {
    const urlParams = new URLSearchParams(window.location.search);
    /** @type {Record<string, string | null>} */ const attrParams = {};
    MarkdownView.observedAttributes.forEach((attrName) => {
      attrParams[attrName] =
        this.getAttribute(attrName) ?? urlParams.get(attrName);
    });
    return attrParams;
  }

  /**
   * Convert markdown string to html elements that can be rendered
   * @param {string} markdown
   */
  async convertMarkdownToHtml(markdown) {
    await this._deps;
    /** @ts-expect-error Marked is fetched from the linked {@link MarkdownView.DEPS} */
    return marked.parse(markdown);
  }
}

// Define the custom element
customElements.define(MarkdownView.NAME, MarkdownView);
