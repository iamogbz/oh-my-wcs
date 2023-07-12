# Github File View

Show the raw contents of a single text file with line numbers for easy embedding in other sites.

## Parameters

| Param            | Value                | Description              |
| ---------------- | -------------------- | ------------------------ |
| `component-name` | `"github-file-view"` | __CONSTANT__             |
| `repo`           | `string`             | Github `user/repo`       |
| `file`           | `string`             | Git file path            |
| `ref`            | `string`             | Git <REF>                |
| `lines`          | `string?`            | e.g. `L1-L20`            |
| `auth`           | `string?`            | Github [token][gh-token] |

## Example

```js
<script src="https://raw.githubusercontent.com/iamogbz/oh-my-wcs/main/components/github-file-view.js" />

<github-file-view repo="iamogbz/portmanteaux" file="src/components/Portmanteaux/useWordList.ts" head="HEAD" auth="https://github.com/settings/tokens" />
```

__NOTE__: Any attributes not provided will fallback to url parameters of the same name.

<!-- Links -->
[gh-token]: https://github.com/settings/tokens
