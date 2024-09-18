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

<carousel-stack id="carousel" images="url('https://get.fohlio.com/hubfs/Imported_Blog_Media/The-Psychology-of-Hotel-Interior-Design-Part-3-Acoustics-Fohlio-Peninsula-Shanghai-1.jpg')|url('https://get.fohlio.com/hubfs/Imported_Blog_Media/The-Psychology-of-Hotel-Interior-Design-Part-3-Acoustics-Fohlio-St-Regis-Shenzen-1.jpg')|url('https://get.fohlio.com/hubfs/Imported_Blog_Media/The-Psychology-of-Hotel-Interior-Design-Part-3-Acoustics-Fohlio-sound-diffusion-1.jpg')|url('https://get.fohlio.com/hubfs/Imported_Blog_Media/The-Psychology-of-Hotel-Interior-Design-Part-3-Acoustics-Fohlio-Dubai-skyline-1.png')" style="position:relative;width:200px;height:120px" stack-style="width:200px;height:120px;border-radius:12px;background-size:cover;border:solid 2px black;" image-gap="10px" image-idx="0" transition-secs="1"></carousel-stack>
```

[Live demo](https://codepen.io/iamogbz/pen/eYwwOMy)
