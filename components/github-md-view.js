const MARKDOWN_RENDER_STYLES = `
<style>
/* Add your desired styling for the rendered readme */
.readme-container {
  font-family: Arial, sans-serif;
  font-size: 16px;
  line-height: 1.6;
  padding: 20px;
  background-color: #f9f9f9;
  border: 1px solid #ddd;
  border-radius: 4px;
}
</style>
`
// Define the web component
class MarkdownView extends HTMLElement {
    static NAME = "md-view";
    static ATTR_FILE = "url"

    constructor() {
        super();
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
        const url = this.getAttribute(MarkdownView.ATTR_FILE);

        if (!url) {
            this.shadowRoot.innerHTML = `<p>No URL provided</p>`;
            return;
        }

        fetch(url)
            .then(response => response.text())
            .then(data => {
                this.shadowRoot.innerHTML = `<div class="md-container">${data}</div>`;
            })
            .catch(error => {
                console.error(error);
                this.shadowRoot.innerHTML = `<p>Error loading markdown</p>`;
            });
    }
}

// Define the custom element
customElements.define(MarkdownView.NAME, MarkdownView);
