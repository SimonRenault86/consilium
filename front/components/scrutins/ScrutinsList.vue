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
            <ScrutinCard
                v-for="scrutin in scrutins"
                :key="scrutin.uid"
                :scrutin="scrutin"
                :href="`/scrutin/${scrutin.uid}`"
                show-stats
            />
        </div>
    </div>
</template>

<script setup>
import { ref, onMounted } from 'vue';
import SearchBar from '@components/SearchBar.vue';
import ScrutinCard from '@components/scrutins/ScrutinCard.vue';

const scrutins = ref([]);
const loading = ref(false);
const error = ref(false);
const search = ref('');
let searchTimer = null;

const load = async () => {
    loading.value = true;
    error.value = false;
    try {
        const params = new URLSearchParams({ limit: search.value.trim() ? 50 : 10 });
        if (search.value.trim()) params.set('q', search.value.trim());
        const res = await fetch(`/api/scrutins?${params}`);
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
