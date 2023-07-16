# Github Markdown View

Render a markdown file from a url as html in github style

| Param            | Value                 | Description       |
| ---------------- | --------------------- | ----------------- |
| `component-name` | `"github-md-view"`    | CONSTANT          |
| `url`            | `string`              | Markdown file url |

## Example

```js
<script src="https://cdn.jsdelivr.net/gh/iamogbz/oh-my-wcs@main/components/github-md-view.js"></script>

<github-md-view url="https://raw.githubusercontent.com/iamogbz/oh-my-wcs/HEAD/README.md"></github-md-view>
```

__NOTE__: Uses `marked.js` to provide rendering of the markdown file to html
