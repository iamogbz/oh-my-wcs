# Github Diff View

Show the difference between two commits for a single file in github style

## Parameters

| Param            | Value                | Description              |
| ---------------- | -------------------- | ------------------------ |
| `component-name` | `"github-diff-view"` | __CONSTANT__             |
| `repo`           | `string`             | Github `user/repo`       |
| `file`           | `string`             | Git file path            |
| `head`           | `string`             | Git <REF>                |
| `base`           | `string`             | Git <REF>                |
| `auth`           | `string?`            | Github [token][gh-token] |

## Example

```js
<script src="https://raw.githubusercontent.com/iamogbz/oh-my-wcs/main/components/github-diff-view.js" />

<github-diff-view repo="iamogbz/portmanteaux" file="src/components/Portmanteaux/useWordList.ts" head="HEAD" base="70551a0" auth="https://github.com/settings/tokens" />
```

__NOTE__: Any attributes not provided will fallback to url parameters of the same name.

![sample image][sample-img]

<!-- Links -->
[gh-token]: https://github.com/settings/tokens
[sample-img]: https://github.com/iamogbz/oh-my-wcs/assets/2528959/66319588-8e14-4b20-9d92-fa3109b84546
