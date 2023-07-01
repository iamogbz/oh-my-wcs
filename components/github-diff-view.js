// Define the web component
class DiffView extends HTMLElement {
    static NAME = "github-diff-view";
    static ATTR_FILE="file"
    static ATTR_REPO="repo"
    static URL_PARAM_COMMIT_A = "commitA";
    static URL_PARAM_COMMIT_B = "commitB";

    constructor() {
        super();
    }

    connectedCallback() {
        const urlParams = new URLSearchParams(window.location.search);
        const commitA = urlParams.get(DiffView.URL_PARAM_COMMIT_A);
        const commitB = urlParams.get(DiffView.URL_PARAM_COMMIT_B);

        if (commitA && commitB) {
            this.render(commitA, commitB);
        } else {
            this.innerHTML = `<p>Missing commit parameters</p>`;
        }
    }

    render(commitA, commitB) {
        const repo = this.getAttribute(DiffView.ATTR_REPO);
        const file = this.getAttribute(DiffView.ATTR_FILE);

        fetch(`https://api.github.com/repos/${repo}/compare/${commitA}...${commitB}/files/${file}`)
            .then(response => response.json())
            .then(data => {
                const diffHtml = data.patch;
                this.innerHTML = `<pre>${diffHtml}</pre>`;
            })
            .catch(error => {
                console.error(error);
                this.innerHTML = `<p>Error loading diff</p>`;
            });
    }
}

// Define the custom element
customElements.define(DiffView.NAME, DiffView);
