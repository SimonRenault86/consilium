<template>
    <div>
        <!-- 3.1 Infos : scrutins préférés + scrutins spécifiques -->
        <div class="grid grid-cols-1 md:grid-cols-2 gap-6 mb-6">
            <!-- Scrutins préférés (catégories) -->
            <ScrutinsPreferesGroupe
                :stats="stats"
                :loading="statsLoading"
            />

            <!-- Scrutins spécifiques au groupe -->
            <section class="bg-white rounded-sm shadow-sm border border-slate-200 p-5">
                <h2 class="text-xs font-semibold text-primary-500 uppercase tracking-widest mb-4">
                    Scrutins récents
                </h2>
                <LoadingState
                    v-if="scrutinsLoading"
                    class="py-8"
                />
                <EmptyState
                    v-else-if="!scrutins.length"
                    message="Aucun scrutin"
                    class="py-8"
                />
                <div
                    v-else
                    class="space-y-2"
                >
                    <a
                        v-for="s in scrutins.slice(0, 5)"
                        :key="s.uid"
                        :href="`/scrutin/${s.uid}`"
                        class="flex items-start gap-2.5 p-2.5 rounded-xl hover:bg-slate-50 transition group no-underline hover:no-underline"
                    >
                        <!-- Badge position du groupe -->
                        <span
                            class="mt-0.5 shrink-0 inline-flex items-center rounded-full px-2 py-0.5 text-xs font-bold uppercase"
                            :class="positionClass(s.groupeVote)"
                        >
                            {{ positionLabel(s.groupeVote) }}
                        </span>
                        <div class="min-w-0">
                            <p class="text-sm font-medium text-primary-700 leading-snug line-clamp-2 group-hover:text-primary-900">
                                {{ s.titre }}
                            </p>
                            <p class="text-xs text-primary-500 mt-0.5">
                                Scrutin n°{{ s.numero }} · {{ formatDate(s.dateScrutin) }}
                            </p>
                        </div>
                    </a>
                </div>
            </section>
        </div>

        <!-- 3.2 : Dernières QaG -->
        <div class="mb-6">
            <DernierQag :abrev="abrev" />
        </div>

        <!-- 3.3 + 3.4 : Carte + Nombre de députés -->
        <div class="grid grid-cols-1 lg:grid-cols-3 gap-6 mb-6">
            <!-- Carte hémicycle (gauche, 2/3) -->
            <div class="lg:col-span-2 bg-white rounded-sm shadow-sm border border-slate-200 overflow-hidden">
                <AssemblyMap
                    :filter-groupe="abrev"
                    hide-filters
                    hide-stats
                />
            </div>

            <!-- Nombre de députés + résumé (droite, 1/3) -->
            <div class="flex flex-col gap-4">
                <div class="bg-white rounded-sm shadow-sm border border-slate-200 p-6 text-center">
                    <p class="text-5xl font-bold text-primary-900">
                        {{ nbDeputes }}
                    </p>
                    <p class="text-sm text-primary-500 mt-2">
                        député{{ nbDeputes > 1 ? 's' : '' }}
                    </p>
                </div>

                <!-- Résumé global pour/contre/abstentions -->
                <div
                    v-if="totaux"
                    class="bg-white rounded-sm shadow-sm border border-slate-200 p-5"
                >
                    <p class="text-xs font-semibold text-primary-500 uppercase tracking-widest mb-4">
                        Vote global
                    </p>
                    <div class="space-y-2">
                        <div class="flex items-center justify-between text-sm">
                            <span class="flex items-center gap-1.5 text-primary-600">
                                <span class="w-2 h-2 rounded-full bg-emerald-500 shrink-0" />
                                Pour
                            </span>
                            <span class="font-semibold text-primary-700">
                                {{ pct(totaux.pour, totaux.total) }}%
                            </span>
                        </div>
                        <div class="flex items-center justify-between text-sm">
                            <span class="flex items-center gap-1.5 text-primary-600">
                                <span class="w-2 h-2 rounded-full bg-red-500 shrink-0" />
                                Contre
                            </span>
                            <span class="font-semibold text-primary-700">
                                {{ pct(totaux.contre, totaux.total) }}%
                            </span>
                        </div>
                        <div class="flex items-center justify-between text-sm">
                            <span class="flex items-center gap-1.5 text-primary-600">
                                <span class="w-2 h-2 rounded-full bg-slate-300 shrink-0" />
                                Abstention
                            </span>
                            <span class="font-semibold text-primary-700">
                                {{ pct(totaux.abstentions, totaux.total) }}%
                            </span>
                        </div>
                        <div class="mt-2 h-2 rounded-full overflow-hidden bg-primary-100 flex">
                            <div
                                class="h-full bg-emerald-500"
                                :style="{ width: pct(totaux.pour, totaux.total) + '%' }"
                            />
                            <div
                                class="h-full bg-red-500"
                                :style="{ width: pct(totaux.contre, totaux.total) + '%' }"
                            />
                            <div
                                class="h-full bg-slate-300"
                                :style="{ width: pct(totaux.abstentions, totaux.total) + '%' }"
                            />
                        </div>
                    </div>
                </div>
            </div>
        </div>

        <!-- 3.4 Panel : liste complète des députés -->
        <Panel
            title="Membres du groupe"
            :default-open="false"
            class="mb-6"
        >
            <LoadingState
                v-if="!isDeputesReady"
                class="py-8"
            />
            <div
                v-else
                class="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-6 gap-3"
            >
                <a
                    v-for="depute in deputesGroupe"
                    :key="depute.id"
                    :href="`/depute/${depute.slug}`"
                    class="flex flex-col items-center gap-2 p-3 rounded-xl border border-slate-200 bg-white hover:border-slate-300 hover:shadow-sm transition text-center no-underline hover:no-underline"
                >
                    <div class="relative w-12 h-12 shrink-0">
                        <img
                            :src="`/elus/${depute.id}.jpg`"
                            :alt="`${depute.prenom} ${depute.nom}`"
                            class="w-12 h-12 rounded-full object-cover border border-slate-100"
                            @error="e => { e.target.style.display = 'none'; e.target.nextElementSibling.style.display = 'flex'; }"
                        >
                        <div class="w-12 h-12 rounded-full bg-slate-200 text-primary-600 font-bold absolute inset-0 hidden items-center justify-center text-sm">
                            {{ depute.prenom[0] }}{{ depute.nom[0] }}
                        </div>
                    </div>
                    <span class="text-xs font-medium text-primary-700 leading-tight">{{ depute.prenom }} {{ depute.nom }}</span>
                    <span
                        v-if="depute.departementNom"
                        class="text-xs text-primary-500 leading-tight"
                    >{{ depute.departementNom }}</span>
                </a>
            </div>
        </Panel>
    </div>
</template>

<script setup>
import { ref, computed, onMounted } from 'vue';
import AssemblyMap from '@components/AssemblyMap.vue';
import Panel from '@components/Panel.vue';
import LoadingState from '@components/LoadingState.vue';
import EmptyState from '@components/EmptyState.vue';
import ScrutinsPreferesGroupe from '@components/partis/ScrutinsPreferesGroupe.vue';
import DernierQag from '@components/partis/DernierQag.vue';
import { deputesMap, isDeputesReady } from '@/helpers/deputes.js';

const props = defineProps({
    abrev: { type: String, required: true },
});

const stats = ref([]);
const scrutins = ref([]);
const statsLoading = ref(true);
const scrutinsLoading = ref(true);

const mois = ['jan.', 'fév.', 'mars', 'avr.', 'mai', 'juin',
    'juil.', 'août', 'sept.', 'oct.', 'nov.', 'déc.'];

const formatDate = dateStr => {
    const [y, m, d] = String(dateStr).slice(0, 10).split('-').map(Number);
    return `${d} ${mois[m - 1]} ${y}`;
};

const pct = (value, total) => total ? Math.round((value / total) * 100) : 0;

const deputesGroupe = computed(() =>
    [...deputesMap.value.values()]
        .filter(d => d.groupe === props.abrev)
        .sort((a, b) => a.nom.localeCompare(b.nom))
);

const nbDeputes = computed(() => deputesGroupe.value.length);

// Calcule les totaux globaux depuis les stats par catégorie
const totaux = computed(() => {
    if (!stats.value.length) return null;
    const pour = stats.value.reduce((acc, s) => acc + s.nbPour, 0);
    const contre = stats.value.reduce((acc, s) => acc + s.nbContre, 0);
    const abstentions = stats.value.reduce((acc, s) => acc + s.nbAbstentions, 0);
    return { pour, contre, abstentions, total: pour + contre + abstentions };
});

// Retourne la position majoritaire du groupe sur un scrutin
const positionMajoritaire = groupeVote => {
    const { pour, contre, abstentions } = groupeVote;
    if (pour >= contre && pour >= abstentions) return 'pour';
    if (contre >= pour && contre >= abstentions) return 'contre';
    return 'abstention';
};

const positionClass = groupeVote => {
    const pos = positionMajoritaire(groupeVote);
    if (pos === 'pour') return 'bg-emerald-100 text-emerald-700';
    if (pos === 'contre') return 'bg-red-100 text-red-700';
    return 'bg-primary-100 text-primary-600';
};

const positionLabel = groupeVote => {
    const pos = positionMajoritaire(groupeVote);
    if (pos === 'pour') return 'Pour';
    if (pos === 'contre') return 'Contre';
    return 'Abst.';
};

onMounted(async () => {
    const [statsRes, scrutinsRes] = await Promise.all([
        fetch(`/api/partis/${props.abrev}/stats`),
        fetch(`/api/partis/${props.abrev}/scrutins?limit=5`),
    ]);

    if (statsRes.ok) stats.value = await statsRes.json();
    statsLoading.value = false;

    if (scrutinsRes.ok) scrutins.value = await scrutinsRes.json();
    scrutinsLoading.value = false;
});
</script>
