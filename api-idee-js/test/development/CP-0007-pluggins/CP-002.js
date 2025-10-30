import { map as Mmap } from 'IDEE/api-idee';

import Plugin from 'IDEE/Plugin';
import Tool from 'IDEE/tool/Tool';

const map = Mmap({
  container: 'map',
  projection: 'EPSG:3857',
});

window.mapa = map;

const plugin = new Plugin('MyPlugin', { tooltip: 'GitHub', position: 'right', svgPath: 'https://componentes.idee.es/estaticos/imagenes/logos/logo-github.svg' });
map.addPlugin(plugin);

const tool1 = new Tool('MyTool1', { tooltip: 'tool 1', svgPath: 'https://componentes.idee.es/estaticos/imagenes/logos/spain-flag.svg' });
tool1.htmlView = `<button id="toastInfor" class="m-controlToast"> 🛈 </button>
									<button id="toastError" class="m-controlToast"> ✘ </button>
									<button id="toastwarning" class="m-controlToast"> ⚠ </button>
									<button id="toastExito" class="m-controlToast"> ✔ </button>`;
tool1.activate = () => {
	console.log('Activada tool: controlToast ');
	tool1.parent.getTools().forEach((tool) => {
        tool.deactivate();
    });
	
	document.querySelector('#m-tool-button-MyTool1').classList.add("activated");
	tool1.panel.innerHTML = tool1.htmlView;
	tool1.parent.panel.panelContent.appendChild(tool1.panel);

	tool1.panel.querySelector('#toastInfor').onclick = function(){
		IDEE.toast.info('Notificación informativa');
	};
	tool1.panel.querySelector('#toastError').onclick = function(){
		IDEE.toast.error('Notificación de error', null, 5000);
	};
	tool1.panel.querySelector('#toastwarning').onclick = function(){
		IDEE.toast.warning('Notificación de aviso', 2, 3000);
	};
	tool1.panel.querySelector('#toastExito').onclick = function(){
		IDEE.toast.success('Notificación de éxito', 1, 1000);
	};
	tool1.activated = true;
}

tool1.deactivate = () => {
	console.log('Desactivada tool: tool1 ');
	document.querySelector('#m-tool-button-MyTool1').classList.remove("activated");
	tool1.panel.innerHTML = '';
	tool1.activated = false;
}
plugin.addTool(tool1);

const tool2 = new Tool('MyTool2', { tooltip: 'tool 2', svgPath: 'https://componentes.idee.es/estaticos/imagenes/logos/uk-flag.svg' });
tool2.htmlView = 'inglés';
plugin.addTool(tool2);
