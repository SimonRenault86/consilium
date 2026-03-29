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
                <div class="relative h-3 flex-1 rounded-full bg-slate-100 overflow-hidden flex">
                    <div
                        class="h-full bg-emerald-500 transition-all duration-500"
                        :style="{ width: g.nbDeputes ? (g.pour / g.nbDeputes * 100) + '%' : '0%' }"
                    />
                    <div
                        class="h-full bg-red-500 transition-all duration-500"
                        :style="{ width: g.nbDeputes ? (g.contre / g.nbDeputes * 100) + '%' : '0%' }"
                    />
                    <div
                        class="h-full bg-amber-400 transition-all duration-500"
                        :style="{ width: g.nbDeputes ? (g.abstention / g.nbDeputes * 100) + '%' : '0%' }"
                    />
                    <div
                        class="h-full bg-slate-300 flex-1 transition-all duration-500"
                        :style="{ minWidth: g.nbDeputes ? (g.nonParticipation / g.nbDeputes * 100) + '%' : '0%' }"
                    />
                </div>

                <!-- Détail chiffres -->
                <div class="shrink-0 flex gap-2 text-xs w-28 justify-end">
                    <span class="text-emerald-600 font-medium">{{ g.pour }}</span>
                    <span class="text-slate-300">/</span>
                    <span class="text-red-500 font-medium">{{ g.contre }}</span>
                    <span class="text-slate-300">/</span>
                    <span class="text-amber-500">{{ g.abstention }}</span>
                    <span class="text-slate-300">/</span>
                    <span class="text-slate-400">{{ g.nonParticipation }}</span>
                </div>
            </div>

            <!-- Légende -->
            <div class="flex flex-wrap justify-center gap-x-4 gap-y-1 mt-1">
                <div class="flex items-center gap-1.5">
                    <span class="inline-block w-2.5 h-2.5 rounded-sm bg-emerald-500" />
                    <span class="text-xs text-slate-500">Pour</span>
                </div>
                <div class="flex items-center gap-1.5">
                    <span class="inline-block w-2.5 h-2.5 rounded-sm bg-red-500" />
                    <span class="text-xs text-slate-500">Contre</span>
                </div>
                <div class="flex items-center gap-1.5">
                    <span class="inline-block w-2.5 h-2.5 rounded-sm bg-amber-400" />
                    <span class="text-xs text-slate-500">Abstention</span>
                </div>
                <div class="flex items-center gap-1.5">
                    <span class="inline-block w-2.5 h-2.5 rounded-sm bg-slate-300" />
                    <span class="text-xs text-slate-500">Non-participation</span>
                </div>
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
                    <span class="text-xs font-semibold text-slate-800">{{ g.nombreDeputes }}</span>
                    <span class="text-xs text-slate-400">députés</span>
                </div>
            </a>
        </div>

        <!-- Filtres scores : barre par groupe -->
        <div
            v-else
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
                <div class="relative h-3 flex-1 rounded-full bg-slate-100 overflow-hidden">
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
        default: null
    }
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
    const parGroupe = {};
    for (const depute of tousLesDeputes.value) {
        const g = depute.groupe;
        if (!parGroupe[g]) parGroupe[g] = { pour: 0, contre: 0, abstention: 0, nbDeputes: 0 };
        parGroupe[g].nbDeputes++;
        const position = votantsMap[depute.id];
        if (position) parGroupe[g][position]++;
    }
    return Object.entries(parGroupe)
        .map(([abrev, counts]) => ({
            abrev,
            ...counts,
            nonParticipation: counts.nbDeputes - counts.pour - counts.contre - counts.abstention,
        }))
        .sort((a, b) => (groupeOrdreGaucheaDroite[a.abrev] ?? 99) - (groupeOrdreGaucheaDroite[b.abrev] ?? 99));
});

const logoErreur = reactive({});
</script>
