class SquareFold extends HTMLElement {
  static NAME = "square-fold";
  static CARD_ID = "folded-card";
  static DEPS = {};

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
    return Object.values(SquareFold.ATTRS);
  }

  get params() {
    const urlParams = new URLSearchParams(window.location.search);
    /** @type {Record<string, number | null>} */ const attrParams = {};
    SquareFold.observedAttributes.forEach((attrName) => {
      attrParams[attrName] = Number(
        this.getAttribute(attrName) ?? urlParams.get(attrName)
      );
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
    if (SquareFold.observedAttributes.includes(name) && oldValue !== newValue) {
      this.render();
    }
  }

  render() {
    console.log(this.params);
    const firstUnfoldDir = this.params[SquareFold.ATTRS.FOLDED_FINAL] || 0;
    const foldedHeight =
      this.params[SquareFold.ATTRS.FOLDED_HEIGHT] || SquareFold.SIZE.MIN_PX;
    const foldedWidth =
      this.params[SquareFold.ATTRS.FOLDED_WIDTH] || SquareFold.SIZE.MIN_PX;
    const unfoldLimit = this.params[SquareFold.ATTRS.UNFOLD_LIMIT] || 1;
    const unfoldProgress = this.params[SquareFold.ATTRS.UNFOLD_PROGRESS] || 0;
    const currentUnfoldProgress = unfoldProgress * unfoldLimit;
    const currentUnfoldCount = Math.floor(currentUnfoldProgress);
    const nextUnfoldProgress = currentUnfoldProgress - currentUnfoldCount;
    const nextUnfoldDir = (firstUnfoldDir + currentUnfoldCount) % 2;
    const lowerFoldCount = Math.floor(currentUnfoldCount / 2);
    const higherFoldCount = currentUnfoldCount - lowerFoldCount;
    const currentWidth =
      foldedWidth *
      Math.pow(
        2,
        firstUnfoldDir == SquareFold.DIR.HORIZONTAL
          ? higherFoldCount
          : lowerFoldCount
      );
    const currentHeight =
      foldedHeight *
      Math.pow(
        2,
        firstUnfoldDir == SquareFold.DIR.VERTICAL
          ? higherFoldCount
          : lowerFoldCount
      );
    console.log({
      currentHeight,
      currentUnfoldCount,
      currentUnfoldProgress,
      currentWidth,
      nextUnfoldDir,
      nextUnfoldProgress,
      unfoldLimit,
      unfoldProgress,
    });

    const card =
      document.getElementById(SquareFold.CARD_ID) ??
      document.createElement("div");
    card.setAttribute("id", SquareFold.CARD_ID);
    card.style.backgroundColor = "red";
    card.style.height = `${currentHeight}px`;
    card.style.width = `${currentWidth}px`;
    this._root.appendChild(card);
  }
}

// Define the custom element
customElements.define(SquareFold.NAME, SquareFold);
