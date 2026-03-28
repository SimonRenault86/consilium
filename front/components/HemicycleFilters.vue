<template>
    <div class="flex items-center justify-center gap-2 mb-4">
        <button
            v-for="vue in vues"
            :key="vue.id"
            class="flex items-center gap-1.5 rounded-full px-4 py-1.5 text-sm font-medium transition-all duration-150 border"
            :class="modelValue === vue.id
                ? 'bg-slate-900 text-white border-slate-900'
                : 'bg-white text-slate-600 border-slate-200 hover:border-slate-400'"
            @click="$emit('update:modelValue', vue.id)"
        >
            <span
                v-if="vue.gradient"
                class="inline-block h-3 w-8 rounded-full shrink-0"
                :style="{ background: 'linear-gradient(to right, #ef4444, #22c55e)' }"
            />
            <span
                v-else
                class="inline-block h-3 w-3 rounded-full shrink-0"
                :style="{ background: vue.couleur }"
            />
            {{ vue.label }}
        </button>
    </div>
</template>

<script setup>
defineProps({
    modelValue: {
        type: String,
        required: true
    }
});

defineEmits(['update:modelValue']);

const vues = [
    { id: 'standard', label: 'Groupes', couleur: '#64748b', gradient: false },
    { id: 'loyaute', label: 'Loyauté', gradient: true },
    { id: 'participation', label: 'Participation', gradient: true },
    { id: 'vote', label: 'Vote', couleur: '#10b981', gradient: false },
];
</script>
