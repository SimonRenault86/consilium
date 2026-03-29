<template>
    <div
        v-if="categorie"
        class="inline-flex items-center gap-1.5"
    >
        <span
            class="inline-flex items-center gap-1 rounded-md px-2 py-0.5 text-xs font-semibold text-white"
            :style="{ backgroundColor: categorie.couleur }"
        >
            {{ categorie.nom }}
        </span>
        <span
            v-if="sousCategorie"
            class="inline-flex items-center gap-1 rounded-md bg-slate-100 px-2 py-0.5 text-xs font-medium text-slate-600"
        >
            {{ sousCategorie.nom }}
        </span>
    </div>
</template>

<script setup>
defineProps({
    categorie: { type: Object, default: null },
    sousCategorie: { type: Object, default: null },
});
</script>
