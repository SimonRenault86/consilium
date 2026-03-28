import '@styles/tailwind.css';
import '@styles/main.scss';
import { createApp } from 'vue';
import HomePage from '@components/HomePage.vue';
import DeputeInfo from '@components/deputes/DeputeInfo.vue';
import VotesStats from '@components/deputes/VotesStats.vue';
import ScrutinInfo from '@components/scrutins/ScrutinInfo.vue';
import { initDeputes } from '@/helpers/deputes.js';
import { initPartis } from '@/helpers/partis.js';

const createVueApp = (component, props = {}) => createApp(component, props);

const mapEl = document.getElementById('assembly-map');
if (mapEl) {
    createVueApp(HomePage).mount(mapEl);
    initPartis().then(() => initDeputes());
}

const deputeInfoEl = document.querySelector('depute-info');
if (deputeInfoEl) {
    createVueApp(DeputeInfo, { deputeId: deputeInfoEl.dataset.deputeId }).mount(deputeInfoEl);
}

const votesStatsEl = document.querySelector('votes-stats');
if (votesStatsEl) {
    createVueApp(VotesStats, { deputeId: votesStatsEl.dataset.deputeId }).mount(votesStatsEl);
}

const scrutinInfoEl = document.querySelector('scrutin-info');
if (scrutinInfoEl) {
    createVueApp(ScrutinInfo, { scrutinUid: scrutinInfoEl.dataset.scrutinUid }).mount(scrutinInfoEl);
}
