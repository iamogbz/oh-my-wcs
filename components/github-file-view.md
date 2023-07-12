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

![sample image][sample-img]

__NOTE__: Any attributes not provided will fallback to url parameters of the same name.

<!-- Links -->
[gh-token]: https://github.com/settings/tokens
[sample-img]: https://user-images.githubusercontent.com/2528959/252833122-4ce58a8f-a8ed-4567-9e52-316af55dc6a7.png
