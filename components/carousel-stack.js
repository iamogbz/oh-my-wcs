class CarouselStackElement extends HTMLElement {
  static NAME = "carousel-stack";
  static ATTR_DELIM = "|";
  static attrs = Object.freeze({
    /** Transition time when images are rotated. */
    TRANSITION_TIME_SECS: "transition-secs",
    /** List of image sources e.g. href or data urls, delimited by '|' */
    IMAGES: "images",
    IMAGE_GAP: "image-gap",
    IMAGE_INDEX: "image-idx",
    /** Style attributes to copy delimted by '|' */
    STYLE_TRANSFER: "style-transfer",
  });

  static imagePrefixes = ["in", "bottom", "next", "top", "out"];

  /** @type {Readonly<(typeof CarouselStackElement.attrs)[keyof (typeof CarouselStackElement.attrs)][]>} */
  static observedAttributes = Object.freeze(
    Object.values(CarouselStackElement.attrs)
  );

  constructor() {
    super();
    this._root = this.attachShadow({ mode: "open" });
    this.lastIndex = this.currentIndex;
    this.createStack();
  }

  get currentIndex() {
    return Number(
      this.getAttribute(CarouselStackElement.attrs.IMAGE_INDEX) || 0
    );
  }

  /**
   * @type {(keyof CSSStyleDeclaration)[]}
   */
  get transferStyles() {
    // @ts-expect-error string vs CSSStyleDeclaration
    return (
      this.getAttribute(CarouselStackElement.attrs.STYLE_TRANSFER)?.split(
        CarouselStackElement.ATTR_DELIM
      ) ?? []
    );
  }

  get images() {
    return (
      this.getAttribute(CarouselStackElement.attrs.IMAGES)?.split(
        CarouselStackElement.ATTR_DELIM
      ) ?? []
    );
  }

  get imageGap() {
    return this.getAttribute(CarouselStackElement.attrs.IMAGE_GAP);
  }

  get transitionTimeSecs() {
    return Number(
      this.getAttribute(CarouselStackElement.attrs.TRANSITION_TIME_SECS) || 0.3
    );
  }

  get transitionTimeMs() {
    return this.transitionTimeSecs * 1000;
  }

  createStack() {
    this.onEachImage((imageElem) => {
      this._root?.appendChild(imageElem);
    });
  }

  connectedCallback() {
    this.updateStack();
  }

  attributeChangedCallback() {
    if (this.lastIndex !== this.currentIndex) {
      this.startTransition();
    }
  }

  adoptedCallback() {
    this.updateStack();
  }

  startTransition() {
    this.onEachImage((imageElem, idx) => {
      this.setImageOffset(imageElem, idx + 1);
      // transparent if top two images
      const topTwoImages = idx === 3 || idx === 4;
      imageElem.style.opacity = Number(
        topTwoImages ? !topTwoImages : (idx + 1) / 3
      ).toString();
    });
    setTimeout(() => {
      this.onEachImage((imageElem) => {
        imageElem.style.transition = "none";
      });
      this.updateStack();
    }, this.transitionTimeMs * 1.5);
  }

  updateStack() {
    const imagesToDisplay = this.images;

    if (imagesToDisplay.length < 1) {
      // no images to display
      return;
    }

    // TODO: double check functionality when more than 3 images provided
    while (imagesToDisplay.length < 3) {
      imagesToDisplay.push(...imagesToDisplay);
    }

    const topImageIdx = this.currentIndex;
    const nextIdx = (idx = 0, increment = 1) =>
      (idx + increment) % imagesToDisplay.length;

    // Set image backgrounds and position
    this.onEachImage((imageElem, idx) => {
      const imageBg =
        imagesToDisplay[nextIdx(topImageIdx, imagesToDisplay.length * 2 - idx)];
      imageElem.style.backgroundImage = imageBg;
      imageElem.style.position = "absolute";
      // transparent if top or bottom image
      const topOrBottomImage = idx === 0 || idx === 4;
      imageElem.style.opacity = Number(
        topOrBottomImage ? !topOrBottomImage : idx / 3
      ).toString();
      this.setImageOffset(imageElem, idx);
      setTimeout(() => {
        const duration = `${this.transitionTimeSecs}s`;
        const delay = `${this.transitionTimeSecs / 2 - idx / 10}s`;
        imageElem.style.transition = ["top", "left", "opacity"]
          .map((p) => `${p} ${duration} ease-in-out ${delay}`)
          .join(",");
      }, this.transitionTimeMs / 2);
    });

    this.lastIndex = this.currentIndex;
  }

  /**
   * Set the position offset of the image based on index.
   * @param {HTMLElement} imageElem
   * @param {number} idx
   */
  setImageOffset(imageElem, idx) {
    const posOffset = `calc(${this.imageGap} * (3 - ${idx}))`;
    imageElem.style.top = posOffset;
    imageElem.style.left = posOffset;
  }

  /**
   * Call a function on each image in the carousel stack
   * @param {(imageElem: HTMLElement, index: number) => void} callback
   */
  onEachImage(callback = () => undefined) {
    CarouselStackElement.imagePrefixes.forEach((imgPrefix, idx) => {
      const imageId = `${imgPrefix}Image`;
      const imageElem =
        this._root.getElementById(imageId) ?? document.createElement("div");
      imageElem.id = imageId;
      this.copyStyles(this, imageElem);
      callback(imageElem, idx);
    });
  }

  /**
   * Copy all styles from one element to another
   * @param {HTMLElement} from
   * @param {HTMLElement} to
   */
  copyStyles(from, to) {
    for (const styleAttr of this.transferStyles) {
      try {
        // @ts-expect-error skip readonly property errors
        to.style[styleAttr] = from.style[styleAttr];
      } catch (e) {
        continue;
      }
    }
  }
}

// Define the custom element
customElements.define(CarouselStackElement.NAME, CarouselStackElement);
