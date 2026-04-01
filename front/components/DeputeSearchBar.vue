<template>
    <div class="relative w-full max-w-sm mx-auto mb-4">
        <div class="relative">
            <svg
                class="pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-primary-500"
                fill="none"
                stroke="currentColor"
                stroke-width="2"
                viewBox="0 0 24 24"
            >
                <circle
                    cx="11"
                    cy="11"
                    r="8"
                /><path d="m21 21-4.35-4.35" />
            </svg>
            <input
                :value="displayQuery"
                type="text"
                placeholder="Rechercher un député..."
                class="w-full rounded-full border border-slate-200 bg-white py-2 pl-9 pr-9 text-sm text-primary-700 shadow-sm outline-none focus:border-slate-400 placeholder:text-primary-500"
                @input="onInput"
                @focus="onFocus"
                @keydown.escape="effacer"
                @keydown.down.prevent="naviguer(1)"
                @keydown.up.prevent="naviguer(-1)"
                @keydown.enter.prevent="selectionner(suggestions[indexActif])"
            >
            <button
                v-if="displayQuery"
                class="absolute right-3 top-1/2 -translate-y-1/2 text-primary-500 hover:text-primary-600"
                @mousedown.prevent="effacer"
            >
                <svg
                    class="h-4 w-4"
                    fill="none"
                    stroke="currentColor"
                    stroke-width="2"
                    viewBox="0 0 24 24"
                >
                    <path d="M18 6 6 18M6 6l12 12" />
                </svg>
            </button>
        </div>

        <!-- Suggestions -->
        <ul
            v-if="isOpen && suggestions.length"
            class="absolute z-50 mt-1 w-full rounded-xl border border-slate-200 bg-white shadow-lg overflow-hidden"
        >
            <li
                v-for="(depute, i) in suggestions"
                :key="depute.seatId"
                class="flex items-center gap-3 px-3 py-2 cursor-pointer text-sm transition-colors"
                :class="i === indexActif ? 'bg-primary-100' : 'hover:bg-slate-50'"
                @mousedown.prevent="selectionner(depute)"
                @mouseenter="indexActif = i"
            >
                <img
                    v-if="getPhotoUrl(depute) && !photoErreur[depute.slug]"
                    :src="getPhotoUrl(depute)"
                    :alt="`${depute.prenom} ${depute.nom}`"
                    class="size-7 shrink-0 rounded-md object-cover bg-primary-100"
                    @error="photoErreur[depute.slug] = true"
                >
                <div
                    v-else
                    class="flex size-7 shrink-0 items-center justify-center rounded-md text-xs font-bold text-white"
                    :style="{ backgroundColor: groupes[depute.groupe]?.couleur }"
                >
                    {{ depute.prenom[0] }}{{ depute.nom[0] }}
                </div>
                <span class="font-medium text-primary-900">{{ depute.prenom }} {{ depute.nom }}</span>
                <span class="ml-auto text-xs text-primary-500 shrink-0">{{ groupes[depute.groupe]?.nom }}</span>
            </li>
        </ul>
    </div>
</template>

<script setup>
import { ref, computed, reactive } from 'vue';
import { tousLesDeputes, getPhotoUrl } from '@/helpers/deputes.js';
import { groupes } from '@/helpers/partis.js';

const emit = defineEmits(['pin']);

const displayQuery = ref('');
const isSelectionMode = ref(false); // true quand le champ affiche un nom sélectionné
const isOpen = ref(false);
const indexActif = ref(0);

const photoErreur = reactive({});

const normaliser = str =>
    str.normalize('NFD').replace(/[\u0300-\u036f]/g, '').toLowerCase();

const suggestions = computed(() => {
    if (isSelectionMode.value) return [];
    const q = normaliser(displayQuery.value.trim());
    if (!q) return [];
    return tousLesDeputes.value
        .filter(d => normaliser(`${d.prenom} ${d.nom}`).includes(q))
        .slice(0, 8);
});

// L'user commence à taper : on quitte le mode sélection
const onInput = e => {
    isSelectionMode.value = false;
    displayQuery.value = e.target.value;
    indexActif.value = 0;
    isOpen.value = true;
};

// Focus : si un nom était affiché, on le vide pour permettre une nouvelle recherche
const onFocus = () => {
    if (isSelectionMode.value) {
        displayQuery.value = '';
        isSelectionMode.value = false;
    }
    isOpen.value = true;
};

const selectionner = depute => {
    if (!depute) return;
    displayQuery.value = `${depute.prenom} ${depute.nom}`;
    isSelectionMode.value = true;
    isOpen.value = false;
    indexActif.value = 0;
    emit('pin', depute.seatId);
};

const effacer = () => {
    displayQuery.value = '';
    isSelectionMode.value = false;
    isOpen.value = false;
    emit('pin', null);
};

const naviguer = delta => {
    indexActif.value = Math.max(0, Math.min(suggestions.value.length - 1, indexActif.value + delta));
};
</script>
