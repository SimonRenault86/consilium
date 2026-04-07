<template>
    <section
        v-if="!loading && (coherence || allAnalyses.length)"
        class="mb-6"
    >
        <Panel
            title="Cohérence discours / votes"
            tooltip="L'analyse croise trois dimensions : les questions au gouvernement (QAGs) posées par le député ce mois, ses votes parlementaires sur les mêmes thèmes depuis le début du mandat, et sa discipline de vote par rapport à la position majoritaire de son groupe. Une IA synthétise ensuite ces données en tenant compte du positionnement politique du député (majorité, opposition, indépendant)."
        >
            <!-- Toggle vue résumée / détaillée -->
            <div class="flex items-center gap-2 mb-5">
                <button
                    class="text-xs px-3 py-1.5 rounded-full border transition font-medium"
                    :class="!detailMode
                        ? 'bg-primary-700 text-white border-primary-700'
                        : 'border-slate-200 text-primary-500 hover:border-primary-400'"
                    @click="switchMode(false)"
                >
                    Résumé
                </button>
                <button
                    class="text-xs px-3 py-1.5 rounded-full border transition font-medium"
                    :class="detailMode
                        ? 'bg-primary-700 text-white border-primary-700'
                        : 'border-slate-200 text-primary-500 hover:border-primary-400'"
                    @click="switchMode(true)"
                >
                    Toutes les analyses
                </button>
            </div>

            <!-- ── VUE RÉSUMÉE (un mois à la fois) ── -->
            <template v-if="!detailMode && coherence">
                <CoherenceAnalyseBlock :analyse="coherence" />

                <!-- Navigation mois + date de calcul -->
                <div class="flex items-center justify-between mt-5 pt-4 border-t border-slate-100">
                    <div class="flex items-center gap-2 flex-wrap">
                        <button
                            v-for="m in coherence.moisDispos"
                            :key="m"
                            class="text-xs px-2.5 py-1 rounded-full border transition"
                            :class="m === coherence.mois
                                ? 'bg-primary-700 text-white border-primary-700'
                                : 'border-slate-200 text-primary-500 hover:border-primary-400'"
                            @click="loadMois(m)"
                        >
                            {{ formatMois(m) }}
                        </button>
                    </div>
                    <p
                        v-if="coherence.computedAt"
                        class="text-xs text-primary-400 shrink-0 flex items-center gap-2"
                    >
                        <span class="inline-flex items-center gap-1.5 rounded-full bg-secondary-100 px-3 py-1 text-xs font-bold text-secondary-600 uppercase tracking-wide">
                            <i class="fa-solid fa-wand-magic-sparkles text-[10px]" />
                            Résumé IA
                        </span>
                        <span class="opacity-40">|</span>
                        Calculé {{ formatDate(coherence.computedAt) }}
                    </p>
                </div>
            </template>

            <!-- ── VUE DÉTAILLÉE (toutes les analyses en accordéon) ── -->
            <template v-if="detailMode">
                <div
                    v-if="allLoading"
                    class="text-sm text-primary-400 py-4 text-center"
                >
                    Chargement…
                </div>
                <div
                    v-else
                    class="space-y-3"
                >
                    <div
                        v-for="analyse in allAnalyses"
                        :key="analyse.mois"
                        class="rounded-xl border border-slate-100 overflow-hidden"
                    >
                        <!-- En-tête accordéon -->
                        <button
                            class="w-full flex items-center justify-between px-4 py-3 hover:bg-slate-50 transition text-left"
                            @click="toggleMois(analyse.mois)"
                        >
                            <div class="flex items-center gap-3">
                                <span class="text-sm font-semibold text-primary-700 capitalize">
                                    {{ formatMois(analyse.mois) }}
                                </span>
                                <CoherenceBadge
                                    v-if="analyse.statut"
                                    :statut="analyse.statut"
                                    :small="true"
                                />
                            </div>
                            <i
                                class="fa-solid fa-chevron-down text-primary-400 text-xs transition-transform"
                                :class="{ 'rotate-180': openMois === analyse.mois }"
                            />
                        </button>

                        <!-- Contenu accordéon -->
                        <div
                            v-if="openMois === analyse.mois"
                            class="px-4 pb-4"
                        >
                            <CoherenceAnalyseBlock :analyse="analyse" />
                            <p
                                v-if="analyse.computedAt"
                                class="text-xs text-primary-400 mt-4 flex items-center gap-2"
                            >
                                <span class="inline-flex items-center gap-1.5 rounded-full bg-secondary-100 px-3 py-1 text-xs font-bold text-secondary-600 uppercase tracking-wide">
                                    <i class="fa-solid fa-wand-magic-sparkles text-[10px]" />
                                    Résumé IA
                                </span>
                                <span class="opacity-40">|</span>
                                Calculé {{ formatDate(analyse.computedAt) }}
                            </p>
                        </div>
                    </div>
                </div>
            </template>
        </Panel>
    </section>
</template>

<script setup>
import { ref, onMounted } from 'vue';
import Panel from '@components/Panel.vue';
import CoherenceBadge from '@components/deputes/CoherenceBadge.vue';
import CoherenceAnalyseBlock from '@components/deputes/CoherenceAnalyseBlock.vue';
import { dayjsParis } from '@/helpers/dayjsUtils.js';

const props = defineProps({
    deputeId: { type: String, required: true },
});

const coherence = ref(null);
const allAnalyses = ref([]);
const loading = ref(true);
const allLoading = ref(false);
const detailMode = ref(false);
const openMois = ref(null);

const formatDate = dateStr => dayjsParis(dateStr).format('D MMM YYYY');
const formatMois = moisStr => dayjsParis(moisStr + '-01').format('MMM YYYY');

const fetchCoherence = async (mois = null) => {
    const url = mois
        ? `/api/deputes/${props.deputeId}/coherence?mois=${mois}`
        : `/api/deputes/${props.deputeId}/coherence`;
    const res = await fetch(url);
    if (res.ok) coherence.value = await res.json();
};

const fetchAll = async () => {
    if (allAnalyses.value.length) return;
    allLoading.value = true;
    try {
        const res = await fetch(`/api/deputes/${props.deputeId}/coherence/all`);
        if (res.ok) {
            allAnalyses.value = await res.json();
            if (allAnalyses.value.length) openMois.value = allAnalyses.value[0].mois;
        }
    } finally {
        allLoading.value = false;
    }
};

const switchMode = async (detail) => {
    detailMode.value = detail;
    if (detail) await fetchAll();
};

const loadMois = async mois => {
    await fetchCoherence(mois);
};

const toggleMois = mois => {
    openMois.value = openMois.value === mois ? null : mois;
};

onMounted(async () => {
    try {
        await fetchCoherence();
    } catch {
        // Pas de données : on n'affiche rien
    } finally {
        loading.value = false;
    }
});
</script>


