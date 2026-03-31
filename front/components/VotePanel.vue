<template>
    <div class="flex flex-col h-full">
        <!-- En-tête -->
        <div class="flex flex-col gap-2">
            <div class="flex">
                <SeedUpdateChip :loading="loading" />
            </div>
            <div class="flex items-center justify-between mb-3">
                <h2 class="text-xs font-semibold text-slate-400 uppercase tracking-widest py-3">
                    Derniers scrutins
                </h2>
                <div class="flex items-center gap-2">
                    <ButtonBase
                        v-if="selectedVote"
                        @click="clearVote"
                    >
                        <i class="fa-solid fa-xmark" /> Réinitialiser
                    </ButtonBase>
                </div>
            </div>
        </div>


        <!-- Recherche par mot-clé -->
        <div class="mb-2">
            <SearchBar
                v-model="search"
                placeholder="Rechercher un vote…"
                @update:model-value="onSearchInput"
            />
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
        <LoadingState
            v-if="loading && !votes.length"
            class="flex-1 py-8"
        />
        <ErrorState
            v-else-if="error && !votes.length"
            class="flex-1 py-8"
        />
        <EmptyState
            v-else-if="!loading && !votes.length"
            class="flex-1 py-8"
        />

        <!-- Liste des votes -->
        <div
            v-else
            class="flex-1 relative overflow-hidden"
        >
            <!-- Indicateur de rafraîchissement -->
            <Transition name="fade">
                <div
                    v-if="loading"
                    class="absolute inset-0 z-10 flex items-start justify-center pt-8 pointer-events-none"
                >
                    <div class="flex items-center gap-2 bg-white border border-slate-200 rounded-full px-3 py-1.5 shadow-sm text-xs text-slate-500">
                        <svg
                            class="h-3 w-3 animate-spin text-slate-400"
                            xmlns="http://www.w3.org/2000/svg"
                            fill="none"
                            viewBox="0 0 24 24"
                        >
                            <circle
                                class="opacity-25"
                                cx="12"
                                cy="12"
                                r="10"
                                stroke="currentColor"
                                stroke-width="4"
                            />
                            <path
                                class="opacity-75"
                                fill="currentColor"
                                d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z"
                            />
                        </svg>
                        Actualisation…
                    </div>
                </div>
            </Transition>

            <!-- Liste scrollable -->
            <div
                class="h-full overflow-y-auto space-y-2 pr-1 transition-opacity duration-200"
                :class="loading ? 'opacity-40' : 'opacity-100'"
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
                            class="flex-shrink-0 inline-flex items-center justify-center rounded-full px-2 py-0.5 text-xs font-bold uppercase"
                            :class="vote.sort === 'adopté'
                                ? 'bg-emerald-100 text-emerald-700'
                                : 'bg-red-100 text-red-700'"
                        >
                            {{ vote.sort === 'adopté' ? 'Adopté' : 'Rejeté' }}
                        </span>
                        <div class="flex flex-col gap-1">
                            <ScrutinCategorie
                                :categorie="vote.categorie"
                                class="mb-1"
                            />
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
    </div>
</template>

<script setup>
import { ref, watch, onMounted, onUnmounted } from 'vue';
import { fetchScrutins } from '@/helpers/scrutins.js';
import ButtonLink from '@components/ButtonLink.vue';
import ButtonBase from '@components/ButtonBase.vue';
import SearchBar from '@components/SearchBar.vue';
import ScrutinCategorie from '@components/scrutins/ScrutinCategorie.vue';
import LoadingState from '@components/LoadingState.vue';
import ErrorState from '@components/ErrorState.vue';
import EmptyState from '@components/EmptyState.vue';
import SeedUpdateChip from '@components/SeedUpdateChip.vue';

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
        const [result] = await Promise.all([
            fetchScrutins({
                from: dateFrom.value || undefined,
                to: dateTo.value || undefined,
                q: search.value.trim() || undefined,
                limit: (dateFrom.value || dateTo.value || search.value.trim()) ? 50 : 10,
            }),
            new Promise(resolve => setTimeout(resolve, 1000)),
        ]);
        votes.value = result;
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

const toggleVote = async vote => {
    if (selectedVote.value?.uid === vote.uid) {
        selectedVote.value = null;
        return;
    }
    // On sélectionne d'abord le vote de la liste pour un affichage immédiat
    selectedVote.value = vote;
    // Puis on enrichit avec le votantsMap pour colorer la carte
    try {
        const res = await fetch(`/api/scrutins/${vote.uid}`);
        if (res.ok) selectedVote.value = await res.json();
    } catch {
        // en cas d'erreur on garde le vote sans votantsMap
    }
};

const clearVote = () => {
    selectedVote.value = null;
};

watch(selectedVote, vote => emit('select', vote));

let autoRefreshTimer = null;

onMounted(() => {
    load();
    autoRefreshTimer = setInterval(load, 20_000);
});

onUnmounted(() => {
    clearInterval(autoRefreshTimer);
});
</script>

<style scoped>
.fade-enter-active,
.fade-leave-active {
    transition: opacity 0.2s ease;
}
.fade-enter-from,
.fade-leave-to {
    opacity: 0;
}
</style>
