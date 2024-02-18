/**
 * https://developer.mozilla.org/en-US/docs/Web/API/Web_components
 */

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
    // serves as mirror frame
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
    this.frameStylesEl = document.createElement("frame-styles");
    this.reflectionEl = document.createElement("reflection-element");

    this._root.appendChild(this.frameStylesEl);
    this._root.appendChild(this.reflectionEl);
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

  disconnectedCallback() {
    this.targetObserver?.disconnect();
  }

  connectMirror() {
    const targetId = this.params[MirrorElement.attrs.TARGET_ID];
    const frameProps = this.params[MirrorElement.attrs.FRAME_ATTRS];
    if (!frameProps) {
      console.warn(`No frame element attributes found`, frameProps);
      return;
    }
    // update the mirror frame with expanded frame props
    const frameAttrs = fromEntries([
      ...new URLSearchParams(frameProps).entries(),
    ]);
    updateAttributes(this, {
      "instance-id": this._instanceId,
      ...frameAttrs,
    });
    // connect the reflection to the target
    updateAttributes(this.reflectionEl, {
      [ReflectionElement.attrs.TARGET_ID]: targetId,
      [ReflectionElement.attrs.DESCENDANT_STYLES]: "pointer-events: none",
    });
    // Connect the target element using the current document.
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
      this.style.width = `${right - left}px`;
      this.style.height = `${bottom - top}px`;
    };
    // provide reference for later disconnecting on callback
    this.targetObserver = observe(this.targetEl, updateFrameSize, {
      characterData: true,
    });
  }
}

/** This does not use a shadow dom so must be wrapped by MirrorElement */
class FrameStyles extends HTMLElement {
  static NAME = "frame-styles";
  static attrs = Object.freeze({});
  static observedAttributes = Object.freeze(Object.values(FrameStyles.attrs));

  connectedCallback() {
    this.createStyles();
    this.connectStyles();
  }

  adoptedCallback() {
    this.connectStyles();
  }

  disconnectedCallback() {
    this.styleObserver?.disconnect();
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

    this.appendChild(this.normaliseStyleEl);
    this.appendChild(this.resetFrameStyleEl);
    this.appendChild(this.documentFrameStyleEl);
  }

  connectStyles() {
    const updateStyles = () => {
      if (!this.documentFrameStyleEl) {
        console.warn("Parent document mirror stylesheet not found.");
        return;
      }
      const newRules = getAllStyleRules().join(";");
      this.documentFrameStyleEl.textContent = newRules;
    };
    // provide reference for later disconnecting on callback
    this.styleObserver = observe(window.document, updateStyles, {
      attributeFilter: ["class"],
      attributes: true,
      characterData: true,
      childList: true,
      subtree: true,
    });
  }
}

/** This does not use a shadow dom so must be wrapped by MirrorElement */
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

  connectedCallback() {
    this.connectReflection();
  }

  attributeChangedCallback() {
    this.connectReflection();
  }

  adoptedCallback() {
    this.connectReflection();
  }

  disconnectedCallback() {
    this.targetObserver?.disconnect();
  }

  connectReflection() {
    const targetId = this.getAttribute(ReflectionElement.attrs.TARGET_ID);
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
        `Target already previously connected to reflection. ${targetId}`
      );
      return;
    }
    this.targetEl = targetEl;

    const descendantClasses = this.getAttribute(
      ReflectionElement.attrs.DESCENDANT_CLASSES
    );
    const descendantStyles = this.getAttribute(
      ReflectionElement.attrs.DESCENDANT_STYLES
    );
    // attach observer to target element to update existing frame
    const updateReflection = () => {
      if (!this.targetEl || isText(this.targetEl)) {
        this.innerHTML = this.targetEl?.innerHTML ?? "";
        return;
      }
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

      // replace previous reflection
      // TODO: do this diff efficiently
      this.innerHTML = "";
      reflectedNode && this.appendChild(reflectedNode);
    };
    // provide reference for later disconnecting on callback
    this.targetObserver = observe(
      this.targetEl,
      updateReflection,
      INIT_OPTIONS,
      EVENT_TYPES
    );
  }
}

// Define the custom element
customElements.define(MirrorElement.NAME, MirrorElement);
customElements.define(FrameStyles.NAME, FrameStyles);
customElements.define(ReflectionElement.NAME, ReflectionElement);

// --- Helpers --- //
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
 * @param {Parameters<InstanceType<typeof ResizeObserver | typeof MutationObserver>["observe"]>[0]} target
 * @param {ResizeObserverCallback & MutationCallback & Parameters<GlobalEventHandlers["addEventListener"]>[1]} callback
 * @param {Readonly<Parameters<InstanceType<typeof ResizeObserver | typeof MutationObserver>["observe"]>[1]>} initOptions
 * @param {Readonly<Set<keyof GlobalEventHandlersEventMap>>?} eventTypes
 */
function observe(target, callback, initOptions = {}, eventTypes = null) {
  const ObserverClass = isElement(target) ? ResizeObserver : MutationObserver;
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
          console.warn("No css rules in sheet", sheet);
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
