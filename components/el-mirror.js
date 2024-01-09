/**
 * https://developer.mozilla.org/en-US/docs/Web/API/Web_components
 */
// TODO: see https://github.com/iamogbz/react-mirror

/**
 * @param {number} length
 */
function randomString(length) {
  let str = "";
  while (str.length < length) {
    str += Math.random()
      .toString(36)
      .substr(2, length - str.length);
  }
  return str;
}

/**
 * @param {Element} el
 * @param {Record<string, string | null>} attrs
 */
function updateAttributes(el, attrs) {
  for (const [attrName, attrValue] of Object.entries(attrs)) {
    if (attrValue) el.setAttribute(attrName, attrValue);
    else el.removeAttribute(attrName);
  }
}

/**
 * @param {Node | Element | undefined} node
 */
function getBounds(node) {
  if (isElement(node)) {
    // @ts-expect-error node at this point is an element
    return node.getBoundingClientRect();
  }
  if (isText(node)) {
    const range = document.createRange();
    // @ts-expect-error confirmed text node at this point
    range.selectNodeContents(node);
    return range.getBoundingClientRect();
  }
  return new DOMRect();
}

/**
 * @param {Node | undefined} node
 */
function isElement(node) {
  return node ? !isText(node) : false;
}

/**
 * @param {Node | undefined} node
 */
function isText(node) {
  return node?.nodeType === Node.TEXT_NODE;
}

/**
 * Observe changes to text node or html element
 * @param {Node & Element} target
 * @param {ResizeObserverCallback & MutationCallback} callback
 * @param {Parameters<InstanceType<typeof ResizeObserver | typeof MutationObserver>["observe"]>[1]} initOptions
 */
function observe(target, callback, initOptions = {}) {
  const ObserverClass = isElement(target) ? ResizeObserver : MutationObserver;
  const observer = new ObserverClass(callback);
  observer.observe(target, initOptions);
  return observer;
}

class MirrorElement extends HTMLElement {
  static NAME = "mirror-element";
  // TODO: add props to be passed down to mirror frame
  static attrs = {
    FRAME_CLS: "frame-cls",
    TARGET_ID: "target-id",
  };

  static observedAttributes = [this.attrs.FRAME_CLS, this.attrs.TARGET_ID];

  constructor() {
    super();
    this._root = this.attachShadow({ mode: "open" });
    this._instanceId = randomString(7);
    this.createFrame();
  }

  /**
   * @returns {Record<string, string>}
   */
  get params() {
    const urlParams = new URLSearchParams(window.location.search);
    const attrParams = {};
    Object.values(MirrorElement.attrs).forEach((attrName) => {
      const attrValue =
        this.getAttribute(attrName) ?? urlParams.get(attrName) ?? undefined;
      Object.assign(attrParams, { [attrName]: attrValue });
    });
    // @ts-expect-error simple Record {} type mismatch
    return attrParams;
  }

  /**
   * Invoked when the custom element is first connected to the document's DOM.
   */
  connectedCallback() {
    this.connectFrame();
    this.connectTarget();
  }

  /**
   * Invoked when the custom element is moved to a new document.
   */
  adoptedCallback() {
    // this.connectFrame();
    this.connectTarget();
  }

  /**
   * Invoked when one of the custom element's attributes is added, removed, or changed.
   */
  attributeChangedCallback() {
    this.connectFrame();
    this.connectTarget();
  }

  /**
   * Invoked when the custom element is disconnected from the document's DOM.
   */
  disconnectedCallback() {
    if (this.targetObserver) {
      this.targetObserver.disconnect();
    }
  }

  createFrame() {
    const frameEl = document.createElement("iframe");
    frameEl.id = this._instanceId;
    this._root.appendChild(frameEl);
  }

  /**
   * Connect the root frame and pass down props from mirror
   */
  connectFrame() {
    if (!this._instanceId) {
      console.error(`No frame element id attribute found`);
      return;
    }
    const frameEl = this._root.getElementById(this._instanceId);
    if (!frameEl) {
      console.warn(`Frame element not found in document. ${this._instanceId}`);
      return;
    }
    this.frameEL = frameEl;
    // TODO: drop in the props to be passed to the mirror frame
    updateAttributes(frameEl, {
      class: this.params[MirrorElement.attrs.FRAME_CLS],
    });
  }

  /**
   * Connect the target element using the current document.
   */
  connectTarget() {
    const targetId = this.params[MirrorElement.attrs.TARGET_ID];
    if (!targetId) {
      console.error(`No target element id attribute found`);
      return;
    }
    const targetEl = document.getElementById(targetId);
    if (!targetEl) {
      console.warn(`Target element not found in document. ${targetId}`);
      return;
    }
    if (this.targetEl?.isEqualNode(targetEl)) {
      console.info(
        `Target already previously connected to mirror. ${targetId}`
      );
      return;
    }
    this.targetEl = targetEl;
    // attach size observer to target element to update existing frame
    const updateFrameSize = () => {
      const { top, bottom, left, right } = getBounds(this.targetEl);
      const attributes = {
        height: `${bottom - top}px`,
        width: `${right - left}px`,
      };
      if (!this.frameEL) {
        console.warn(
          `Frame element not found for dimension update:`,
          attributes
        );
        return;
      }
      updateAttributes(this.frameEL, attributes);
    };
    this.targetObserver = observe(targetEl, updateFrameSize, {
      characterData: true,
    });
  }
}

// Define the custom element
customElements.define(MirrorElement.NAME, MirrorElement);
