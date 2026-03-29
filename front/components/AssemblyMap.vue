<template>
    <div
        ref="containerEl"
        class="relative flex items-end justify-center px-4 py-6"
    >
        <div class="w-full">
            <HemicycleFilters
                v-if="!hideFilters"
                v-model="vueActive"
            />
            <DeputeSearchBar
                v-if="!hideFilters"
                @pin="onPin"
            />
            <svg
                ref="svgEl"
                :viewBox="`0 0 ${VIEWBOX_WIDTH} ${VIEWBOX_HEIGHT}`"
                class="w-full h-auto"
                @mouseleave="hoveredSeat = null"
            >
                <a
                    v-for="seat in seats"
                    :key="seat.seatId"
                    :href="getDepute(seat.seatId) ? `/depute/${getDepute(seat.seatId).slug}` : undefined"
                    class="seat-link"
                >
                    <!-- Anneau couleur2 visible au hover ou pin -->
                    <circle
                        :cx="seat.x"
                        :cy="seat.y"
                        :r="SEAT_RADIUS + 2.5"
                        :fill="(hoveredSeat === seat.seatId || pinnedSeat === seat.seatId) ? getCouleur2Siege(seat.seatId) : 'transparent'"
                        :opacity="isSeatDimmed(seat.seatId) ? 0.3 : 1"
                    />
                    <!-- Cercle principal -->
                    <circle
                        :cx="seat.x"
                        :cy="seat.y"
                        :r="SEAT_RADIUS"
                        :fill="getCouleurSiegeActive(seat.seatId)"
                        stroke="none"
                        class="transition-opacity duration-150"
                        :opacity="isSeatDimmed(seat.seatId) ? 0.3 : 1"
                    />
                    <!-- Zone de hover invisible plus grande -->
                    <circle
                        :cx="seat.x"
                        :cy="seat.y"
                        :r="SEAT_RADIUS + 4"
                        fill="transparent"
                        class="cursor-pointer"
                        @mouseenter="onSeatHover(seat, $event)"
                    />
                </a>
            </svg>

            <!-- Tooltip flottant -->
            <Transition name="tooltip">
                <div
                    v-if="hoveredDepute"
                    class="pointer-events-none absolute z-50 w-60 rounded-xl border border-slate-200 bg-white shadow-lg overflow-hidden"
                    :style="tooltipStyle"
                >
                    <!-- Bannière parti -->
                    <div
                        class="flex items-center gap-2 px-3 py-1.5"
                        :style="{ backgroundColor: groupes[hoveredDepute.groupe]?.couleur + '22', borderBottom: `2px solid ${groupes[hoveredDepute.groupe]?.couleur}` }"
                    >
                        <img
                            v-if="logoLoaded[hoveredDepute.groupe]"
                            :src="getLogoUrl(hoveredDepute.groupe)"
                            :alt="groupes[hoveredDepute.groupe]?.nom"
                            class="h-5 max-w-[80px] object-contain"
                        >
                        <span
                            v-else
                            class="text-xs font-bold"
                            :style="{ color: groupes[hoveredDepute.groupe]?.couleur }"
                        >{{ hoveredDepute.groupe }}</span>
                    </div>

                    <!-- Infos député -->
                    <div class="flex items-center gap-3 p-3">
                        <img
                            v-if="photoLoaded[hoveredDepute.slug]"
                            :src="getPhotoUrl(hoveredDepute)"
                            :alt="`${hoveredDepute.prenom} ${hoveredDepute.nom}`"
                            class="size-12 shrink-0 rounded-lg object-cover bg-slate-100"
                        >
                        <div
                            v-else
                            class="flex size-12 shrink-0 items-center justify-center rounded-lg text-sm font-bold text-white"
                            :style="{ backgroundColor: groupes[hoveredDepute.groupe]?.couleur }"
                        >
                            {{ hoveredDepute.prenom[0] }}{{ hoveredDepute.nom[0] }}
                        </div>
                        <div class="flex flex-col justify-center gap-0.5 overflow-hidden">
                            <span class="truncate text-sm font-semibold text-slate-900">
                                {{ hoveredDepute.prenom }} {{ hoveredDepute.nom }}
                            </span>
                            <span class="truncate text-xs text-slate-400">{{ groupes[hoveredDepute.groupe]?.nom }}</span>
                        </div>
                    </div>

                    <!-- Scores -->
                    <div class="flex flex-col gap-1.5 px-3 pb-3">
                        <div
                            v-for="score in scores"
                            :key="score.champ"
                            class="flex flex-col gap-0.5"
                        >
                            <div class="flex justify-between text-xs text-slate-500">
                                <span>{{ score.label }}</span>
                                <span
                                    class="font-medium"
                                    :style="{ color: scoreToCouleur(score.normaliser(hoveredDepute[score.champ])) }"
                                >
                                    {{ hoveredDepute[score.champ] !== null ? Math.round(hoveredDepute[score.champ] * 100) + ' %' : '—' }}
                                </span>
                            </div>
                            <div class="relative h-1.5 rounded-full bg-slate-100 overflow-hidden">
                                <div
                                    class="absolute inset-y-0 left-0 rounded-full"
                                    :style="{
                                        width: hoveredDepute[score.champ] !== null ? (hoveredDepute[score.champ] * 100) + '%' : '0%',
                                        backgroundColor: scoreToCouleur(score.normaliser(hoveredDepute[score.champ]))
                                    }"
                                />
                            </div>
                        </div>
                    </div>
                </div>
            </Transition>

            <!-- Légende dégradé pour les vues score -->
            <div
                v-if="vueActive === 'loyaute' || vueActive === 'participation'"
                class="mt-3 flex items-center justify-center gap-3"
            >
                <span class="text-xs text-slate-500">0 %</span>
                <div
                    class="h-2.5 w-40 rounded-full"
                    style="background: linear-gradient(to right, #ef4444, #22c55e)"
                />
                <span class="text-xs text-slate-500">100 %</span>
            </div>

            <!-- Légende mode vote -->
            <div
                v-if="vueActive === 'vote'"
                class="mt-3 flex items-center justify-center gap-4"
            >
                <div class="flex items-center gap-1.5">
                    <span class="inline-block w-3 h-3 rounded-full bg-emerald-500" />
                    <span class="text-xs text-slate-500">Pour</span>
                </div>
                <div class="flex items-center gap-1.5">
                    <span class="inline-block w-3 h-3 rounded-full bg-red-500" />
                    <span class="text-xs text-slate-500">Contre</span>
                </div>
                <div class="flex items-center gap-1.5">
                    <span class="inline-block w-3 h-3 rounded-full bg-slate-400" />
                    <span class="text-xs text-slate-500">Abstention</span>
                </div>
            </div>

            <AssemblyStats
                v-model:hovered-groupe="hoveredGroupe"
                :vue-active="vueActive"
                :selected-vote="props.selectedVote"
            />
        </div>
    </div>
</template>

<script setup>
import { ref, computed, reactive, watch, onMounted, onUnmounted } from 'vue';
import seats, { VIEWBOX_WIDTH, VIEWBOX_HEIGHT, SEAT_RADIUS } from '@/helpers/hemicycle.js';
import deputesMap, { getDepute, getCouleurSiege, getCouleur2Siege, getCouleurScoreSiege, getPhotoUrl } from '@/helpers/deputes.js';
import { groupes, getLogoUrl } from '@/helpers/partis.js';
import HemicycleFilters from '@/components/HemicycleFilters.vue';
import AssemblyStats from '@/components/AssemblyStats.vue';
import DeputeSearchBar from '@/components/DeputeSearchBar.vue';

const props = defineProps({
    selectedVote: {
        type: Object,
        default: null
    },
    hideFilters: {
        type: Boolean,
        default: false
    },
});

const emit = defineEmits(['update:vueActive']);

const svgEl = ref(null);
const containerEl = ref(null);
const hoveredSeat = ref(null);
const pinnedSeat = ref(null); // siège épinglé via la barre de recherche
const hoveredGroupe = ref(null);
const vueActive = ref('standard');

const CHAMP_SCORE = { loyaute: 'scoreLoyaute', participation: 'scoreParticipation' };

// Map acteurRef (id) → seatId pour le mode vote
const acteurToSeat = computed(() => {
    const map = {};
    for (const [seatId, depute] of deputesMap.value.entries()) {
        map[depute.id] = seatId;
    }
    return map;
});

// Map seatId → 'pour'|'contre'|'abstention' pour le vote sélectionné
const voteParSiege = computed(() => {
    if (!props.selectedVote?.votantsMap) return {};
    const map = {};
    for (const [acteurRef, position] of Object.entries(props.selectedVote.votantsMap)) {
        const seatId = acteurToSeat.value[acteurRef];
        if (seatId) map[seatId] = position;
    }
    return map;
});

const COULEURS_VOTE = {
    pour: '#10b981',
    contre: '#ef4444',
    abstention: '#94a3b8',
};

const getCouleurSiegeActive = seatId => {
    if (vueActive.value === 'vote') {
        return COULEURS_VOTE[voteParSiege.value[seatId]] || '#e2e8f0';
    }
    if (vueActive.value === 'standard') return getCouleurSiege(seatId);
    return getCouleurScoreSiege(seatId, CHAMP_SCORE[vueActive.value]);
};

const isSeatDimmed = seatId => {
    if (vueActive.value === 'vote' && props.selectedVote) {
        return !voteParSiege.value[seatId];
    }
    if (pinnedSeat.value) return pinnedSeat.value !== seatId;
    if (hoveredSeat.value) return hoveredSeat.value !== seatId;
    if (hoveredGroupe.value) return getDepute(seatId)?.groupe !== hoveredGroupe.value;
    return false;
};

// Bascule automatique en mode vote quand un vote est sélectionné
watch(() => props.selectedVote, vote => {
    if (vote) {
        vueActive.value = 'vote';
    } else if (vueActive.value === 'vote') {
        vueActive.value = 'standard';
    }
}, { immediate: true });

const onPin = seatId => {
    pinnedSeat.value = seatId;
    hoveredGroupe.value = null;
};

// Clic en dehors du composant → efface le pin
const onDocumentClick = e => {
    if (!containerEl.value?.contains(e.target)) pinnedSeat.value = null;
};

onMounted(() => document.addEventListener('click', onDocumentClick));
onUnmounted(() => document.removeEventListener('click', onDocumentClick));

// Mêmes seuils que dans deputes.js
const normaliserScore = (score, champ) => {
    if (score === null || score === undefined) return null;
    if (champ === 'scoreLoyaute') return Math.min(1, Math.pow(score / 0.95, 3));
    if (champ === 'scoreParticipation') {
        if (score <= 0.15) return 0;
        if (score >= 0.25) return 1;
        return (score - 0.15) / 0.10;
    }
    return Math.max(0, Math.min(1, score));
};

const scoreToCouleur = t => {
    if (t === null || t === undefined) return '#94a3b8';
    const clamped = Math.max(0, Math.min(1, t));
    const r = Math.round(239 + (34 - 239) * clamped);
    const g = Math.round(68 + (197 - 68) * clamped);
    const b = Math.round(68 + (94 - 68) * clamped);
    return `rgb(${r}, ${g}, ${b})`;
};

const scores = [
    { champ: 'scoreLoyaute', label: 'Loyauté', normaliser: score => normaliserScore(score, 'scoreLoyaute') },
    { champ: 'scoreParticipation', label: 'Participation', normaliser: score => normaliserScore(score, 'scoreParticipation') },
];
const tooltipPos = reactive({ x: 0, y: 0 });

// Mémorise quelles photos/logos ont chargé avec succès pour afficher les initiales/sigle en fallback
const photoLoaded = reactive({});
const logoLoaded = reactive({});

const hoveredDepute = computed(() => hoveredSeat.value ? getDepute(hoveredSeat.value) : null);

// Au changement de député survolé, on précharge les images si pas encore testées
watch(hoveredDepute, depute => {
    if (!depute) return;

    if (photoLoaded[depute.slug] === undefined) {
        const url = getPhotoUrl(depute);
        if (!url) { photoLoaded[depute.slug] = false; return; }
        const img = new Image();
        img.onload = () => { photoLoaded[depute.slug] = true; };
        img.onerror = () => { photoLoaded[depute.slug] = false; };
        img.src = url;
    }

    if (logoLoaded[depute.groupe] === undefined) {
        const url = getLogoUrl(depute.groupe);
        if (!url) { logoLoaded[depute.groupe] = false; return; }
        const img = new Image();
        img.onload = () => { logoLoaded[depute.groupe] = true; };
        img.onerror = () => { logoLoaded[depute.groupe] = false; };
        img.src = url;
    }
});

const tooltipStyle = computed(() => ({
    left: `${tooltipPos.x}px`,
    top: `${tooltipPos.y}px`
}));

const onSeatHover = (seat, event) => {
    hoveredGroupe.value = null;
    hoveredSeat.value = seat.seatId;
    if (!svgEl.value) return;

    // Convertit les coords SVG en coords DOM relatives au conteneur parent
    const svgRect = svgEl.value.getBoundingClientRect();
    const scaleX = svgRect.width / VIEWBOX_WIDTH;
    const scaleY = svgRect.height / VIEWBOX_HEIGHT;
    const domX = seat.x * scaleX;
    const domY = seat.y * scaleY;

    // Décalage pour que le tooltip apparaisse au-dessus et centré
    tooltipPos.x = domX - 120; // moitié de w-60 (240px / 2)
    tooltipPos.y = domY - 110;
};
</script>

<style scoped>
.seat-link {
    text-decoration: none;
}

.tooltip-enter-active {
    transition: opacity 0.15s ease, transform 0.15s ease;
}
.tooltip-leave-active {
    transition: opacity 0.1s ease;
}
.tooltip-enter-from {
    opacity: 0;
    transform: translateY(4px);
}
.tooltip-leave-to {
    opacity: 0;
}
</style>
