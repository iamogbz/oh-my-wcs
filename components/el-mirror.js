/**
 * https://developer.mozilla.org/en-US/docs/Web/API/Web_components
 */
// TODO: see https://github.com/iamogbz/react-mirror

/** The init options used for observing elements for updates */
const INIT_OPTIONS = Object.freeze({
  attributes: true,
  childList: true,
  subtree: false,
  characterData: true,
});
/** @type {Readonly<Set<keyof GlobalEventHandlersEventMap>>} */
// @ts-expect-error string not automatically narrowed appropriately
const EVENT_TYPES = Object.freeze(
  new Set([
    "click",
    "input",
    "keypress",
    "keydown",
    "keyup",
    "mousemove",
    "mousedown",
    "mouseup",
    "scroll",
  ])
);

/**
 * Generate random string using length
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
 * Update, adding and removing attributes from element
 * TODO: type hinting matching the attributes accepted to element type
 * @param {Element | undefined} el
 * @param {Record<string, string | null>} attrs
 */
function updateAttributes(el, attrs) {
  if (!el) {
    console.warn("Invalid element given for update:", el, attrs);
    return;
  }
  for (const [attrName, attrValue] of Object.entries(attrs)) {
    if (attrValue) el.setAttribute(attrName, attrValue);
    else el.removeAttribute(attrName);
  }
}

/**
 * Get the dimensions of a given node
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
 * Check if node is html element
 * @param {Node | undefined} node
 */
function isElement(node) {
  return node ? !isText(node) : false;
}

/**
 * Check if node is plain text
 * @param {Node | undefined} node
 */
function isText(node) {
  return node?.nodeType === Node.TEXT_NODE;
}

/**
 * Custom implementation of `{@link Object.fromEntries}`
 * @template T eventual record values
 * @param {[string, T][]} entries
 * @returns {Record<string, T>}
 */
function fromEntries(entries) {
  return entries.reduce(
    (cummulator, [k, v]) => ({ ...cummulator, [k]: v }),
    {}
  );
}

/**
 * Observe changes to text node or html element
 * @param {Node & Element} target
 * @param {ResizeObserverCallback & MutationCallback & Parameters<GlobalEventHandlers["addEventListener"]>[1]} callback
 * @param {Readonly<Parameters<InstanceType<typeof ResizeObserver | typeof MutationObserver>["observe"]>[1]>} initOptions
 * @param {Readonly<Set<keyof GlobalEventHandlersEventMap>>?} eventTypes
 */
function observe(target, callback, initOptions = {}, eventTypes = null) {
  const ObserverClass = isElement(target) ? ResizeObserver : MutationObserver;
  const observer = new ObserverClass(callback);
  observer.observe(target, initOptions);

  // attach event listeners too
  const listener = (function addEventHandlers() {
    eventTypes?.forEach((eventType) => {
      target?.addEventListener(eventType, callback, false);
    });

    return {
      destroy: () => {
        eventTypes?.forEach((eventType) => {
          target?.removeEventListener(eventType, callback, false);
        });
      },
    };
  })();

  return {
    /** Wrap the observer disconnect and remove event listeners */
    disconnect: () => {
      listener.destroy();
      observer.disconnect();
    },
  };
}

class MirrorElement extends HTMLElement {
  static NAME = "mirror-element";
  static attrs = Object.freeze({
    /** attributes passed into frame in form of "attr=value;attr=value" */
    FRAME_ATTRS: "frame-attrs",
    /** ID of the target element to be mirrored */
    TARGET_ID: "target-id",
  });

  /** @type {Readonly<(typeof MirrorElement.attrs)[keyof (typeof MirrorElement.attrs)][]>} */
  static observedAttributes = Object.freeze(Object.values(MirrorElement.attrs));

  constructor() {
    super();
    this._root = this.attachShadow({ mode: "open" });
    this._instanceId = randomString(7);
    this.createMirror();
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
   * Create the elements used to mirror an isolated framed target.
   */
  createMirror() {
    this.frameEl = document.createElement("frame-element");
    this.frameEl.id = this._instanceId;
    this.frameStylesEl = document.createElement("frame-styles");
    this.reflectionEl = document.createElement("reflection-element");

    this.frameEl.appendChild(this.frameStylesEl);
    this.frameEl.appendChild(this.reflectionEl);
    this._root.appendChild(this.frameEl);
  }

  connectedCallback() {
    this.connectMirror();
  }

  attributeChangedCallback() {
    this.connectMirror();
  }

  adoptedCallback() {
    this.connectMirror();
  }

  connectMirror() {
    const targetElementId = this.params[MirrorElement.attrs.TARGET_ID];
    const frameAttrs = this.params[MirrorElement.attrs.FRAME_ATTRS];
    updateAttributes(this.frameEl, {
      [FrameElement.attrs.TARGET_ID]: targetElementId,
      [FrameElement.attrs.FRAME_ATTRS]: frameAttrs,
    });
    updateAttributes(this.reflectionEl, {
      [ReflectionElement.attrs.TARGET_ID]: targetElementId,
      [ReflectionElement.attrs.DESCENDANT_STYLES]: "pointer-events: none",
    });
  }
}

class FrameElement extends HTMLElement {
  static NAME = "frame-element";
  static attrs = Object.freeze({
    /** attributes passed into frame in form of "attr=value;attr=value" */
    FRAME_ATTRS: "frame-attrs",
    /** ID of the target element to be mirror framed */
    TARGET_ID: "target-id",
  });
  /** @type {Readonly<(typeof FrameElement.attrs)[keyof (typeof FrameElement.attrs)][]>} */
  static observedAttributes = Object.freeze(Object.values(FrameElement.attrs));

  constructor() {
    super();
    this._root = this.attachShadow({ mode: "open" });
    this.createFrame();
  }

  connectedCallback() {
    this.connectFrame();
    this.connectTarget();
  }

  attributeChangedCallback() {
    this.connectFrame();
    this.connectTarget();
  }

  adoptedCallback() {
    this.connectFrame();
    this.connectTarget();
  }

  disconnectedCallback() {
    this.targetObserver?.disconnect();
  }

  /**
   * Create the instance frame used to isolate reflection from rest of document.
   */
  createFrame() {
    const iframe = document.createElement("iframe");
    this._root.appendChild(iframe);
    this.frameEl = iframe;
  }

  /**
   * Connect the root frame and pass down props from mirror.
   */
  connectFrame() {
    if (!this.frameEl) {
      console.error(`No frame element found`);
      return;
    }
    const frameProps = this.getAttribute(FrameElement.attrs.FRAME_ATTRS);
    if (!frameProps) {
      console.warn(`No frame element attributes found`, frameProps);
      return;
    }
    const frameAttrs = fromEntries([
      ...new URLSearchParams(frameProps).entries(),
    ]);
    updateAttributes(this.frameEl, frameAttrs);
  }

  /**
   * Connect the target element using the current document.
   */
  connectTarget() {
    const targetId = this.getAttribute(FrameElement.attrs.TARGET_ID);
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
        `Target already previously connected to mirror frame. ${targetId}`
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
      if (!this.frameEl) {
        console.warn(
          `Frame element not found for dimension update:`,
          attributes
        );
        return;
      }
      updateAttributes(this.frameEl, attributes);
    };
    // provide reference for later disconnecting on callback
    this.targetObserver = observe(this.targetEl, updateFrameSize, {
      characterData: true,
    });
  }
}

class FrameStyles extends HTMLElement {
  static NAME = "frame-styles";
  static attrs = Object.freeze({});
  static observerdAttributes = Object.freeze(Object.values(FrameStyles.attrs));

  constructor() {
    super();
    this._root = this.attachShadow({ mode: "open" });
    this.createStyles()
  }

  createStyles() {
    // create element to import normaliseed frame styles
    const normaliseStyleEl = document.createElement("link");
    updateAttributes(normaliseStyleEl, {
      rel: "stylesheet",
      href: "https://necolas.github.io/normalize.css/8.0.1/normalize.css",
    });

    // create style element to reset frame document
    const resetFrameStyleEl = document.createElement("style");
    resetFrameStyleEl.id = "reset-frame";
    resetFrameStyleEl.textContent = `html { overflow: hidden }`;

    this._root.appendChild(normaliseStyleEl);
    this._root.appendChild(resetFrameStyleEl);
  }
}

class ReflectionElement extends HTMLElement {
  static NAME = "reflection-element";
  static attrs = Object.freeze({
    TARGET_ID: MirrorElement.attrs.TARGET_ID,
    /** class attribute to be passed to all descendant elements refelected */
    DESCENDANT_CLASSES: "descendant-cls",
    /** style attribute to be passed to all descendant elements reflected */
    DESCENDANT_STYLES: "descendant-styles",
  });
  /** @type {Readonly<(typeof ReflectionElement.attrs)[keyof (typeof ReflectionElement.attrs)][]>} */
  static observedAttributes = Object.freeze(
    Object.values(ReflectionElement.attrs)
  );
}

// Define the custom element
customElements.define(MirrorElement.NAME, MirrorElement);
customElements.define(FrameElement.NAME, FrameElement);
customElements.define(FrameStyles.NAME, FrameStyles);
customElements.define(ReflectionElement.NAME, ReflectionElement);
