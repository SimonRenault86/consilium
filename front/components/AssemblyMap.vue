<template>
    <div
        ref="containerEl"
        class="relative flex items-end justify-center px-4 py-6"
    >
        <LoadingState
            v-if="!isDeputesReady"
            class="py-16 w-full"
        />
        <div
            v-else
            class="w-full"
        >
            <HemicycleFilters
                v-if="!hideFilters"
                v-model="vueActive"
                :vote-disabled="!props.selectedVote"
            />
            <DeputeSearchBar
                v-if="!hideFilters"
                @pin="onPin"
            />

            <!-- Taux pour / contre / abstention en mode vote -->
            <div
                v-if="vueActive === 'vote' && voteStats"
                class="mb-2 px-1"
            >
                <div class="flex items-center justify-center gap-5">
                    <div class="flex items-center gap-1.5">
                        <span class="inline-block w-2 h-2 rounded-full bg-emerald-500 shrink-0" />
                        <span class="text-xl font-bold text-emerald-600">{{ voteStats.pour.pct }} %</span>
                    </div>
                    <div class="flex items-center gap-1.5">
                        <span class="inline-block w-2 h-2 rounded-full bg-red-500 shrink-0" />
                        <span class="text-xl font-bold text-red-500">{{ voteStats.contre.pct }} %</span>
                    </div>
                    <div class="flex items-center gap-1.5">
                        <span class="inline-block w-2 h-2 rounded-full bg-amber-400 shrink-0" />
                        <span class="text-xl font-bold text-amber-500">{{ voteStats.abstentions.pct }} %</span>
                    </div>
                </div>
            </div>

            <svg
                ref="svgEl"
                :viewBox="`0 0 ${VIEWBOX_WIDTH} ${svgHeight}`"
                class="w-full h-auto"
                @mouseleave="hoveredSeat = null; hoveredMinisterId = null"
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
                        :opacity="isSeatDimmed(seat.seatId) ? 0 : 1"
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

                <!-- Mini hémicycle gouvernement (dans le creux des députés) -->
                <template v-if="gouvernementActuel.length">
                    <g
                        v-for="ms in ministerSeats"
                        :key="ms.acteurId"
                    >
                        <!-- Anneau hover -->
                        <circle
                            :cx="ms.x"
                            :cy="ms.y"
                            :r="MINISTER_RADIUS + 3"
                            :fill="hoveredMinisterId === ms.acteurId ? ms.couleur + '44' : 'transparent'"
                        />
                        <!-- Cercle principal -->
                        <circle
                            :cx="ms.x"
                            :cy="ms.y"
                            :r="MINISTER_RADIUS"
                            :fill="ms.couleur"
                        />
                        <!-- Zone de hover -->
                        <circle
                            :cx="ms.x"
                            :cy="ms.y"
                            :r="MINISTER_RADIUS + 6"
                            fill="transparent"
                            class="cursor-pointer"
                            @mouseenter="onMinisterHover(ms, $event)"
                            @mouseleave="hoveredMinisterId = null"
                        />
                    </g>
                    <text
                        :x="VIEWBOX_WIDTH / 2"
                        y="580"
                        text-anchor="middle"
                        font-size="11"
                        fill="#94a3b8"
                        font-family="system-ui, sans-serif"
                    >Gouvernement</text>
                </template>
            </svg>

            <!-- Tooltip ministre -->
            <Transition name="tooltip">
                <div
                    v-if="hoveredMinisterData"
                    class="pointer-events-none fixed z-50 w-56 rounded-xl border border-slate-200 bg-white shadow-lg overflow-hidden"
                    :style="tooltipStyle"
                >
                    <div
                        class="flex items-center gap-2 px-3 py-2"
                        :style="{ backgroundColor: hoveredMinisterData.couleur + '22', borderBottom: `2px solid ${hoveredMinisterData.couleur}` }"
                    >
                        <span
                            class="text-xs font-bold"
                            :style="{ color: hoveredMinisterData.couleur }"
                        >
                            {{ hoveredMinisterData.roleLabel }}
                        </span>
                    </div>
                    <div class="p-3 flex items-center gap-3">
                        <img
                            v-if="ministerPhotoLoaded[hoveredMinisterData.acteurId]"
                            :src="`/elus/${hoveredMinisterData.acteurId}.jpg`"
                            :alt="`${hoveredMinisterData.prenom} ${hoveredMinisterData.nom}`"
                            class="size-10 shrink-0 rounded-lg object-cover bg-primary-100"
                        >
                        <div
                            v-else
                            class="flex size-10 shrink-0 items-center justify-center rounded-lg text-sm font-bold text-white"
                            :style="{ backgroundColor: hoveredMinisterData.couleur }"
                        >
                            {{ hoveredMinisterData.prenom[0] }}{{ hoveredMinisterData.nom[0] }}
                        </div>
                        <div class="flex flex-col justify-center gap-0.5 min-w-0">
                            <p class="text-sm font-semibold text-primary-900 truncate">
                                {{ hoveredMinisterData.civ }} {{ hoveredMinisterData.prenom }} {{ hoveredMinisterData.nom }}
                            </p>
                            <p class="mt-0.5 text-xs text-primary-500 truncate">
                                {{ hoveredMinisterData.qualite }}
                            </p>
                        </div>
                    </div>
                </div>
            </Transition>

            <!-- Tooltip député -->
            <Transition name="tooltip">
                <div
                    v-if="hoveredDepute && !hoveredMinisterId"
                    class="pointer-events-none fixed z-50 w-60 rounded-xl border border-slate-200 bg-white shadow-lg overflow-hidden"
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
                            class="size-12 shrink-0 rounded-lg object-cover bg-primary-100"
                        >
                        <div
                            v-else
                            class="flex size-12 shrink-0 items-center justify-center rounded-lg text-sm font-bold text-white"
                            :style="{ backgroundColor: groupes[hoveredDepute.groupe]?.couleur }"
                        >
                            {{ hoveredDepute.prenom[0] }}{{ hoveredDepute.nom[0] }}
                        </div>
                        <div class="flex flex-col justify-center gap-0.5 overflow-hidden">
                            <span class="truncate text-sm font-semibold text-primary-900">
                                {{ hoveredDepute.prenom }} {{ hoveredDepute.nom }}
                            </span>
                            <span class="truncate text-xs text-primary-500">{{ groupes[hoveredDepute.groupe]?.nom }}</span>
                            <div class="flex">
                                <!-- Badge cohérence -->
                                <CoherenceBadge
                                    class="mt-1"
                                    :statut="coherenceBadges[hoveredDepute.id]?.statut || 'non_analyse'"
                                    :title="coherenceBadges[hoveredDepute.id]?.recap || null"
                                    small
                                />
                            </div>
                        </div>
                    </div>

                    <!-- Scores -->
                    <div class="flex flex-col gap-1.5 px-3 pb-3">
                        <div
                            v-for="score in scores"
                            :key="score.champ"
                            class="flex flex-col gap-0.5"
                        >
                            <div class="flex justify-between text-xs text-primary-500">
                                <span>{{ score.label }}</span>
                                <span
                                    class="font-medium"
                                    :style="{ color: scoreToCouleur(score.normaliser(hoveredDepute[score.champ])) }"
                                >
                                    {{ hoveredDepute[score.champ] !== null ? Math.round(hoveredDepute[score.champ] * 100) + ' %' : '—' }}
                                </span>
                            </div>
                            <div class="relative h-1.5 rounded-full bg-primary-100 overflow-hidden">
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

            <!-- Légende cohérence : pills statut uniquement -->
            <div
                v-if="vueActive === 'coherence'"
                class="mt-3 flex items-center justify-center gap-4 flex-wrap"
            >
                <div
                    v-for="[statut, couleur] in [['coherent','#10b981'],['mitige','#f59e0b'],['incoherent','#ef4444'],['non_analyse','#e2e8f0']]"
                    :key="statut"
                    class="flex items-center gap-1.5"
                >
                    <span
                        class="inline-block h-3 w-3 rounded-full shrink-0"
                        :style="{ background: couleur }"
                    />
                    <span class="text-xs text-primary-500">{{ { coherent: 'Cohérent', mitige: 'Mitigé', incoherent: 'Incohérent', non_analyse: 'Non analysé' }[statut] }}</span>
                </div>
            </div>

            <!-- Légende dégradé pour les vues score -->
            <div
                v-if="vueActive === 'loyaute' || vueActive === 'participation'"
                class="mt-3 flex items-center justify-center gap-3"
            >
                <span class="text-xs text-primary-500">0 %</span>
                <div
                    class="h-2.5 w-40 rounded-full"
                    style="background: linear-gradient(to right, #ef4444, #22c55e)"
                />
                <span class="text-xs text-primary-500">100 %</span>
            </div>

            <!-- Légende gouvernement -->
            <div
                v-if="gouvernementActuel.length"
                class="mt-3 flex flex-wrap items-center justify-center gap-3"
            >
                <div
                    v-for="(label, role) in LABELS_GOUVERNEMENT"
                    :key="role"
                    class="flex items-center gap-1.5"
                >
                    <span
                        class="inline-block h-3 w-3 rounded-full shrink-0"
                        :style="{ background: COULEURS_GOUVERNEMENT[role] }"
                    />
                    <span class="text-xs text-primary-500">{{ label }}</span>
                </div>
            </div>

            <!-- Légende mode vote -->
            <div
                v-if="vueActive === 'vote'"
                class="mt-3 flex items-center justify-center gap-4"
            >
                <template v-if="props.selectedVote?.signatairesMap">
                    <div class="flex items-center gap-1.5">
                        <span class="inline-block w-3 h-3 rounded-full bg-emerald-600" />
                        <span class="text-xs text-primary-500">Auteur</span>
                    </div>
                    <div class="flex items-center gap-1.5">
                        <span class="inline-block w-3 h-3 rounded-full bg-emerald-300" />
                        <span class="text-xs text-primary-500">Cosignataires</span>
                    </div>
                </template>
                <template v-else>
                    <div class="flex items-center gap-1.5">
                        <span class="inline-block w-3 h-3 rounded-full bg-emerald-500" />
                        <span class="text-xs text-primary-500">Pour</span>
                    </div>
                    <div class="flex items-center gap-1.5">
                        <span class="inline-block w-3 h-3 rounded-full bg-red-500" />
                        <span class="text-xs text-primary-500">Contre</span>
                    </div>
                    <div class="flex items-center gap-1.5">
                        <span class="inline-block w-3 h-3 rounded-full bg-amber-400" />
                        <span class="text-xs text-primary-500">Abstention</span>
                    </div>
                </template>
            </div>

            <AssemblyStats
                v-if="!hideStats && !filterGroupe"
                v-model:hovered-groupe="hoveredGroupe"
                :vue-active="vueActive"
                :selected-vote="props.selectedVote"
                :coherence-badges="coherenceBadges"
            />
        </div>
    </div>
</template>

<script setup>
import { ref, computed, reactive, watch, onMounted, onUnmounted } from 'vue';
import seats, { VIEWBOX_WIDTH, VIEWBOX_HEIGHT, SEAT_RADIUS } from '@/helpers/hemicycle.js';
import deputesMap, { getDepute, getCouleurSiege, getCouleur2Siege, getCouleurScoreSiege, getPhotoUrl, isDeputesReady } from '@/helpers/deputes.js';
import { gouvernementActuel, COULEURS_GOUVERNEMENT, LABELS_GOUVERNEMENT, categorieRole } from '@/helpers/ministres.js';
import LoadingState from '@components/LoadingState.vue';
import { groupes, getLogoUrl } from '@/helpers/partis.js';
import HemicycleFilters from '@/components/HemicycleFilters.vue';
import AssemblyStats from '@/components/AssemblyStats.vue';
import DeputeSearchBar from '@/components/DeputeSearchBar.vue';
import CoherenceBadge from '@/components/deputes/CoherenceBadge.vue';

const props = defineProps({
    selectedVote: {
        type: Object,
        default: null
    },
    hideFilters: {
        type: Boolean,
        default: false
    },
    filterGroupe: {
        type: String,
        default: null
    },
    hideStats: {
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

const voteStats = computed(() => {
    const s = props.selectedVote?.synthese;
    if (!s) return null;
    const total = (s.pour ?? 0) + (s.contre ?? 0) + (s.abstentions ?? 0);
    if (!total) return null;
    return {
        pour: { count: s.pour ?? 0, pct: Math.round((s.pour ?? 0) / total * 100) },
        contre: { count: s.contre ?? 0, pct: Math.round((s.contre ?? 0) / total * 100) },
        abstentions: { count: s.abstentions ?? 0, pct: Math.round((s.abstentions ?? 0) / total * 100) },
    };
});

const COULEURS_VOTE = {
    pour: '#10b981',
    contre: '#ef4444',
    abstention: '#fbbf24',
    auteur: '#059669',
    cosignataire: '#6ee7b7',
};

const COULEURS_COHERENCE = {
    coherent:    '#10b981',
    mitige:      '#f59e0b',
    incoherent:  '#ef4444',
    non_analyse: '#e2e8f0',
};

const getCouleurSiegeActive = seatId => {
    if (vueActive.value === 'vote') {
        return COULEURS_VOTE[voteParSiege.value[seatId]] || '#e2e8f0';
    }
    if (vueActive.value === 'coherence') {
        const depute = getDepute(seatId);
        if (!depute) return '#e2e8f0';
        const badge = coherenceBadges[depute.id];
        return COULEURS_COHERENCE[badge?.statut] ?? COULEURS_COHERENCE.non_analyse;
    }
    if (vueActive.value === 'standard') return getCouleurSiege(seatId);
    return getCouleurScoreSiege(seatId, CHAMP_SCORE[vueActive.value]);
};;

const isSeatDimmed = seatId => {
    if (vueActive.value === 'vote' && props.selectedVote) {
        return !voteParSiege.value[seatId];
    }
    // Si un groupe est filtré, les autres groupes sont toujours atténués
    if (props.filterGroupe && getDepute(seatId)?.groupe !== props.filterGroupe) return true;
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

onMounted(() => {
    document.addEventListener('click', onDocumentClick);
    fetch('/api/deputes/coherence-badges')
        .then(r => r.ok ? r.json() : {})
        .then(data => Object.assign(coherenceBadges, data))
        .catch(() => {});
});
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

const coherenceBadges = reactive({});


// Mémorise quelles photos/logos ont chargé avec succès pour afficher les initiales/sigle en fallback
const photoLoaded = reactive({});
const logoLoaded = reactive({});
const ministerPhotoLoaded = reactive({});

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
    if (!containerEl.value) return;

    const circleRect = event.target.getBoundingClientRect();
    const domX = (circleRect.left + circleRect.right) / 2;
    const domY = (circleRect.top + circleRect.bottom) / 2;

    tooltipPos.x = domX - 120;
    tooltipPos.y = domY - 220;
};

// — Ministres (mini hémicycle dans le creux des députés) —
// Reprend la géométrie de hemicycle.js
const HEMI_CENTER_X = 550;
const HEMI_CENTER_Y = 556;
const HEMI_ANGLE_START = 0;
const HEMI_ANGLE_END = Math.PI;
const MINISTER_RADIUS = 8;

const svgHeight = computed(() => VIEWBOX_HEIGHT);

const ministerSeats = computed(() => {
    const ministers = gouvernementActuel.value;
    if (!ministers.length) return [];

    const N = ministers.length;
    const angleRange = HEMI_ANGLE_END - HEMI_ANGLE_START; // π

    // 2 rangées, rayons réduits pour laisser plus d'espace avec les députés (INNER_RADIUS=130)
    const radii = N <= 10 ? [85] : [60, 90];
    const totalArc = radii.reduce((sum, r) => sum + r * angleRange, 0);
    const seatsPerRow = radii.map(r => Math.round((r * angleRange / totalArc) * N));
    seatsPerRow[seatsPerRow.length - 1] += N - seatsPerRow.reduce((a, b) => a + b, 0);

    const result = [];
    let idx = 0;
    for (let rowIdx = 0; rowIdx < radii.length; rowIdx++) {
        const radius = radii[rowIdx];
        const count = seatsPerRow[rowIdx];

        // Répartition uniforme qui couvre tout le demi-cercle (de 0 à π inclus)
        const step = angleRange / count;
        const angles = Array.from({ length: count }, (_, i) => HEMI_ANGLE_START + step / 2 + i * step);

        // Ordre de remplissage : centre d'abord (PM au sommet), puis alternance gauche/droite
        const mid = Math.floor(count / 2);
        const posOrder = [mid];
        for (let d = 1; d <= Math.max(mid, count - mid - 1); d++) {
            if (mid + d < count) posOrder.push(mid + d);
            if (mid - d >= 0) posOrder.push(mid - d);
        }

        const rowSeats = new Array(count);
        for (let i = 0; i < count && idx < N; i++) {
            const pos = posOrder[i];
            const angle = angles[pos];
            const x = Math.round((HEMI_CENTER_X - radius * Math.cos(angle)) * 100) / 100;
            const y = Math.round((HEMI_CENTER_Y - radius * Math.sin(angle)) * 100) / 100;
            const m = ministers[idx++];
            const role = categorieRole(m.qualite);
            rowSeats[pos] = {
                ...m, x, y,
                couleur: COULEURS_GOUVERNEMENT[role] ?? '#3b82f6',
                roleLabel: LABELS_GOUVERNEMENT[role] ?? 'Ministre',
            };
        }
        result.push(...rowSeats.filter(Boolean));
    }
    return result;
});

const hoveredMinisterId = ref(null);
const hoveredMinisterData = computed(() =>
    hoveredMinisterId.value
        ? ministerSeats.value.find(m => m.acteurId === hoveredMinisterId.value) ?? null
        : null
);

const onMinisterHover = (ms, event) => {
    hoveredSeat.value = null;
    hoveredMinisterId.value = ms.acteurId;
    const rect = event.target.getBoundingClientRect();
    const domX = (rect.left + rect.right) / 2;
    const domY = (rect.top + rect.bottom) / 2;
    tooltipPos.x = domX - 112;
    tooltipPos.y = domY - 110;

    if (ministerPhotoLoaded[ms.acteurId] === undefined) {
        const img = new Image();
        img.onload = () => { ministerPhotoLoaded[ms.acteurId] = true; };
        img.onerror = () => { ministerPhotoLoaded[ms.acteurId] = false; };
        img.src = `/elus/${ms.acteurId}.jpg`;
    }
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
