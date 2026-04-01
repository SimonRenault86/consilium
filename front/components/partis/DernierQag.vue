<template>
    <section class="bg-white rounded-2xl shadow-sm border border-slate-200 p-5">
        <h2 class="text-xs font-semibold text-primary-500 uppercase tracking-widest mb-4">
            Dernières questions au gouvernement
        </h2>

        <LoadingState
            v-if="loading"
            class="py-8"
        />
        <EmptyState
            v-else-if="!qags.length"
            message="Aucune question disponible"
            class="py-8"
        />
        <div
            v-else
            class="space-y-1 -mx-5"
        >
            <div
                v-for="qag in qags"
                :key="qag.uid"
                class="border-b border-slate-100 last:border-b-0"
            >
                <QagItem :qag="qag" />
            </div>

            <div class="px-5 pt-3">
                <a
                    href="/qags"
                    class="block text-center text-xs text-secondary-600 hover:text-secondary-700 font-medium"
                >
                    Voir toutes les sessions QaG →
                </a>
            </div>
        </div>
    </section>
</template>

<script setup>
import { ref, onMounted } from 'vue';
import LoadingState from '@components/LoadingState.vue';
import EmptyState from '@components/EmptyState.vue';
import QagItem from '@components/qags/QagItem.vue';

const props = defineProps({
    abrev: { type: String, default: null },
    deputeId: { type: String, default: null },
});

const qags = ref([]);
const loading = ref(false);

onMounted(async () => {
    loading.value = true;
    try {
        const url = props.deputeId
            ? `/api/qags/depute/${encodeURIComponent(props.deputeId)}?limit=5`
            : `/api/qags/groupe/${encodeURIComponent(props.abrev)}?limit=5`;
        const res = await fetch(url);
        if (res.ok) qags.value = await res.json();
    } finally {
        loading.value = false;
    }
});
</script>
