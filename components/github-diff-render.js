// Define the web component
class DiffRender extends HTMLElement {
    constructor() {
        super();
    }

    connectedCallback() {
        const urlParams = new URLSearchParams(window.location.search);
        const commitA = urlParams.get("commitA");
        const commitB = urlParams.get("commitB");

        if (commitA && commitB) {
            this.render(commitA, commitB);
        } else {
            this.innerHTML = `<p>Missing commit parameters</p>`;
        }
    }

    render(commitA, commitB) {
        const repo = this.getAttribute("repo");
        const file = this.getAttribute("file");

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
customElements.define("github-diff-render", DiffRender);
