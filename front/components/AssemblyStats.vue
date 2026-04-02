<template>
    <div class="mt-6 px-4">
        <!-- Récapitulatif votes par groupe -->
        <div
            v-if="vueActive === 'vote' && statsVoteParGroupe.length"
            class="flex flex-col gap-1.5"
        >
            <div
                v-for="g in statsVoteParGroupe"
                :key="g.abrev"
                class="flex items-center gap-3 cursor-pointer"
                :class="hoveredGroupe && hoveredGroupe !== g.abrev ? 'opacity-30' : 'opacity-100'"
                style="transition: opacity 0.15s"
                @mouseenter="emit('update:hoveredGroupe', g.abrev)"
                @mouseleave="emit('update:hoveredGroupe', null)"
            >
                <!-- Logo / Abréviation -->
                <div class="w-14 shrink-0 flex items-center gap-1.5 overflow-hidden">
                    <img
                        v-if="getLogoUrl(g.abrev) && !logoErreur[g.abrev]"
                        :src="getLogoUrl(g.abrev)"
                        :alt="g.abrev"
                        class="h-4 max-w-[40px] shrink-0 object-contain"
                        @error="logoErreur[g.abrev] = true"
                    >
                    <span
                        v-else
                        class="text-xs font-bold truncate"
                        :style="{ color: groupes[g.abrev]?.couleur }"
                    >{{ g.abrev }}</span>
                </div>

                <!-- Barre pour/contre/abstention/non-participation -->
                <SegmentedBar
                    :segments="g.segments"
                    class="flex-1"
                />

                <!-- Détail chiffres -->
                <div class="shrink-0 flex gap-2 text-xs w-28 justify-end">
                    <span
                        class="font-medium"
                        :class="selectedVote?.signatairesMap ? 'text-emerald-700' : 'text-emerald-600'"
                    >{{ g.pour }}</span>
                    <template v-if="!selectedVote?.signatairesMap">
                        <span class="text-primary-300">/</span>
                        <span class="text-red-500 font-medium">{{ g.contre }}</span>
                    </template>
                    <span class="text-primary-300">/</span>
                    <span :class="selectedVote?.signatairesMap ? 'text-emerald-400' : 'text-amber-500'">{{ g.abstention }}</span>
                    <template v-if="!selectedVote?.signatairesMap">
                        <span class="text-primary-300">/</span>
                        <span class="text-primary-500">{{ g.nonParticipation }}</span>
                    </template>
                </div>
            </div>

            <!-- Légende -->
            <div class="flex flex-wrap justify-center gap-x-4 gap-y-1 mt-1">
                <template v-if="selectedVote?.signatairesMap">
                    <div class="flex items-center gap-1.5">
                        <span class="inline-block w-2.5 h-2.5 rounded-sm bg-emerald-600" />
                        <span class="text-xs text-primary-500">Auteur</span>
                    </div>
                    <div class="flex items-center gap-1.5">
                        <span class="inline-block w-2.5 h-2.5 rounded-sm bg-emerald-300" />
                        <span class="text-xs text-primary-500">Cosignataires</span>
                    </div>
                </template>
                <template v-else>
                    <div class="flex items-center gap-1.5">
                        <span class="inline-block w-2.5 h-2.5 rounded-sm bg-emerald-500" />
                        <span class="text-xs text-primary-500">Pour</span>
                    </div>
                    <div class="flex items-center gap-1.5">
                        <span class="inline-block w-2.5 h-2.5 rounded-sm bg-red-500" />
                        <span class="text-xs text-primary-500">Contre</span>
                    </div>
                    <div class="flex items-center gap-1.5">
                        <span class="inline-block w-2.5 h-2.5 rounded-sm bg-amber-400" />
                        <span class="text-xs text-primary-500">Abstention</span>
                    </div>
                    <div class="flex items-center gap-1.5">
                        <span class="inline-block w-2.5 h-2.5 rounded-sm bg-slate-300" />
                        <span class="text-xs text-primary-500">Non-participation</span>
                    </div>
                </template>
            </div>
        </div>

        <!-- Chargement du vote en cours -->
        <div
            v-else-if="vueActive === 'vote'"
            class="flex flex-col gap-1.5 animate-pulse px-1"
        >
            <div
                v-for="n in 5"
                :key="n"
                class="flex items-center gap-3"
            >
                <div class="w-14 h-4 rounded bg-slate-200" />
                <div class="h-3 flex-1 rounded-full bg-slate-200" />
                <div class="w-20 h-3 rounded bg-slate-200" />
            </div>
        </div>

        <!-- Filtre groupes standard -->
        <div
            v-else-if="vueActive === 'standard'"
            class="flex flex-wrap justify-center gap-2"
        >
            <a
                v-for="g in stats"
                :key="g.abrev"
                :href="`/partis#${g.abrev}`"
                class="flex items-center gap-2 rounded-xl border border-slate-100 bg-white px-3 py-2 shadow-sm cursor-pointer transition-opacity duration-150"
                :class="hoveredGroupe && hoveredGroupe !== g.abrev ? 'opacity-30' : 'opacity-100'"
                @mouseenter="emit('update:hoveredGroupe', g.abrev)"
                @mouseleave="emit('update:hoveredGroupe', null)"
            >
                <img
                    v-if="getLogoUrl(g.abrev) && !logoErreur[g.abrev]"
                    :src="getLogoUrl(g.abrev)"
                    :alt="g.abrev"
                    class="h-5 max-w-[48px] shrink-0 object-contain"
                    @error="logoErreur[g.abrev] = true"
                >
                <span
                    v-else
                    class="text-xs font-bold"
                    :style="{ color: groupes[g.abrev]?.couleur }"
                >{{ g.abrev }}</span>
                <div class="flex flex-col leading-tight">
                    <span class="text-xs font-semibold text-primary-700">{{ g.nombreDeputes }}</span>
                    <span class="text-xs text-primary-500">députés</span>
                </div>
            </a>
        </div>

        <!-- Cohérence par groupe -->
        <div
            v-else-if="vueActive === 'coherence'"
            class="flex flex-col gap-2"
        >
            <div
                v-for="g in coherenceParGroupe"
                :key="g.abrev"
                class="flex items-center gap-3 cursor-pointer"
                :class="hoveredGroupe && hoveredGroupe !== g.abrev ? 'opacity-30' : 'opacity-100'"
                style="transition: opacity 0.15s"
                @mouseenter="emit('update:hoveredGroupe', g.abrev)"
                @mouseleave="emit('update:hoveredGroupe', null)"
            >
                <!-- Logo / Abréviation -->
                <div class="w-14 shrink-0 flex items-center gap-1.5 overflow-hidden">
                    <img
                        v-if="getLogoUrl(g.abrev) && !logoErreur[g.abrev]"
                        :src="getLogoUrl(g.abrev)"
                        :alt="g.abrev"
                        class="h-4 max-w-[40px] shrink-0 object-contain"
                        @error="logoErreur[g.abrev] = true"
                    >
                    <span
                        v-else
                        class="text-xs font-bold truncate"
                        :style="{ color: groupes[g.abrev]?.couleur }"
                    >{{ g.abrev }}</span>
                </div>

                <!-- Barre segmentée cohérence/mitigé/incohérent/non analysé -->
                <SegmentedBar
                    :segments="g.segments"
                    class="flex-1"
                />

                <!-- Cohérent / Mitigé / Incohérent / N/A -->
                <div class="shrink-0 flex gap-1.5 text-xs justify-end tabular-nums">
                    <span class="font-medium text-emerald-600">{{ g.counts.coherent }}</span>
                    <span class="text-primary-300">/</span>
                    <span class="text-amber-500">{{ g.counts.mitige }}</span>
                    <span class="text-primary-300">/</span>
                    <span class="font-medium text-red-500">{{ g.counts.incoherent }}</span>
                    <span class="text-primary-300">/</span>
                    <span class="text-slate-400">{{ g.counts.non_analyse }}</span>
                </div>
            </div>
        </div>

        <!-- Filtres scores : barre par groupe -->
        <div
            v-else-if="champ"
            class="flex flex-col gap-2"
        >
            <div
                v-for="g in stats"
                :key="g.abrev"
                class="flex items-center gap-3 cursor-pointer"
                :class="hoveredGroupe && hoveredGroupe !== g.abrev ? 'opacity-30' : 'opacity-100'"
                style="transition: opacity 0.15s"
                @mouseenter="emit('update:hoveredGroupe', g.abrev)"
                @mouseleave="emit('update:hoveredGroupe', null)"
            >
                <!-- Label groupe -->
                <div class="w-32 shrink-0 flex items-center gap-1.5 overflow-hidden">
                    <img
                        v-if="getLogoUrl(g.abrev) && !logoErreur[g.abrev]"
                        :src="getLogoUrl(g.abrev)"
                        :alt="g.abrev"
                        class="h-4 max-w-[40px] shrink-0 object-contain"
                        @error="logoErreur[g.abrev] = true"
                    >
                    <span
                        v-else
                        class="text-xs font-bold truncate"
                        :style="{ color: groupes[g.abrev]?.couleur }"
                    >{{ g.abrev }}</span>
                </div>

                <!-- Barre -->
                <div class="relative h-3 flex-1 rounded-full bg-primary-100 overflow-hidden">
                    <div
                        class="absolute inset-y-0 left-0 rounded-full transition-all duration-500"
                        :style="{
                            width: g[champ] !== null ? (g[champ] * 100) + '%' : '0%',
                            backgroundColor: scoreToCouleur(normaliserScore(g[champ], champ))
                        }"
                    />
                </div>

                <!-- Valeur -->
                <span
                    class="w-10 shrink-0 text-right text-xs font-medium"
                    :style="{ color: scoreToCouleur(normaliserScore(g[champ], champ)) }"
                >{{ g[champ] !== null ? Math.round(g[champ] * 100) + ' %' : '—' }}</span>
            </div>
        </div>
    </div>
</template>

<script setup>
import { computed, reactive } from 'vue';
import { statsParGroupe, normaliserScore, scoreToCouleur, tousLesDeputes } from '@/helpers/deputes.js';
import { groupes, getLogoUrl, groupeOrdreGaucheaDroite } from '@/helpers/partis.js';
import SegmentedBar from '@/components/SegmentedBar.vue';

const props = defineProps({
    vueActive: {
        type: String,
        required: true
    },
    hoveredGroupe: {
        type: String,
        default: null
    },
    selectedVote: {
        type: Object,
        default: null,
    },
    coherenceBadges: {
        type: Object,
        default: () => ({}),
    },
});

const emit = defineEmits(['update:hoveredGroupe']);

const CHAMP_SCORE = { loyaute: 'scoreLoyaute', participation: 'scoreParticipation' };

const champ = computed(() => CHAMP_SCORE[props.vueActive] ?? null);

const stats = computed(() => {
    const tri = champ.value;
    return [...statsParGroupe.value].sort((a, b) => {
        if (!tri) return b.nombreDeputes - a.nombreDeputes;
        const va = a[tri] ?? -1;
        const vb = b[tri] ?? -1;
        return vb - va;
    });
});

// Calcule le décompte pour/contre/abstention/non-participation par groupe pour le vote sélectionné
const statsVoteParGroupe = computed(() => {
    if (!props.selectedVote?.votantsMap) return [];
    const { votantsMap } = props.selectedVote;
    const isAmendement = !!props.selectedVote.signatairesMap;
    const parGroupe = {};
    for (const depute of tousLesDeputes.value) {
        const g = depute.groupe;
        if (!parGroupe[g]) parGroupe[g] = { pour: 0, contre: 0, abstention: 0, nbDeputes: 0 };
        parGroupe[g].nbDeputes++;
        const position = votantsMap[depute.id];
        if (position === 'auteur') parGroupe[g].pour++;
        else if (position === 'cosignataire') parGroupe[g].abstention++;
        else if (position === 'pour' || position === 'contre' || position === 'abstention') parGroupe[g][position]++;
    }
    return Object.entries(parGroupe)
        .map(([abrev, counts]) => ({
            abrev,
            ...counts,
            nonParticipation: counts.nbDeputes - counts.pour - counts.contre - counts.abstention,
            segments: isAmendement ? [
                { key: 'auteur', pct: counts.nbDeputes ? counts.pour / counts.nbDeputes * 100 : 0, color: '#059669' },
                { key: 'cosignataire', pct: counts.nbDeputes ? counts.abstention / counts.nbDeputes * 100 : 0, color: '#6ee7b7' },
            ] : [
                { key: 'pour', pct: counts.nbDeputes ? counts.pour / counts.nbDeputes * 100 : 0, color: '#10b981' },
                { key: 'contre', pct: counts.nbDeputes ? counts.contre / counts.nbDeputes * 100 : 0, color: '#ef4444' },
                { key: 'abstention', pct: counts.nbDeputes ? counts.abstention / counts.nbDeputes * 100 : 0, color: '#fbbf24' },
                { key: 'nonParticipation', pct: counts.nbDeputes ? (counts.nbDeputes - counts.pour - counts.contre - counts.abstention) / counts.nbDeputes * 100 : 0, color: '#cbd5e1' },
            ],
        }))
        .filter(g => !isAmendement || (g.pour + g.abstention) > 0)
        .sort((a, b) => (groupeOrdreGaucheaDroite[a.abrev] ?? 99) - (groupeOrdreGaucheaDroite[b.abrev] ?? 99));
});

const logoErreur = reactive({});

// Cohérence par groupe — trié par % cohérent décroissant
const coherenceParGroupe = computed(() => {
    return [...statsParGroupe.value]
        .map(g => {
            const deputes = tousLesDeputes.value.filter(d => d.groupe === g.abrev);
            const counts = { coherent: 0, mitige: 0, incoherent: 0, non_analyse: 0 };
            for (const d of deputes) {
                const statut = props.coherenceBadges[d.id]?.statut ?? 'non_analyse';
                counts[statut] = (counts[statut] || 0) + 1;
            }
            const total = deputes.length;
            const analysed = total - counts.non_analyse;
            return {
                abrev: g.abrev,
                counts,
                total,
                analysed,
                segments: [
                    { key: 'coherent', pct: counts.coherent / total * 100, color: '#10b981' },
                    { key: 'mitige', pct: counts.mitige / total * 100, color: '#f59e0b' },
                    { key: 'incoherent', pct: counts.incoherent / total * 100, color: '#ef4444' },
                    { key: 'non_analyse', pct: counts.non_analyse / total * 100, color: '#e2e8f0' },
                ],
                coherentPct: analysed ? counts.coherent / total * 100 : -1,
            };
        })
        .filter(g => g.total > 0)
        .sort((a, b) => b.coherentPct - a.coherentPct);
});
</script>
