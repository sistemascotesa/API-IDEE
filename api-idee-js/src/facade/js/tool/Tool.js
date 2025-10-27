/**
 * @module IDEE/Tool
 */
import { isUndefined, isNullOrEmpty } from '../util/Utils';
import Base from '../Base';
import * as EventType from '../event/eventtype';
import Plugin from '../Plugin';

class Tool extends Base {
  constructor(name, options = {}) {
    super(options);

    this.name = name;
    this.tooltip = options.tooltip || '';
    this.svgPath = options.svgPath || null;

    this.map = null;
    this.panel = null;
    this.controls = null;
    this.element = null;
    this.activationBtn = null;
    this.activated = false;
  }

  addTo(parent) {
    this.parent = parent;
    const impl = this.getImpl();
    const view = this.createView(parent);
    if (view instanceof Promise) { // the view is a promise
      view.then((html) => {
        this.manageActivation(html);
        impl.addTo(parent, html);
        this.fire(EventType.ADDED_TO_MAP);
      });
    } else { // view is an HTML or text or null
      if (parent instanceof Plugin) {
        parent.addToolToPlugin(this);
      } else {
        impl.addTo(parent, view);
      }

      this.manageActivation(view);
      this.fire(EventType.ADDED_TO_MAP);
    }
  }

  createView(plugin) {
    const element = document.createElement('li');
    element.classList.add('m-api-idee-tab');
    element.id = `m-tool-button-${this.name}`;
    element.title = this.tooltip;
    element.role = 'button';
    element.ariaLabel = this.tooltip;

    if (this.svgPath) {
      fetch(this.svgPath)
        .then((response) => response.text())
        .then((svgContent) => {
          element.innerHTML = svgContent;
        });
    }

    this.element = element;
    return element;
  }

  manageActivation(html) {
    this.activationBtn = this.getActivationButton(this.element);
    if (!isNullOrEmpty(this.activationBtn)) {
      this.activationBtn.addEventListener('click', (evt) => {
        evt.preventDefault();
        if (!this.activated) {
          this.activate();
          this.activated = true;
          this.element.classList.add('activated');
        } else {
          this.deactivate();
          this.activated = false;
          this.element.classList.remove('activated');
        }
      }, false);
    }
  }

  getActivationButton(html) {
    return html;
  }

  activate() {
    if (!isNullOrEmpty(this.parent)) {
      this.parent.getTools().forEach((tool) => {
        tool.deactivate();
      });
    }
    if (!isNullOrEmpty(this.element)) {
      this.element.classList.add('activated');
    }
    if (!isUndefined(this.getImpl()) && !isUndefined(this.getImpl().activate)) {
      this.getImpl().activate();
    }

    this.activated = true;
    this.fire(EventType.ACTIVATED);
  }

  deactivate() {
    if (!isNullOrEmpty(this.element)) {
      this.element.classList.remove('activated');
    }
    if (!isUndefined(this.getImpl()) && !isUndefined(this.getImpl().deactivate)) {
      this.getImpl().deactivate();
    }
    this.activated = false;
    this.fire(EventType.DEACTIVATED);
  }
}

export default Tool;
