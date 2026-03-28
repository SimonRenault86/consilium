<template>
    <div>
        <div
            v-if="loading"
            class="flex items-center justify-center py-12 text-slate-400 text-sm"
        >
            Chargement de la carte…
        </div>
        <template v-else-if="vote">
            <section class="bg-white rounded-2xl shadow-sm border border-slate-200 overflow-hidden mb-6">
                <AssemblyMap :selected-vote="vote" />
            </section>
        </template>
    </div>
</template>

<script setup>
import { ref, onMounted } from 'vue';
import AssemblyMap from '@components/AssemblyMap.vue';
import { initDeputes } from '@/helpers/deputes.js';
import { initPartis } from '@/helpers/partis.js';

const props = defineProps({
    scrutinUid: { type: String, required: true },
});

const vote = ref(null);
const loading = ref(true);

onMounted(async () => {
    await Promise.all([initPartis(), initDeputes()]);
    try {
        const res = await fetch(`/api/votes/${props.scrutinUid}`);
        if (res.ok) vote.value = await res.json();
    } catch {
        // carte non affichée en cas d'erreur
    } finally {
        loading.value = false;
    }
});
</script>
