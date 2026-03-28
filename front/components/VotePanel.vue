<template>
    <div class="flex flex-col h-full">
        <!-- En-tête -->
        <div class="flex items-center justify-between mb-3">
            <h2 class="text-xs font-semibold text-slate-400 uppercase tracking-widest py-3">
                Derniers votes
            </h2>
            <ButtonBase
                v-if="selectedVote"
                @click="clearVote"
            >
                <i class="fa-solid fa-xmark" /> Réinitialiser
            </ButtonBase>
        </div>

        <!-- Recherche par mot-clé -->
        <div class="relative mb-2">
            <input
                v-model="search"
                type="text"
                placeholder="Rechercher un vote…"
                class="w-full rounded-lg border border-slate-200 bg-white pl-8 pr-7 py-1.5 text-xs text-slate-700 focus:outline-none focus:border-slate-400"
                @input="onSearchInput"
            >
            <svg
                class="absolute left-2.5 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-slate-400 pointer-events-none"
                fill="none"
                stroke="currentColor"
                stroke-width="2"
                viewBox="0 0 24 24"
            >
                <circle
                    cx="11"
                    cy="11"
                    r="8"
                /><path d="m21 21-4.35-4.35" />
            </svg>
            <button
                v-if="search"
                class="absolute right-2 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-700"
                @click="clearSearch"
            >
                ✕
            </button>
        </div>

        <!-- Filtre par dates -->
        <div class="grid grid-cols-[1fr_auto_1fr_auto] items-center gap-1.5 mb-3">
            <input
                v-model="dateFrom"
                type="date"
                class="rounded-lg border border-slate-200 bg-white px-2 py-1.5 text-xs text-slate-700 focus:outline-none focus:border-slate-400 min-w-0"
                @change="applyFilter"
            >
            <span class="text-xs text-slate-400 px-0.5">→</span>
            <input
                v-model="dateTo"
                type="date"
                class="rounded-lg border border-slate-200 bg-white px-2 py-1.5 text-xs text-slate-700 focus:outline-none focus:border-slate-400 min-w-0"
                @change="applyFilter"
            >
            <button
                v-if="dateFrom || dateTo"
                class="text-xs text-slate-400 hover:text-slate-700 px-0.5"
                title="Effacer le filtre"
                @click="clearFilter"
            >
                ✕
            </button>
            <div v-else />
        </div>

        <!-- États de chargement / erreur / vide -->
        <div
            v-if="loading"
            class="flex-1 flex items-center justify-center text-xs text-slate-400"
        >
            Chargement…
        </div>
        <div
            v-else-if="error"
            class="flex-1 flex items-center justify-center text-xs text-red-400"
        >
            Erreur de chargement
        </div>
        <div
            v-else-if="!votes.length"
            class="flex-1 flex items-center justify-center text-xs text-slate-400"
        >
            Aucun résultat
        </div>

        <!-- Liste des votes -->
        <div
            v-else
            class="flex-1 overflow-y-auto space-y-2 pr-1"
        >
            <div
                v-for="vote in votes"
                :key="vote.uid"
                class="rounded-xl border transition-all duration-150 cursor-pointer relative group"
                :class="selectedVote?.uid === vote.uid
                    ? 'border-slate-900 bg-slate-50'
                    : 'border-slate-200 bg-white hover:border-slate-300'"
                @click="toggleVote(vote)"
            >
                <!-- Infobulle titre complet -->
                <div class="pointer-events-none absolute bottom-full left-0 right-0 mb-2 z-50 hidden group-hover:block">
                    <div class="bg-slate-900 text-white text-xs rounded-lg px-3 py-2 shadow-lg leading-snug">
                        {{ vote.titre }}
                    </div>
                </div>

                <div class="px-4 py-3 flex items-start gap-3">
                    <span
                        class="mt-0.5 flex-shrink-0 inline-flex items-center justify-center rounded-full px-2 py-0.5 text-xs font-bold uppercase"
                        :class="vote.sort === 'adopté'
                            ? 'bg-emerald-100 text-emerald-700'
                            : 'bg-red-100 text-red-700'"
                    >
                        {{ vote.sort === 'adopté' ? 'Adopté' : 'Rejeté' }}
                    </span>
                    <div class="min-w-0">
                        <p class="text-sm font-medium text-slate-800 leading-snug line-clamp-2">
                            {{ vote.titre }}
                        </p>
                        <p class="text-xs text-slate-400 mt-1">
                            Scrutin n°{{ vote.numero }} · {{ formatDate(vote.dateScrutin) }}
                        </p>
                    </div>
                </div>

                <div
                    v-if="selectedVote?.uid === vote.uid"
                    class="border-t border-slate-100 px-4 py-3"
                >
                    <p
                        v-if="vote.demandeur"
                        class="text-xs text-slate-500 mb-3"
                    >
                        Demandé par : {{ vote.demandeur }}
                    </p>

                    <div class="flex items-center gap-4 text-sm">
                        <div class="flex items-center gap-1.5">
                            <span class="inline-block w-2.5 h-2.5 rounded-full bg-emerald-500" />
                            <span class="font-semibold text-slate-800">{{ vote.synthese.pour }}</span>
                            <span class="text-slate-400">pour</span>
                        </div>
                        <div class="flex items-center gap-1.5">
                            <span class="inline-block w-2.5 h-2.5 rounded-full bg-red-500" />
                            <span class="font-semibold text-slate-800">{{ vote.synthese.contre }}</span>
                            <span class="text-slate-400">contre</span>
                        </div>
                        <div class="flex items-center gap-1.5">
                            <span class="inline-block w-2.5 h-2.5 rounded-full bg-slate-300" />
                            <span class="font-semibold text-slate-800">{{ vote.synthese.abstentions }}</span>
                            <span class="text-slate-400">abst.</span>
                        </div>
                    </div>

                    <div class="mt-3 h-2 rounded-full overflow-hidden bg-slate-100 flex">
                        <div
                            class="h-full bg-emerald-500"
                            :style="{ width: pct(vote.synthese.pour, vote.synthese.votants) + '%' }"
                        />
                        <div
                            class="h-full bg-red-500"
                            :style="{ width: pct(vote.synthese.contre, vote.synthese.votants) + '%' }"
                        />
                        <div
                            class="h-full bg-slate-300"
                            :style="{ width: pct(vote.synthese.abstentions, vote.synthese.votants) + '%' }"
                        />
                    </div>
                    <div class="mt-3">
                        <ButtonLink
                            :href="`/scrutin/${vote.uid}`"
                            @click.stop
                        >
                            Voir le scrutin <i class="fa-solid fa-arrow-right" />
                        </ButtonLink>
                    </div>
                </div>
            </div>
        </div>
    </div>
</template>

<script setup>
import { ref, watch, onMounted } from 'vue';
import { fetchVotes } from '@/helpers/votes.js';
import ButtonLink from '@components/ButtonLink.vue';
import ButtonBase from '@components/ButtonBase.vue';

const emit = defineEmits(['select']);

const votes = ref([]);
const selectedVote = ref(null);
const loading = ref(false);
const error = ref(false);
const dateFrom = ref('');
const dateTo = ref('');
const search = ref('');
let searchTimer = null;

const mois = ['jan.', 'fév.', 'mars', 'avr.', 'mai', 'juin',
    'juil.', 'août', 'sept.', 'oct.', 'nov.', 'déc.'];

const formatDate = dateStr => {
    const [y, m, d] = dateStr.split('-').map(Number);
    return `${d} ${mois[m - 1]} ${y}`;
};

const pct = (value, total) => total ? Math.round((value / total) * 100) : 0;

const load = async () => {
    loading.value = true;
    error.value = false;
    try {
        votes.value = await fetchVotes({
            from: dateFrom.value || undefined,
            to: dateTo.value || undefined,
            q: search.value.trim() || undefined,
            limit: (dateFrom.value || dateTo.value || search.value.trim()) ? 50 : 10
        });
    } catch (e) {
        error.value = true;
    } finally {
        loading.value = false;
    }
};

const applyFilter = () => {
    selectedVote.value = null;
    load();
};

const clearFilter = () => {
    dateFrom.value = '';
    dateTo.value = '';
    selectedVote.value = null;
    load();
};

const onSearchInput = () => {
    clearTimeout(searchTimer);
    searchTimer = setTimeout(() => {
        selectedVote.value = null;
        load();
    }, 350);
};

const clearSearch = () => {
    search.value = '';
    selectedVote.value = null;
    load();
};

const toggleVote = async vote => {
    if (selectedVote.value?.uid === vote.uid) {
        selectedVote.value = null;
        return;
    }
    // On sélectionne d'abord le vote de la liste pour un affichage immédiat
    selectedVote.value = vote;
    // Puis on enrichit avec le votantsMap pour colorer la carte
    try {
        const res = await fetch(`/api/votes/${vote.uid}`);
        if (res.ok) selectedVote.value = await res.json();
    } catch {
        // en cas d'erreur on garde le vote sans votantsMap
    }
};

const clearVote = () => {
    selectedVote.value = null;
};

watch(selectedVote, vote => emit('select', vote));

onMounted(load);
</script>
