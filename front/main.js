import '@styles/tailwind.css';
import '@styles/main.scss';
import { createApp } from 'vue';
import HomePage from '@components/HomePage.vue';
import { initDeputes } from '@/helpers/deputes.js';

const mapEl = document.getElementById('assembly-map');
if (mapEl) {
    createApp(HomePage).mount(mapEl);
    initDeputes();
}
