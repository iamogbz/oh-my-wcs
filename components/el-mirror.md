# Mirror Element

Create synchronized replicas of a DOM node

| Param            | Value              | Description                                        |
| ---------------- | ------------------ | -------------------------------------------------- |
| `component-name` | `"mirror-element"` | CONSTANT                                           |
| `frame-cls`      | `string`           | Class assigned to the iframe in the mirror element |
| `target-id`      | `string`           | ID of the element that should be mirrored          |

Internal shadow elements inherit the iframe properties from the `mirror-element` custom component.

## Example

```js
<script src="https://cdn.jsdelivr.net/gh/iamogbz/oh-my-wcs@main/components/el-mirror.js"></script>

<div id="real-element">...</>
<mirror-element target-id="real-element"></mirror-element>
```

### Reference

* [React Mirror](https://www.npmjs.com/package/react-mirror)
