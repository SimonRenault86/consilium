<template>
    <div class="grid grid-cols-1 md:grid-cols-2 gap-6 mb-6">
        <!-- Récapitulatif -->
        <section class="bg-white rounded-2xl shadow-sm border border-slate-200 p-4 sm:p-6">
            <h2 class="text-xs font-semibold text-slate-400 uppercase tracking-widest mb-4">
                Votes au scrutin public
            </h2>

            <div
                v-if="loading"
                class="text-sm text-slate-400"
            >
                Chargement…
            </div>
            <div
                v-else-if="error"
                class="text-sm text-red-400"
            >
                Données indisponibles
            </div>
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
            </template>
        </section>

        <!-- 5 derniers scrutins -->
        <section
            v-if="stats && stats.derniersVotes.length"
            class="bg-white rounded-2xl shadow-sm border border-slate-200 p-4 sm:p-6"
        >
            <h2 class="text-xs font-semibold text-slate-400 uppercase tracking-widest mb-4">
                5 derniers scrutins
            </h2>
            <ul class="space-y-3">
                <li
                    v-for="vote in stats.derniersVotes"
                    :key="vote.uid"
                >
                    <a
                        :href="`/scrutin/${vote.uid}`"
                        class="flex items-start gap-3 rounded-xl p-2 -mx-2 hover:bg-slate-50 hover:shadow-sm transition"
                    >
                        <span
                            class="mt-0.5 flex-shrink-0 inline-flex items-center justify-center rounded-full px-2 py-0.5 text-xs font-bold uppercase"
                            :class="{
                                'bg-emerald-100 text-emerald-700': vote.position === 'pour',
                                'bg-red-100 text-red-700': vote.position === 'contre',
                                'bg-slate-100 text-slate-600': vote.position === 'abstention',
                            }"
                        >
                            {{ positionLabel(vote.position) }}
                        </span>
                        <div class="min-w-0">
                            <p class="text-sm text-slate-800 leading-snug line-clamp-2">
                                {{ vote.titre }}
                            </p>
                            <p class="text-xs text-slate-400 mt-0.5">
                                Scrutin n°{{ vote.numero }} · {{ formatDate(vote.dateScrutin) }}
                                <span
                                    class="ml-1"
                                    :class="vote.sort === 'adopté' ? 'text-emerald-600' : 'text-red-500'"
                                >· {{ vote.sort }}</span>
                            </p>
                        </div>
                    </a>
                </li>
            </ul>
        </section>
    </div>
</template>

<script setup>
import { ref, onMounted } from 'vue';

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

const positionLabel = position => {
    if (position === 'pour') return 'Pour';
    if (position === 'contre') return 'Contre';
    return 'Abst.';
};

onMounted(async () => {
    try {
        const res = await fetch(`/api/deputes/${props.deputeId}/votes-stats`);
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
