// Define the web component
class DiffView extends HTMLElement {
    static NAME = "github-diff-view";

    static ATTR_COMMIT_A = "commitA";
    static ATTR_COMMIT_B = "commitB";
    static ATTR_FILE = "file"
    static ATTR_REPO = "repo"

    constructor() {
        super();
    }

    connectedCallback() {
        const urlParams = new URLSearchParams(window.location.search);
        const repo = this.getAttribute(DiffView.ATTR_REPO) ?? urlParams.get(DiffView.ATTR_REPO);
        const file = this.getAttribute(DiffView.ATTR_FILE) ?? urlParams.get(DiffView.ATTR_FILE);
        const commitA = this.getAttribute(DiffView.ATTR_COMMIT_A) ?? urlParams.get(DiffView.ATTR_COMMIT_A);
        const commitB = this.getAttribute(DiffView.ATTR_COMMIT_B) ?? urlParams.get(DiffView.ATTR_COMMIT_B);

        if (repo && file && commitA && commitB) {
            this.render(repo, file, commitA, commitB);
        } else {
            this.innerHTML = `<p>Missing some parameters</p><pre><code type="json">${JSON.stringify({ repo, file, commitA, commitB }, 2, null)}</code><pre>`;
        }
    }

    render(repo, file, commitA, commitB) {
        const commitHeadBase = `${commitA}...${commitB}`;
        const diffApiUrl = `https://api.github.com/repos/${repo}/compare/${commitHeadBase}`;
        fetch(diffApiUrl)
            .then(response => response.json())
            .then(data => {
                const diffHtml = data.files.filter(f => f.filename === file)[0]?.patch;
                if (diffHtml) {
                    this.innerHTML = `<pre>${diffHtml}</pre>`;
                } else {
                    throw `Missing '${file}' diff: ${diffApiUrl}`
                }
            })
            .catch(error => {
                console.error(error);
                this.innerHTML = `<p>Error loading diff</p>`;
            });
    }
}

// Define the custom element
customElements.define(DiffView.NAME, DiffView);
