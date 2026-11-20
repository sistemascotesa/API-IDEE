/**
 * @module IDEE/control/VectorsManagementControl
 */

import implementationFactory from 'impl/implementationfactory';
import template from '../../templates/vectorsmanagement';
import editingSessionTemplate from '../../templates/editingsession';
import { getValue } from './i18n/language';
import SelectionControl, { FeatureSelection } from './selectioncontrol';
import AddLayerControl from './addlayercontrol';
import AnalysisControl from './analysiscontrol';
import CreationControl from './creationcontrol';
import DownloadControl from './downloadcontrol';
import EditionControl from './editioncontrol';
import HelpControl from './helpcontrol';
import StyleControl from './stylecontrol';
import TurfControl from './turfcontrol';
import { getSnapOptions } from './snapoptions';
import { formatSaveValidationError } from './dataideeformmessages';
import askChoice from './choicedialog';
import { EDITING_AREA, implementsContracts } from './contracts';

/**
 * Toolbar buttons whose panels show the editing session of the layer.
 * @const
 * @type {Array<String>}
 */
const EDITING_TOOLS = ['m-vectorsmanagement-creation', 'm-vectorsmanagement-edition'];

/**
 * @classdesc
 * Vector layers management api-idee control.
 * This control can create vector layers, draw and edit features, edit styles,
 * calculate topographic profiles and buffers, run Turf.js operations,
 * and download a layer or feature.
 */
export default class VectorsManagementControl extends IDEE.Control {
  get layerSelectorWrapper() {
    return this.html.querySelector('#m-vectorsmanagement-layer-selector');
  }

  get layerSelectorSelectedOption() {
    return this.layerSelectorWrapper.querySelector(
      '#m-vectorsmanagement-layer-selected',
    );
  }

  get layerSelectorOptionsContainer() {
    return this.layerSelectorWrapper.querySelector(
      '#m-vectorsmanagement-layer-selector-options',
    );
  }

  /**
   * @classdesc
   * Main constructor of the class. Creates a PluginControl
   * control
   *
   * @constructor
   * @extends {IDEE.Control}
   * @api stable
   */
  constructor({
    map,
    selection,
    addlayer,
    analysis,
    creation,
    download,
    edition,
    help,
    style,
    turf,
    snapping,
    profileGraphs,
    order,
  }) {
    const impl = typeof implementationFactory.vectorsManagement === 'function'
      ? implementationFactory.vectorsManagement()
      : new IDEE.impl.Control();
    super('VectorsManagement', impl, {});

    const allLayers = map
      .getLayers()
      .concat(map.getImpl().getAllLayerInGroup());
    this.selection_ = selection;
    this.addlayer_ = addlayer;
    this.analysis_ = analysis;
    this.creation_ = creation;
    this.download_ = download;
    this.edition_ = edition;
    this.snapOptions = getSnapOptions(snapping);
    // Graphs of the topographic profile
    this.profileGraphs = profileGraphs;
    this.help_ = help;
    this.style_ = style;
    this.turf_ = turf;
    this.layers_ = allLayers
      .filter(
        (l) => (l instanceof IDEE.layer.Vector
            || l instanceof IDEE.layer.GenericVector)
          && l.displayInLayerSwitcher,
      )
      .map((l) => {
        return {
          value: l.idLayer,
          text: l.legend || l.idLayer,
          zIndex: l.getZIndex(),
        };
      })
      .sort((a, b) => b.zIndex - a.zIndex);
    this.selectedLayer = null;

    /**
     * Features selected in the selected layer, shared by all controls
     * @private
     * @type {FeatureSelection}
     */
    this.featureSelection_ = null;

    /**
     * Listener of the map layers changes
     * @private
     * @type {Function}
     */
    this.refreshLayersListener_ = this.refreshLayers.bind(this);

    // order
    this.order = order;
  }

  /**
   * Creates the platform implementation of a control.
   *
   * @private
   * @function
   * @param {String} capability factory entry
   * @returns {Object|undefined} implementation, undefined if the platform does not provide it
   */
  createImplementation_(capability) {
    const create = implementationFactory[capability];
    return typeof create === 'function' ? create(this.map_) : undefined;
  }

  /**
   * This function creates the view
   *
   * @public
   * @function
   * @param {IDEE.Map} map to add the control
   * @api stable
   */
  createView(map) {
    this.map_ = map;
    return new Promise((success, fail) => {
      const html = IDEE.template.compileSync(template, {
        vars: {
          selection: this.selection_,
          addlayer: this.addlayer_,
          analysis: this.analysis_,
          creation: this.creation_,
          download: this.download_,
          edition: !!this.edition_,
          help: this.help_,
          style: this.style_,
          turf: this.turf_,
          layer: this.layers_,
          translations: {
            headertitle: getValue('tooltip'),
            analysis: getValue('analysis'),
            creation: getValue('creation'),
            download: getValue('download'),
            edition: getValue('edition'),
            help: getValue('help'),
            selection: getValue('selection'),
            style: getValue('style'),
            turf: getValue('turf.title'),
            selectLayerDefault: getValue('selectLayerDefault'),
          },
        },
      });
      this.html = html;
      this.featureSelection_ = new FeatureSelection(
        this.map_,
        this.createImplementation_('selection'),
        () => this.refreshSelection(),
      );

      if (this.selection_) {
        this.addSelectionControl(html);
      }

      if (this.addlayer_) {
        this.addAddLayerControl(html);
      }

      if (this.analysis_) {
        this.addAnalysisControl(html);
      }

      if (this.creation_) {
        this.addCreationControl(html);
      }

      if (this.download_) {
        this.addDownloadControl(html);
      }

      if (this.edition_) {
        this.addEditionControl(html);
      }

      if (this.help_) {
        this.addHelpControl(html);
      }

      if (this.style_) {
        this.addStyleControl(html);
      }

      if (this.turf_) {
        this.addTurfControl(html);
      }

      this.initLayerSelect();

      this.map_.on(IDEE.evt.ADDED_LAYER, this.refreshLayersListener_);
      this.map_.on(IDEE.evt.REMOVED_LAYER, this.refreshLayersListener_);

      this.accessibilityTab(html);
      success(html);
    });
  }

  getAllLayers() {
    return this.map_
      .getLayers()
      .concat(this.map_.getImpl().getAllLayerInGroup());
  }

  initLayerSelect() {
    this.layerSelectorWrapper.setAttribute('tabindex', '0');

    this.layerSelectorWrapper.addEventListener('click', (event) => {
      const isOpen = !this.layerSelectorOptionsContainer.classList.contains('closed');
      if (isOpen && this.layerSelectorOptionsContainer.children.length > 0) {
        this.layerSelectorOptionsContainer.classList.remove('flex');
        this.layerSelectorOptionsContainer.classList.add('closed');
        this.layerSelectorWrapper.classList.replace(
          'vectorsmanagement-icon-selector-arrow-up',
          'vectorsmanagement-icon-selector-arrow-down',
        );
      } else {
        this.layerSelectorOptionsContainer.classList.remove('closed');
        this.layerSelectorOptionsContainer.classList.add('flex');
        this.layerSelectorWrapper.classList.replace(
          'vectorsmanagement-icon-selector-arrow-down',
          'vectorsmanagement-icon-selector-arrow-up',
        );
      }
      this.layerSelectorWrapper.focus();
    });

    this.layerSelectorWrapper.addEventListener('selectLayer', (event) => {
      const { selected } = event.detail;
      if (
        this.editingPreparing_
        && selected.dataset.value !== this.selectedLayer?.idLayer
      ) {
        this.setEditingStatus_(getValue('editing_prepare_wait'), true);
        return;
      }
      if (
        this.editingSession_
        && selected.dataset.value !== this.selectedLayer?.idLayer
      ) {
        this.requestEndEditing().then((canSwitch) => {
          if (canSwitch) {
            this.layerSelectorWrapper.dispatchEvent(
              new CustomEvent('selectLayer', {
                detail: { selected },
              }),
            );
          }
        });
        return;
      }
      this.selectLayerEvent.bind(this);
      const selectionLayer = this.layerSelectorSelectedOption;
      selectionLayer.dataset.value = selected.dataset.value;
      selectionLayer.textContent = selected.textContent;
      selectionLayer.title = selected.textContent;

      for (
        let i = 0;
        i < this.layerSelectorOptionsContainer.children.length;
        i += 1
      ) {
        const option = this.layerSelectorOptionsContainer.children[i];
        option.selected = option.dataset.value === selected.dataset.value;
        if (option.selected) {
          option.classList.add('selected');
        } else {
          option.classList.remove('selected');
        }
      }

      this.selectLayerEvent();
    });

    this.layerSelectorWrapper.addEventListener('blur', () => this.closeLayerSelect());
    this.handleDocumentClick = (e) => {
      if (!this.layerSelectorWrapper.contains(e.target)) this.closeLayerSelect();
    };
    document.addEventListener('click', this.handleDocumentClick);

    this.refreshLayers();
  }

  closeLayerSelect() {
    if (this.layerSelectorOptionsContainer) {
      this.layerSelectorOptionsContainer.classList.remove('flex');
      this.layerSelectorOptionsContainer.classList.add('closed');
      this.layerSelectorWrapper.classList.remove(
        'vectorsmanagement-icon-selector-arrow-up',
      );
      this.layerSelectorWrapper.classList.add(
        'vectorsmanagement-icon-selector-arrow-down',
      );
    }
  }

  /**
   * This function manage the selection of a layer in selector.
   *
   * @public
   * @function
   * @api stable
   */
  selectLayerEvent() {
    if (
      this.selectionControl
      && (this.getSelection() === 'feature' || this.getSelectedFeatures().length > 0)
    ) {
      document
        .querySelector('#m-vectorsmanagement-selection')
        .classList.remove('activated');
      this.selectionControl.deactivate();
    }

    if (this.editionControl && this.editionControl.isActivated()) {
      document
        .querySelector('#m-vectorsmanagement-edition')
        .classList.remove('activated');
      this.editionControl.deactivate();
    }

    if (this.creationControl) {
      this.creationControl.deactivateDrawing();
    }
    if (this.getSelectedFeatures().length > 0) {
      this.featureSelection_.clear();
    }

    this.html
      .querySelector('#m-vectorsmanagement-previews')
      .classList.remove('closed');
    const selector = this.html.querySelector(
      '#m-vectorsmanagement-layer-selected',
    );
    const selectedLayerId = selector.dataset.value;

    const allLayers = this.map_
      .getLayers()
      .concat(this.map_.getImpl().getAllLayerInGroup());
    this.selectedLayer = allLayers.filter(
      (l) => l.idLayer === selectedLayerId,
    )[0];
    if (!this.selectedLayer) return;

    if (
      this.selectedLayer.type === 'MVT'
      || this.selectedLayer.type === 'MBTilesVector'
    ) {
      IDEE.toast.warning(getValue('exception.typeLayer'), null, 6000);
    }

    if (this.selection_) {
      this.selectionControl.setLayer(this.selectedLayer);
    }
    if (this.creation_) {
      this.creationControl.setLayer(this.selectedLayer);
    }
    if (this.edition_) {
      this.editionControl.setLayer(this.selectedLayer);
    }
    if (this.style_) {
      this.styleControl.setLayer(this.selectedLayer);
    }
    if (this.analysis_) {
      this.analysisControl.setLayer(this.selectedLayer);
    }
    if (this.download_) {
      this.downloadControl.setLayer(this.selectedLayer);
    }
    if (this.turf_) {
      this.turfControl.setLayer(this.selectedLayer);
    }
    // Permissions and messages belong to the previous layer. An open Creation panel was built
    // for it: it closes so that opening it again shows (or hides) the editing section.
    if (!this.editingSession_) {
      this.editingCapabilities_ = null;
      this.editingCapabilityError_ = false;
      this.editingMessage_ = '';
    }
    if (this.isEditingLayer() || this.editingSection_?.isConnected) this.closeEditingTools_();
    this.updateEditingAvailability();
  }

  /**
   * Indicates whether the selected layer is edited through a session (DataIDEE) that this
   * platform supports. Its Creation and Edition panels then show the editing section.
   *
   * @public
   * @function
   * @returns {Boolean} true if the layer is edited through a session
   * @api
   */
  isEditingLayer() {
    return this.isSessionLayer_(this.selectedLayer)
      && implementsContracts(this.getImpl(), EDITING_AREA);
  }

  isSessionLayer_(layer = this.selectedLayer) {
    return Boolean(
      layer
      && typeof layer.getEditingCapabilities === 'function'
      && typeof layer.beginEditing === 'function'
      && typeof layer.endEditing === 'function',
    );
  }

  hasActiveEditingSession() {
    return Boolean(this.editingSession_);
  }

  getActiveEditingSession() {
    return this.editingSession_;
  }

  getEditingCapabilities() {
    return this.editingCapabilities_;
  }

  /**
   * Indicates whether the selected layer is edited through a session (DataIDEE) but its
   * collection does not allow any change. Its features are only consulted: Edition opens
   * without a session and shows their attributes in a read-only form.
   *
   * @public
   * @function
   * @returns {Boolean} true when the permissions are known and allow nothing
   * @api
   */
  isReadOnlyEditingLayer() {
    const capabilities = this.editingCapabilities_;
    return this.isEditingLayer() && Boolean(capabilities)
      && !capabilities.create && !capabilities.update && !capabilities.delete;
  }

  /**
   * Geometry type that the selected layer stores for a drawn geometry. A layer edited through
   * a session (DataIDEE) only stores the types of its collection: the drawn type or, when the
   * collection only accepts its multipart type, that one (a drawn polygon is then stored as a
   * single-part multipolygon).
   *
   * @public
   * @function
   * @param {String} type Drawn geometry type: Point, LineString or Polygon
   * @returns {String|null} Type to store, or null when the layer accepts neither
   * @api
   */
  getEditingGeometryType(type) {
    const geometryTypes = this.isEditingLayer() ? this.editingCapabilities_?.geometryTypes : null;
    if (!geometryTypes?.length || geometryTypes.includes(type.toLowerCase())) return type;
    const multipart = `Multi${type}`;
    return geometryTypes.includes(multipart.toLowerCase()) ? multipart : null;
  }

  /**
   * Fills the editing section of the Creation or Edition panel that has just opened and
   * starts the session if there is none: its fixed area is the current map view. The
   * session stays active while the panels close and open.
   *
   * @public
   * @function
   * @param {HTMLElement} panel Panel template
   * @api
   */
  mountEditingSection(panel) {
    const section = panel.querySelector('#m-vectorsmanagement-editing');
    if (!section) return;
    const content = IDEE.template.compileSync(editingSessionTemplate, {
      vars: {
        translations: {
          editing_save: getValue('editing_save'),
          editing_discard: getValue('editing_discard'),
          editing_end: getValue('editing_end'),
        },
      },
    });
    content
      .querySelector('#m-vectorsmanagement-editing-save')
      .addEventListener('click', () => this.saveEditingChanges());
    content
      .querySelector('#m-vectorsmanagement-editing-discard')
      .addEventListener('click', () => this.discardEditingChanges());
    content
      .querySelector('#m-vectorsmanagement-editing-end')
      .addEventListener('click', () => this.requestEndEditing());
    section.replaceChildren(content);
    this.accessibilityTab(content);
    this.editingSection_ = section;
    this.renderEditingSection_();
    if (!this.editingSession_ && !this.editingPreparing_) this.startEditing();
  }

  /**
   * Shows the state of the session in the editing section of the open panel, if any.
   * @private
   * @function
   */
  renderEditingSection_() {
    const section = this.editingSection_;
    if (!section?.isConnected) return;
    const busy = Boolean(this.editingPreparing_ || this.editingSaving_);
    const ready = Boolean(this.editingSession_) && !busy;
    section.setAttribute('aria-busy', String(busy));
    section.querySelector('#m-vectorsmanagement-editing-status').textContent = this.editingMessage_ || '';
    section.querySelector('#m-vectorsmanagement-editing-save').disabled = !ready
      || Boolean(this.editingSession_.requiresReview);
    section.querySelector('#m-vectorsmanagement-editing-discard').disabled = !ready;
    section.querySelector('#m-vectorsmanagement-editing-end').disabled = !ready;
  }

  /**
   * Sets the message of the editing session, kept while the panels close and open.
   * @private
   * @function
   * @param {String} message Message
   * @param {Boolean} [notify=false] Shows it in a toast when no open panel shows the session
   */
  setEditingStatus_(message, notify = false) {
    this.editingMessage_ = message;
    if (this.editingSection_?.isConnected) this.renderEditingSection_();
    else if (notify && message) IDEE.toast.warning(message, null, 6000);
  }

  /**
   * Closes the Creation or Edition panel, if one of them is open.
   * @private
   * @function
   */
  closeEditingTools_() {
    const active = this.getControlActive(this.html);
    if (active && EDITING_TOOLS.includes(active.id)) this.deactive(this.html, '');
  }

  /**
   * Enables the tools allowed for the selected layer and, for a session layer without an
   * active session, requests its editing permissions.
   *
   * @public
   * @function
   * @api
   */
  updateEditingAvailability() {
    this.updateEditingTools_();
    this.loadEditingCapabilities_();
  }

  /**
   * Reason shown on the Creation and Edition buttons of a session layer when they are disabled.
   * @private
   * @function
   * @returns {String} Reason
   */
  getEditingBlockedReason_() {
    if (this.editingCapabilityError_) return getValue('editing_capability_error');
    return getValue(this.editingCapabilities_ ? 'editing_not_allowed' : 'editing_checking');
  }

  updateEditingTools_() {
    const isEditing = this.isEditingLayer();
    const attributeFormAvailable = Boolean(this.editingCapabilities_?.form?.available);
    const geometryTypes = this.editingCapabilities_?.geometryTypes;
    const readOnly = this.isReadOnlyEditingLayer();
    // Opening Creation or Edition starts the session, so they follow the permissions
    const permissions = {
      creation: this.editingCapabilities_?.create,
      edition: this.editingCapabilities_?.update || this.editingCapabilities_?.delete
        || (readOnly && attributeFormAvailable),
    };
    Object.entries(permissions).forEach(([id, allowed]) => {
      const button = this.html.querySelector(`#m-vectorsmanagement-${id}`);
      if (!button) return;
      const blocked = isEditing && !allowed;
      button.disabled = blocked;
      button.title = blocked ? this.getEditingBlockedReason_() : getValue(id);
      button.hidden = blocked && Boolean(this.editingCapabilities_);
    });
    const creationTemplate = this.creationControl?.template;
    if (creationTemplate) {
      const geometryButtons = {
        pointdrawing: 'Point',
        pointlocateddrawing: 'Point',
        linedrawing: 'LineString',
        polygondrawing: 'Polygon',
        figuredrawing: 'Polygon',
      };
      Object.entries(geometryButtons).forEach(([id, type]) => {
        const button = creationTemplate.querySelector(`#${id}`);
        if (button) {
          button.hidden = this.getEditingGeometryType(type) === null;
          button.disabled = isEditing
            && (!this.editingSession_ || !this.editingCapabilities_?.create
              || !attributeFormAvailable || button.hidden);
        }
      });
      const textButton = creationTemplate.querySelector('#textdrawing');
      if (textButton) {
        textButton.hidden = isEditing;
        textButton.disabled = isEditing;
      }
    }
    const editionTemplate = this.editionControl?.template;
    if (editionTemplate) {
      // The buttons of the session section follow its own state (renderEditingSection_)
      editionTemplate.querySelectorAll('button').forEach((button) => {
        if (button.closest('#m-vectorsmanagement-editing')) return;
        button.toggleAttribute('disabled', isEditing && !this.editingSession_);
      });
      const updateAllowed = !isEditing
        || Boolean(this.editingSession_ && this.editingCapabilities_?.update);
      [
        'edit',
        'holedrawing',
        'rotatedrawing',
        'scaledrawing',
        'movedrawing',
      ].forEach((id) => {
        const button = editionTemplate.querySelector(`#${id}`);
        if (button) {
          let compatible = true;
          if (id === 'holedrawing') {
            compatible = this.getEditingGeometryType('Polygon') !== null;
          } else if (id === 'rotatedrawing' || id === 'scaledrawing') {
            compatible = !isEditing || !geometryTypes?.length
              || geometryTypes.some((type) => type !== 'point');
          }
          button.hidden = !compatible || readOnly;
          button.disabled = !updateAllowed || !compatible;
        }
      });
      const deleteAllowed = !isEditing
        || Boolean(this.editingSession_ && this.editingCapabilities_?.delete);
      ['cleanAll', 'm-vectorsmanagement-deletegeom-btn'].forEach((id) => {
        const button = editionTemplate.querySelector(`#${id}`);
        if (button) button.disabled = !deleteAllowed;
      });
      const cleanAll = editionTemplate.querySelector('#cleanAll');
      if (cleanAll) cleanAll.hidden = !deleteAllowed;
      const attributes = editionTemplate.querySelector('#editattribute');
      if (attributes) {
        attributes.hidden = false;
        const selectedCount = this.getSelectedFeatures().length;
        const formAvailable = attributeFormAvailable;
        const canOpenForm = readOnly
          || Boolean(this.editingSession_ && this.editingCapabilities_?.update);
        attributes.disabled = isEditing
          && (!canOpenForm || !formAvailable || selectedCount !== 1);
        attributes.title = getValue('attributes');
        if (isEditing && selectedCount !== 1) {
          attributes.title = getValue('dataidee_form.multiple_selection');
        } else if (isEditing && !readOnly && !this.editingSession_) {
          attributes.title = getValue('dataidee_form.editing_not_started');
        } else if (isEditing && !readOnly && !this.editingCapabilities_?.update) {
          attributes.title = getValue('dataidee_form.collection_readonly');
        } else if (isEditing && !formAvailable) {
          attributes.title = this.editingCapabilities_?.form?.reason
            || getValue('dataidee_form.unsupported');
        }
      }
    }
  }

  loadEditingCapabilities_() {
    if (!this.isEditingLayer() || this.editingSession_) return;
    const targetLayer = this.selectedLayer;
    const revision = (this.capabilityRevision_ || 0) + 1;
    this.capabilityRevision_ = revision;
    const isCurrent = () => this.selectedLayer === targetLayer
      && this.capabilityRevision_ === revision && !this.editingSession_;
    targetLayer
      .getEditingCapabilities()
      .then((capabilities) => {
        if (!isCurrent()) return;
        this.editingCapabilities_ = capabilities;
        this.editingCapabilityError_ = false;
        this.updateEditingTools_();
      })
      .catch(() => {
        if (!isCurrent()) return;
        this.editingCapabilities_ = null;
        this.editingCapabilityError_ = true;
        this.updateEditingTools_();
      });
  }

  async startEditing() {
    if (this.editingPreparing_ || this.editingSession_) return;
    this.editingPreparing_ = true;
    this.setEditingStatus_(getValue('editing_preparing'));
    let prepared = null;
    const targetLayer = this.selectedLayer;
    try {
      const bbox = this.getImpl().getViewExtent();
      prepared = await targetLayer.beginEditing({ bbox });
      if (targetLayer !== this.selectedLayer) {
        targetLayer.endEditing(false);
        this.editingMessage_ = '';
        return;
      }
      this.featureSelection_.clear();
      this.editingSession_ = prepared.session || targetLayer.getEditingSession();
      if (!this.editingSession_) {
        throw new Error(
          'The selected layer did not provide an editing session.',
        );
      }
      this.editingCapabilities_ = prepared.capabilities;
      this.editingUnsubscribe_ = this.editingSession_.subscribe((state) => {
        this.setEditingStatus_(state.error?.message
          || getValue('editing_pending').replace('{count}', String(state.count)));
      });
      this.getImpl().addEditingBoundary(bbox);
      // The layer limit may have left features of the zone out of the session.
      const areaMessage = prepared.complete === false
        ? 'editing_fixed_area_limited' : 'editing_fixed_area';
      this.setEditingStatus_(getValue(areaMessage).replace(
        '{count}',
        String(prepared.features.length),
      ));
    } catch (error) {
      if (this.editingSession_) this.finishEditing();
      else if (prepared) {
        targetLayer.endEditing();
        this.featureSelection_.clear();
      }
      this.setEditingStatus_(error.message, true);
    } finally {
      this.editingPreparing_ = false;
      this.renderEditingSection_();
      this.updateEditingAvailability();
    }
  }

  async saveEditingChanges() {
    if (!this.editingSession_ || this.editingSession_.saving) return;
    this.editingSaving_ = true;
    this.renderEditingSection_();
    try {
      const result = await this.editingSession_.save();
      this.setEditingStatus_(getValue('editing_save_done')
        .replace('{completed}', String(result.completed.length))
        .replace('{pending}', String(result.pending)));
    } catch (error) {
      this.setEditingStatus_(error.code === 'VALIDATION'
        ? formatSaveValidationError(error, this.editingCapabilities_?.form?.fields)
        : getValue('editing_save_error').replace('{error}', error.message));
    } finally {
      this.editingSaving_ = false;
      this.renderEditingSection_();
    }
  }

  discardEditingChanges() {
    if (!this.editingSession_) return;
    const count = this.editingSession_.count;
    const requiresReview = this.editingSession_.requiresReview;
    this.editingSession_.discard();
    this.featureSelection_.clear();
    this.setEditingStatus_(getValue(
      requiresReview ? 'editing_discarded_uncertain' : 'editing_discarded',
    ).replace('{count}', String(count)));
  }

  async requestEndEditing() {
    if (!this.editingSession_) return true;
    if (this.editingSession_.count > 0) {
      const choice = await askChoice({
        id: 'm-vectorsmanagement-editing-end-choice',
        title: getValue('editing_end'),
        message: getValue('editing_end_prompt'),
        choices: [
          { value: 'save', label: getValue('editing_save') },
          { value: 'discard', label: getValue('editing_discard') },
        ],
        cancelLabel: getValue('cancel'),
      });
      if (choice === 'save') {
        await this.saveEditingChanges();
        if (this.editingSession_?.count > 0) return false;
      } else if (choice === 'discard') this.discardEditingChanges();
      else return false;
    }
    this.finishEditing();
    return true;
  }

  finishEditing(refresh = true) {
    if (!this.editingSession_) return;
    this.editingUnsubscribe_?.();
    this.editingUnsubscribe_ = null;
    this.editingSession_ = null;
    this.selectedLayer.endEditing(refresh);
    this.featureSelection_.clear();
    this.getImpl().removeEditingBoundary();
    this.editingMessage_ = '';
    // Without a session their tools cannot be used: opening them again starts a new one.
    this.closeEditingTools_();
    this.updateEditingAvailability();
  }

  /**
   * This function create the selection control.
   *
   * @public
   * @function
   * @param {Node} html plugin template
   * @api stable
   */
  addSelectionControl(html) {
    this.selectionControl = new SelectionControl(this.map_, this, this.createImplementation_('selection'));
    html
      .querySelector('#m-vectorsmanagement-selection')
      .addEventListener('click', (event) => {
        const clickActivate = event.target.classList.contains('activated');
        if (!clickActivate) {
          this.selectionControl.active(html);
          event.target.classList.add('activated');
          this.creationControl.deactivate();
          document
            .querySelector('#m-vectorsmanagement-creation')
            .classList.remove('activated');
        } else {
          this.selectionControl.deactivate();
          event.target.classList.remove('activated');
        }
      });
  }

  /**
   * This function create addlayer control.
   *
   * @public
   * @function
   * @param {Node} html plugin template
   * @api stable
   */
  addAddLayerControl(html) {
    this.addLayerControl = new AddLayerControl(this.map_);
    html.querySelector('#layerdrawing').addEventListener('click', (event) => {
      const clickActivate = this.deactive(html, 'addlayer');
      if (!clickActivate) {
        event.target.classList.add('activated');
        this.addLayerControl.active(html);
      }
    });
  }

  /**
   * This function create analysis control.
   *
   * @public
   * @function
   * @param {Node} html plugin template
   * @api stable
   */
  addAnalysisControl(html) {
    this.analysisControl = new AnalysisControl(this.map_, this, this.createImplementation_('analysis'));
    html
      .querySelector('#m-vectorsmanagement-analysis')
      .addEventListener('click', (event) => {
        const clickActivate = this.deactive(html, 'analysis');
        if (!clickActivate) {
          this.analysisControl.active(html);
          event.target.classList.add('activated');
        }
      });
  }

  /**
   * This function create creation control.
   *
   * @public
   * @function
   * @param {Node} html plugin template
   * @api stable
   */
  addCreationControl(html) {
    this.creationControl = new CreationControl(this.map_, this, this.createImplementation_('creation'));
    html
      .querySelector('#m-vectorsmanagement-creation')
      .addEventListener('click', (event) => {
        const clickActivate = this.deactive(html, 'creation');
        if (!clickActivate) {
          this.creationControl.active(html);
          event.target.classList.add('activated');
          if (this.selectionControl) {
            this.selectionControl.deactivate();
            document
              .querySelector('#m-vectorsmanagement-selection')
              .classList.remove('activated');
          }
        }
      });
  }

  /**
   * This function create download control.
   *
   * @public
   * @function
   * @param {Node} html plugin template
   * @api stable
   */
  addDownloadControl(html) {
    this.downloadControl = new DownloadControl(this.map_, this);
    html
      .querySelector('#m-vectorsmanagement-download')
      .addEventListener('click', (event) => {
        const clickActivate = this.deactive(html, 'download');
        if (!clickActivate) {
          if (this.selectedLayer.getFeatures().length > 0) {
            this.downloadControl.active(html);
            event.target.classList.add('activated');
          } else {
            IDEE.dialog.info(getValue('exception.emptylayer'));
          }
        }
      });
  }

  /**
   * This function create edition control.
   *
   * @public
   * @function
   * @param {Node} html plugin template
   * @api stable
   */
  addEditionControl(html) {
    this.editionControl = new EditionControl(this.map_, this, this.createImplementation_('edition'));
    html
      .querySelector('#m-vectorsmanagement-edition')
      .addEventListener('click', (event) => {
        const $selection = document.querySelector(
          '#m-vectorsmanagement-selection',
        );

        if (
          this.selectionControl
          && $selection.classList.contains('activated')
        ) {
          this.selectionControl.hideSelectionLayer();
          $selection.classList.remove('activated');
        }

        const clickActivate = this.deactive(html, 'edition');

        if (!clickActivate) {
          this.editionControl.active(html);
          if (this.selectionControl) {
            this.selectionControl.active(html);
            $selection.classList.add('activated');
          }
          event.target.classList.add('activated');
        }
      });
  }

  /**
   * This function create help control.
   *
   * @public
   * @function
   * @param {Node} html plugin template
   * @api stable
   */
  addHelpControl(html) {
    this.helpControl = new HelpControl(this.map_, this);
    html
      .querySelector('#m-vectorsmanagement-help')
      .addEventListener('click', (event) => {
        const clickActivate = this.deactive(html, 'help');
        if (!clickActivate) {
          this.helpControl.active(html);
          event.target.classList.add('activated');
        }
      });
  }

  /**
   * This function create style control.
   *
   * @public
   * @function
   * @param {Node} html plugin template
   * @api stable
   */
  addStyleControl(html) {
    this.styleControl = new StyleControl(this.map_, this);
    html
      .querySelector('#m-vectorsmanagement-style')
      .addEventListener('click', (event) => {
        const clickActivate = this.deactive(html, 'style');
        if (!clickActivate) {
          this.styleControl.active(html);
          event.target.classList.add('activated');
        }
      });
  }

  /**
   * This function create Turf.js control.
   *
   * @public
   * @function
   * @param {Node} html plugin template
   * @api stable
   */
  addTurfControl(html) {
    this.turfControl = new TurfControl(this.map_, this, this.createImplementation_('turf'));
    html
      .querySelector('#m-vectorsmanagement-turf')
      .addEventListener('click', (event) => {
        const clickActivate = this.deactive(html, 'turf');
        if (!clickActivate) {
          this.turfControl.active(html);
          event.target.classList.add('activated');
        }
      });
  }

  /**
   * This function deactivates the activated control
   * before activating another
   *
   * @public
   * @function
   * @param {Node} html
   * @param {String} control
   * @api
   */
  deactive(html, control) {
    const active = this.getControlActive(html);
    let clickActivate = false;
    if (!active) {
      return clickActivate;
    }

    if (active) {
      if (active.id === `m-vectorsmanagement-${control}`) {
        clickActivate = true;
      }
      if (active.id === 'layerdrawing') {
        this.addLayerControl.deactivate();
      } else if (active.id === 'm-vectorsmanagement-selection') {
        this.selectionControl.deactivate();
      } else if (active.id === 'm-vectorsmanagement-analysis') {
        this.analysisControl.deactivate();
      } else if (active.id === 'm-vectorsmanagement-creation') {
        this.creationControl.deactivate();
      } else if (active.id === 'm-vectorsmanagement-download') {
        this.downloadControl.deactivate();
      } else if (active.id === 'm-vectorsmanagement-edition') {
        this.editionControl.deactivate();
      } else if (active.id === 'm-vectorsmanagement-help') {
        this.helpControl.deactivate();
      } else if (active.id === 'm-vectorsmanagement-style') {
        this.styleControl.deactivate();
      } else if (active.id === 'm-vectorsmanagement-turf') {
        this.turfControl.deactivate();
      }

      active.classList.remove('activated');
    }

    return clickActivate;
  }

  /**
   * This function returns node button of active control.
   *
   * @public
   * @function
   * @param {Node} html plugin template
   * @api stable
   */
  getControlActive(html) {
    if (
      html.querySelectorAll(
        '#m-vectorsmanagement-previews .activated:not(#m-vectorsmanagement-selection)',
      ).length === 0
    ) {
      return false;
    }
    return html.querySelectorAll(
      '#m-vectorsmanagement-previews .activated:not(#m-vectorsmanagement-selection)',
    )[0];
  }

  /**
   * This function gets the selection of selectionControl (feature/layer).
   *
   * @public
   * @function
   * @api stable
   * @returns {String} selection
   */
  getSelection() {
    let selection = 'layer';
    if (this.selectionControl) {
      selection = this.selectionControl.getSelection();
    }
    return selection;
  }

  /**
   * This function gets the features selection shared by controls.
   *
   * @public
   * @function
   * @api
   * @returns {FeatureSelection} selection
   */
  getFeatureSelection() {
    return this.featureSelection_;
  }

  /**
   * This function gets the selected features.
   *
   * @public
   * @function
   * @api stable
   * @returns {Array} features
   */
  getSelectedFeatures() {
    return this.featureSelection_ ? this.featureSelection_.getFeatures() : [];
  }

  /**
   * This function gets the selected openlayers features of selectionControl.
   *
   * @public
   * @function
   * @api stable
   * @returns {Array} features
   */
  getSelectedOLFeatures() {
    let olFeatures = [];
    if (this.selectionControl) {
      olFeatures = this.selectionControl.getSelectedOLFeatures();
    }
    return olFeatures;
  }

  /**
   * This function clear the selected features.
   *
   * @public
   * @function
   * @api stable
   */
  removeSelectedFeatures() {
    this.featureSelection_.clear();
  }

  /**
   * This function adds a feature to selected features.
   *
   * @public
   * @function
   * @param {IDEE.Feature} feature
   * @api stable
   */
  addFeatureToSelection(feature) {
    this.featureSelection_.add(feature);
  }

  /**
   * This function disable selection of selectionControl.
   *
   * @public
   * @function
   * @api stable
   */
  hideSelectionLayer() {
    if (this.selectionControl) {
      const controlBtn = this.html.querySelector(
        '#m-vectorsmanagement-selection',
      );
      if (controlBtn.classList.contains('activated')) {
        this.selectionControl.hideSelectionLayer();
      }
    }
  }

  /**
   * This function enable selection of selectionControl.
   *
   * @public
   * @function
   * @api stable
   */
  showSelectionLayer() {
    if (this.selectionControl) {
      const controlBtn = this.html.querySelector(
        '#m-vectorsmanagement-selection',
      );
      if (controlBtn.classList.contains('activated')) {
        this.selectionControl.showSelectedLayer();
      }
    }
  }

  /**
   * This function refresh options layers for selection.
   *
   * @public
   * @function
   * @api stable
   */
  refreshLayers() {
    if (
      this.selectedLayer
      && !this.getAllLayers().includes(this.selectedLayer)
    ) {
      const pending = this.editingSession_?.count || 0;
      this.deactive(this.html, '');
      if (this.editingSession_) this.finishEditing(false);
      if (pending > 0) {
        IDEE.toast.warning(getValue('editing_removed_notice'), null, 6000);
      }
      if (this.getSelectedFeatures().length > 0) {
        this.featureSelection_.clear();
      }
      this.selectedLayer = null;
    }
    this.layers_ = this.getAllLayers()
      .filter(
        (l) => (l instanceof IDEE.layer.Vector
            || l instanceof IDEE.layer.GenericVector)
          && l.displayInLayerSwitcher,
      )
      .map((l) => ({
        value: l.idLayer,
        text: l.legend || l.idLayer,
        zIndex: l.getZIndex(),
      }));

    const layerSelector = this.layerSelectorWrapper;
    layerSelector.classList.remove('disabled');
    const selectedLayerSpan = this.layerSelectorSelectedOption;
    const optionsContainer = this.layerSelectorOptionsContainer;

    const layerIdSelected = selectedLayerSpan.dataset.value ?? '';
    const layerExists = this.layers_.some((l) => l.value === layerIdSelected);

    optionsContainer.innerHTML = '';

    const layerOrder = [...this.layers_].sort((a, b) => b.zIndex - a.zIndex);
    layerOrder.forEach((layer, i) => {
      const span = document.createElement('span');
      span.textContent = layer.text;
      span.title = layer.text;
      span.dataset.value = layer.value;
      span.addEventListener('click', (event) => {
        const changeEvent = new CustomEvent('selectLayer', {
          detail: { selected: event.target },
          bubbles: true,
        });
        layerSelector.dispatchEvent(changeEvent);
      });
      optionsContainer.appendChild(span);
    });

    if (!layerExists) {
      if (this.layers_.length === 0) layerSelector.classList.add('disabled');
      selectedLayerSpan.textContent = `${getValue('selectLayerDefault')}...`;
      selectedLayerSpan.title = selectedLayerSpan.textContent;
      delete selectedLayerSpan.dataset.value;
      this.html
        .querySelector('#m-vectorsmanagement-previews')
        .classList.add('closed');
      this.deactive(this.html, '');
    }
  }

  /**
   * This function refresh selected features for other controls.
   *
   * @public
   * @function
   * @api stable
   */
  refreshSelection() {
    if (this.turf_) this.turfControl.onSelectionChange();
    const active = this.getControlActive(this.html);
    if (active) {
      if (active.id === 'm-vectorsmanagement-edition') {
        this.editionControl.refreshSelection();
      } else if (active.id === 'm-vectorsmanagement-style') {
        this.styleControl.refreshStyle();
      }
    }
  }

  accessibilityTab(html) {
    html
      .querySelectorAll('[tabindex="0"]')
      .forEach((el) => el.setAttribute('tabindex', this.order));
  }

  /**
   * This function leaves the map as it was before adding the plugin:
   * removes interactions, selection, windows and listeners.
   *
   * @public
   * @function
   * @api stable
   */
  destroy() {
    document.removeEventListener('click', this.handleDocumentClick);
    if (this.map_) {
      this.map_.un(IDEE.evt.ADDED_LAYER, this.refreshLayersListener_);
      this.map_.un(IDEE.evt.REMOVED_LAYER, this.refreshLayersListener_);
    }
    if (this.editingSession_) this.finishEditing(false);
    if (this.html) this.deactive(this.html, '');
    if (this.selectionControl) this.selectionControl.deactivate();
    if (this.featureSelection_) this.featureSelection_.destroy();
    if (this.analysisControl) this.analysisControl.destroy();
    if (this.turfControl) this.turfControl.destroy();
    // Dialogs are modal over the map, so the open ones come from the plugin
    IDEE.dialog.remove();
  }

  /**
   * This function compares controls
   *
   * @public
   * @function
   * @param {IDEE.Control} control to compare
   * @api stable
   */
  equals(control) {
    return control instanceof VectorsManagementControl;
  }
}
