import '@styles/tailwind.css';
import '@styles/main.scss';
import { createApp } from 'vue';
import HomePage from '@components/HomePage.vue';
import DeputeInfo from '@components/deputes/DeputeInfo.vue';
import DeputeHeader from '@components/deputes/DeputeHeader.vue';
import VotesStats from '@components/deputes/VotesStats.vue';
import ScrutinInfo from '@components/scrutins/ScrutinInfo.vue';
import ScrutinsList from '@components/scrutins/ScrutinsList.vue';
import MajoriteBuilder from '@components/outils/MajoriteBuilder.vue';
import { initDeputes } from '@/helpers/deputes.js';
import { initPartis } from '@/helpers/partis.js';

const createVueApp = (component, props = {}) => createApp(component, props);

const mapEl = document.getElementById('assembly-map');
if (mapEl) {
    createVueApp(HomePage).mount(mapEl);
    initPartis().then(() => initDeputes());
}

const deputeHeaderEl = document.querySelector('depute-header');
if (deputeHeaderEl) {
    createVueApp(DeputeHeader, { deputeId: deputeHeaderEl.dataset.deputeId }).mount(deputeHeaderEl);
}

const deputeInfoEl = document.querySelector('depute-info');
if (deputeInfoEl) {
    createVueApp(DeputeInfo, { deputeId: deputeInfoEl.dataset.deputeId }).mount(deputeInfoEl);
}

const votesStatsEl = document.querySelector('scrutins-stats');
if (votesStatsEl) {
    createVueApp(VotesStats, { deputeId: votesStatsEl.dataset.deputeId }).mount(votesStatsEl);
}

const scrutinInfoEl = document.querySelector('scrutin-info');
if (scrutinInfoEl) {
    createVueApp(ScrutinInfo, { scrutinUid: scrutinInfoEl.dataset.scrutinUid }).mount(scrutinInfoEl);
}

const scrutinsListEl = document.querySelector('scrutins-list');
if (scrutinsListEl) {
    createVueApp(ScrutinsList).mount(scrutinsListEl);
}

const majoriteBuilderEl = document.querySelector('majorite-builder');
if (majoriteBuilderEl) {
    createVueApp(MajoriteBuilder).mount(majoriteBuilderEl);
}
