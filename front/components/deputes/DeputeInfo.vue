<template>
    <div>
        <div
            v-if="loading"
            class="bg-white rounded-2xl shadow-sm border border-slate-200 p-8 mb-6"
        >
            <LoadingState />
        </div>
        <div
            v-else-if="error"
            class="bg-white rounded-2xl shadow-sm border border-slate-200 p-8 mb-6"
        >
            <ErrorState message="Impossible de charger les informations." />
        </div>
        <template v-else-if="depute">
            <div class="grid grid-cols-1 md:grid-cols-2 gap-6 mb-6">
                <!-- Mandat -->
                <Panel title="Mandat">
                    <dl class="space-y-3">
                        <div>
                            <dt class="text-xs text-primary-500 mb-0.5">
                                Circonscription
                            </dt>
                            <dd class="text-primary-700 font-medium">
                                {{ depute.departementNom }}{{ depute.departementCode ? ` (${depute.departementCode})` : '' }} — {{ depute.circo }}e
                            </dd>
                        </div>
                        <div v-if="depute.mandatPrincipal?.region">
                            <dt class="text-xs text-primary-500 mb-0.5">
                                Région
                            </dt>
                            <dd class="text-primary-700 font-medium">
                                {{ depute.mandatPrincipal.region }}
                            </dd>
                        </div>
                        <div v-if="depute.mandatPrincipal?.legislature">
                            <dt class="text-xs text-primary-500 mb-0.5">
                                Législature
                            </dt>
                            <dd class="text-primary-700 font-medium">
                                {{ depute.mandatPrincipal.legislature }}e
                            </dd>
                        </div>
                        <div v-if="depute.datePriseFonction">
                            <dt class="text-xs text-primary-500 mb-0.5">
                                Prise de fonction
                            </dt>
                            <dd class="text-primary-700 font-medium">
                                {{ formatDate(depute.datePriseFonction) }}
                            </dd>
                        </div>
                        <div v-if="depute.mandatPrincipal?.causeMandat">
                            <dt class="text-xs text-primary-500 mb-0.5">
                                Cause du mandat
                            </dt>
                            <dd class="text-primary-700 font-medium capitalize">
                                {{ depute.mandatPrincipal.causeMandat }}
                            </dd>
                        </div>
                        <div v-if="depute.mandatPrincipal?.placeHemicycle">
                            <dt class="text-xs text-primary-500 mb-0.5">
                                Siège à l'hémicycle
                            </dt>
                            <dd class="text-primary-700 font-medium">
                                N° {{ depute.mandatPrincipal.placeHemicycle }}
                            </dd>
                        </div>
                        <div v-if="depute.nombreMandats">
                            <dt class="text-xs text-primary-500 mb-0.5">
                                Expérience
                            </dt>
                            <dd class="text-primary-700 font-medium">
                                {{ depute.nombreMandats }} mandat{{ depute.nombreMandats > 1 ? 's' : '' }}{{ depute.experienceDepute ? ` · ${depute.experienceDepute}` : '' }}
                                <span
                                    v-if="depute.mandatPrincipal?.premiereElection"
                                    class="text-emerald-600"
                                > · Première élection</span>
                            </dd>
                        </div>
                    </dl>
                </Panel>

                <!-- Identité -->
                <Panel title="Identité">
                    <dl class="space-y-3">
                        <div v-if="depute.naissance">
                            <dt class="text-xs text-primary-500 mb-0.5">
                                Date de naissance
                            </dt>
                            <dd class="text-primary-700 font-medium">
                                {{ formatDate(depute.naissance) }}{{ depute.age ? ` (${depute.age} ans)` : '' }}
                            </dd>
                        </div>
                        <div v-if="depute.villeNaissance">
                            <dt class="text-xs text-primary-500 mb-0.5">
                                Lieu de naissance
                            </dt>
                            <dd class="text-primary-700 font-medium">
                                {{ depute.villeNaissance }}
                            </dd>
                        </div>
                        <div v-if="depute.job">
                            <dt class="text-xs text-primary-500 mb-0.5">
                                Profession
                            </dt>
                            <dd class="text-primary-700 font-medium">
                                {{ depute.job }}
                            </dd>
                        </div>
                    </dl>
                </Panel>
            </div>

            <!-- Commissions & collaborateurs -->
            <div
                v-if="depute.commissions?.length || depute.mandatPrincipal?.collaborateurs?.length"
                class="grid grid-cols-1 md:grid-cols-2 gap-6 mb-6"
            >
                <Panel
                    v-if="depute.commissions?.length"
                    :title="`Commission${depute.commissions.length > 1 ? 's' : ''} permanente${depute.commissions.length > 1 ? 's' : ''}`"
                >
                    <ul class="space-y-2">
                        <li
                            v-for="commission in depute.commissions"
                            :key="commission.nom"
                            class="flex items-start gap-2"
                        >
                            <i class="fa-solid fa-circle mt-1.5 flex-shrink-0 text-blue-400 text-[6px]" />
                            <span class="text-primary-700 text-sm">
                                {{ commission.nom }}
                                <span
                                    v-if="commission.role && commission.role !== 'Membre'"
                                    class="ml-1 text-xs text-primary-500"
                                >({{ commission.role }})</span>
                            </span>
                        </li>
                    </ul>
                </Panel>

                <Panel
                    v-if="depute.mandatPrincipal?.collaborateurs?.length"
                    title="Collaborateurs parlementaires"
                >
                    <ul class="space-y-2">
                        <li
                            v-for="collaborateur in depute.mandatPrincipal.collaborateurs"
                            :key="collaborateur"
                            class="flex items-center gap-2 text-sm text-primary-700"
                        >
                            <i class="fa-solid fa-circle flex-shrink-0 text-primary-300 text-[6px]" />
                            {{ collaborateur }}
                        </li>
                    </ul>
                </Panel>
            </div>

            <!-- Activité parlementaire & évolution -->
            <div
                v-if="depute.scoreParticipation != null || depute.scoreLoyaute != null || depute.scoreParticipationSpecialite != null"
                class="grid grid-cols-1 md:grid-cols-2 gap-6 mb-6"
            >
                <Panel
                    title="Activité parlementaire"
                    tooltip="Scores calculés par data.assemblee-nationale.fr à partir des votes, présences et positions du député par rapport à son groupe."
                >
                    <dl class="space-y-4">
                        <div v-if="depute.scoreParticipation != null">
                            <div class="flex justify-between items-center mb-1.5">
                                <span class="flex items-center gap-1.5 text-sm text-primary-600">
                                    Participation
                                    <TooltipInfo size="sm">Taux de présence du député à l'ensemble des votes en séance publique.</TooltipInfo>
                                </span>
                                <span class="flex items-center gap-2">
                                    <span class="text-sm font-semibold text-primary-700">{{ pct(depute.scoreParticipation) }} %</span>
                                    <template v-if="scoreDelta && scoreDelta.scoreParticipation != null">
                                        <span
                                            v-if="scoreDelta.scoreParticipation === 0"
                                            class="text-xs font-medium text-orange-500"
                                        >= 0 pt</span>
                                        <span
                                            v-else-if="scoreDelta.scoreParticipation > 0"
                                            class="flex items-center gap-0.5 text-xs font-medium text-emerald-600"
                                        ><i class="fa-solid fa-arrow-up text-[10px]" /> +{{ scoreDelta.scoreParticipation }} pt</span>
                                        <span
                                            v-else
                                            class="flex items-center gap-0.5 text-xs font-medium text-red-500"
                                        ><i class="fa-solid fa-arrow-down text-[10px]" /> {{ scoreDelta.scoreParticipation }} pt</span>
                                    </template>
                                </span>
                            </div>
                            <div class="relative h-2 bg-primary-100 rounded-full">
                                <div
                                    class="absolute inset-y-0 left-0"
                                    :class="barConfigs.scoreParticipation.deltaWidth ? 'rounded-l-full' : 'rounded-full'"
                                    :style="{ width: barConfigs.scoreParticipation.mainWidth + '%', backgroundColor: barConfigs.scoreParticipation.color }"
                                />
                                <div
                                    v-if="barConfigs.scoreParticipation.deltaWidth"
                                    class="absolute inset-y-0 rounded-r-full"
                                    :class="barConfigs.scoreParticipation.deltaSide === 'left' ? 'delta-decrease' : 'delta-increase'"
                                    :style="{ left: barConfigs.scoreParticipation.deltaLeft + '%', width: barConfigs.scoreParticipation.deltaWidth + '%', backgroundColor: barConfigs.scoreParticipation.deltaColor }"
                                />
                            </div>
                        </div>
                        <div v-if="depute.scoreParticipationSpecialite != null">
                            <div class="flex justify-between items-center mb-1.5">
                                <span class="flex items-center gap-1.5 text-sm text-primary-600">
                                    Implication dans sa spécialité
                                    <TooltipInfo size="sm">Participation du député aux votes relatifs aux commissions dont il est membre (son domaine de spécialité).</TooltipInfo>
                                </span>
                                <span class="flex items-center gap-2">
                                    <span class="text-sm font-semibold text-primary-700">{{ pct(depute.scoreParticipationSpecialite) }} %</span>
                                    <template v-if="scoreDelta && scoreDelta.scoreParticipationSpecialite != null">
                                        <span
                                            v-if="scoreDelta.scoreParticipationSpecialite === 0"
                                            class="text-xs font-medium text-orange-500"
                                        >= 0 pt</span>
                                        <span
                                            v-else-if="scoreDelta.scoreParticipationSpecialite > 0"
                                            class="flex items-center gap-0.5 text-xs font-medium text-emerald-600"
                                        ><i class="fa-solid fa-arrow-up text-[10px]" /> +{{ scoreDelta.scoreParticipationSpecialite }} pt</span>
                                        <span
                                            v-else
                                            class="flex items-center gap-0.5 text-xs font-medium text-red-500"
                                        ><i class="fa-solid fa-arrow-down text-[10px]" /> {{ scoreDelta.scoreParticipationSpecialite }} pt</span>
                                    </template>
                                </span>
                            </div>
                            <div class="relative h-2 bg-primary-100 rounded-full">
                                <div
                                    class="absolute inset-y-0 left-0"
                                    :class="barConfigs.scoreParticipationSpecialite.deltaWidth ? 'rounded-l-full' : 'rounded-full'"
                                    :style="{ width: barConfigs.scoreParticipationSpecialite.mainWidth + '%', backgroundColor: barConfigs.scoreParticipationSpecialite.color }"
                                />
                                <div
                                    v-if="barConfigs.scoreParticipationSpecialite.deltaWidth"
                                    class="absolute inset-y-0 rounded-r-full"
                                    :class="barConfigs.scoreParticipationSpecialite.deltaSide === 'left' ? 'delta-decrease' : 'delta-increase'"
                                    :style="{ left: barConfigs.scoreParticipationSpecialite.deltaLeft + '%', width: barConfigs.scoreParticipationSpecialite.deltaWidth + '%', backgroundColor: barConfigs.scoreParticipationSpecialite.deltaColor }"
                                />
                            </div>
                        </div>
                        <div v-if="depute.scoreLoyaute != null">
                            <div class="flex justify-between items-center mb-1.5">
                                <span class="flex items-center gap-1.5 text-sm text-primary-600">
                                    Loyauté au groupe
                                    <TooltipInfo size="sm">Proportion de votes où le député vote dans le même sens que la majorité de son groupe politique.</TooltipInfo>
                                </span>
                                <span class="flex items-center gap-2">
                                    <span class="text-sm font-semibold text-primary-700">{{ pct(depute.scoreLoyaute) }} %</span>
                                    <template v-if="scoreDelta && scoreDelta.scoreLoyaute != null">
                                        <span
                                            v-if="scoreDelta.scoreLoyaute === 0"
                                            class="text-xs font-medium text-orange-500"
                                        >= 0 %</span>
                                        <span
                                            v-else-if="scoreDelta.scoreLoyaute > 0"
                                            class="flex items-center gap-0.5 text-xs font-medium text-emerald-600"
                                        ><i class="fa-solid fa-arrow-up text-[10px]" /> +{{ scoreDelta.scoreLoyaute }} %</span>
                                        <span
                                            v-else
                                            class="flex items-center gap-0.5 text-xs font-medium text-red-500"
                                        ><i class="fa-solid fa-arrow-down text-[10px]" /> {{ scoreDelta.scoreLoyaute }} %</span>
                                    </template>
                                </span>
                            </div>
                            <div class="relative h-2 bg-primary-100 rounded-full">
                                <div
                                    class="absolute inset-y-0 left-0"
                                    :class="barConfigs.scoreLoyaute.deltaWidth ? 'rounded-l-full' : 'rounded-full'"
                                    :style="{ width: barConfigs.scoreLoyaute.mainWidth + '%', backgroundColor: barConfigs.scoreLoyaute.color }"
                                />
                                <div
                                    v-if="barConfigs.scoreLoyaute.deltaWidth"
                                    class="absolute inset-y-0 rounded-r-full"
                                    :class="barConfigs.scoreLoyaute.deltaSide === 'left' ? 'delta-decrease' : 'delta-increase'"
                                    :style="{ left: barConfigs.scoreLoyaute.deltaLeft + '%', width: barConfigs.scoreLoyaute.deltaWidth + '%', backgroundColor: barConfigs.scoreLoyaute.deltaColor }"
                                />
                            </div>
                        </div>
                    </dl>
                </Panel>

                <Panel
                    title="Évolution activité parlementaire"
                    tooltip="Historique des scores enregistrés."
                >
                    <DeputeScoresChart :depute-id="deputeId" />
                </Panel>
            </div>

            <!-- Contact & liens -->
            <Panel
                v-if="depute.mail || depute.twitter || depute.facebook || depute.website || depute.hatvpUrl"
                title="Contact & liens"
                class="mb-6"
            >
                <div class="flex flex-wrap gap-3">
                    <a
                        v-if="depute.mail"
                        :href="`mailto:${depute.mail}`"
                        class="inline-flex items-center gap-1.5 text-sm text-primary-600 hover:text-primary-900 border border-slate-200 rounded-lg px-3 py-1.5"
                    ><i class="fa-solid fa-envelope" /> {{ depute.mail }}</a>
                    <a
                        v-if="depute.twitter"
                        :href="`https://twitter.com/${depute.twitter.replace('@', '')}`"
                        target="_blank"
                        rel="noopener noreferrer"
                        class="inline-flex items-center gap-1.5 text-sm text-primary-600 hover:text-primary-900 border border-slate-200 rounded-lg px-3 py-1.5"
                    ><i class="fa-brands fa-x-twitter" /> {{ depute.twitter }}</a>
                    <a
                        v-if="depute.facebook"
                        :href="`https://facebook.com/${depute.facebook}`"
                        target="_blank"
                        rel="noopener noreferrer"
                        class="inline-flex items-center gap-1.5 text-sm text-primary-600 hover:text-primary-900 border border-slate-200 rounded-lg px-3 py-1.5"
                    ><i class="fa-brands fa-facebook" /> Facebook</a>
                    <a
                        v-if="depute.website"
                        :href="`https://${depute.website}`"
                        target="_blank"
                        rel="noopener noreferrer"
                        class="inline-flex items-center gap-1.5 text-sm text-primary-600 hover:text-primary-900 border border-slate-200 rounded-lg px-3 py-1.5"
                    ><i class="fa-solid fa-globe" /> Site web</a>
                    <a
                        v-if="depute.hatvpUrl"
                        :href="depute.hatvpUrl"
                        target="_blank"
                        rel="noopener noreferrer"
                        class="inline-flex items-center gap-1.5 text-sm text-primary-600 hover:text-primary-900 border border-slate-200 rounded-lg px-3 py-1.5"
                    ><i class="fa-solid fa-file-lines" /> Déclaration HATVP</a>
                </div>
            </Panel>
        </template>
    </div>
</template>

<script setup>
import { ref, computed, onMounted } from 'vue';
import Panel from '@components/Panel.vue';
import LoadingState from '@components/LoadingState.vue';
import ErrorState from '@components/ErrorState.vue';
import DeputeScoresChart from '@components/deputes/DeputeScoresChart.vue';
import TooltipInfo from '@components/TooltipInfo.vue';

const props = defineProps({
    deputeId: { type: String, required: true },
});

const depute = ref(null);
const loading = ref(true);
const error = ref(false);
const scoresHistory = ref([]);

const scoreDelta = computed(() => {
    if (scoresHistory.value.length < 2) return null;
    const prev = scoresHistory.value[scoresHistory.value.length - 2];
    const curr = scoresHistory.value[scoresHistory.value.length - 1];
    const delta = key => (curr[key] != null && prev[key] != null)
        ? Math.round((curr[key] - prev[key]) * 100)
        : null;
    return {
        scoreParticipation: delta('scoreParticipation'),
        scoreParticipationSpecialite: delta('scoreParticipationSpecialite'),
        scoreLoyaute: delta('scoreLoyaute'),
    };
});

const scoreColor = value => {
    const v = Math.max(0, Math.min(100, value));
    const r = Math.round(248 - 174 * v / 100);
    const g = Math.round(113 + 109 * v / 100);
    const b = Math.round(113 + 15 * v / 100);
    return `rgb(${r},${g},${b})`;
};

const barConfigs = computed(() => {
    const cfg = key => {
        const curr = depute.value?.[key] != null ? Math.round(depute.value[key] * 100) : 0;
        const delta = scoreDelta.value?.[key] ?? 0;
        const color = scoreColor(curr);
        if (delta > 0) return { mainWidth: curr - delta, deltaLeft: curr - delta, deltaWidth: delta, color, deltaColor: 'rgb(16,185,129)', deltaSide: 'right' };
        if (delta < 0) return { mainWidth: curr, deltaLeft: curr, deltaWidth: Math.abs(delta), color, deltaColor: 'rgb(239,68,68)', deltaSide: 'left' };
        return { mainWidth: curr, deltaLeft: 0, deltaWidth: 0, color, deltaColor: null, deltaSide: null };
    };
    return {
        scoreParticipation: cfg('scoreParticipation'),
        scoreParticipationSpecialite: cfg('scoreParticipationSpecialite'),
        scoreLoyaute: cfg('scoreLoyaute'),
    };
});

const mois = ['janvier', 'février', 'mars', 'avril', 'mai', 'juin',
    'juillet', 'août', 'septembre', 'octobre', 'novembre', 'décembre'];

const formatDate = dateStr => {
    if (!dateStr) return '';
    const [y, m, d] = String(dateStr).slice(0, 10).split('-').map(Number);
    return `${d} ${mois[m - 1]} ${y}`;
};

const pct = value => value != null ? Math.round(value * 100) : 0;

onMounted(async () => {
    try {
        const [deputeRes, historyRes] = await Promise.all([
            fetch(`/api/deputes/${props.deputeId}`),
            fetch(`/api/deputes/${props.deputeId}/scores-history`),
        ]);
        if (!deputeRes.ok) throw new Error();
        depute.value = await deputeRes.json();
        if (historyRes.ok) scoresHistory.value = await historyRes.json();
    } catch {
        error.value = true;
    } finally {
        loading.value = false;
    }
});
</script>

<style scoped>
@keyframes delta-pulse {
    0%, 100% { opacity: 0.2; }
    50% { opacity: 0.5; }
}
.delta-increase,
.delta-decrease {
    animation: delta-pulse 1.6s ease-in-out infinite;
}
</style>
