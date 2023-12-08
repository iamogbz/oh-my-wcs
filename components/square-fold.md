# Square Fold

Render an unfolding square up to a point to reveal contents

| Param             | Value               | Description                                                         |
| ----------------- | ------------------- | ------------------------------------------------------------------- |
| `component-name`  | `"simple-keyboard"` | CONSTANT                                                            |
| `folded-final`    | `number`            | `0` or `1` for horizontal or vertical unfold direction respectively |
| `folded-height`   | `number`            | Minimum folded height                                               |
| `folded-width`    | `number`            | Minimum folded width                                                |
| `unfold-limit`    | `number`            | How many times the card is folded                                   |
| `unfold-progress` | `number`            | From `0.0` to `1.0`                                                 |

## Example

```js
<script src="https://cdn.jsdelivr.net/gh/iamogbz/oh-my-wcs@main/components/square-fold.js"></script>

<square-fold folded-final="1"></square-fold>
```
