<template>
    <div class="flex items-center gap-1.5">
        <input
            :value="from"
            type="date"
            class="border border-slate-200 bg-white text-primary-700 focus:outline-none focus:border-slate-400 min-w-0 cursor-pointer"
            :class="sizeClass"
            @change="$emit('update:from', $event.target.value)"
        >
        <span class="text-xs text-primary-500 shrink-0">→</span>
        <input
            :value="to"
            type="date"
            class="border border-slate-200 bg-white text-primary-700 focus:outline-none focus:border-slate-400 min-w-0 cursor-pointer"
            :class="sizeClass"
            @change="$emit('update:to', $event.target.value)"
        >
    </div>
</template>

<script setup>
import { computed } from 'vue';

const SIZE_CLASSES = {
    sm: 'rounded-sm px-3 py-1 text-xs',
    md: 'rounded-md px-4 py-2 text-sm',
    lg: 'rounded-md px-5 py-3 text-base',
};

const props = defineProps({
    from: { type: String, default: '' },
    to: { type: String, default: '' },
    size: { type: String, default: 'sm', validator: v => ['sm', 'md', 'lg'].includes(v) },
});

const sizeClass = computed(() => SIZE_CLASSES[props.size] ?? SIZE_CLASSES.sm);
</script>
