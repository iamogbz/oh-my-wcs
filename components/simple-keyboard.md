# Simple Keyboard

Render a markdown file from a url as html in github style

| Param            | Value               | Description                 |
| ---------------- | ------------------- | --------------------------- |
| `component-name` | `"simple-keyboard"` | CONSTANT                    |
| `keys`           | `string[][]`        | Base 64 encoded JSON string |
| `keys-active`    | `string[]`          | Base 64 encoded JSON string |
| `keys-disabled`  | `string[]`          | Base 64 encoded JSON string |
| `keys-selected`  | `string[]`          | Base 64 encoded JSON string |
| `keys-tabindex`  | `number`            | See `tabindex`              |
| `data-keyname-*` | `string`            | Specify a custom key name   |

## Example

```js
<script src="https://cdn.jsdelivr.net/gh/iamogbz/oh-my-wcs@main/components/simple-keyboard.js"></script>

const keys = window.btoa(JSON.stringify([
  "1234567890".split(""),
  ["Shift", "", "", "", "", "Backspace"], // use "" for empty spaces
  "QWERTYUIOP".toLocaleLowerCase().split(""),
  "ASDFGHJKL".toLocaleLowerCase().split(""),
  "ZXCVBNM".toLocaleLowerCase().split(""),
  [" ", "", "", "", "", "Enter"], // use " " for spacebar key
]));
// same logic applies for the keys-active, disabled, selected etc. except they are 1d array

<simple-keyboard keys={keys} keys-disabled="WzFd" data-keyname-space="Spacebar"></simple-keyboard>
// data-keyname-space: example custom key name for spacebar
// data-keyname-null: example custom key name for empty spaces
// data-keyname-k: example custom key name for the lower letter K
```

[![Example](https://github.com/user-attachments/assets/39972d27-2f60-4c28-aee7-01979c738e76)](https://ogbizi.com/oh-my-wcs/?component-name=simple-keyboard&keys=W1siMSIsIjIiLCIzIiwiNCIsIjUiLCI2IiwiNyIsIjgiLCI5IiwiMCJdLFsiU2hpZnQiLCJCYWNrc3BhY2UiXSxbInEiLCJ3IiwiZSIsInIiLCJ0IiwieSIsInUiLCJpIiwibyIsInAiXSxbImEiLCJzIiwiZCIsImYiLCJnIiwiaCIsImoiLCJrIiwibCJdLFsieiIsIngiLCJjIiwidiIsImIiLCJuIiwibSJdLFsiICIsIkVudGVyIl1d&keys-active=WzJd&keys-disabled=WzFd&keys-selected=WzBd)
