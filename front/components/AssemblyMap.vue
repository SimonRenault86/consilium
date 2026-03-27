<template>
    <div class="relative flex items-end justify-center px-4 pt-6">
        <div class="w-full">
            <svg
                ref="svgEl"
                :viewBox="`0 0 ${VIEWBOX_WIDTH} ${VIEWBOX_HEIGHT}`"
                class="w-full h-auto"
                @mouseleave="hoveredSeat = null"
            >
                <a
                    v-for="seat in seats"
                    :key="seat.seatId"
                    :href="getDepute(seat.seatId) ? `/elu/${getDepute(seat.seatId).slug}` : undefined"
                    class="seat-link"
                >
                    <!-- Anneau couleur2 visible au hover -->
                    <circle
                        :cx="seat.x"
                        :cy="seat.y"
                        :r="SEAT_RADIUS + 2.5"
                        :fill="hoveredSeat === seat.seatId ? getCouleur2Siege(seat.seatId) : 'transparent'"
                        :opacity="hoveredSeat && hoveredSeat !== seat.seatId ? 0.3 : 1"
                    />
                    <!-- Cercle principal -->
                    <circle
                        :cx="seat.x"
                        :cy="seat.y"
                        :r="SEAT_RADIUS"
                        :fill="getCouleurSiege(seat.seatId)"
                        stroke="none"
                        class="cursor-pointer transition-opacity duration-150"
                        :opacity="hoveredSeat && hoveredSeat !== seat.seatId ? 0.3 : 1"
                        @mouseenter="onSeatHover(seat, $event)"
                    />
                </a>
            </svg>

            <!-- Tooltip flottant -->
            <Transition name="tooltip">
                <div
                    v-if="hoveredDepute"
                    class="pointer-events-none absolute z-50 w-60 rounded-xl border border-slate-200 bg-white shadow-lg overflow-hidden"
                    :style="tooltipStyle"
                >
                    <!-- Bannière parti -->
                    <div
                        class="flex items-center gap-2 px-3 py-1.5"
                        :style="{ backgroundColor: groupes[hoveredDepute.groupe]?.couleur + '22', borderBottom: `2px solid ${groupes[hoveredDepute.groupe]?.couleur}` }"
                    >
                        <img
                            v-if="logoLoaded[hoveredDepute.groupe]"
                            :src="getLogoUrl(hoveredDepute.groupe)"
                            :alt="groupes[hoveredDepute.groupe]?.nom"
                            class="h-5 max-w-[80px] object-contain"
                        >
                        <span
                            v-else
                            class="text-xs font-bold"
                            :style="{ color: groupes[hoveredDepute.groupe]?.couleur }"
                        >{{ hoveredDepute.groupe }}</span>
                    </div>

                    <!-- Infos député -->
                    <div class="flex items-center gap-3 p-3">
                        <img
                            v-if="photoLoaded[hoveredDepute.slug]"
                            :src="getPhotoUrl(hoveredDepute)"
                            :alt="`${hoveredDepute.prenom} ${hoveredDepute.nom}`"
                            class="size-12 shrink-0 rounded-lg object-cover bg-slate-100"
                        >
                        <div
                            v-else
                            class="flex size-12 shrink-0 items-center justify-center rounded-lg text-sm font-bold text-white"
                            :style="{ backgroundColor: groupes[hoveredDepute.groupe]?.couleur }"
                        >
                            {{ hoveredDepute.prenom[0] }}{{ hoveredDepute.nom[0] }}
                        </div>
                        <div class="flex flex-col justify-center gap-0.5 overflow-hidden">
                            <span class="truncate text-sm font-semibold text-slate-900">
                                {{ hoveredDepute.prenom }} {{ hoveredDepute.nom }}
                            </span>
                            <span class="truncate text-xs text-slate-400">{{ groupes[hoveredDepute.groupe]?.nom }}</span>
                        </div>
                    </div>
                </div>
            </Transition>

            <div
                v-if="!hoveredDepute"
                class="mt-2 text-center text-xs text-slate-400"
            >
                Survolez un siège pour afficher le député
            </div>
        </div>
    </div>
</template>

<script setup>
import { ref, computed, reactive, watch } from 'vue';
import seats, { VIEWBOX_WIDTH, VIEWBOX_HEIGHT, SEAT_RADIUS } from '@/helpers/hemicycle.js';
import { getDepute, getCouleurSiege, getCouleur2Siege, getPhotoUrl } from '@/helpers/deputes.js';
import { groupes, getLogoUrl } from '@/helpers/partis.js';

const svgEl = ref(null);
const hoveredSeat = ref(null);
const tooltipPos = reactive({ x: 0, y: 0 });

// Mémorise quelles photos/logos ont chargé avec succès pour afficher les initiales/sigle en fallback
const photoLoaded = reactive({});
const logoLoaded = reactive({});

const hoveredDepute = computed(() => hoveredSeat.value ? getDepute(hoveredSeat.value) : null);

// Au changement de député survolé, on précharge les images si pas encore testées
watch(hoveredDepute, depute => {
    if (!depute) return;

    if (photoLoaded[depute.slug] === undefined) {
        const url = getPhotoUrl(depute);
        if (!url) { photoLoaded[depute.slug] = false; return; }
        const img = new Image();
        img.onload = () => { photoLoaded[depute.slug] = true; };
        img.onerror = () => { photoLoaded[depute.slug] = false; };
        img.src = url;
    }

    if (logoLoaded[depute.groupe] === undefined) {
        const url = getLogoUrl(depute.groupe);
        if (!url) { logoLoaded[depute.groupe] = false; return; }
        const img = new Image();
        img.onload = () => { logoLoaded[depute.groupe] = true; };
        img.onerror = () => { logoLoaded[depute.groupe] = false; };
        img.src = url;
    }
});

const tooltipStyle = computed(() => ({
    left: `${tooltipPos.x}px`,
    top: `${tooltipPos.y}px`
}));

const onSeatHover = (seat, event) => {
    hoveredSeat.value = seat.seatId;
    if (!svgEl.value) return;

    // Convertit les coords SVG en coords DOM relatives au conteneur parent
    const svgRect = svgEl.value.getBoundingClientRect();
    const scaleX = svgRect.width / VIEWBOX_WIDTH;
    const scaleY = svgRect.height / VIEWBOX_HEIGHT;
    const domX = seat.x * scaleX;
    const domY = seat.y * scaleY;

    // Décalage pour que le tooltip apparaisse au-dessus et centré
    tooltipPos.x = domX - 120; // moitié de w-60 (240px / 2)
    tooltipPos.y = domY - 110;
};
</script>

<style scoped>
.seat-link {
    text-decoration: none;
}

.tooltip-enter-active {
    transition: opacity 0.15s ease, transform 0.15s ease;
}
.tooltip-leave-active {
    transition: opacity 0.1s ease;
}
.tooltip-enter-from {
    opacity: 0;
    transform: translateY(4px);
}
.tooltip-leave-to {
    opacity: 0;
}
</style>
