<template>
    <div class="flex h-3 flex-1 rounded-full overflow-hidden bg-primary-100">
        <div
            v-for="segment in segments"
            :key="segment.key"
            class="h-full transition-all duration-500"
            :style="{ width: segment.pct + '%', backgroundColor: segment.color }"
        />
    </div>
</template>

<script setup>
// segments: Array<{ key: string, pct: number, color: string }>
defineProps({
    segments: { type: Array, required: true },
});
</script>
