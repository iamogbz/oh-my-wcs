const MARKDOWN_RENDER_STYLES = `
<link rel="stylesheet" href="https://cdnjs.cloudflare.com/ajax/libs/github-markdown-css/5.2.0/github-markdown-light.min.css" />
`
// Define the web component
class MarkdownView extends HTMLElement {
    static NAME = "github-md-view";
    static DEPS = [
        // https://marked.js.org/
        "https://cdn.jsdelivr.net/npm/marked/marked.min.js"
    ]

    static ATTR_FILE = "url"

    constructor() {
        super();
        this._deps = Promise.all(MarkdownView.DEPS.map((scriptUrl) => import(scriptUrl)));
        this.attachShadow({ mode: "open" });
    }

    static get observedAttributes() {
        return [MarkdownView.ATTR_FILE];
    }

    connectedCallback() {
        this.render();
    }

    attributeChangedCallback(name, oldValue, newValue) {
        if (name === MarkdownView.ATTR_FILE && oldValue !== newValue) {
            this.render();
        }
    }

    render() {
        const urlParams = new URLSearchParams(window.location.search);
        const mdUrl = this.getAttribute(MarkdownView.ATTR_FILE) ?? urlParams.get(MarkdownView.ATTR_FILE);

        if (!mdUrl) {
            this.shadowRoot.innerHTML = `<p>No URL provided</p>`;
            return;
        }

        fetch(mdUrl)
            .then(response => response.text())
            .then(async (data) => {
                const htmlContent = await this.convertMarkdownToHtml(data);
                this.shadowRoot.innerHTML = `${MARKDOWN_RENDER_STYLES}<div class="markdown-body">${htmlContent}</div>`;
            })
            .catch(error => {
                console.error(error);
                this.shadowRoot.innerHTML = `<p>Error loading markdown</p>`;
            });
    }

    async convertMarkdownToHtml(markdown) {
        await this._deps;
        return marked.parse(markdown)
    }
}

// Define the custom element
customElements.define(MarkdownView.NAME, MarkdownView);
