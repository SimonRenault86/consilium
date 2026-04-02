<template>
    <div class="flex flex-wrap items-center justify-center gap-2 mb-4">
        <button
            v-for="vue in vues"
            :key="vue.id"
            class="flex items-center gap-1.5 rounded-full px-3 sm:px-4 py-1.5 text-xs sm:text-sm font-medium transition-all duration-150 border"
            :class="modelValue === vue.id
                ? 'bg-slate-900 text-white border-slate-900'
                : (vue.id === 'vote' && voteDisabled)
                    ? 'bg-white text-primary-300 border-slate-100 cursor-not-allowed'
                    : 'bg-white text-primary-600 border-slate-200 hover:border-slate-400'"
            :disabled="vue.id === 'vote' && voteDisabled"
            @click="vue.id === 'vote' && voteDisabled ? null : $emit('update:modelValue', vue.id)"
        >
            <span
                v-if="vue.gradient"
                class="inline-block h-3 w-8 rounded-full shrink-0"
                :style="{ background: 'linear-gradient(to right, #ef4444, #22c55e)' }"
            />
            <span
                v-else-if="vue.multiCouleur"
                class="flex gap-px shrink-0"
            >
                <span
                    v-for="(c, i) in vue.multiCouleur"
                    :key="c"
                    class="inline-block h-3 w-2.5"
                    :class="i === 0 ? 'rounded-l-full' : i === vue.multiCouleur.length - 1 ? 'rounded-r-full' : ''"
                    :style="{ background: c }"
                />
            </span>
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
    },
    voteDisabled: {
        type: Boolean,
        default: false
    },
});

defineEmits(['update:modelValue']);

const vues = [
    { id: 'standard', label: 'Groupes', couleur: '#64748b', gradient: false },
    { id: 'loyaute', label: 'Loyauté', gradient: true },
    { id: 'participation', label: 'Participation', gradient: true },
    { id: 'vote', label: 'Vote', couleur: '#10b981', gradient: false },
    { id: 'coherence', label: 'Cohérence', gradient: false, multiCouleur: ['#10b981', '#f59e0b', '#ef4444'] },
];
</script>
