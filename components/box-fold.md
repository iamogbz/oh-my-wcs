# Box Fold

Render an unfolding square up to a point to reveal contents

| Param             | Value               | Description                                                         |
| ----------------- | ------------------- | ------------------------------------------------------------------- |
| `component-name`  | `"simple-keyboard"` | CONSTANT                                                            |
| `folded-final`    | `number`            | `0` or `1` for horizontal or vertical unfold direction respectively |
| `folded-height`   | `number`            | Minimum folded height                                               |
| `folded-width`    | `number`            | Minimum folded width                                                |
| `text-content`    | `string`            | The text displayed on the card when fully unfolded                  |
| `unfold-limit`    | `number`            | How many times the card is folded                                   |
| `unfold-progress` | `number`            | From `0.0` to `1.0`                                                 |

Internal shadow elements inherit the following style properties from the `box-fold` custom element.

`backgroundColor`, `backgroundImage`, `color`, `textAlign`

## Example

```js
<script src="https://cdn.jsdelivr.net/gh/iamogbz/oh-my-wcs@main/components/box-fold.js"></script>

<box-fold folded-final="1"></box-fold>
```
