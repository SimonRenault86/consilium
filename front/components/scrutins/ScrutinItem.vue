<template>
    <div
        class="rounded-xl border transition-all duration-150 cursor-pointer relative group"
        :class="selected
            ? 'border-slate-900 bg-slate-50'
            : 'border-slate-200 bg-white hover:border-slate-300'"
        @click="$emit('toggle', vote)"
    >
        <!-- Infobulle titre complet -->
        <div class="pointer-events-none absolute top-full left-0 right-0 mt-1 z-50 hidden group-hover:block">
            <div class="bg-slate-900 text-white text-xs rounded-lg px-3 py-2 shadow-lg leading-snug">
                {{ vote.titre }}
            </div>
        </div>

        <div class="px-4 py-3 flex items-start gap-3">
            <div class="flex flex-col gap-1">
                <div class="flex gap-1 items-center">
                    <span
                        class="flex-shrink-0 inline-flex items-center justify-center rounded-full px-2 py-0.5 text-xs font-bold uppercase"
                        :class="vote.sort === 'adopté'
                            ? 'bg-emerald-100 text-emerald-700'
                            : 'bg-red-100 text-red-700'"
                    >
                        {{ vote.sort === 'adopté' ? 'Adopté' : 'Rejeté' }}
                    </span>
                    <ScrutinCategorie
                        :categorie="vote.categorie"
                        :sous-categorie="vote.sousCategorie"
                    />
                </div>

                <p class="text-sm font-medium text-primary-700 leading-snug line-clamp-2">
                    {{ vote.titre }}
                </p>
                <p class="text-xs text-primary-500 mt-1">
                    Scrutin n°{{ vote.numero }} · {{ formatDate(vote.dateScrutin) }}
                </p>
            </div>
        </div>

        <div
            v-if="selected"
            class="border-t border-slate-100 px-4 py-3"
        >
            <p
                v-if="vote.demandeur"
                class="text-xs text-primary-500 mb-3"
            >
                Demandé par : {{ vote.demandeur }}
            </p>

            <div class="flex items-center gap-4 text-sm">
                <div class="flex items-center gap-1.5">
                    <span class="inline-block w-2.5 h-2.5 rounded-full bg-emerald-500" />
                    <span class="font-semibold text-primary-700">{{ vote.synthese.pour }}</span>
                    <span class="text-primary-500">pour</span>
                </div>
                <div class="flex items-center gap-1.5">
                    <span class="inline-block w-2.5 h-2.5 rounded-full bg-red-500" />
                    <span class="font-semibold text-primary-700">{{ vote.synthese.contre }}</span>
                    <span class="text-primary-500">contre</span>
                </div>
                <div class="flex items-center gap-1.5">
                    <span class="inline-block w-2.5 h-2.5 rounded-full bg-slate-300" />
                    <span class="font-semibold text-primary-700">{{ vote.synthese.abstentions }}</span>
                    <span class="text-primary-500">abst.</span>
                </div>
            </div>

            <div class="mt-3 h-2 rounded-full overflow-hidden bg-primary-100 flex">
                <div
                    class="h-full bg-emerald-500"
                    :style="{ width: pct(vote.synthese.pour, vote.synthese.votants) + '%' }"
                />
                <div
                    class="h-full bg-red-500"
                    :style="{ width: pct(vote.synthese.contre, vote.synthese.votants) + '%' }"
                />
                <div
                    class="h-full bg-slate-300"
                    :style="{ width: pct(vote.synthese.abstentions, vote.synthese.votants) + '%' }"
                />
            </div>
            <div class="mt-3">
                <ButtonLink
                    :href="`/scrutin/${vote.uid}`"
                    @click.stop
                >
                    Voir le scrutin <i class="fa-solid fa-arrow-right" />
                </ButtonLink>
            </div>
        </div>
    </div>
</template>

<script setup>
import ScrutinCategorie from '@components/scrutins/ScrutinCategorie.vue';
import ButtonLink from '@components/ButtonLink.vue';

const props = defineProps({
    vote: { type: Object, required: true },
    selected: { type: Boolean, default: false },
});

defineEmits(['toggle']);

const mois = ['jan.', 'fév.', 'mars', 'avr.', 'mai', 'juin',
    'juil.', 'août', 'sept.', 'oct.', 'nov.', 'déc.'];

const formatDate = dateStr => {
    if (!dateStr) return '';
    const [y, m, d] = dateStr.split('-').map(Number);
    return `${d} ${mois[m - 1]} ${y}`;
};

const pct = (value, total) => total ? Math.round((value / total) * 100) : 0;
</script>
