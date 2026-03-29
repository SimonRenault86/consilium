<template>
    <div class="flex flex-col items-center justify-center gap-3 text-slate-400">
        <i class="fa-solid fa-inbox text-2xl" />
        <span class="text-sm">{{ message }}</span>
    </div>
</template>

<script setup>
defineProps({
    message: { type: String, default: 'Aucun résultat' },
});
</script>
