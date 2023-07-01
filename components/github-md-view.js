const MARKDOWN_RENDER_STYLES = `
<style>
/* Add your desired styling for the rendered readme */
.md-container {
  background-color: #f9f9f9;
  border: 0.1em solid #dddddd;
  border-radius: 0.2em;
  font-family: Arial, sans-serif, monospace;
  padding: 0 1em;
}
</style>
`
// Define the web component
class MarkdownView extends HTMLElement {
    static NAME = "md-view";
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
        this.shadowRoot.innerHTML
        const url = this.getAttribute(MarkdownView.ATTR_FILE);

        if (!url) {
            this.shadowRoot.innerHTML = `<p>No URL provided</p>`;
            return;
        }

        fetch(url)
            .then(response => response.text())
            .then(async (data) => {
                const htmlContent = await this.convertMarkdownToHtml(data);
                this.shadowRoot.innerHTML = `${MARKDOWN_RENDER_STYLES}<div class="md-container">${htmlContent}</div>`;
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
