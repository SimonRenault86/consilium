<template>
    <div>
        <!-- Barre de recherche -->
        <div class="mb-3">
            <SearchBar
                v-model="search"
                placeholder="Rechercher un scrutin…"
                input-class="w-full rounded-xl border border-slate-200 bg-white pl-9 pr-8 py-2.5 text-sm text-primary-700 focus:outline-none focus:border-slate-400"
                @update:model-value="onSearchInput"
            />
        </div>

        <!-- Filtres -->
        <div class="flex flex-wrap items-center gap-2 mb-4">
            <SelectBase
                v-model="selectedGroupes"
                :options="groupeOptions"
                placeholder="Groupes politiques"
                size="md"
                button-class="min-w-[200px]"
                @update:model-value="applyFilter"
            />
            <SelectBase
                v-model="selectedCategories"
                :options="categorieOptions"
                placeholder="Catégories"
                size="md"
                button-class="min-w-[200px]"
                @update:model-value="applyFilter"
            />
            <DateRangeFilter
                :from="dateFrom"
                :to="dateTo"
                size="md"
                @update:from="onDateFrom"
                @update:to="onDateTo"
            />
            <ButtonBase
                v-if="hasActiveFilters"
                type="secondary"
                @click="resetFilters"
            >
                <i class="fa-solid fa-xmark" /> Tout réinitialiser
            </ButtonBase>
        </div>

        <LoadingState
            v-if="loading"
            class="py-16"
        />
        <ErrorState
            v-else-if="error"
            class="py-16"
        />
        <EmptyState
            v-else-if="!scrutins.length"
            class="py-16"
            message="Aucun scrutin trouvé"
        />

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
import { ref, computed, onMounted } from 'vue';
import { fetchScrutins } from '@/helpers/scrutins.js';
import ButtonBase from '@components/ButtonBase.vue';
import SearchBar from '@components/SearchBar.vue';
import SelectBase from '@components/SelectBase.vue';
import DateRangeFilter from '@components/DateRangeFilter.vue';
import ScrutinCard from '@components/scrutins/ScrutinCard.vue';
import LoadingState from '@components/LoadingState.vue';
import ErrorState from '@components/ErrorState.vue';
import EmptyState from '@components/EmptyState.vue';

const scrutins = ref([]);
const loading = ref(false);
const error = ref(false);
const search = ref('');
const dateFrom = ref('');
const dateTo = ref('');
const selectedGroupes = ref([]);
const selectedCategories = ref([]);

const groupeOptions = ref([]);
const categorieOptions = ref([]);

let searchTimer = null;

const hasActiveFilters = computed(() =>
    search.value.trim() ||
    dateFrom.value ||
    dateTo.value ||
    selectedGroupes.value.length ||
    selectedCategories.value.length
);

const load = async () => {
    loading.value = true;
    error.value = false;
    try {
        const isFiltered = hasActiveFilters.value;
        scrutins.value = await fetchScrutins({
            from: dateFrom.value || undefined,
            to: dateTo.value || undefined,
            q: search.value.trim() || undefined,
            groupes: selectedGroupes.value.length ? selectedGroupes.value : undefined,
            categories: selectedCategories.value.length ? selectedCategories.value : undefined,
            limit: isFiltered ? 50 : 20,
        });
    } catch {
        error.value = true;
    } finally {
        loading.value = false;
    }
};

const loadMeta = async () => {
    try {
        const [partis, categories] = await Promise.all([
            fetch('/api/partis').then(r => r.json()),
            fetch('/api/scrutins/categories').then(r => r.json()),
        ]);
        groupeOptions.value = partis.map(p => ({
            value: p.abrev,
            label: p.nom,
            logo: p.logo || null,
            color: p.couleur || null,
        }));
        categorieOptions.value = categories.map(c => ({
            value: c.nom,
            label: c.nom,
            color: c.couleur || null,
        }));
    } catch {
        // silently ignore meta load errors
    }
};

const applyFilter = () => load();

const onDateFrom = val => {
    dateFrom.value = val;
    load();
};

const onDateTo = val => {
    dateTo.value = val;
    load();
};

const onSearchInput = () => {
    clearTimeout(searchTimer);
    searchTimer = setTimeout(load, 350);
};

const resetFilters = () => {
    search.value = '';
    dateFrom.value = '';
    dateTo.value = '';
    selectedGroupes.value = [];
    selectedCategories.value = [];
    load();
};

onMounted(() => {
    loadMeta();
    load();
});
</script>

