/**
 * https://developer.mozilla.org/en-US/docs/Web/API/Web_components
 */

class MirrorElement extends HTMLElement {
  static NAME = "mirror-element";
  static attrs = Object.freeze({
    /** class attribute to be passed to all descendant elements refelected */
    REFLECTION_CLASSES: "reflection-cls",
    /** style attribute to be passed to all descendant elements reflected */
    REFLECTION_STYLES: "reflection-styles",
    /** attributes passed into frame in form of "attr=value;attr=value" */
    FRAME_ATTRS: "frame-attrs",
    /** ID of the target element to be mirrored */
    TARGET_ID: "target-id",
  });

  /** @type {Readonly<(typeof MirrorElement.attrs)[keyof (typeof MirrorElement.attrs)][]>} */
  static observedAttributes = Object.freeze(Object.values(MirrorElement.attrs));

  constructor() {
    super();
    // serves as mirror frame
    this._root = this.attachShadow({ mode: "open" });
    this._instanceId = randomString(7);
    this.createMirror();
  }

  get reflectionId() {
    return `${CUSTOM_CLASS_PREFIX}${this._instanceId}`;
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
    this.createStyles();
  }

  createStyles() {
    // create element to import normaliseed frame styles
    this.normaliseStyleEl = document.createElement("link");
    updateAttributes(this.normaliseStyleEl, {
      rel: "stylesheet",
      href: "https://necolas.github.io/normalize.css/8.0.1/normalize.css",
    });

    // create style element to reset frame document
    this.resetFrameStyleEl = document.createElement("style");
    this.resetFrameStyleEl.id = "reset-frame";
    this.resetFrameStyleEl.textContent = `html { overflow: hidden }`;

    // create style element to host document styles
    this.documentFrameStyleEl = document.createElement("style");
    this.documentFrameStyleEl.id = "parent-document-mirror-stylesheets";

    this._root?.appendChild(this.normaliseStyleEl);
    this._root?.appendChild(this.resetFrameStyleEl);
    this._root?.appendChild(this.documentFrameStyleEl);
  }

  connectedCallback() {
    this.ensureConnect();
  }

  attributeChangedCallback() {
    this.connectMirror();
  }

  adoptedCallback() {
    this.connectMirror();
  }

  disconnectedCallback() {
    this.reflectionObserver?.disconnect();
    this.styleObserver?.disconnect();
    this.targetSizeObserver?.disconnect();
  }

  /**
   * Attempt to connect to the target element multiple times
   * @param {{maxConnectionAttempts?: number, reconnectTimeoutMs?: number}} params
   */
  ensureConnect({ maxConnectionAttempts = 3, reconnectTimeoutMs = 1000 } = {}) {
    let connected = false;
    let connectionAttempts = 0;
    const doConnect = () => {
      if (connected) return;
      if (connectionAttempts > maxConnectionAttempts) {
        console.error("Failed to connect mirror reflection to target element");
        return;
      }
      connectionAttempts += 1;
      connected = this.connectMirror();
      setTimeout(doConnect, reconnectTimeoutMs);
    };
    doConnect();
  }

  connectMirror() {
    const targetId = this.params[MirrorElement.attrs.TARGET_ID];
    const frameProps = this.params[MirrorElement.attrs.FRAME_ATTRS];
    if (!frameProps) {
      console.warn(`No frame element attributes found`, frameProps);
    }
    // update the mirror frame with expanded frame props
    const frameAttrs = fromEntries([
      ...new URLSearchParams(frameProps ?? "").entries(),
    ]);
    updateAttributes(this, {
      "instance-id": this._instanceId,
      ...frameAttrs,
    });
    // Connect the target element using the current document.
    if (!targetId) {
      console.error(`No target element id attribute found`);
      return false;
    }
    const targetEl = document.getElementById(targetId);
    if (!targetEl) {
      console.warn(`Target element not found in document. ${targetId}`);
      return false;
    }
    this.targetEl = targetEl;
    this.connectFrame();
    this.connectStyles();
    this.connectReflection();
    return true;
  }

  connectStyles() {
    const updateStyles = () => {
      if (!this.documentFrameStyleEl) {
        console.warn("Parent document mirror stylesheet not found.");
        return;
      }
      const newRules = getAllStyleRules().join("\n");
      this.documentFrameStyleEl.textContent = newRules;
    };
    // provide reference for later disconnecting on callback
    this.styleObserver = observe({
      target: window.document,
      callback: updateStyles,
      initOptions: {
        attributeFilter: ["class"],
        attributes: true,
        characterData: true,
        childList: true,
        subtree: true,
      },
    });
  }

  connectFrame() {
    if (!this.targetEl) return;
    // attach size observer to target element to update existing frame
    const updateFrameSize = () => {
      const { top, bottom, left, right } = getBounds(this.targetEl);
      this.style.width = `${right - left}px`;
      this.style.height = `${bottom - top}px`;
    };
    // provide reference for later disconnecting on callback
    this.targetSizeObserver = observe({
      target: this.targetEl,
      callback: updateFrameSize,
      initOptions: {
        characterData: true,
      },
      dimensions: true,
    });
  }

  connectReflection() {
    if (!this.targetEl) return;
    // attach observer to target element to update existing frame
    const updateReflection = () => {
      if (!this.targetEl || isText(this.targetEl)) {
        this.innerHTML = this.targetEl?.innerHTML ?? "";
        return;
      }
      const descendantClasses = this.getAttribute(
        MirrorElement.attrs.REFLECTION_CLASSES
      );
      const descendantStyles = this.getAttribute(
        MirrorElement.attrs.REFLECTION_STYLES
      );

      const reflectedNode = cloneNode(this.targetEl, (original, clone) => {
        const {
          class: originalClasses,
          style: originalStyles,
          ...attributes
        } = getAttributes(original);
        const pseudoClassList = getUserActionCustomPseudoClassList(original);

        updateAttributes(clone, {
          readonly: true,
          class: [descendantClasses, originalClasses, ...pseudoClassList]
            .filter(Boolean)
            .join(" "),
          style: [descendantStyles, originalStyles].filter(Boolean).join(";"),
          ...attributes,
        });
        // match reflection scroll position
        clone.scrollTop = original.scrollTop;
        clone.scrollLeft = original.scrollLeft;
      });

      // @ts-expect-error reflection is always an element
      updateAttributes(reflectedNode, { "reflection-id": this.reflectionId });
      const previousReflectionEl = this._root.querySelector(
        `[reflection-id=${this.reflectionId}]`
      );
      // replace previous reflection
      // TODO: do this diff efficiently
      if (previousReflectionEl) {
        this._root.removeChild(previousReflectionEl);
      }
      if (reflectedNode) {
        this._root.appendChild(reflectedNode);
      }
    };
    // provide reference for later disconnecting on callback
    this.reflectionObserver = observe({
      target: this.targetEl,
      callback: updateReflection,
      initOptions: {
        attributes: true,
        childList: true,
        subtree: true,
        characterData: true,
      },
      eventTypes: EVENT_TYPES,
    });
    // trigger first render of reflection
    updateReflection();
  }
}

// Define the custom element
customElements.define(MirrorElement.NAME, MirrorElement);

// --- Helpers --- //
/** @type {Readonly<Set<keyof GlobalEventHandlersEventMap>>} */
// @ts-expect-error string not automatically narrowed appropriately
const EVENT_TYPES = Object.freeze(
  new Set([
    "click",
    "input",
    "keydown",
    "keypress",
    "keyup",
    "mousedown",
    "mouseleave",
    "mousemove",
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
 * @param {Record<string, string | boolean | null>} attrs
 */
function updateAttributes(el, attrs) {
  if (!el) {
    console.warn("Invalid element given for update:", el, attrs);
    return;
  }
  for (const [attrName, attrValue] of Object.entries(attrs)) {
    if (!attrValue) el.removeAttribute(attrName);
    else el.setAttribute(attrName, attrValue.toString());
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
 *
 * @param {Element | undefined} element
 * @returns
 */
function getAttributes(element) {
  /** @type {Record<string, string>} */
  const attributes = {};
  if (isElement(element)) {
    Array.from(element?.attributes ?? []).forEach((attr) => {
      attributes[attr.name] = attr.value;
    });
  }
  const fieldValue = getValue(element);
  if (fieldValue) attributes.value = fieldValue;
  return attributes;
}

/**
 * Get node value
 * @param {Element | undefined} node
 */
function getValue(node) {
  // @ts-expect-error will just return nothing if not {@type HTMLInputElement}
  return node?.value;
}

/**
 * Check if node is html element
 * @param {Node | undefined} node
 */
function isElement(node) {
  return node ? !isText(node) && node.nodeType !== Node.DOCUMENT_NODE : false;
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
 * @param {{
 *  target: Parameters<InstanceType<typeof ResizeObserver | typeof MutationObserver>["observe"]>[0];
 *  callback: ResizeObserverCallback & MutationCallback & Parameters<GlobalEventHandlers["addEventListener"]>[1];
 *  initOptions: Readonly<Parameters<InstanceType<typeof ResizeObserver | typeof MutationObserver>["observe"]>[1]>;
 *  eventTypes?: Readonly<Set<keyof GlobalEventHandlersEventMap>>?;
 *  dimensions?: boolean;
 * }} params
 */
function observe({
  target,
  callback,
  initOptions = {},
  eventTypes,
  dimensions = false,
}) {
  const ObserverClass =
    dimensions && !isText(target) ? ResizeObserver : MutationObserver;
  const observer = new ObserverClass(callback);
  // @ts-expect-error target union vs combination types
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

const USER_ACTION_PSEUDO_CLASS_LIST = Object.freeze([
  "active",
  "hover",
  "focus",
  // FIX: https://github.com/jsdom/jsdom/issues/3426
  // "focus-visible",
  // FIX: https://github.com/jsdom/jsdom/issues/3055
  // "focus-within",
]);

/**
 * @param {string} cssSelector
 */
function withCustomerUserActionPseudoClassSelector(cssSelector) {
  const userActionPseudoClassesRegex = new RegExp(
    USER_ACTION_PSEUDO_CLASS_LIST.map(userActionAsPseudoClassSelector).join("|")
  );

  return cssSelector.replace(
    userActionPseudoClassesRegex,
    (cls) => `.${asCustomPseudoClass(cls.substring(1))}`
  );
}

/**
 * Get as pseudo class name
 * @param {(typeof USER_ACTION_PSEUDO_CLASS_LIST)[number]} cls
 */
function userActionAsPseudoClassSelector(cls) {
  return `:${cls}`;
}

const CUSTOM_CLASS_PREFIX = "_refl_";
/**
 * @param {any} cls
 */
function asCustomPseudoClass(cls) {
  return `${CUSTOM_CLASS_PREFIX}${cls}`;
}

/**
 * Get the user action defined pseudo classes for given node
 * @param {Node | undefined} el
 */
function getUserActionPseudoClassList(el) {
  if (!isElement(el)) return [];
  return USER_ACTION_PSEUDO_CLASS_LIST.filter((cls) =>
    // @ts-expect-error at this point el is definitely {@type Element}
    el?.matches(`*${userActionAsPseudoClassSelector(cls)}`)
  );
}

/**
 * Get the user action defined pseudo classes customised for reflection
 * @param {Element | Text | undefined} el
 */
function getUserActionCustomPseudoClassList(el) {
  return getUserActionPseudoClassList(el).map(asCustomPseudoClass);
}

/**
 * Get all style rules from window document sorted by selector text
 */
function getAllStyleRules() {
  return [""]
    .concat(
      ...Array.from(document.styleSheets).map((sheet) => {
        try {
          return Array.from(sheet.cssRules).map((rule) => {
            return withCustomerUserActionPseudoClassSelector(rule.cssText);
          });
        } catch (err) {
          // TODO: probably a <link /> tag
          // console.warn("No css rules in sheet", sheet);
          return "";
        }
      })
    )
    .filter(Boolean)
    .sort();
}

/**
 * Deep clones a node and applies a callback to each cloned element including descendants.
 * @param {Node | undefined} node
 * @param {(original: Element, clone: Element) => void} onElement
 */
function cloneNode(node, onElement) {
  if (!node) return;
  if (isText(node)) return node.cloneNode(true);
  // @ts-expect-error node is an element at this point
  /** @type {Element} */ const element = node;
  const clonedElement = document.createElement(element.tagName);
  element.childNodes.forEach((childNode) => {
    const clonedChildNode = cloneNode(childNode, onElement);
    clonedChildNode && clonedElement.appendChild(clonedChildNode);
  });
  onElement(element, clonedElement);
  return clonedElement;
}
