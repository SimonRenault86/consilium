<template>
    <div
        class="inline-flex items-center gap-1.5 rounded-full px-2.5 py-1 text-xs font-medium transition-colors duration-300 select-none"
        :class="loading || checking
            ? 'bg-blue-50 text-blue-500 border border-blue-200'
            : 'bg-emerald-50 text-emerald-600 border border-emerald-200'"
    >
        <!-- Spinner quand en cours de chargement -->
        <svg
            v-if="loading || checking"
            class="h-3 w-3 animate-spin flex-shrink-0"
            xmlns="http://www.w3.org/2000/svg"
            fill="none"
            viewBox="0 0 24 24"
        >
            <circle
                class="opacity-25"
                cx="12"
                cy="12"
                r="10"
                stroke="currentColor"
                stroke-width="4"
            />
            <path
                class="opacity-75"
                fill="currentColor"
                d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z"
            />
        </svg>

        <!-- Point pulsant quand à jour -->
        <span
            v-else
            class="relative flex h-2 w-2 flex-shrink-0"
        >
            <span class="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-60" />
            <span class="relative inline-flex rounded-full h-2 w-2 bg-emerald-500" />
        </span>

        <span v-if="loading || checking">Mise à jour en cours…</span>
        <span v-else-if="lastUpdate">Mis à jour {{ formattedTime }}</span>
        <span v-else>Mis à jour</span>
    </div>
</template>

<script setup>
import { ref, computed, watch, onMounted, onUnmounted } from 'vue';
import { fetchLastUpdate } from '@/helpers/scrutins.js';
import { formatUpdateTime } from '@/helpers/dayjsUtils.js';

const props = defineProps({
    loading: {
        type: Boolean,
        default: false,
    },
});

const lastUpdate = ref(null);
const checking = ref(false);

const formattedTime = computed(() => formatUpdateTime(lastUpdate.value));

const refresh = async () => {
    checking.value = true;
    try {
        const [result] = await Promise.all([
            fetchLastUpdate(),
            new Promise(resolve => setTimeout(resolve, 1000)),
        ]);
        lastUpdate.value = result;
    } catch {
        // silencieux
    } finally {
        checking.value = false;
    }
};

// Re-fetch quand le chargement se termine (au cas où un seed s'est produit)
watch(() => props.loading, (isLoading, wasLoading) => {
    if (wasLoading && !isLoading) refresh();
});

onMounted(refresh);
</script>
