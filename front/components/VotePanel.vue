<template>
    <div class="flex flex-col h-full">
        <div class="flex items-center justify-between mb-3">
            <h2 class="text-xs font-semibold text-slate-400 uppercase tracking-widest">
                Derniers votes
            </h2>
            <button
                v-if="selectedVote"
                class="text-xs text-slate-400 hover:text-slate-700 transition"
                @click="clearVote"
            >
                ✕ Réinitialiser
            </button>
        </div>

        <div class="flex-1 overflow-y-auto space-y-2 pr-1">
            <div
                v-for="vote in votes"
                :key="vote.uid"
                class="rounded-xl border transition-all duration-150 cursor-pointer relative group"
                :class="selectedVote?.uid === vote.uid
                    ? 'border-slate-900 bg-slate-50'
                    : 'border-slate-200 bg-white hover:border-slate-300'"
                @click="toggleVote(vote)"
            >
                <!-- Infobulle titre complet -->
                <div class="pointer-events-none absolute bottom-full left-0 right-0 mb-2 z-50 hidden group-hover:block">
                    <div class="bg-slate-900 text-white text-xs rounded-lg px-3 py-2 shadow-lg leading-snug">
                        {{ vote.titre }}
                    </div>
                </div>
                <div class="px-4 py-3 flex items-start gap-3">
                    <span
                        class="mt-0.5 flex-shrink-0 inline-flex items-center justify-center rounded-full px-2 py-0.5 text-xs font-bold uppercase"
                        :class="vote.sort === 'adopté'
                            ? 'bg-emerald-100 text-emerald-700'
                            : 'bg-red-100 text-red-700'"
                    >
                        {{ vote.sort === 'adopté' ? 'Adopté' : 'Rejeté' }}
                    </span>
                    <div class="min-w-0">
                        <p class="text-sm font-medium text-slate-800 leading-snug line-clamp-2">
                            {{ vote.titre }}
                        </p>
                        <p class="text-xs text-slate-400 mt-1">
                            Scrutin n°{{ vote.numero }} · {{ formatDate(vote.dateScrutin) }}
                        </p>
                    </div>
                </div>

                <div
                    v-if="selectedVote?.uid === vote.uid"
                    class="border-t border-slate-100 px-4 py-3"
                >
                    <p
                        v-if="vote.demandeur"
                        class="text-xs text-slate-500 mb-3"
                    >
                        Demandé par : {{ vote.demandeur }}
                    </p>

                    <div class="flex items-center gap-4 text-sm">
                        <div class="flex items-center gap-1.5">
                            <span class="inline-block w-2.5 h-2.5 rounded-full bg-emerald-500" />
                            <span class="font-semibold text-slate-800">{{ vote.synthese.pour }}</span>
                            <span class="text-slate-400">pour</span>
                        </div>
                        <div class="flex items-center gap-1.5">
                            <span class="inline-block w-2.5 h-2.5 rounded-full bg-red-500" />
                            <span class="font-semibold text-slate-800">{{ vote.synthese.contre }}</span>
                            <span class="text-slate-400">contre</span>
                        </div>
                        <div class="flex items-center gap-1.5">
                            <span class="inline-block w-2.5 h-2.5 rounded-full bg-slate-300" />
                            <span class="font-semibold text-slate-800">{{ vote.synthese.abstentions }}</span>
                            <span class="text-slate-400">abst.</span>
                        </div>
                    </div>

                    <div class="mt-3 h-2 rounded-full overflow-hidden bg-slate-100 flex">
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
                </div>
            </div>
        </div>
    </div>
</template>

<script setup>
import { ref, watch } from 'vue';
import allVotes from '@/helpers/votes.js';

const emit = defineEmits(['select']);

const votes = allVotes;
const selectedVote = ref(null);

const mois = ['jan.', 'fév.', 'mars', 'avr.', 'mai', 'juin',
    'juil.', 'août', 'sept.', 'oct.', 'nov.', 'déc.'];

const formatDate = dateStr => {
    const [y, m, d] = dateStr.split('-').map(Number);
    return `${d} ${mois[m - 1]} ${y}`;
};

const pct = (value, total) => total ? Math.round((value / total) * 100) : 0;

const toggleVote = vote => {
    if (selectedVote.value?.uid === vote.uid) {
        selectedVote.value = null;
    } else {
        selectedVote.value = vote;
    }
};

const clearVote = () => {
    selectedVote.value = null;
};

watch(selectedVote, vote => {
    emit('select', vote);
});
</script>
