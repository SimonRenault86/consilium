import '@styles/tailwind.css';
import '@styles/main.scss';
import { createApp } from 'vue';
import AssemblyMap from '@components/AssemblyMap.vue';

const mapEl = document.getElementById('assembly-map');
if (mapEl) {
    createApp(AssemblyMap).mount(mapEl);
}
