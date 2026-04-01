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

            <!-- Activité parlementaire -->
            <Panel
                v-if="depute.scoreParticipation != null || depute.scoreLoyaute != null"
                title="Activité parlementaire"
                class="mb-6"
            >
                <div class="grid grid-cols-1 md:grid-cols-2 gap-6">
                    <div v-if="depute.scoreParticipation != null">
                        <div class="flex justify-between items-center mb-1.5">
                            <span class="text-sm text-primary-600">Participation</span>
                            <span class="text-sm font-semibold text-primary-700">{{ pct(depute.scoreParticipation) }} %</span>
                        </div>
                        <div class="h-2 bg-primary-100 rounded-full overflow-hidden">
                            <div
                                class="h-2 rounded-full bg-blue-500"
                                :style="{ width: pct(depute.scoreParticipation) + '%' }"
                            />
                        </div>
                    </div>
                    <div v-if="depute.scoreLoyaute != null">
                        <div class="flex justify-between items-center mb-1.5">
                            <span class="text-sm text-primary-600">Loyauté au groupe</span>
                            <span class="text-sm font-semibold text-primary-700">{{ pct(depute.scoreLoyaute) }} %</span>
                        </div>
                        <div class="h-2 bg-primary-100 rounded-full overflow-hidden">
                            <div
                                class="h-2 rounded-full bg-emerald-500"
                                :style="{ width: pct(depute.scoreLoyaute) + '%' }"
                            />
                        </div>
                    </div>
                </div>
            </Panel>

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
import { ref, onMounted } from 'vue';
import Panel from '@components/Panel.vue';
import LoadingState from '@components/LoadingState.vue';
import ErrorState from '@components/ErrorState.vue';

const props = defineProps({
    deputeId: { type: String, required: true },
});

const depute = ref(null);
const loading = ref(true);
const error = ref(false);

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
        const res = await fetch(`/api/deputes/${props.deputeId}`);
        if (!res.ok) throw new Error();
        depute.value = await res.json();
    } catch {
        error.value = true;
    } finally {
        loading.value = false;
    }
});
</script>
