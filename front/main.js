import '@styles/tailwind.css';
import '@styles/main.scss';
import { createApp } from 'vue';
import HomePage from '@components/HomePage.vue';
import { initDeputes } from '@/helpers/deputes.js';
import { initPartis } from '@/helpers/partis.js';

const mapEl = document.getElementById('assembly-map');
if (mapEl) {
    createApp(HomePage).mount(mapEl);
    initPartis().then(() => initDeputes());
}
