class BoxFold extends HTMLElement {
  static NAME = "box-fold";
  static DEPS = {};

  static DEFAULT_COLOR_BG = "peachpuff";

  static IDS = {
    CARD: "folded-card",
    CONTENT: "card-content",
    FOLD: "unfolding-card",
  };

  static SIZE = {
    MIN_PX: 32,
  };

  static DIR = {
    /** Zero */
    HORIZONTAL: 0,
    /** One */
    VERTICAL: 1,
  };

  static ATTRS = {
    /** The folded final direction */
    FOLDED_FINAL: "folded-final",
    /** The fully folded starting height */
    FOLDED_HEIGHT: "folded-height",
    /** The fully folded starting width  */
    FOLDED_WIDTH: "folded-width",
    /** The component style attribute */
    STYLE: "style",
    /** The card text content */
    TEXT_CONTENT: "text-content",
    /** The number of half folds that it takes to unfold fully */
    UNFOLD_LIMIT: "unfold-limit",
    /** Ratio percentage progress from fully folded to completely unfolded */
    UNFOLD_PROGRESS: "unfold-progress",
  };

  constructor() {
    super();
    this._root = this.attachShadow({ mode: "open" });
  }

  static get observedAttributes() {
    return Object.values(BoxFold.ATTRS);
  }

  get params() {
    const urlParams = new URLSearchParams(window.location.search);
    /** @type {Record<string, null | string>} */ const attrParams = {};
    BoxFold.observedAttributes.forEach((attrName) => {
      attrParams[attrName] =
        this.getAttribute(attrName) ?? urlParams.get(attrName);
    });
    return attrParams;
  }

  connectedCallback() {
    this.render();
  }

  /**
   * Handle web component watched attribute updates
   * @param {string} name
   * @param {string} oldValue
   * @param {string} newValue
   */
  attributeChangedCallback(name, oldValue, newValue) {
    if (BoxFold.observedAttributes.includes(name) && oldValue !== newValue) {
      this.render();
    }
  }

  render() {
    const firstUnfoldDir = Number(this.params[BoxFold.ATTRS.FOLDED_FINAL]) || 0;
    const foldedHeight =
      Number(this.params[BoxFold.ATTRS.FOLDED_HEIGHT]) || BoxFold.SIZE.MIN_PX;
    const foldedWidth =
      Number(this.params[BoxFold.ATTRS.FOLDED_WIDTH]) || BoxFold.SIZE.MIN_PX;
    const unfoldLimit = Number(this.params[BoxFold.ATTRS.UNFOLD_LIMIT]) || 1;
    const unfoldProgress =
      Number(this.params[BoxFold.ATTRS.UNFOLD_PROGRESS]) || 0;
    const currentUnfoldProgress = unfoldProgress * unfoldLimit;
    const currentUnfoldCount = Math.floor(currentUnfoldProgress);
    let nextUnfoldProgress = currentUnfoldProgress - currentUnfoldCount;
    nextUnfoldProgress = nextUnfoldProgress < 0.5 ? 0 : nextUnfoldProgress;
    const nextUnfoldDir = (firstUnfoldDir + currentUnfoldCount) % 2;
    const lowerFoldCount = Math.floor(currentUnfoldCount / 2);
    const higherFoldCount = currentUnfoldCount - lowerFoldCount;
    const currentWidth =
      foldedWidth *
      Math.pow(
        2,
        firstUnfoldDir == BoxFold.DIR.HORIZONTAL
          ? higherFoldCount
          : lowerFoldCount
      );
    const currentHeight =
      foldedHeight *
      Math.pow(
        2,
        firstUnfoldDir == BoxFold.DIR.VERTICAL
          ? higherFoldCount
          : lowerFoldCount
      );
    const unfoldWidth = currentWidth * (nextUnfoldDir ? 1 : nextUnfoldProgress);
    const unfoldHeight =
      currentHeight * (nextUnfoldDir ? nextUnfoldProgress : 1);
    const isFullyUnfolded = !!Math.floor(unfoldProgress);

    const card =
      this._root.getElementById(BoxFold.IDS.CARD) ??
      document.createElement("div");
    card.setAttribute("id", BoxFold.IDS.CARD);
    card.style.backgroundColor =
      this.style.backgroundColor || BoxFold.DEFAULT_COLOR_BG;
    card.style.backgroundImage =
      (isFullyUnfolded && this.style.backgroundImage) ||
      `linear-gradient(45deg, transparent, rgba(0,0,0,0.1))`;
    card.style.backgroundPosition = "top-left";
    card.style.backgroundRepeat = "repeat";
    card.style.backgroundSize = `${foldedWidth}px ${foldedHeight}px`;
    card.style.position = "relative";
    card.style.height = `${
      currentHeight + Number(currentHeight !== unfoldHeight) * unfoldHeight
    }px`;
    card.style.width = `${
      currentWidth + Number(currentWidth !== unfoldWidth) * unfoldWidth
    }px`;
    card.style.overflow = "hidden";
    card.style.display = "flex";
    card.style.alignItems = "center";
    card.style.justifyContent = "center";

    const unfold =
      this._root.getElementById(BoxFold.IDS.FOLD) ??
      document.createElement("div");
    unfold.setAttribute("id", BoxFold.IDS.FOLD);
    const unfoldAngle = nextUnfoldDir ? 180 : 90;
    const unfoldShade = 1 - nextUnfoldProgress;
    const unfoldShadeA = `rgba(0,0,0,${unfoldShade / 8})`;
    const unfoldShadeB = `rgba(0,0,0,${unfoldShade / 4})`;
    unfold.style.backgroundImage = `linear-gradient(${unfoldAngle}deg, ${unfoldShadeA}, ${unfoldShadeB})`;
    unfold.style.position = "absolute";
    unfold.style.height = `${unfoldHeight}px`;
    unfold.style.width = `${unfoldWidth}px`;
    unfold.style.top = nextUnfoldDir ? `${currentHeight}px` : "0";
    unfold.style.left = nextUnfoldDir ? "0" : `${currentWidth}px`;

    const content =
      this._root.getElementById(BoxFold.IDS.CONTENT) ??
      document.createElement("pre");
    content.setAttribute("id", BoxFold.IDS.CONTENT);
    content.innerText = this.params[BoxFold.ATTRS.TEXT_CONTENT] ?? "";
    const contentVisibilityProgressThreshold = 0.95;
    content.style.opacity = Math.max(
      (unfoldProgress - contentVisibilityProgressThreshold) /
        (1 - contentVisibilityProgressThreshold),
      0
    ).toString();
    content.style.transition = "opacity 0.3s ease-in-out";
    content.style.color = this.style.color;
    content.style.textAlign = this.style.textAlign;

    card.appendChild(unfold);
    card.appendChild(content);
    this._root.appendChild(card);
  }
}

// Define the custom element
customElements.define(BoxFold.NAME, BoxFold);
