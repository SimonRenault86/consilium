<template>
    <span
        v-if="style"
        class="relative inline-flex items-center gap-1.5 text-xs font-semibold px-2.5 py-1 rounded-full cursor-default group"
        :class="[style.cls, sizeClass]"
    >
        <span
            class="w-1.5 h-1.5 rounded-full shrink-0"
            :class="style.dotCls"
        />
        {{ style.label }}

        <!-- Tooltip CSS -->
        <span
            class="pointer-events-none absolute bottom-full left-1/2 -translate-x-1/2 mb-2 w-max max-w-56 rounded-lg bg-primary-800 px-2.5 py-1.5 text-xs font-normal text-white shadow-lg opacity-0 group-hover:opacity-100 transition-opacity duration-150 z-50 text-center leading-snug"
        >
            Analyse IA
        </span>
    </span>
</template>

<script setup>
import { computed } from 'vue';

const STYLES = {
    coherent:   { label: 'Cohérent', cls: 'bg-emerald-50 text-emerald-700', dotCls: 'bg-emerald-500' },
    mitige:     { label: 'Mitigé', cls: 'bg-amber-50 text-amber-700', dotCls: 'bg-amber-400' },
    incoherent: { label: 'Incohérent', cls: 'bg-red-50 text-red-700', dotCls: 'bg-red-500' },
    non_analyse: { label: 'Non analysé', cls: 'bg-slate-100 text-slate-500', dotCls: 'bg-slate-400' },
};

const props = defineProps({
    statut: { type: String, default: null },
    title:  { type: String, default: null },
    small:  { type: Boolean, default: false },
});

const style = computed(() => props.statut ? (STYLES[props.statut] ?? null) : null);
const sizeClass = computed(() => props.small ? 'px-2 py-0.5' : 'px-2.5 py-1');
</script>
