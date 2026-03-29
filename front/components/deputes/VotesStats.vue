<template>
    <div class="grid grid-cols-1 md:grid-cols-2 gap-6 mb-6">
        <!-- Récapitulatif -->
        <Panel title="Votes au scrutin public">
            <LoadingState
                v-if="loading"
                class="py-6"
            />
            <ErrorState
                v-else-if="error"
                class="py-6"
                message="Données indisponibles"
            />
            <template v-else-if="stats">
                <p class="text-3xl font-bold text-slate-900 mb-4">
                    {{ stats.total }}
                </p>
                <div class="space-y-3">
                    <div>
                        <div class="flex justify-between items-center mb-1">
                            <span class="text-sm text-slate-600 flex items-center gap-1.5">
                                <span class="inline-block w-2.5 h-2.5 rounded-full bg-emerald-500" />Pour
                            </span>
                            <span class="text-sm font-semibold text-slate-800">{{ stats.pour }}</span>
                        </div>
                        <div class="h-1.5 bg-slate-100 rounded-full overflow-hidden">
                            <div
                                class="h-full bg-emerald-500 rounded-full"
                                :style="{ width: pct(stats.pour) + '%' }"
                            />
                        </div>
                    </div>
                    <div>
                        <div class="flex justify-between items-center mb-1">
                            <span class="text-sm text-slate-600 flex items-center gap-1.5">
                                <span class="inline-block w-2.5 h-2.5 rounded-full bg-red-500" />Contre
                            </span>
                            <span class="text-sm font-semibold text-slate-800">{{ stats.contre }}</span>
                        </div>
                        <div class="h-1.5 bg-slate-100 rounded-full overflow-hidden">
                            <div
                                class="h-full bg-red-500 rounded-full"
                                :style="{ width: pct(stats.contre) + '%' }"
                            />
                        </div>
                    </div>
                    <div>
                        <div class="flex justify-between items-center mb-1">
                            <span class="text-sm text-slate-600 flex items-center gap-1.5">
                                <span class="inline-block w-2.5 h-2.5 rounded-full bg-slate-300" />Abstentions
                            </span>
                            <span class="text-sm font-semibold text-slate-800">{{ stats.abstentions }}</span>
                        </div>
                        <div class="h-1.5 bg-slate-100 rounded-full overflow-hidden">
                            <div
                                class="h-full bg-slate-300 rounded-full"
                                :style="{ width: pct(stats.abstentions) + '%' }"
                            />
                        </div>
                    </div>
                    <div>
                        <div class="flex justify-between items-center mb-1">
                            <span class="text-sm text-slate-600 flex items-center gap-1.5">
                                <span class="inline-block w-2.5 h-2.5 rounded-full bg-slate-200" />Non participation
                            </span>
                            <span class="text-sm font-semibold text-slate-800">{{ stats.nonParticipation }}</span>
                        </div>
                        <div class="h-1.5 bg-slate-100 rounded-full overflow-hidden">
                            <div
                                class="h-full bg-slate-200 rounded-full"
                                :style="{ width: pctTotal(stats.nonParticipation) + '%' }"
                            />
                        </div>
                    </div>
                </div>
                <div
                    v-if="stats.categoriesPrincipales && stats.categoriesPrincipales.length"
                    class="mt-4 pt-4 border-t border-slate-100 space-y-3"
                >
                    <div>
                        <span class="text-xs font-semibold text-slate-400 uppercase tracking-wide block mb-1.5">Thèmes principaux</span>
                        <div class="flex flex-wrap gap-1.5">
                            <span
                                v-for="cat in stats.categoriesPrincipales"
                                :key="cat.nom"
                                class="text-xs font-semibold px-2 py-0.5 rounded-full text-white"
                                :style="{ backgroundColor: cat.couleur }"
                            >{{ cat.nom }}</span>
                        </div>
                    </div>
                    <div v-if="stats.sousCategoriesPrincipales && stats.sousCategoriesPrincipales.length">
                        <span class="text-xs font-semibold text-slate-400 uppercase tracking-wide block mb-1.5">Sujets spécifiques</span>
                        <div class="flex flex-wrap gap-1.5">
                            <span
                                v-for="cat in stats.sousCategoriesPrincipales"
                                :key="cat.nom"
                                class="text-xs font-medium px-2 py-0.5 rounded-full border"
                                :style="{ borderColor: cat.couleur, color: cat.couleur }"
                            >{{ cat.nom }}</span>
                        </div>
                    </div>
                </div>
            </template>
        </Panel>

        <!-- 5 derniers scrutins -->
        <Panel
            v-if="stats && stats.derniersVotes.length"
            title="5 derniers scrutins"
        >
            <div class="space-y-2">
                <ScrutinCard
                    v-for="vote in stats.derniersVotes"
                    :key="vote.uid"
                    :scrutin="vote"
                    :position="vote.position"
                    :href="`/scrutin/${vote.uid}`"
                    :show-stats="false"
                    compact
                />
            </div>
        </Panel>
    </div>
</template>

<script setup>
import { ref, onMounted } from 'vue';
import Panel from '@components/Panel.vue';
import ScrutinCard from '@components/scrutins/ScrutinCard.vue';
import LoadingState from '@components/LoadingState.vue';
import ErrorState from '@components/ErrorState.vue';

const props = defineProps({
    deputeId: { type: String, required: true },
});

const stats = ref(null);
const loading = ref(true);
const error = ref(false);

const mois = ['jan.', 'fév.', 'mars', 'avr.', 'mai', 'juin',
    'juil.', 'août', 'sept.', 'oct.', 'nov.', 'déc.'];

const formatDate = dateStr => {
    const [y, m, d] = dateStr.split('-').map(Number);
    return `${d} ${mois[m - 1]} ${y}`;
};

const pct = value => stats.value?.total ? Math.round((value / stats.value.total) * 100) : 0;

const totalScrutins = () => (stats.value?.total ?? 0) + (stats.value?.nonParticipation ?? 0);
const pctTotal = value => totalScrutins() ? Math.round((value / totalScrutins()) * 100) : 0;

onMounted(async () => {
    try {
        const res = await fetch(`/api/deputes/${props.deputeId}/scrutins-stats`);
        if (!res.ok) throw new Error();
        stats.value = await res.json();
    } catch {
        error.value = true;
    } finally {
        loading.value = false;
    }
});
</script>

<style scoped>
a:hover {
    text-decoration: none;
}
</style>
