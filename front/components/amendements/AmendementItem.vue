<template>
    <div
        class="rounded-xl border transition-all duration-150 cursor-pointer relative group"
        :class="selected
            ? 'border-slate-900 bg-slate-50'
            : 'border-slate-200 bg-white hover:border-slate-300'"
        @click="$emit('toggle', amdt)"
    >
        <!-- Infobulle titre complet -->
        <div class="pointer-events-none absolute top-full left-0 right-0 mt-1 z-50 hidden group-hover:block">
            <div class="bg-slate-900 text-white text-xs rounded-lg px-3 py-2 shadow-lg leading-snug">
                {{ amdt.dispositif || amdt.articleTitre || amdt.numeroLong }}
            </div>
        </div>
        <div class="px-4 py-3 flex items-start gap-3">
            <div class="flex flex-col gap-1 min-w-0">
                <div class="flex items-center gap-1 flex-wrap">
                    <span
                        class="flex-shrink-0 inline-flex items-center justify-center rounded-full px-2 py-0.5 text-xs font-bold uppercase whitespace-nowrap"
                        :class="sortClass"
                    >
                        {{ amdt.sort || amdt.etat || '—' }}
                    </span>
                    <p
                        v-if="amdt.articleTitre"
                        class="text-xs font-medium text-indigo-600"
                    >
                        {{ amdt.articleTitre }}
                    </p>
                    <span
                        v-if="amdt.categorie"
                        class="inline-flex items-center rounded-full px-2 py-0.5 text-xs font-medium"
                        :style="{ backgroundColor: amdt.categorie.couleur + '22', color: amdt.categorie.couleur }"
                    >
                        {{ amdt.categorie.nom }}<span
                            v-if="amdt.sousCategorie"
                            class="ml-1 opacity-70"
                        >· {{ amdt.sousCategorie.nom }}</span>
                    </span>
                </div>
                <p class="text-sm font-medium text-primary-700 leading-snug line-clamp-2">
                    {{ amdt.dispositif || 'Amendement ' + amdt.numeroLong }}
                </p>
                <p class="text-xs text-primary-500 mt-1">
                    {{ amdt.numeroLong }}
                    <template v-if="amdt.auteur">
                        · {{ amdt.auteur.nom }}
                    </template>
                    <template v-if="amdt.dateDepot">
                        · {{ formatDate(amdt.dateDepot) }}
                    </template>
                </p>
            </div>
        </div>

        <div
            v-if="selected"
            class="border-t border-slate-100 px-4 py-3"
        >
            <p
                v-if="amdt.auteur"
                class="text-xs text-primary-500 mb-2"
            >
                Auteur : {{ amdt.auteur.nom }}
                <span
                    v-if="amdt.auteur.groupe"
                    class="text-primary-500"
                >({{ amdt.auteur.groupe }})</span>
            </p>
            <p
                v-if="amdt.exposeSommaire"
                class="text-xs text-primary-600 leading-relaxed line-clamp-4 mb-2"
            >
                {{ amdt.exposeSommaire }}
            </p>
            <p
                v-if="amdt.etat || amdt.sousEtat"
                class="text-xs text-primary-500"
            >
                État : {{ amdt.etat }}
                <template v-if="amdt.sousEtat">
                    — {{ amdt.sousEtat }}
                </template>
            </p>
        </div>
    </div>
</template>

<script setup>
import { computed } from 'vue';

const props = defineProps({
    amdt: { type: Object, required: true },
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

const sortClass = computed(() => {
    const s = (props.amdt.sort || '').toLowerCase();
    if (s === 'adopté') return 'bg-emerald-100 text-emerald-700';
    if (s === 'rejeté') return 'bg-red-100 text-red-700';
    if (s === 'retiré') return 'bg-amber-100 text-amber-700';
    return 'bg-primary-100 text-primary-600';
});
</script>
