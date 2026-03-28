<template>
    <div>
        <div class="mb-4">
            <SearchBar
                v-model="search"
                placeholder="Rechercher un scrutin…"
                input-class="w-full rounded-xl border border-slate-200 bg-white pl-9 pr-8 py-2.5 text-sm text-slate-700 focus:outline-none focus:border-slate-400"
                @update:model-value="onSearchInput"
            />
        </div>

        <div
            v-if="loading"
            class="flex items-center justify-center py-16 text-slate-400 text-sm"
        >
            Chargement…
        </div>
        <div
            v-else-if="error"
            class="flex items-center justify-center py-16 text-red-400 text-sm"
        >
            Erreur de chargement
        </div>
        <div
            v-else-if="!scrutins.length"
            class="flex items-center justify-center py-16 text-slate-400 text-sm"
        >
            Aucun scrutin trouvé
        </div>

        <div
            v-else
            class="space-y-3"
        >
            <a
                v-for="scrutin in scrutins"
                :key="scrutin.uid"
                :href="`/scrutin/${scrutin.uid}`"
                class="block rounded-2xl border border-slate-200 bg-white px-5 py-4 hover:border-slate-300 hover:shadow-sm transition-all"
            >
                <div class="flex items-start gap-3">
                    <span
                        class="mt-0.5 shrink-0 inline-flex items-center justify-center rounded-full px-2.5 py-0.5 text-xs font-bold uppercase"
                        :class="scrutin.sort === 'adopté'
                            ? 'bg-emerald-100 text-emerald-700'
                            : 'bg-red-100 text-red-700'"
                    >
                        {{ scrutin.sort === 'adopté' ? 'Adopté' : 'Rejeté' }}
                    </span>
                    <div class="min-w-0 flex-1">
                        <p class="text-sm font-medium text-slate-800 leading-snug">
                            {{ scrutin.titre }}
                        </p>
                        <p class="text-xs text-slate-400 mt-1">
                            Scrutin n°{{ scrutin.numero }} · {{ formatDate(scrutin.dateScrutin) }}
                        </p>
                    </div>
                </div>

                <div class="mt-3 flex items-center gap-4 text-xs text-slate-600">
                    <div class="flex items-center gap-1.5">
                        <span class="inline-block w-2 h-2 rounded-full bg-emerald-500" />
                        <span class="font-semibold">{{ scrutin.synthese.pour }}</span>
                        <span class="text-slate-400">pour</span>
                    </div>
                    <div class="flex items-center gap-1.5">
                        <span class="inline-block w-2 h-2 rounded-full bg-red-500" />
                        <span class="font-semibold">{{ scrutin.synthese.contre }}</span>
                        <span class="text-slate-400">contre</span>
                    </div>
                    <div class="flex items-center gap-1.5">
                        <span class="inline-block w-2 h-2 rounded-full bg-slate-300" />
                        <span class="font-semibold">{{ scrutin.synthese.abstentions }}</span>
                        <span class="text-slate-400">abst.</span>
                    </div>
                </div>

                <div class="mt-3 h-1.5 rounded-full overflow-hidden bg-slate-100 flex">
                    <div
                        class="h-full bg-emerald-500"
                        :style="{ width: pct(scrutin.synthese.pour, scrutin.synthese.votants) + '%' }"
                    />
                    <div
                        class="h-full bg-red-500"
                        :style="{ width: pct(scrutin.synthese.contre, scrutin.synthese.votants) + '%' }"
                    />
                    <div
                        class="h-full bg-slate-300"
                        :style="{ width: pct(scrutin.synthese.abstentions, scrutin.synthese.votants) + '%' }"
                    />
                </div>
            </a>
        </div>
    </div>
</template>

<script setup>
import { ref, onMounted } from 'vue';
import SearchBar from '@components/SearchBar.vue';

const scrutins = ref([]);
const loading = ref(false);
const error = ref(false);
const search = ref('');
let searchTimer = null;

const mois = ['jan.', 'fév.', 'mars', 'avr.', 'mai', 'juin',
    'juil.', 'août', 'sept.', 'oct.', 'nov.', 'déc.'];

const formatDate = dateStr => {
    const [y, m, d] = dateStr.split('-').map(Number);
    return `${d} ${mois[m - 1]} ${y}`;
};

const pct = (value, total) => total ? Math.round((value / total) * 100) : 0;

const load = async () => {
    loading.value = true;
    error.value = false;
    try {
        const params = new URLSearchParams({ limit: search.value.trim() ? 50 : 10 });
        if (search.value.trim()) params.set('q', search.value.trim());
        const res = await fetch(`/api/votes?${params}`);
        if (!res.ok) throw new Error();
        scrutins.value = await res.json();
    } catch {
        error.value = true;
    } finally {
        loading.value = false;
    }
};

const onSearchInput = () => {
    clearTimeout(searchTimer);
    searchTimer = setTimeout(load, 350);
};

onMounted(load);
</script>

<style scoped>
a:hover {
    text-decoration: none;
}
</style>
