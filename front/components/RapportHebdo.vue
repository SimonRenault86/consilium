<template>
    <div>
        <!-- En-tête -->
        <div class="mb-6 flex flex-col sm:flex-row sm:items-start sm:justify-between gap-4">
            <div>
                <div class="flex items-center gap-2 mb-1">
                    <h1 class="text-2xl sm:text-3xl font-bold text-primary-900">
                        Rapport hebdomadaire
                    </h1>
                    <span class="inline-flex items-center gap-1.5 rounded-full bg-secondary-100 px-3 py-1 text-xs font-bold text-secondary-600 uppercase tracking-wide">
                        <i class="fa-solid fa-wand-magic-sparkles text-[10px]" />
                        Résumé IA
                    </span>
                </div>
                <p
                    v-if="rapportData"
                    class="text-primary-500 text-sm mt-1"
                >
                    {{ labelSemaine }}
                </p>
            </div>

            <RapportSemaineNav
                v-if="semainesData.length > 0"
                :semaines="semainesData"
                :semaine-actuelle="semaineActuelleData"
                class="sm:w-80 shrink-0"
                @navigate="url => window.location.href = `/semaine/${url}`"
            />
        </div>

        <!-- États de chargement -->
        <LoadingState v-if="loading" />
        <ErrorState
            v-else-if="error"
            message="Impossible de charger le rapport"
        />

        <!-- Aucun rapport -->
        <template v-else-if="!rapportData">
            <div class="flex flex-col items-center justify-center gap-4 py-24 text-center text-primary-400">
                <i class="fa-solid fa-newspaper text-4xl" />
                <div>
                    <p class="font-semibold text-primary-600">
                        Aucun rapport disponible
                    </p>
                </div>
            </div>
        </template>

        <template v-else>
            <!-- Narratif -->
            <section class="mb-6 rounded-2xl border border-secondary-200 bg-secondary-50 px-6 py-5">
                <div class="flex items-start gap-3">
                    <div class="mt-0.5 flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-secondary-200 text-secondary-600">
                        <i class="fa-solid fa-quote-left text-xs" />
                    </div>
                    <div>
                        <p class="text-sm font-semibold text-secondary-700 mb-2 uppercase tracking-wide">
                            Synthèse de la semaine
                        </p>
                        <p class="text-primary-800 leading-relaxed">
                            {{ rapportData.narratif }}
                        </p>
                    </div>
                </div>
            </section>

            <div class="grid grid-cols-1 lg:grid-cols-2 gap-6">
                <!-- Scrutins marquants -->
                <section class="bg-white rounded-2xl border border-slate-200 overflow-hidden">
                    <div class="flex items-center gap-2 px-5 py-4 border-b border-slate-100">
                        <div class="flex h-7 w-7 items-center justify-center rounded-full bg-emerald-100 text-emerald-600">
                            <i class="fa-solid fa-check-to-slot text-xs" />
                        </div>
                        <h2 class="text-sm font-bold text-primary-900 uppercase tracking-wide">
                            Votes marquants
                        </h2>
                        <span class="ml-auto text-xs font-medium text-primary-400 bg-slate-100 rounded-full px-2 py-0.5">
                            {{ rapportData.scrutins.length }}
                        </span>
                    </div>
                    <div
                        v-if="rapportData.scrutins.length"
                        class="divide-y divide-slate-100"
                    >
                        <a
                            v-for="s in rapportData.scrutins"
                            :key="s.uid"
                            :href="`/scrutin/${s.uid}`"
                            class="flex items-start gap-3 px-5 py-4 hover:bg-slate-50 transition-colors"
                        >
                            <div class="mt-0.5 flex h-6 w-6 shrink-0 items-center justify-center rounded-full bg-primary-100 text-primary-500">
                                <i class="fa-solid fa-gavel text-[10px]" />
                            </div>
                            <p class="text-sm text-primary-700 leading-snug">
                                {{ s.commentaire }}
                            </p>
                            <i class="fa-solid fa-chevron-right text-primary-200 text-xs mt-1 shrink-0" />
                        </a>
                    </div>
                    <div
                        v-else
                        class="flex items-center justify-center py-10 text-primary-400"
                    >
                        <EmptyState message="Aucun vote cette semaine" />
                    </div>
                </section>

                <!-- Thèmes QaG -->
                <section class="bg-white rounded-2xl border border-slate-200 overflow-hidden">
                    <div class="flex items-center gap-2 px-5 py-4 border-b border-slate-100">
                        <div class="flex h-7 w-7 items-center justify-center rounded-full bg-blue-100 text-blue-600">
                            <i class="fa-solid fa-comments text-xs" />
                        </div>
                        <h2 class="text-sm font-bold text-primary-900 uppercase tracking-wide">
                            Grandes thématiques QaG
                        </h2>
                        <span class="ml-auto text-xs font-medium text-primary-400 bg-slate-100 rounded-full px-2 py-0.5">
                            {{ rapportData.themesQags.length }}
                        </span>
                    </div>
                    <div
                        v-if="rapportData.themesQags.length"
                        class="divide-y divide-slate-100"
                    >
                        <div
                            v-for="t in rapportData.themesQags"
                            :key="t.theme"
                            class="px-5 py-4"
                        >
                            <p class="text-sm font-semibold text-primary-800 mb-1">
                                {{ t.theme }}
                            </p>
                            <p class="text-xs text-primary-500 leading-relaxed">
                                {{ t.description }}
                            </p>
                        </div>
                    </div>
                    <div
                        v-else
                        class="flex items-center justify-center py-10 text-primary-400"
                    >
                        <EmptyState message="Aucune QaG cette semaine" />
                    </div>
                </section>

                <!-- Amendements marquants -->
                <section
                    v-if="rapportData.amendements.length > 0"
                    class="bg-white rounded-2xl border border-slate-200 overflow-hidden lg:col-span-2"
                >
                    <div class="flex items-center gap-2 px-5 py-4 border-b border-slate-100">
                        <div class="flex h-7 w-7 items-center justify-center rounded-full bg-orange-100 text-orange-600">
                            <i class="fa-solid fa-pen-to-square text-xs" />
                        </div>
                        <h2 class="text-sm font-bold text-primary-900 uppercase tracking-wide">
                            Amendements marquants
                        </h2>
                        <span class="ml-auto text-xs font-medium text-primary-400 bg-slate-100 rounded-full px-2 py-0.5">
                            {{ rapportData.amendements.length }}
                        </span>
                    </div>
                    <div class="grid grid-cols-1 sm:grid-cols-2 divide-y sm:divide-y-0 sm:divide-x divide-slate-100">
                        <a
                            v-for="a in rapportData.amendements"
                            :key="a.uid"
                            :href="`/amendements?uid=${a.uid}`"
                            class="flex items-start gap-3 px-5 py-4 hover:bg-slate-50 transition-colors"
                        >
                            <div class="mt-0.5 flex h-6 w-6 shrink-0 items-center justify-center rounded-full bg-orange-100 text-orange-500">
                                <i class="fa-solid fa-file-lines text-[10px]" />
                            </div>
                            <p class="text-sm text-primary-700 leading-snug">
                                {{ a.commentaire }}
                            </p>
                        </a>
                    </div>
                </section>
            </div>

            <!-- Footer rapport -->
            <p class="mt-6 text-center text-xs text-primary-400">
                <i class="fa-solid fa-wand-magic-sparkles mr-1" />
                Rapport généré par IA · {{ formatComputedAt(rapportData.computedAt) }}
                <a
                    :href="`/semaine/${semaineActuelleData}`"
                    class="ml-2 underline hover:text-secondary-500 transition-colors"
                >
                    Voir les archives →
                </a>
            </p>
        </template>
    </div>
</template>

<script setup>
import { ref, computed, onMounted } from 'vue';
import RapportSemaineNav from '@components/rapportHebdo/RapportSemaineNav.vue';
import EmptyState from '@components/EmptyState.vue';
import LoadingState from '@components/LoadingState.vue';
import ErrorState from '@components/ErrorState.vue';

const props = defineProps({
    semaineActuelle: { type: String, default: null },
    semaines: { type: Array, default: null },
    rapport: { type: Object, default: null },
});

// Mode auto-fetch si aucune prop n'est injectée (ex: homepage)
const loading = ref(false);
const error = ref(false);
const rapportData = ref(props.rapport);
const semainesData = ref(props.semaines ?? []);
const semaineActuelleData = ref(props.semaineActuelle);

onMounted(async () => {
    if (props.rapport !== null || props.semaines !== null) return; // données SSR présentes
    loading.value = true;
    try {
        const [rRes, sRes] = await Promise.all([
            fetch('/api/rapport-hebdo/latest'),
            fetch('/api/rapport-hebdo'),
        ]);
        if (rRes.ok) rapportData.value = await rRes.json();
        if (sRes.ok) semainesData.value = await sRes.json();
        semaineActuelleData.value = rapportData.value?.semaineDebut ?? null;
    } catch {
        error.value = true;
    } finally {
        loading.value = false;
    }
});

const labelSemaine = computed(() => {
    if (!rapportData.value) return '';
    const d = new Date(rapportData.value.semaineDebut + 'T12:00:00');
    const f = new Date(rapportData.value.semaineFin + 'T12:00:00');
    const opts = { day: 'numeric', month: 'long' };
    const optsY = { day: 'numeric', month: 'long', year: 'numeric' };
    return `${d.toLocaleDateString('fr-FR', opts)} – ${f.toLocaleDateString('fr-FR', optsY)}`;
});

const formatComputedAt = (ts) => {
    if (!ts) return '';
    return new Date(ts).toLocaleDateString('fr-FR', {
        day: 'numeric', month: 'long', year: 'numeric', hour: '2-digit', minute: '2-digit',
    });
};
</script>
