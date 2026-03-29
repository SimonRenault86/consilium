<template>
    <div>
        <div
            v-if="loading"
            class="bg-white rounded-2xl shadow-sm border border-slate-200 p-8 mb-6 text-sm text-slate-400"
        >
            Chargement…
        </div>
        <div
            v-else-if="error"
            class="bg-white rounded-2xl shadow-sm border border-slate-200 p-8 mb-6 text-sm text-red-400"
        >
            Impossible de charger les informations du scrutin.
        </div>
        <template v-else-if="scrutin">
            <!-- Titre complet -->
            <Panel
                title="Objet du scrutin"
                class="mb-6"
            >
                <p class="text-slate-800 leading-relaxed">
                    {{ scrutin.titre }}
                </p>
                <dl class="mt-4 grid grid-cols-1 sm:grid-cols-2 gap-3">
                    <div v-if="scrutin.demandeur">
                        <dt class="text-xs text-slate-400 mb-0.5">
                            Demandé par
                        </dt>
                        <dd class="text-slate-800 font-medium text-sm">
                            {{ scrutin.demandeur }}
                        </dd>
                    </div>
                    <div>
                        <dt class="text-xs text-slate-400 mb-0.5">
                            Date
                        </dt>
                        <dd class="text-slate-800 font-medium text-sm">
                            {{ formatDate(scrutin.dateScrutin) }}
                        </dd>
                    </div>
                </dl>
            </Panel>

            <!-- Carte de l'hémicycle -->
            <section
                v-if="scrutin.votantsMap"
                class="bg-white rounded-2xl shadow-sm border border-slate-200 overflow-hidden mb-6"
            >
                <AssemblyMap
                    :selected-vote="scrutin"
                    hide-filters
                />
            </section>

            <!-- Résultat du vote -->
            <Panel
                title="Résultat"
                class="mb-6"
            >
                <div class="flex items-center gap-3 mb-4">
                    <span
                        class="inline-flex items-center justify-center rounded-full px-3 py-1 text-sm font-bold uppercase"
                        :class="scrutin.sort === 'adopté'
                            ? 'bg-emerald-100 text-emerald-700'
                            : 'bg-red-100 text-red-700'"
                    >
                        {{ scrutin.sort }}
                    </span>
                    <span class="text-sm text-slate-500">{{ scrutin.synthese.votants }} votants</span>
                </div>

                <div class="space-y-3">
                    <div>
                        <div class="flex justify-between items-center mb-1">
                            <span class="text-sm text-slate-600 flex items-center gap-1.5">
                                <i class="fa-solid fa-circle text-emerald-500 text-xs" />Pour
                            </span>
                            <span class="text-sm font-semibold text-slate-800">{{ scrutin.synthese.pour }}</span>
                        </div>
                        <div class="h-1.5 bg-slate-100 rounded-full overflow-hidden">
                            <div
                                class="h-full bg-emerald-500 rounded-full"
                                :style="{ width: pct(scrutin.synthese.pour) + '%' }"
                            />
                        </div>
                    </div>
                    <div>
                        <div class="flex justify-between items-center mb-1">
                            <span class="text-sm text-slate-600 flex items-center gap-1.5">
                                <i class="fa-solid fa-circle text-red-500 text-xs" />Contre
                            </span>
                            <span class="text-sm font-semibold text-slate-800">{{ scrutin.synthese.contre }}</span>
                        </div>
                        <div class="h-1.5 bg-slate-100 rounded-full overflow-hidden">
                            <div
                                class="h-full bg-red-500 rounded-full"
                                :style="{ width: pct(scrutin.synthese.contre) + '%' }"
                            />
                        </div>
                    </div>
                    <div>
                        <div class="flex justify-between items-center mb-1">
                            <span class="text-sm text-slate-600 flex items-center gap-1.5">
                                <i class="fa-solid fa-circle text-slate-300 text-xs" />Abstentions
                            </span>
                            <span class="text-sm font-semibold text-slate-800">{{ scrutin.synthese.abstentions }}</span>
                        </div>
                        <div class="h-1.5 bg-slate-100 rounded-full overflow-hidden">
                            <div
                                class="h-full bg-slate-300 rounded-full"
                                :style="{ width: pct(scrutin.synthese.abstentions) + '%' }"
                            />
                        </div>
                    </div>
                </div>

                <!-- Barre combinée -->
                <p class="text-xs font-semibold text-slate-400 uppercase tracking-widest mt-5 mb-2">
                    Récapitulatif
                </p>
                <div class="mt-1 h-3 rounded-full overflow-hidden bg-slate-100 flex">
                    <div
                        class="h-3 bg-emerald-500"
                        :style="{ width: pct(scrutin.synthese.pour) + '%' }"
                    />
                    <div
                        class="h-3 bg-red-500"
                        :style="{ width: pct(scrutin.synthese.contre) + '%' }"
                    />
                    <div
                        class="h-3 bg-slate-300"
                        :style="{ width: pct(scrutin.synthese.abstentions) + '%' }"
                    />
                </div>
            </Panel>
        </template>
    </div>
</template>

<script setup>
import { ref, onMounted } from 'vue';
import Panel from '@components/Panel.vue';
import AssemblyMap from '@components/AssemblyMap.vue';
import { initDeputes } from '@/helpers/deputes.js';
import { initPartis } from '@/helpers/partis.js';

const props = defineProps({
    scrutinUid: { type: String, required: true },
});

const scrutin = ref(null);
const loading = ref(true);
const error = ref(false);

const mois = ['janvier', 'février', 'mars', 'avril', 'mai', 'juin',
    'juillet', 'août', 'septembre', 'octobre', 'novembre', 'décembre'];

const formatDate = dateStr => {
    if (!dateStr) return '';
    const [y, m, d] = String(dateStr).slice(0, 10).split('-').map(Number);
    return `${d} ${mois[m - 1]} ${y}`;
};

const pct = value => scrutin.value?.synthese?.votants
    ? Math.round((value / scrutin.value.synthese.votants) * 100)
    : 0;

onMounted(async () => {
    await Promise.all([initPartis(), initDeputes()]);
    try {
        const res = await fetch(`/api/scrutins/${props.scrutinUid}`);
        if (!res.ok) throw new Error();
        scrutin.value = await res.json();
    } catch {
        error.value = true;
    } finally {
        loading.value = false;
    }
});
</script>
