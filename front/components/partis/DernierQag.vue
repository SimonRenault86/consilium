<template>
    <Panel title="Dernières questions au gouvernement">
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
            class="-mx-4 sm:-mx-6 -my-4 sm:-my-6"
        >
            <div
                v-for="qag in qags"
                :key="qag.uid"
                class="border-b border-slate-100 last:border-b-0"
            >
                <QagItem :qag="qag" />
            </div>

            <div class="px-4 sm:px-6 py-3">
                <a
                    href="/qags"
                    class="block text-center text-xs text-secondary-600 hover:text-secondary-700 font-medium"
                >
                    Voir toutes les sessions QaG →
                </a>
            </div>
        </div>
    </Panel>
</template>

<script setup>
import { ref, onMounted } from 'vue';
import Panel from '@components/Panel.vue';
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
