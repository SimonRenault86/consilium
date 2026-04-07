<template>
    <nav class="flex items-center gap-2">
        <a
            v-if="prevSemaine"
            :href="`/semaine/${prevSemaine}`"
            class="flex items-center justify-center w-8 h-8 rounded-full border border-slate-200 bg-white text-primary-500 hover:border-secondary-400 hover:text-secondary-500 transition-all"
            title="Semaine précédente"
        >
            <i class="fa-solid fa-chevron-left text-xs" />
        </a>
        <span
            v-else
            class="flex items-center justify-center w-8 h-8 rounded-full border border-slate-100 bg-slate-50 text-primary-300"
        >
            <i class="fa-solid fa-chevron-left text-xs" />
        </span>

        <select
            :value="semaineActuelle"
            class="flex-1 rounded-xl border border-slate-200 bg-white px-3 py-1.5 text-sm font-medium text-primary-700 focus:outline-none focus:ring-2 focus:ring-secondary-400 cursor-pointer"
            @change="e => $emit('navigate', e.target.value)"
        >
            <option
                v-for="s in semaines"
                :key="s.semaine_debut"
                :value="s.semaine_debut"
            >
                {{ formatSemaine(s.semaine_debut, s.semaine_fin) }}
            </option>
        </select>

        <a
            v-if="nextSemaine"
            :href="`/semaine/${nextSemaine}`"
            class="flex items-center justify-center w-8 h-8 rounded-full border border-slate-200 bg-white text-primary-500 hover:border-secondary-400 hover:text-secondary-500 transition-all"
            title="Semaine suivante"
        >
            <i class="fa-solid fa-chevron-right text-xs" />
        </a>
        <span
            v-else
            class="flex items-center justify-center w-8 h-8 rounded-full border border-slate-100 bg-slate-50 text-primary-300"
        >
            <i class="fa-solid fa-chevron-right text-xs" />
        </span>
    </nav>
</template>

<script setup>
import { computed } from 'vue';

const props = defineProps({
    semaines: { type: Array, required: true },
    semaineActuelle: { type: String, default: null },
});

defineEmits(['navigate']);

const formatSemaine = (debut, fin) => {
    const d = new Date(debut);
    const f = new Date(fin);
    const opts = { day: 'numeric', month: 'long' };
    const optsWithYear = { day: 'numeric', month: 'long', year: 'numeric' };
    return `${d.toLocaleDateString('fr-FR', opts)} – ${f.toLocaleDateString('fr-FR', optsWithYear)}`;
};

const currentIndex = computed(() =>
    props.semaines.findIndex(s => s.semaine_debut === props.semaineActuelle)
);

const prevSemaine = computed(() => {
    const i = currentIndex.value;
    return i !== -1 && i < props.semaines.length - 1 ? props.semaines[i + 1].semaine_debut : null;
});

const nextSemaine = computed(() => {
    const i = currentIndex.value;
    return i > 0 ? props.semaines[i - 1].semaine_debut : null;
});
</script>
