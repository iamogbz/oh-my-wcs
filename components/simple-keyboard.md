# Simple Keyboard

Render a markdown file from a url as html in github style

| Param            | Value               | Description                 |
| ---------------- | ------------------- | --------------------------- |
| `component-name` | `"simple-keyboard"` | CONSTANT                    |
| `keys`           | `string[][]`        | Base 64 encoded JSON string |
| `keys-active`    | `string[]`          | Base 64 encoded JSON string |
| `keys-disabled`  | `string[]`          | Base 64 encoded JSON string |
| `keys-selected`  | `string[]`          | Base 64 encoded JSON string |

## Example

```js
<script src="https://cdn.jsdelivr.net/gh/iamogbz/oh-my-wcs@main/components/simple-keyboard.js"></script>

<simple-keyboard keys="W1sxLDIsM10sWzQsNSw2XSxbNyw4LDldLFsiIiwwLCIiXV0=" keys-disabled="WzFd"></simple-keyboard>
```
