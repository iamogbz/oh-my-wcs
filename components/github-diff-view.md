# Github Diff View

Show the difference between two commits for a single file in github style

## Parameters

| Param            | Value                | Description        |
| ---------------- | -------------------- | ------------------ |
| `component-name` | `"github-diff-view"` | CONSTANT           |
| `repo`           | `string`             | Github `user/repo` |
| `file`           | `string`             | Git file path      |
| `head`           | `string`             | Git <REF>          |
| `base`           | `string`             | Git <REF>          |

## Example

```js
<script src="https://raw.githubusercontent.com/iamogbz/oh-my-wcs/main/components/github-diff-view.js" />

<github-diff-view repo="iamogbz/portmanteaux" file="src/components/Portmanteaux/useWordList.ts" head="HEAD" base="70551a0" />
```

__NOTE__: Any attributes not provided will fallback to url parameters of the same name.
