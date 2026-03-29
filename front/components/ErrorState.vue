<template>
    <div class="flex flex-col items-center justify-center gap-3 text-red-400">
        <i class="fa-solid fa-circle-exclamation text-2xl" />
        <span class="text-sm">{{ message }}</span>
    </div>
</template>

<script setup>
defineProps({
    message: { type: String, default: 'Erreur de chargement' },
});
</script>
