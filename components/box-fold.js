class BoxFold extends HTMLElement {
  static NAME = "box-fold";
  static DEPS = {};

  static IDS = {
    CARD: "folded-card",
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
    /** The number of half folds that it takes to unfold fully */
    UNFOLD_LIMIT: "unfold-limit",
    /** Ratio percentage progress from fully folded to completely unfolded */
    UNFOLD_PROGRESS: "unfold-progress",
    CONTENT: "card-content",
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
    /** @type {Record<string, number | null>} */ const attrParams = {};
    BoxFold.observedAttributes.forEach((attrName) => {
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
    if (BoxFold.observedAttributes.includes(name) && oldValue !== newValue) {
      this.render();
    }
  }

  render() {
    // console.log(this.params);
    const firstUnfoldDir = this.params[BoxFold.ATTRS.FOLDED_FINAL] || 0;
    const foldedHeight =
      this.params[BoxFold.ATTRS.FOLDED_HEIGHT] || BoxFold.SIZE.MIN_PX;
    const foldedWidth =
      this.params[BoxFold.ATTRS.FOLDED_WIDTH] || BoxFold.SIZE.MIN_PX;
    const unfoldLimit = this.params[BoxFold.ATTRS.UNFOLD_LIMIT] || 1;
    const unfoldProgress = this.params[BoxFold.ATTRS.UNFOLD_PROGRESS] || 0;
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
      this._root.getElementById(BoxFold.IDS.CARD) ??
      document.createElement("div");
    card.setAttribute("id", BoxFold.IDS.CARD);
    card.style.backgroundColor = "red";
    card.style.position = "relative";
    card.style.height = `${currentHeight}px`;
    card.style.width = `${currentWidth}px`;

    const unfold =
      this._root.getElementById(BoxFold.IDS.FOLD) ??
      document.createElement("div");
    unfold.setAttribute("id", BoxFold.IDS.FOLD);
    unfold.style.backgroundColor = card.style.backgroundColor;
    const unfoldAngle = nextUnfoldDir ? 180 : 90;
    const unfoldShade = 1 - nextUnfoldProgress;
    const unfoldShadeA = `rgba(0,0,0,${unfoldShade / 2})`;
    const unfoldShadeB = `rgba(0,0,0,${unfoldShade})`;
    unfold.style.backgroundImage = `linear-gradient(${unfoldAngle}deg, ${unfoldShadeA}, ${unfoldShadeB})`;
    unfold.style.position = "absolute";
    unfold.style.height = `${
      currentHeight * (nextUnfoldDir ? nextUnfoldProgress : 1)
    }px`;
    unfold.style.width = `${
      currentWidth * (nextUnfoldDir ? 1 : nextUnfoldProgress)
    }px`;
    unfold.style.marginTop = nextUnfoldDir ? card.style.height : "0";
    unfold.style.marginLeft = nextUnfoldDir ? "0" : card.style.width;

    card.appendChild(unfold);
    this._root.appendChild(card);
  }
}

// Define the custom element
customElements.define(BoxFold.NAME, BoxFold);
