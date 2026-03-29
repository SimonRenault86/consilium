<template>
    <component
        :is="href ? 'a' : 'div'"
        :href="href || undefined"
        class="block rounded-2xl border border-slate-200 bg-white px-5 py-4 hover:border-slate-300 hover:shadow-sm transition-all"
    >
        <div class="flex items-start gap-3">
            <!-- Badge position député OU sort global -->
            <span
                class="mt-0.5 shrink-0 inline-flex items-center justify-center rounded-full px-2.5 py-0.5 text-xs font-bold uppercase"
                :class="badgeClass"
            >
                {{ badgeLabel }}
            </span>

            <div class="min-w-0 flex-1">
                <div
                    v-if="scrutin.categorie"
                    class="mb-1"
                >
                    <ScrutinCategorie :categorie="scrutin.categorie" />
                </div>
                <p
                    class="text-sm font-medium text-slate-800 leading-snug"
                    :class="compact ? 'line-clamp-2' : ''"
                >
                    {{ scrutin.titre }}
                </p>
                <p class="text-xs text-slate-400 mt-1">
                    Scrutin n°{{ scrutin.numero }} · {{ formatDate(scrutin.dateScrutin) }}
                    <span
                        v-if="position"
                        class="ml-1"
                        :class="scrutin.sort === 'adopté' ? 'text-emerald-600' : 'text-red-500'"
                    >· {{ scrutin.sort }}</span>
                </p>
            </div>
        </div>

        <template v-if="showStats && scrutin.synthese">
            <div class="mt-3 flex items-center gap-4 text-xs text-slate-600">
                <div class="flex items-center gap-1.5">
                    <span class="inline-block w-2 h-2 rounded-full bg-emerald-500" />
                    <span class="font-semibold">{{ scrutin.synthese.pour }}</span>
                    <span class="text-slate-400">pour</span>
                </div>
                <div class="flex items-center gap-1.5">
                    <span class="inline-block w-2 h-2 rounded-full bg-red-500" />
                    <span class="font-semibold">{{ scrutin.synthese.contre }}</span>
                    <span class="text-slate-400">contre</span>
                </div>
                <div class="flex items-center gap-1.5">
                    <span class="inline-block w-2 h-2 rounded-full bg-slate-300" />
                    <span class="font-semibold">{{ scrutin.synthese.abstentions }}</span>
                    <span class="text-slate-400">abst.</span>
                </div>
            </div>
            <div class="mt-3 h-1.5 rounded-full overflow-hidden bg-slate-100 flex">
                <div
                    class="h-full bg-emerald-500"
                    :style="{ width: pct(scrutin.synthese.pour, scrutin.synthese.votants) + '%' }"
                />
                <div
                    class="h-full bg-red-500"
                    :style="{ width: pct(scrutin.synthese.contre, scrutin.synthese.votants) + '%' }"
                />
                <div
                    class="h-full bg-slate-300"
                    :style="{ width: pct(scrutin.synthese.abstentions, scrutin.synthese.votants) + '%' }"
                />
            </div>
        </template>
    </component>
</template>

<script setup>
import { computed } from 'vue';
import ScrutinCategorie from '@components/scrutins/ScrutinCategorie.vue';

const props = defineProps({
    scrutin: { type: Object, required: true },
    // Position du député (pour/contre/abstention) — si absent, affiche le sort global
    position: { type: String, default: null },
    showStats: { type: Boolean, default: true },
    compact: { type: Boolean, default: false },
    href: { type: String, default: null },
});

const mois = ['jan.', 'fév.', 'mars', 'avr.', 'mai', 'juin',
    'juil.', 'août', 'sept.', 'oct.', 'nov.', 'déc.'];

const formatDate = dateStr => {
    const [y, m, d] = String(dateStr).slice(0, 10).split('-').map(Number);
    return `${d} ${mois[m - 1]} ${y}`;
};

const pct = (value, total) => total ? Math.round((value / total) * 100) : 0;

const badgeClass = computed(() => {
    if (props.position === 'pour') return 'bg-emerald-100 text-emerald-700';
    if (props.position === 'contre') return 'bg-red-100 text-red-700';
    if (props.position === 'abstention') return 'bg-slate-100 text-slate-600';
    return props.scrutin.sort === 'adopté'
        ? 'bg-emerald-100 text-emerald-700'
        : 'bg-red-100 text-red-700';
});

const badgeLabel = computed(() => {
    if (props.position === 'pour') return 'Pour';
    if (props.position === 'contre') return 'Contre';
    if (props.position === 'abstention') return 'Abst.';
    return props.scrutin.sort === 'adopté' ? 'Adopté' : 'Rejeté';
});
</script>

<style scoped>
a:hover {
    text-decoration: none;
}
</style>
