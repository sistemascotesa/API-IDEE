/**
 * @module IDEE/control/StoryMapControl
 */

import StoryMapControlImplControl from 'impl/storymapcontrol';
import template from '../../templates/storymap';
import { getValue } from './i18n/language';

// import { getValue } from './i18n/language';

export default class StoryMapControl extends IDEE.Control {
  /**
   * @constructor
   * @extends {IDEE.Control}
   * @api
   */
  constructor(content = {}, delay = 2000, indexInContent = false) {
    if (IDEE.utils.isUndefined(StoryMapControlImplControl)
      || (IDEE.utils.isObject(StoryMapControlImplControl)
      && IDEE.utils.isNullOrEmpty(Object.keys(StoryMapControlImplControl)))) {
      IDEE.exception(getValue('exception.impl'));
    }
    const impl = new StoryMapControlImplControl();
    super('StoryMap', impl);
    this.content_ = content;
    this.delay = delay;

    this.stepIndex = 0;
    this.indexCap = 0;

    this.indexInContent = indexInContent;

    this.direction = true;

    this.svgArrowScroll = true;
    this.arrowScrollEffect_contador = 1;
    this.panelHTML_ = null;
  }

  /**
   * This function creates the view
   *
   * @public
   * @function
   * @param {IDEE.Map} map to add the control
   * @api
   */
  createView(map) {
    this.map_ = map;
    this.translations_ = {
      chapter: getValue('chapter'),
      step: getValue('step'),
    };
    return new Promise((success, fail) => {
      let html = IDEE.template.compileSync(template, {
        vars: {
          instructions: getValue('instructions'),
          speed: (this.delay / 1000),
          translations: {
            play: getValue('play'),
            pause: getValue('pause'),
            delay: getValue('delay'),
          },
        },
      });

      html = this.createContent(html, this.indexInContent);
      this.scrollEvent(html);
      html = this.createNavPointer(html, this.cap_.length);
      html = this.buttonDelay(html);

      map.on('IDEE.evt.COMPLETED', () => {
        this.createPointerSteps(0);
      });

      html = this.createPlayPause(html);
      html = this.arrowEvent(html);
      html = this.eventIndex(html);

      this.panelHTML_ = html;

      success(this.panelHTML_);
    });
  }

  createContent(allhtml, indexInContent) {
    const contentHistory = allhtml.querySelector('#contentStoryMap');
    this.cap_ = [...this.content_.cap];

    if (indexInContent) {
      const index = {
        title: indexInContent.title,
        subtitle: indexInContent.subtitle,
        steps: [{
          html: `${this.createIndex()}`,
          js: indexInContent.js,
        }],
      };
      this.cap_.unshift(index);
    }

    let content = '';

    this.cap_.forEach(({ steps }, i) => {
      if (i === 0) {
        content += `<div id=cap${i} style="display: flex;" class="chapters">`;
      } else {
        content += `<div id=cap${i} style="display: none;" class="chapters">`;
      }
      steps.forEach(({ html, js }, j) => {
        if (j === 0 && i === 0) {
          content += `<div id="step${j}" class="step d-flex-column" style="display: flex;">${html}</div>`;
        } else {
          content += `<div id="step${j}" class="step d-flex-column" style="display: none;">${html}</div>`;
        }
      });
      content += '</div>';
    });
    contentHistory.innerHTML += content;

    const title = allhtml.querySelector('#title_contentStoryMap');
    if (title) title.innerHTML = this.cap_[0].title;
    const subtitle = allhtml.querySelector('#subtitle_contentStoryMap');
    if (subtitle) subtitle.innerHTML = this.cap_[0].subtitle;

    const instructions = allhtml.querySelector('.m-storymap-instructions');
    if (instructions && !indexInContent) instructions.style.display = 'none';

    const navStep = allhtml.querySelector('#navStep');
    const stepLabel = this.translations_.step;
    let initialSteps = '';
    this.cap_[0].steps.forEach((s, i) => {
      initialSteps += `<svg id="pointStep${i}" height="23" width="23" index="${i}">
      <circle class="${i === 0 ? 'pointerEffect active' : 'pointerEffect'}" index="${i}" cx="50%" cy="50%" r="4" />
      <title>${stepLabel} ${i + 1}</title>
    </svg>`;
    });
    navStep.innerHTML = initialSteps;
    navStep.querySelectorAll('svg').forEach((elemt) => {
      elemt.addEventListener('click', ({ target }) => {
        this.disableStep(0, target.getAttribute('index'));
        this.addJSCap(0, target.getAttribute('index'));
        this.effectPointer(target.getAttribute('index'), '#pointStep', 'navStep');
      });
    });

    return allhtml;
  }

  disableCap(indexNextCap, indexCap, positionStep) {
    const divElement = document.querySelector('#contentStoryMap');
    const caps = divElement.querySelectorAll('.chapters');
    const steps = caps[indexNextCap].querySelectorAll('.step');

    caps[indexCap].style = 'display: none';
    caps[indexNextCap].style = 'display: flex';

    const step = (positionStep) ? steps[0] : steps[steps.length - 1];

    this.addJSCap(indexNextCap, (positionStep) ? 0 : steps.length - 1);

    step.style = 'display: flex';

    step.scroll({
      top: 20,
      behavior: 'smooth',
    });

    this.changeTitleSubtitle(indexNextCap);
  }

  disableStep(numberCap, activate) {
    const cap = document.querySelector(`#cap${numberCap}`);
    cap.querySelectorAll('.step').forEach((step) => {
      // eslint-disable-next-line no-param-reassign
      step.style = 'display: none;';
    });

    const stepActive = cap.querySelector(`#step${activate}`);
    stepActive.style = 'display: flex';

    stepActive.scroll({
      top: 20,
      behavior: 'smooth',
    });
  }

  changeTitleSubtitle(indexNextCap) {
    if (!this.cap_ || !this.cap_[indexNextCap]) return;
    const title = document.querySelector('#title_contentStoryMap');
    if (!title) return;
    title.innerHTML = this.cap_[indexNextCap].title;
    const subtitle = document.querySelector('#subtitle_contentStoryMap');
    if (!subtitle) return;
    subtitle.innerHTML = this.cap_[indexNextCap].subtitle;
  }

  capIndex(idContainer, idElement) {
    const container = document.querySelector(idContainer);
    const divElement = container.querySelectorAll(idElement);
    // eslint-disable-next-line guard-for-in, no-restricted-syntax
    for (const key of divElement) {
      if (key.style.display === 'flex') {
        const id = key.id;
        return Number.parseInt(id.match(/\d+/)[0], 10);
      }
    }
    return false;
  }

  createNavPointer(html, capLength) {
    const divElement = html.querySelector('#navPointer');
    const chapterLabel = this.translations_.chapter;
    // eslint-disable-next-line no-plusplus
    for (let i = 0; i < capLength; i++) {
      if (i === 0) {
        divElement.innerHTML += `
        <svg id="pointerNav${i}" height="23" width="23" index="${i}">
          <circle class="pointerEffect active" index="${i}" strokeWidth="1" cx="50%" cy="50%" r="4" />
          <title>${chapterLabel} ${i + 1}</title>
        </svg>
        `;
      } else {
        divElement.innerHTML += `
        <svg id="pointerNav${i}" height="23" width="23" index="${i}">
          <circle index="${i}" class="pointerEffect" cx="50%" cy="50%" r="4" />
          <title>${chapterLabel} ${i + 1}</title>
        </svg>
        `;
      }
    }

    const pointers = html.querySelectorAll('#navPointer > svg');
    pointers.forEach((pointer, i) => {
      pointer.addEventListener('click', ({ target }) => {
        this.resetScroll();
        this.disableCap(target.getAttribute('index'), this.capIndex('#contentStoryMap', '.chapters'), true);
        this.createPointerSteps(target.getAttribute('index'));
        this.effectPointer(target.getAttribute('index'), '#pointerNav', 'navPointer');
        this.effectPointer(0, '#pointStep', 'navStep');
      });
      pointer.children[0].addEventListener('click', ({ target }) => {
        this.resetScroll();
        this.disableCap(target.getAttribute('index'), this.capIndex('#contentStoryMap', '.chapters'), true);
        this.createPointerSteps(target.getAttribute('index'));
        this.effectPointer(target.getAttribute('index'), '#pointerNav', 'navPointer');
        this.effectPointer(0, '#pointStep', 'navStep');
      });
    });

    return html;
  }

  createPointerSteps(indexCap) {
    const steps = this.cap_[indexCap].steps;
    const stepLabel = this.translations_.step;

    let stepsPoint = '';

    steps.forEach((s, i) => {
      if (i === 0) {
        stepsPoint += `<svg id="pointStep${i}" height="23" width="23" index="${i}">
        <circle class="pointerEffect active" index="${i}" cx="50%" cy="50%" r="4" />
        <title>${stepLabel} ${i + 1}</title>
      </svg>`;
      } else {
        stepsPoint += `<svg id="pointStep${i}" height="23" width="23" index="${i}">
        <circle class="pointerEffect" index="${i}" cx="50%" cy="50%" r="4" />
        <title>${stepLabel} ${i + 1}</title>
      </svg>`;
      }
    });

    const navStep = document.querySelector('#navStep');
    navStep.innerHTML = stepsPoint;

    navStep.querySelectorAll('svg').forEach((elemt) => {
      elemt.addEventListener('click', ({ target }) => {
        this.disableStep(indexCap, target.getAttribute('index'));
        this.addJSCap(indexCap, target.getAttribute('index'));
        this.effectPointer(target.getAttribute('index'), '#pointStep', 'navStep');
      });
    });
  }

  createPlayPause(html) {
    const play = html.querySelector('#play');
    const pause = html.querySelector('#pause');
    this.idTimeCap = 0;
    this.allIntervalId = [];
    play.addEventListener('click', () => {
      play.style.display = 'none';
      pause.style.display = 'block';
      this.idTimeCap = this.timeCap();
      this.allIntervalId.push(this.idTimeCap);
    });

    pause.addEventListener('click', () => {
      pause.style.display = 'none';
      play.style.display = 'block';
      this.allIntervalId.forEach((id) => {
        clearInterval(id);
      });
    });
    return html;
  }

  resetScroll() {
    document.querySelectorAll('.step').forEach((e) => {
      e.style = 'display: none';
    });
  }

  stopPlayback() {
    this.allIntervalId.forEach((id) => clearInterval(id));
    document.querySelector('#play').style.display = 'block';
    document.querySelector('#pause').style.display = 'none';
  }

  scrollEvent(html) {
    const navContent = html.querySelectorAll('.chapters');
    navContent.forEach((cap) => {
      cap.querySelectorAll('.step').forEach((step) => {
        step.addEventListener('scroll', ({ target }) => {
          if (this.svgArrowScroll) this.arrowScrollEffect();
          const isScrolledToBottom = Math.abs(
            target.scrollHeight - target.clientHeight - target.scrollTop,
          ) < 2;
          const isLastCap = navContent[navContent.length - 1].id === cap.id;
          const isLastStep = `step${cap.childElementCount - 1}` === target.id;

          if (isScrolledToBottom && isLastCap && isLastStep) {
            this.stopPlayback();
          } else if (isScrolledToBottom && !(isLastCap && isLastStep)) {
            // eslint-disable-next-line no-param-reassign
            target.style = 'display: none';
            const idStep = Number(step.id.replace('step', '')) + 1;

            if (cap.querySelectorAll('.step').length - 1 < idStep) {
              const idCap = Number(cap.id.replace('cap', '')) + 1;
              document.querySelector(`#cap${idCap}`).style = 'display: flex';
              const siguienteStep = document.querySelector(`#cap${idCap}`).querySelector('#step0');
              siguienteStep.style = 'display: flex';

              document.querySelector(`#${cap.id}`).style = 'display: none';
              this.addJSCap(idCap, 0);
              this.effectPointer(idCap, '#pointerNav', 'navPointer');
              this.createPointerSteps(idCap);
              this.effectPointer(0, '#pointStep', 'navStep');
              this.changeTitleSubtitle(idCap);
            } else {
              const siguienteStep = document.querySelector(`#${cap.id}`).querySelector(`#step${idStep}`);
              const idCap = Number(cap.id.replace('cap', ''));
              siguienteStep.style = 'display: flex';
              siguienteStep.scrollTop = 3;
              this.addJSCap(idCap, idStep);
              this.effectPointer(idStep, '#pointStep', 'navStep');
            }
            // ***** Atras *****
          } else if (target.scrollTop === 0 && !(cap.id === 'cap0' && target.id === 'step0')) {
            const idStep = Number(step.id.replace('step', '')) - 1;
            // eslint-disable-next-line no-param-reassign
            target.style = 'display: none';

            if (idStep < 0) {
              const idCap = Number(cap.id.replace('cap', '')) - 1;
              const capNext = document.querySelector(`#cap${idCap}`);
              capNext.style = 'display: flex';

              const siguienteStep = document.querySelector(`#cap${idCap}`).querySelector(`#step${capNext.childElementCount - 1}`);
              siguienteStep.style = 'display: flex';
              siguienteStep.scrollTop = 10;

              document.querySelector(`#${cap.id}`).style = 'display: none';
              this.addJSCap(idCap, capNext.childElementCount - 1);
              this.effectPointer(idCap, '#pointerNav', 'navPointer');
              this.createPointerSteps(idCap);
              this.changeTitleSubtitle(idCap);
              this.effectPointer(capNext.childElementCount - 1, '#pointStep', 'navStep');
            } else {
              const idCap = Number(cap.id.replace('cap', ''));
              const siguienteStep = document.querySelector(`#${cap.id}`).querySelector(`#step${idStep}`);
              siguienteStep.style = 'display: flex';
              siguienteStep.scrollTop = 10;
              this.addJSCap(idCap, idStep);
              this.effectPointer(idStep, '#pointStep', 'navStep');
            }
          }
        });
      });
    });

    return html;
  }

  addJSCap(indexCap, indexStep) {
    try {
      if (document.querySelector('#storyMap_jsCap')) document.body.removeChild(document.querySelector('#storyMap_jsCap'));
      const newScript = document.createElement('script');
      newScript.id = 'storyMap_jsCap';

      const inlineScript = document.createTextNode(`{${this.cap_[indexCap].steps[indexStep].js}}`);
      newScript.appendChild(inlineScript);
      document.body.appendChild(newScript);
    } catch (error) {
      // eslint-disable-next-line no-console
      console.warn('Comprueba que has introducido correctamente el script, respetando ";" y llamando a map o mapjs');
    }
  }

  timeCap() {
    const id = setInterval(() => {
      const idStep = this.capIndex(`#cap${this.capIndex('#contentStoryMap', '.chapters')}`, '.step');
      const div = document.querySelector(`#cap${this.capIndex('#contentStoryMap', '.chapters')}`);
      const step = div.querySelector(`#step${idStep}`);
      const lenghtCap = this.cap_.length - 1;
      const lengthStep = this.cap_[this.cap_.length - 1].steps.length - 1;
      if (`#cap${this.capIndex('#contentStoryMap', '.chapters')}` !== `#cap${lenghtCap}`
        || `#step${idStep}` !== `#step${lengthStep}`) {
        step.scroll({ top: step.scrollHeight + 10, behavior: 'smooth' });
      } else {
        this.stopPlayback();
      }
    }, (document.querySelector('#buttonDelay').getAttribute('speed') * 1000));

    return id;
  }

  arrowScrollEffect() {
    this.arrowScrollEffect_contador -= 0.1;
    document.querySelector('.m-storymap-instructions').style = `opacity: ${this.arrowScrollEffect_contador}`;
    if (this.arrowScrollEffect_contador >= 0) this.arrowScrollEffect();

    this.svgArrowScroll = !this.svgArrowScroll;
  }

  arrowEvent(html) {
    html.querySelector('.m-storymap-instructions').addEventListener('mouseover', (e) => {
      document.querySelector('#cap0').querySelector('#step0').scroll({ top: 70, behavior: 'smooth' });
    });
    return html;
  }

  effectPointer(indexNext, typeNapID, container) {
    document.querySelector(`.${container} .pointerEffect.active`).classList.remove('active');
    document.querySelector(`${typeNapID}${indexNext} > circle`).classList.add('pointerEffect', 'active');
  }

  createIndex() {
    const { cap } = this.content_;

    let index = '';

    cap.forEach(({ title = '', subtitle = '' }, i) => {
      index += `<li index="${i + 1}">${title}. ${subtitle}</li>`;
    });

    index = `<ol class='m-storymap-chapters d-flex-column' id='indexContent'>${index}</ol>`;

    return index;
  }

  eventIndex(html) {
    html.querySelectorAll('#indexContent > li').forEach((li, i) => {
      li.addEventListener('click', ({ target }) => {
        this.resetScroll();
        this.disableCap(target.getAttribute('index'), this.capIndex('#contentStoryMap', '.chapters'), true);
        this.createPointerSteps(target.getAttribute('index'));
        this.effectPointer(target.getAttribute('index'), '#pointerNav', 'navPointer');
      });
    });
    return html;
  }

  buttonDelay(html) {
    const speed = [
      { cssClass: 'g-cartografia-storymap-btn-x05', value: 0 },
      { cssClass: 'g-cartografia-storymap-btn-x1', value: 1 },
      { cssClass: 'g-cartografia-storymap-btn-x2', value: 2 },
      { cssClass: 'g-cartografia-storymap-btn-x3', value: 3 },
      { cssClass: 'g-cartografia-storymap-btn-x5', value: 5 },
    ];
    const speedClasses = speed.map((s) => s.cssClass);
    let position = 0;
    html.querySelector('#buttonDelay').addEventListener('click', ({ target }) => {
      this.allIntervalId.forEach((id) => {
        clearInterval(id);
      });

      position = (position >= speed.length - 1) ? 0 : position + 1;
      if (position !== 0) {
        // eslint-disable-next-line no-param-reassign
        target.setAttribute('speed', (this.delay / 1000) / speed[position].value);
      } else {
        target.setAttribute('speed', (this.delay / 1000) * (speed[position].value + 1.5));
      }

      speedClasses.forEach((cls) => target.classList.remove(cls));
      target.classList.add(speed[position].cssClass);

      const play = html.querySelector('#play');
      const pause = html.querySelector('#pause');

      play.style.display = 'none';
      pause.style.display = 'block';

      const id = setInterval(() => {
        const idStep = this.capIndex(`#cap${this.capIndex('#contentStoryMap', '.chapters')}`, '.step');
        const div = document.querySelector(`#cap${this.capIndex('#contentStoryMap', '.chapters')}`);
        const step = div.querySelector(`#step${idStep}`);
        const lenghtCap = this.cap_.length - 1;
        const lengthStep = this.cap_[this.cap_.length - 1].steps.length - 1;
        if (`#cap${this.capIndex('#contentStoryMap', '.chapters')}` !== `#cap${lenghtCap}`
          || `#step${idStep}` !== `#step${lengthStep}`) {
          step.scroll({ top: step.scrollHeight + 10, behavior: 'smooth' });
        } else {
          this.stopPlayback();
        }
      }, (target.getAttribute('speed') * 1000));
      this.allIntervalId.push(id);
    });
    return html;
  }

  /**
   * This function is called on the control activation
   *
   * @public
   * @function
   * @api
   */
  activate() {
    super.activate();
  }

  /**
   * This function is called on the control deactivation
   *
   * @public
   * @function
   * @api
   */
  deactivate() {
    super.deactivate();
  }

  /**
   * This function compares controls
   *
   * @public
   * @function
   * @param {IDEE.Control} control to compare
    * @api
    */
  equals(control) {
    return control instanceof StoryMapControl;
  }
}
