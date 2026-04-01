<template>
    <div>
        <LoadingState
            v-if="loading"
            class="py-16"
        />
        <ErrorState
            v-else-if="error"
            class="py-16"
        />
        <EmptyState
            v-else-if="!groupesData.length"
            class="py-16"
            message="Aucune question pour cette session"
        />

        <div v-else>
            <!-- Filtre par catégorie -->
            <div
                v-if="categorieOptions.length"
                class="mb-4"
            >
                <SelectBase
                    v-model="selectedCategories"
                    :options="categorieOptions"
                    placeholder="Filtrer par catégorie"
                    size="md"
                    button-class="min-w-[220px]"
                />
            </div>

            <div class="space-y-3">
                <QagGroupe
                    v-for="(entry, index) in groupesData"
                    :key="entry.groupe.abrev"
                    :groupe="entry.groupe"
                    :questions="entry.questions"
                    :default-open="index === 0"
                />
            </div>
        </div>
    </div>
</template>

<script setup>
import { ref, computed, onMounted } from 'vue';
import { fetchQags, fetchQagCategories } from '@/helpers/qags.js';
import { groupeOrdreGaucheaDroite } from '@/helpers/partis.js';
import QagGroupe from '@components/qags/QagGroupe.vue';
import SelectBase from '@components/SelectBase.vue';
import LoadingState from '@components/LoadingState.vue';
import ErrorState from '@components/ErrorState.vue';
import EmptyState from '@components/EmptyState.vue';

const props = defineProps({
    date: { type: String, required: true },
});

const qags = ref([]);
const loading = ref(false);
const error = ref(false);
const selectedCategories = ref([]);
const categorieOptions = ref([]);

onMounted(async () => {
    loading.value = true;
    try {
        const [qagsData, categories] = await Promise.all([
            fetchQags(props.date),
            fetchQagCategories().catch(() => []),
        ]);
        qags.value = qagsData;
        categorieOptions.value = categories.map(c => ({
            value: c.nom,
            label: c.nom,
            color: c.couleur || null,
        }));
    } catch {
        error.value = true;
    } finally {
        loading.value = false;
    }
});

// Filtrer les QaGs selon la catégorie sélectionnée
const filteredQags = computed(() => {
    if (!selectedCategories.value.length) return qags.value;
    return qags.value.filter(q =>
        q.categorie && selectedCategories.value.includes(q.categorie.nom)
    );
});

// Regrouper les questions par groupe politique, triées gauche → droite
const groupesData = computed(() => {
    const map = new Map();
    for (const qag of filteredQags.value) {
        const abrev = qag.groupe?.abrev || 'NI';
        if (!map.has(abrev)) {
            map.set(abrev, {
                groupe: qag.groupe || { abrev: 'NI', developpe: 'Non inscrit' },
                questions: [],
            });
        }
        map.get(abrev).questions.push(qag);
    }

    return [...map.values()].sort((a, b) => {
        const oa = groupeOrdreGaucheaDroite[a.groupe.abrev] ?? 99;
        const ob = groupeOrdreGaucheaDroite[b.groupe.abrev] ?? 99;
        return oa - ob;
    });
});
</script>
