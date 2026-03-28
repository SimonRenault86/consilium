<template>
    <div class="relative">
        <svg
            class="pointer-events-none absolute left-2.5 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-slate-400"
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
            :value="modelValue"
            :placeholder="placeholder"
            type="text"
            :class="inputClass"
            @input="$emit('update:modelValue', $event.target.value)"
        >
        <button
            v-if="modelValue"
            class="absolute right-2 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-700"
            @click="$emit('update:modelValue', '')"
        >
            ✕
        </button>
    </div>
</template>

<script setup>
defineProps({
    modelValue: { type: String, default: '' },
    placeholder: { type: String, default: 'Rechercher…' },
    inputClass: {
        type: String,
        default: 'w-full rounded-lg border border-slate-200 bg-white pl-8 pr-7 py-1.5 text-xs text-slate-700 focus:outline-none focus:border-slate-400',
    },
});

defineEmits(['update:modelValue']);
</script>
