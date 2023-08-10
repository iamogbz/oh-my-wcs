const COMPONENT_STYLES = `
<style type="text/css">
.keyboard,
.keyrow {
  gap: 0.2em;
  outline: none;
  pointer-events: none;
  user-select: none;
}
.keyboard {
  align-items: center;
  display: flex;
  flex-direction: column;
  font-family: monospace;
  line-height: 1em;
  position: relative;

  &[aria-disabled="true"] .keyfield,
  .keyfield[aria-disabled="true"] {
    border-color: transparent;
    border-style: dotted;
    opacity: 0.5;
    pointer-events: none;
  }
}
.keyrow {
  align-items: center;
  display: flex;
  flex-direction: row;
  justify-content: space-between;
  position: relative;
}
.keyfield {
  align-items: center;
  border-color: initial;
  border-radius: 0.4em;
  border-style: solid;
  border-width: 2px;
  cursor: pointer;
  display: flex;
  flex-grow: 1;
  font-weight: 100;
  justify-content: center;
  min-height: 1em;
  min-width: 0.6em;
  padding: 0.2em 0.4em;
  pointer-events: all;
  position: relative;
  text-align: center;
  text-transform: uppercase;
  user-select: none;

  &[aria-current="true"] {
    font-weight: 900;
  }

  &[aria-selected="true"] {
    background-color: rgba(0,0,0,0.1);
    border-color: initial;
  }
}
</style>
`;

// Define the web component
class SimpleKeyboard extends HTMLElement {
  static NAME = "simple-keyboard";
  static DEPS = {
    // https://marked.js.org/
    "https://cdn.jsdelivr.net/npm/marked@5.1.2/marked.min.js": {
      marked: "marked",
    },
  };
  static CLS_KB = "keyboard";
  static CLS_KR = "keyrow";
  static CLS_KF = "keyfield";

  static ATTR_KEYS = "keys";
  static ATTR_KEYS_ACTIVE = "keys-active";
  static ATTR_KEYS_DISABLED = "keys-disabled";
  static ATTR_KEYS_SELECTED = "keys-selected";
  static ATTR_ARIA_DISABLED = "aria-disabled";

  constructor() {
    super();
    this._deps = Promise.all(
      Object.keys(SimpleKeyboard.DEPS).map((scriptUrl) => import(scriptUrl))
    );
    this._root = this.attachShadow({ mode: "open" });
  }

  static get observedAttributes() {
    return [
      SimpleKeyboard.ATTR_KEYS,
      SimpleKeyboard.ATTR_KEYS_ACTIVE,
      SimpleKeyboard.ATTR_KEYS_DISABLED,
      SimpleKeyboard.ATTR_KEYS_SELECTED,
      SimpleKeyboard.ATTR_ARIA_DISABLED,
    ];
  }

  get params() {
    const urlParams = new URLSearchParams(window.location.search);
    /** @type {Record<string, string | null>} */ const attrParams = {};
    SimpleKeyboard.observedAttributes.forEach((attrName) => {
      attrParams[attrName] =
        this.getAttribute(attrName) ?? urlParams.get(attrName);
    });
    return attrParams;
  }

  get keyboard() {
    /** @type {string[][]} */
    const keys = this.decodeAttr(SimpleKeyboard.ATTR_KEYS);
    return Object.freeze(
      keys.map((row) => Object.freeze(row.map((k) => `${k}`)))
    );
  }

  get allowedKeys() {
    /** @type {Set<string>} */
    const allowed = new Set();
    this.keyboard.forEach((line) => line.forEach((key) => allowed.add(key)));
    return Object.freeze(Array.from(allowed));
  }

  get activeKeys() {
    return this.decodeKeys(SimpleKeyboard.ATTR_KEYS_ACTIVE);
  }

  get selectedKeys() {
    return this.decodeKeys(SimpleKeyboard.ATTR_KEYS_SELECTED);
  }

  get disabledKeys() {
    return this.decodeKeys(SimpleKeyboard.ATTR_KEYS_DISABLED).concat(
      this.ariaDisabled === "true" ? this.allowedKeys : []
    );
  }

  connectedCallback() {
    document.addEventListener("keydown", (e) => this.selectKey(e.key, e));
    document.addEventListener("keyup", (e) => this.releaseKey(e.key, e));
    this.render();
  }

  /**
   * Handle web component watched attribute updates
   * @param {string} name
   * @param {string} oldValue
   * @param {string} newValue
   */
  attributeChangedCallback(name, oldValue, newValue) {
    if (
      SimpleKeyboard.observedAttributes.includes(name) &&
      oldValue !== newValue
    ) {
      this.render();
    }
  }

  render() {
    if (!this.keyboard) {
      this._root.innerHTML = `<p>No Keys</p>`;
      return;
    }

    this._root.innerHTML = `${COMPONENT_STYLES}`;

    const keyboardWrapper = document.createElement("div");
    keyboardWrapper.className = SimpleKeyboard.CLS_KB;
    keyboardWrapper.setAttribute("tabindex", "-1");
    [SimpleKeyboard.ATTR_ARIA_DISABLED].forEach((attrName) => {
      const attrVal = this.getAttribute(attrName);
      if (attrVal) keyboardWrapper.setAttribute(attrName, attrVal);
    });

    this.keyboard.forEach((keyLine) => {
      const keyLineWrapper = document.createElement("div");
      keyLineWrapper.className = SimpleKeyboard.CLS_KR;
      keyLineWrapper.setAttribute("tabindex", "-1");

      keyLine.forEach((k) => {
        const keyWrapper = document.createElement("div");
        keyWrapper.className = SimpleKeyboard.CLS_KF;
        keyWrapper.setAttribute("tabindex", "0");
        if (this.activeKeys.includes(k)) {
          keyWrapper.ariaCurrent = "true";
        }
        if (!k || this.disabledKeys.includes(k)) {
          keyWrapper.ariaDisabled = "true";
        }
        if (this.selectedKeys.includes(k)) {
          keyWrapper.ariaSelected = "true";
        }
        const keyName = this.getAttribute(
          `data-keyname-${k.toLowerCase().trim() || "space"}`
        );
        keyWrapper.innerHTML = keyName || k;
        keyWrapper.dataset.key = k;

        keyWrapper.addEventListener("mousedown", (e) => this.selectKey(k, e));
        keyWrapper.addEventListener("mouseup", (e) => this.releaseKey(k, e));
        keyWrapper.addEventListener("click", (e) => this.releaseKey(k, e));

        keyLineWrapper.appendChild(keyWrapper);
      });

      keyboardWrapper.appendChild(keyLineWrapper);
    });

    this._root.appendChild(keyboardWrapper);
  }

  /**
   * Select single key
   * @param {string} key
   * @param {Event | undefined} e
   */
  selectKey = (key, e) => {
    if (!this.allowedKeys.includes(key)) return;
    if (this.disabledKeys.includes(key)) return;
    e?.preventDefault();
    this.selectKeys(new Set([...this.selectedKeys, key]));
    if (e) this.onkeydown?.(this.asKeyboardEvent(e, "keydown", key));
  };

  /**
   * Release single key
   * @param {string} key
   * @param {Event | undefined} e
   */
  releaseKey = (key, e) => {
    if (!this.allowedKeys.includes(key)) return;
    if (this.disabledKeys.includes(key)) return;
    e?.preventDefault();
    const selectedKeys = new Set(this.selectedKeys);
    selectedKeys.delete(key);
    this.selectKeys(selectedKeys);
    if (e) this.onkeyup?.(this.asKeyboardEvent(e, "keyup", key));
  };

  /**
   * Convert event to single use keyboard event
   * @param {Event} e
   * @param {String} type
   * @param {string} key
   * @returns
   */
  asKeyboardEvent = (e, type, key) => {
    return new KeyboardEvent(type, { ...e, key, bubbles: false });
  };

  /** Set selected keys
   * @param {Set<string>} selectedKeys
   */
  selectKeys = (selectedKeys) => {
    this.setAttribute(
      SimpleKeyboard.ATTR_KEYS_SELECTED,
      this.encodeKeys(Array.from(selectedKeys))
    );
  };

  /**
   * @param {string} attrName
   */
  decodeKeys(attrName) {
    /** @type {string[]} */
    const attrValue = this.decodeAttr(attrName);
    return Object.freeze(attrValue.map((k) => `${k}`));
  }

  /**
   * @param {string} attrKey
   */
  decodeAttr(attrKey) {
    return JSON.parse(window.atob(this.params[attrKey] ?? this.encodeKeys([])));
  }

  /**
   * Convert keys to url encoded value
   * @param {readonly (readonly string[] | string)[]} keyboard
   * @returns {string}
   */
  encodeKeys(keyboard) {
    return window.btoa(JSON.stringify(keyboard));
  }
}

// Define the custom element
customElements.define(SimpleKeyboard.NAME, SimpleKeyboard);
