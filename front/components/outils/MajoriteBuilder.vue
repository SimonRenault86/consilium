<template>
    <div class="flex flex-col gap-6">
        <!-- Compteur majorité -->
        <div
            class="rounded-2xl border p-5 transition-colors duration-300"
            :class="atteint ? 'border-emerald-300 bg-emerald-50' : 'border-slate-200 bg-white'"
        >
            <div class="flex flex-wrap items-center justify-between gap-4">
                <div class="flex items-baseline gap-3">
                    <span
                        class="text-5xl font-bold tabular-nums transition-colors duration-300"
                        :class="atteint ? 'text-emerald-600' : 'text-primary-900'"
                    >{{ totalSelectionne }}</span>
                    <span class="text-xl text-primary-500">/ 577</span>
                </div>
                <div
                    v-if="atteint"
                    class="flex items-center gap-2 rounded-full bg-emerald-500 px-4 py-1.5 text-sm font-semibold text-white"
                >
                    <svg
                        class="h-4 w-4"
                        fill="none"
                        stroke="currentColor"
                        viewBox="0 0 24 24"
                    >
                        <path
                            stroke-linecap="round"
                            stroke-linejoin="round"
                            stroke-width="2"
                            d="M5 13l4 4L19 7"
                        />
                    </svg>
                    Majorité absolue atteinte
                </div>
                <div
                    v-else
                    class="rounded-full bg-primary-100 px-4 py-1.5 text-sm font-semibold text-primary-500"
                >
                    {{ SEUIL_MAJORITE - totalSelectionne }} siège{{ SEUIL_MAJORITE - totalSelectionne > 1 ? 's' : '' }} manquant{{ SEUIL_MAJORITE - totalSelectionne > 1 ? 's' : '' }}
                </div>
            </div>
            <!-- Barre de progression -->
            <div class="relative mt-4 pb-5">
                <div class="h-3 w-full overflow-hidden rounded-full bg-primary-100">
                    <div
                        class="h-full rounded-full transition-all duration-300"
                        :class="atteint ? 'bg-emerald-500' : 'bg-red-500'"
                        :style="{ width: `${(totalSelectionne / 577) * 100}%` }"
                    />
                </div>
                <!-- Marqueur majorité : barre + label en position absolue -->
                <div
                    class="absolute top-0 flex -translate-x-1/2 flex-col items-center"
                    :style="{ left: `${(SEUIL_MAJORITE / 577) * 100}%` }"
                >
                    <div
                        class="h-3 w-0.5 transition-colors duration-300"
                        :class="atteint ? 'bg-emerald-700' : 'bg-slate-400'"
                    />
                    <span
                        class="mt-1 text-xs font-semibold transition-colors duration-300"
                        :class="atteint ? 'text-emerald-600' : 'text-primary-500'"
                    >{{ SEUIL_MAJORITE }}</span>
                </div>
                <!-- Labels extrémités -->
                <span class="absolute bottom-0 left-0 text-xs text-primary-500">0</span>
                <span class="absolute bottom-0 right-0 text-xs text-primary-500">577</span>
            </div>
        </div>

        <!-- Hémicycle + sélecteur de groupes -->
        <div class="flex flex-col items-start gap-6 xl:flex-row">
            <!-- SVG hémicycle -->
            <div class="w-full min-w-0 flex-1 rounded-2xl border border-slate-200 bg-white px-4 py-6">
                <svg
                    :viewBox="`0 0 ${VIEWBOX_WIDTH} ${VIEWBOX_HEIGHT}`"
                    class="h-auto w-full"
                >
                    <circle
                        v-for="seat in seats"
                        :key="seat.seatId"
                        :cx="seat.x"
                        :cy="seat.y"
                        :r="SEAT_RADIUS"
                        :fill="getCouleurSeat(seat.seatId)"
                        class="transition-[fill] duration-150"
                    />
                </svg>
            </div>

            <!-- Liste des groupes -->
            <div class="flex w-full flex-col gap-2 xl:w-72">
                <div class="mb-1 flex items-center justify-between">
                    <h2 class="text-sm font-semibold text-primary-700">
                        Groupes politiques
                    </h2>
                    <div class="flex gap-2 text-xs">
                        <button
                            class="text-blue-600 hover:underline"
                            @click="toutSelectionner"
                        >
                            Tout
                        </button>
                        <span class="text-primary-300">·</span>
                        <button
                            class="text-blue-600 hover:underline"
                            @click="toutDeselectionner"
                        >
                            Aucun
                        </button>
                    </div>
                </div>
                <button
                    v-for="groupe in groupesStats"
                    :key="groupe.abrev"
                    class="flex cursor-pointer items-center gap-3 rounded-xl border px-3 py-2.5 text-left transition-all duration-150"
                    :class="selectedGroupes.has(groupe.abrev) ? '' : 'opacity-40 grayscale'"
                    :style="selectedGroupes.has(groupe.abrev) ? { borderColor: groupe.couleur + '60', backgroundColor: groupe.couleur + '12' } : {}"
                    @click="toggleGroupe(groupe.abrev)"
                >
                    <img
                        v-if="groupe.logo"
                        :src="groupe.logo"
                        :alt="groupe.abrev"
                        class="h-5 w-10 shrink-0 object-contain"
                    >
                    <span
                        v-else
                        class="w-10 shrink-0 text-center text-xs font-bold"
                        :style="{ color: groupe.couleur }"
                    >{{ groupe.abrev }}</span>
                    <span class="line-clamp-1 flex-1 text-xs font-medium leading-tight text-primary-700">{{ groupe.nom }}</span>
                    <span
                        class="shrink-0 text-sm font-bold tabular-nums"
                        :style="{ color: groupe.couleur }"
                    >{{ groupe.nombreDeputes }}</span>
                </button>
            </div>
        </div>
    </div>
</template>

<script setup>
import { ref, computed, onMounted } from 'vue';
import seats, { VIEWBOX_WIDTH, VIEWBOX_HEIGHT, SEAT_RADIUS } from '@/helpers/hemicycle.js';
import { getDepute, statsParGroupe, initDeputes } from '@/helpers/deputes.js';
import { groupes, initPartis } from '@/helpers/partis.js';

const SEUIL_MAJORITE = 289;

const selectedGroupes = ref(new Set());

const groupesStats = computed(() => statsParGroupe.value);

const totalSelectionne = computed(() =>
    groupesStats.value
        .filter(g => selectedGroupes.value.has(g.abrev))
        .reduce((acc, g) => acc + g.nombreDeputes, 0)
);

const atteint = computed(() => totalSelectionne.value >= SEUIL_MAJORITE);

const getCouleurSeat = seatId => {
    const depute = getDepute(seatId);
    if (!depute) return '#e2e8f0';
    if (!selectedGroupes.value.has(depute.groupe)) return '#e2e8f0';
    return groupes[depute.groupe]?.couleur || '#9ca3af';
};

const toggleGroupe = abrev => {
    const next = new Set(selectedGroupes.value);
    if (next.has(abrev)) {
        next.delete(abrev);
    } else {
        next.add(abrev);
    }
    selectedGroupes.value = next;
};

const toutSelectionner = () => {
    selectedGroupes.value = new Set(Object.keys(groupes));
};

const toutDeselectionner = () => {
    selectedGroupes.value = new Set();
};

onMounted(async () => {
    await Promise.all([initPartis(), initDeputes()]);
});
</script>
