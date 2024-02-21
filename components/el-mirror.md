# Mirror Element

Create synchronized replicas of a DOM node

| Param               | Value              | Description                                                        |
| ------------------- | ------------------ | ------------------------------------------------------------------ |
| `component-name`    | `"mirror-element"` | CONSTANT                                                           |
| `target-id`         | `string`           | ID of the element that should be mirrored                          |
| `reflection-cls`    | `string`           | Class attribute to be passed to all descendant elements refelected |
| `reflection-styles` | `string`           | Style attribute to be passed to all descendant elements reflected  |

## Example

```js
<script src="https://cdn.jsdelivr.net/gh/iamogbz/oh-my-wcs@main/components/el-mirror.js"></script>

<div id="real-element">...</>
<mirror-element target-id="real-element"></mirror-element>
```

[Live demo](https://codepen.io/iamogbz/pen/xxBeyWy)

### Reference

- [React Mirror](https://www.npmjs.com/package/react-mirror)
