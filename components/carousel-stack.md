# Carousel Stack

Rotate between images in a specific form

| Param             | Value              | Description                                                                    |
| ----------------- | ------------------ | ------------------------------------------------------------------------------ |
| `component-name`  | `"carousel-stack"` | **`CONSTANT`**                                                                 |
| `images`          | `string`           | List of image sources e.g. href or data urls, delimited by `\|`.               |
| `image-gap`       | `string`           | Gap space between stacked images as css dimension value e.g. `4px`, `1em` etc. |
| `image-idx`       | `number`           | The current image index, can be incremented (only) to rotate between images.   |
| `transition-secs` | `number`           | Time taken to switch between images. Defaults to `0.3s`.                       |
| `stack-style`     | `string`           | CSS style prop for the images rendered.                                        |

## Example

```js
<script src="https://cdn.jsdelivr.net/gh/iamogbz/oh-my-wcs@main/components/carousel-stack.js"></script>

<carousel-stack images="linear-gradient(red, red)|linear-gradient(green, green)|linear-gradient(blue, blue)"
    style="width:200px;height:120px;" image-gap="40px" image-idx="0"></carousel-stack>
```

[Live demo](https://codepen.io/iamogbz/pen/eYwwOMy)
