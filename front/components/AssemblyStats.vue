<template>
    <div class="mt-6 px-4">
        <!-- Filtre groupes : liste avec pastille + nombre -->
        <div
            v-if="vueActive === 'standard'"
            class="flex flex-wrap justify-center gap-2"
        >
            <div
                v-for="g in stats"
                :key="g.abrev"
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
            </div>
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
import { statsParGroupe, normaliserScore, scoreToCouleur } from '@/helpers/deputes.js';
import { groupes, getLogoUrl } from '@/helpers/partis.js';

const props = defineProps({
    vueActive: {
        type: String,
        required: true
    },
    hoveredGroupe: {
        type: String,
        default: null
    }
});

const emit = defineEmits(['update:hoveredGroupe']);

const CHAMP_SCORE = { loyaute: 'scoreLoyaute', participation: 'scoreParticipation' };

const champ = computed(() => CHAMP_SCORE[props.vueActive] ?? null);

const stats = statsParGroupe;
const logoErreur = reactive({});
</script>
