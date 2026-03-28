import '@styles/tailwind.css';
import '@styles/main.scss';
import { createApp } from 'vue';
import HomePage from '@components/HomePage.vue';
import DeputeInfo from '@components/deputes/DeputeInfo.vue';
import VotesStats from '@components/deputes/VotesStats.vue';
import ScrutinInfo from '@components/scrutins/ScrutinInfo.vue';
import { initDeputes } from '@/helpers/deputes.js';
import { initPartis } from '@/helpers/partis.js';

const mapEl = document.getElementById('assembly-map');
if (mapEl) {
    createApp(HomePage).mount(mapEl);
    initPartis().then(() => initDeputes());
}

const deputeInfoEl = document.getElementById('depute-info');
if (deputeInfoEl) {
    createApp(DeputeInfo, { deputeId: deputeInfoEl.dataset.deputeId }).mount(deputeInfoEl);
}

const votesStatsEl = document.getElementById('votes-stats');
if (votesStatsEl) {
    createApp(VotesStats, { deputeId: votesStatsEl.dataset.deputeId }).mount(votesStatsEl);
}

const scrutinInfoEl = document.getElementById('scrutin-info');
if (scrutinInfoEl) {
    createApp(ScrutinInfo, { scrutinUid: scrutinInfoEl.dataset.scrutinUid }).mount(scrutinInfoEl);
}
