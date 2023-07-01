# Github Diff View

Show the difference between two commits for a single file.

## Parameters

| Param           | Value                | Description        |
| --------------- | -------------------- | ------------------ |
| `componentName` | `"github-diff-view"` | CONSTANT           |
| `repo`          | `string`             | Github `user/repo` |
| `file`          | `string`             | Git file path      |
| `commitA`       | `string`             | Git <REF>          |
| `commitB`       | `string`             | Git <REF>          |

## Example

```js
<script src="https://raw.githubusercontent.com/iamogbz/oh-my-wcs/main/components/github-diff-view.js" />

<github-diff-view repo="iamogbz/portmanteaux" file="src/components/Portmanteaux/useWordList.ts" commitA="HEAD" commitB="70551a0" />
```

__NOTE__: Any attributes not provided will fallback to url parameters of the same name.