<template>
    <section class="bg-white rounded-2xl shadow-sm border border-slate-200 p-5">
        <div class="mb-4">
            <h2 class="text-xs font-semibold text-primary-500 uppercase tracking-widest">
                Votes par thématique
            </h2>
            <p class="text-xs text-primary-500 mt-1">
                Comportement de vote du groupe selon les catégories de scrutins
            </p>
        </div>
        <LoadingState
            v-if="loading"
            class="py-8"
        />
        <EmptyState
            v-else-if="!stats.length"
            message="Aucune donnée"
            class="py-8"
        />
        <template v-else>
            <div class="space-y-3 mb-4">
                <div
                    v-for="s in stats.slice(0, 6)"
                    :key="s.categorie"
                >
                    <div class="flex items-center justify-between mb-1.5">
                        <span class="text-sm text-primary-700 truncate mr-2">{{ s.categorie }}</span>
                        <span class="text-xs text-primary-500 shrink-0">{{ s.nbScrutins }} scrutin{{ s.nbScrutins > 1 ? 's' : '' }}</span>
                    </div>
                    <div class="relative h-2 rounded-full overflow-hidden bg-primary-100 flex">
                        <div
                            v-for="segment in segments(s)"
                            :key="segment.label"
                            class="h-full cursor-default transition-opacity duration-100"
                            :class="[segment.bg, hoveredSegment && hoveredSegment !== `${s.categorie}-${segment.label}` ? 'opacity-40' : '']"
                            :style="{ width: pct(segment.value, total(s)) + '%' }"
                            @mouseenter="e => onSegmentEnter(e, s, segment)"
                            @mouseleave="hoveredSegment = null; tooltip = null"
                        />
                    </div>
                </div>
            </div>

            <!-- Légende -->
            <div class="flex flex-wrap gap-x-4 gap-y-1.5 pt-3 border-t border-slate-100">
                <div
                    v-for="seg in legendeItems"
                    :key="seg.label"
                    class="flex items-center gap-1.5"
                >
                    <span
                        class="w-2.5 h-2.5 rounded-full shrink-0"
                        :class="seg.bg"
                    />
                    <span class="text-xs text-primary-500">{{ seg.label }}</span>
                </div>
            </div>
        </template>

        <!-- Tooltip -->
        <Transition name="tooltip">
            <div
                v-if="tooltip"
                class="pointer-events-none fixed z-50 rounded-lg border border-slate-200 bg-white shadow-md px-3 py-2 text-xs"
                :style="{ left: tooltip.x + 'px', top: tooltip.y + 'px' }"
            >
                <span class="font-semibold text-primary-700">{{ tooltip.count }}</span>
                <span class="text-primary-500"> vote{{ tooltip.count > 1 ? 's' : '' }} {{ tooltip.label.toLowerCase() }}</span>
            </div>
        </Transition>
    </section>
</template>

<script setup>
import { ref } from 'vue';
import LoadingState from '@components/LoadingState.vue';
import EmptyState from '@components/EmptyState.vue';

defineProps({
    stats: { type: Array, required: true },
    loading: { type: Boolean, default: false },
});

const hoveredSegment = ref(null);
const tooltip = ref(null);

const legendeItems = [
    { label: 'Pour', bg: 'bg-emerald-500' },
    { label: 'Contre', bg: 'bg-red-500' },
    { label: 'Abstention', bg: 'bg-amber-400' },
    { label: 'Non-participation', bg: 'bg-slate-300' },
];

const segments = s => [
    { label: 'Pour', bg: 'bg-emerald-500', value: s.nbPour },
    { label: 'Contre', bg: 'bg-red-500', value: s.nbContre },
    { label: 'Abstention', bg: 'bg-amber-400', value: s.nbAbstentions },
    { label: 'Non-participation', bg: 'bg-slate-300', value: s.nbNonParticipation },
];

const total = s => s.nbPour + s.nbContre + s.nbAbstentions + s.nbNonParticipation;
const pct = (value, tot) => tot ? Math.round((value / tot) * 100) : 0;

const onSegmentEnter = (e, s, segment) => {
    hoveredSegment.value = `${s.categorie}-${segment.label}`;
    const rect = e.target.getBoundingClientRect();
    tooltip.value = {
        x: rect.left + rect.width / 2,
        y: rect.top - 40,
        label: segment.label,
        count: segment.value,
    };
};
</script>

<style scoped>
.tooltip-enter-active,
.tooltip-leave-active {
    transition: opacity 0.1s;
}
.tooltip-enter-from,
.tooltip-leave-to {
    opacity: 0;
}
</style>
