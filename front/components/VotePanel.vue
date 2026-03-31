<template>
    <div class="flex flex-col h-full">
        <!-- En-tête -->
        <div class="flex flex-col gap-2">
            <div class="flex">
                <SeedUpdateChip :loading="loading" />
            </div>
            <div class="flex items-center justify-between mb-3">
                <!-- Toggle scrutins / amendements -->
                <div class="flex bg-slate-100 rounded-lg p-0.5">
                    <button
                        class="px-3 py-1.5 text-xs font-semibold rounded-md transition-all duration-150 cursor-pointer"
                        :class="mode === 'scrutins'
                            ? 'bg-white shadow-sm text-slate-800'
                            : 'text-slate-500 hover:text-slate-700'"
                        @click="switchMode('scrutins')"
                    >
                        Scrutins
                    </button>
                    <button
                        class="px-3 py-1.5 text-xs font-semibold rounded-md transition-all duration-150 cursor-pointer"
                        :class="mode === 'amendements'
                            ? 'bg-white shadow-sm text-slate-800'
                            : 'text-slate-500 hover:text-slate-700'"
                        @click="switchMode('amendements')"
                    >
                        Amendements
                    </button>
                </div>
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
                :placeholder="mode === 'scrutins' ? 'Rechercher un vote…' : 'Rechercher un amendement…'"
                @update:model-value="onSearchInput"
            />
        </div>

        <!-- Filtre par statut (amendements uniquement) -->
        <div
            v-if="mode === 'amendements'"
            class="flex flex-wrap gap-1.5 mb-3"
        >
            <button
                v-for="s in SORT_FILTERS"
                :key="s.value"
                class="px-2.5 py-1 rounded-full text-xs font-semibold border transition-all duration-150 cursor-pointer"
                :class="sortFilter === s.value
                    ? s.activeClass
                    : 'bg-white border-slate-200 text-slate-500 hover:border-slate-400'"
                @click="setSortFilter(s.value)"
            >
                {{ s.label }}
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
        <LoadingState
            v-if="loading && !items.length"
            class="flex-1 py-8"
        />
        <ErrorState
            v-else-if="error && !items.length"
            class="flex-1 py-8"
        />
        <EmptyState
            v-else-if="!loading && !items.length"
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
                <!-- MODE SCRUTINS -->
                <template v-if="mode === 'scrutins'">
                    <ScrutinItem
                        v-for="vote in items"
                        :key="vote.uid"
                        :vote="vote"
                        :selected="selectedVote?.uid === vote.uid"
                        @toggle="toggleVote"
                    />
                </template>

                <!-- MODE AMENDEMENTS -->
                <template v-else>
                    <AmendementItem
                        v-for="amdt in items"
                        :key="amdt.uid"
                        :amdt="amdt"
                        :selected="selectedVote?.uid === amdt.uid"
                        @toggle="toggleAmendement"
                    />
                </template>
            </div>
        </div>
    </div>
</template>

<script setup>
import { ref, computed, watch, onMounted, onUnmounted } from 'vue';
import { fetchScrutins } from '@/helpers/scrutins.js';
import { fetchAmendements } from '@/helpers/amendements.js';
import ButtonBase from '@components/ButtonBase.vue';
import SearchBar from '@components/SearchBar.vue';
import ScrutinItem from '@components/scrutins/ScrutinItem.vue';
import AmendementItem from '@components/amendements/AmendementItem.vue';
import LoadingState from '@components/LoadingState.vue';
import ErrorState from '@components/ErrorState.vue';
import EmptyState from '@components/EmptyState.vue';
import SeedUpdateChip from '@components/SeedUpdateChip.vue';

const emit = defineEmits(['select']);

const SORT_FILTERS = [
    { value: '', label: 'Tous', activeClass: 'bg-slate-800 border-slate-800 text-white' },
    { value: 'Adopté', label: 'Adoptés', activeClass: 'bg-emerald-600 border-emerald-600 text-white' },
    { value: 'Rejeté', label: 'Rejetés', activeClass: 'bg-red-600 border-red-600 text-white' },
    { value: 'Retiré', label: 'Retirés', activeClass: 'bg-amber-500 border-amber-500 text-white' },
    { value: 'Non soutenu', label: 'Non soutenus', activeClass: 'bg-slate-500 border-slate-500 text-white' },
    { value: 'Irrecevable', label: 'Irrecevables', activeClass: 'bg-orange-600 border-orange-600 text-white' },
];

const mode = ref('scrutins');
const votes = ref([]);
const amendements = ref([]);
const items = computed(() => mode.value === 'scrutins' ? votes.value : amendements.value);

const selectedVote = ref(null);
const loading = ref(false);
const error = ref(false);
const dateFrom = ref('');
const dateTo = ref('');
const search = ref('');
const sortFilter = ref('');
let searchTimer = null;

const load = async () => {
    loading.value = true;
    error.value = false;
    try {
        const params = {
            from: dateFrom.value || undefined,
            to: dateTo.value || undefined,
            q: search.value.trim() || undefined,
            sort: (mode.value === 'amendements' && sortFilter.value) ? sortFilter.value : undefined,
            limit: (dateFrom.value || dateTo.value || search.value.trim() || sortFilter.value) ? 50 : 10,
        };
        const [result] = await Promise.all([
            mode.value === 'scrutins' ? fetchScrutins(params) : fetchAmendements(params),
            new Promise(resolve => setTimeout(resolve, 1000)),
        ]);
        if (mode.value === 'scrutins') {
            votes.value = result;
        } else {
            amendements.value = result;
        }
    } catch {
        error.value = true;
    } finally {
        loading.value = false;
    }
};

const setSortFilter = value => {
    sortFilter.value = value;
    selectedVote.value = null;
    load();
};

const switchMode = newMode => {
    if (mode.value === newMode) return;
    mode.value = newMode;
    selectedVote.value = null;
    search.value = '';
    dateFrom.value = '';
    dateTo.value = '';
    sortFilter.value = '';
    load();
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
    selectedVote.value = vote;
    try {
        const res = await fetch(`/api/scrutins/${vote.uid}`);
        if (res.ok) selectedVote.value = await res.json();
    } catch {
        // en cas d'erreur on garde le vote sans votantsMap
    }
};

const toggleAmendement = async amdt => {
    if (selectedVote.value?.uid === amdt.uid) {
        selectedVote.value = null;
        return;
    }
    selectedVote.value = amdt;
    try {
        const res = await fetch(`/api/amendements/${amdt.uid}`);
        if (res.ok) {
            const detail = await res.json();
            // Mapper auteur → 'auteur' et cosignataires → 'cosignataire' pour l'hémicycle
            if (detail.signatairesMap) {
                detail.votantsMap = {};
                for (const [depId, role] of Object.entries(detail.signatairesMap)) {
                    detail.votantsMap[depId] = role;
                }
            }
            selectedVote.value = detail;
        }
    } catch {
        // en cas d'erreur on garde l'amendement sans signatairesMap
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
