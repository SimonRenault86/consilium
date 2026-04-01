<template>
    <div>
        <LoadingState
            v-if="loading"
            class="py-16"
        />
        <ErrorState
            v-else-if="error"
            class="py-16"
        />
        <EmptyState
            v-else-if="!sessions.length"
            class="py-16"
            message="Aucune session disponible"
        />

        <div
            v-else
            class="space-y-2"
        >
            <a
                v-for="session in sessions"
                :key="session.dateSeance"
                :href="`/qag/${session.dateSeance}`"
                class="flex items-center justify-between rounded-2xl border border-slate-200 bg-white px-5 py-4 hover:border-slate-300 hover:shadow-sm transition-all"
            >
                <div class="flex items-center gap-3">
                    <div class="flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-secondary-100 text-secondary-600">
                        <i class="fa-solid fa-comments text-sm" />
                    </div>
                    <div>
                        <p class="text-sm font-bold text-primary-900">
                            {{ formatDate(session.dateSeance, true) }}
                        </p>
                        <p class="text-xs text-primary-500 mt-0.5">
                            {{ session.nbQuestions }} question{{ session.nbQuestions > 1 ? 's' : '' }}
                        </p>
                    </div>
                </div>
                <i class="fa-solid fa-chevron-right text-primary-300 text-xs" />
            </a>
        </div>
    </div>
</template>

<script setup>
import { ref, onMounted } from 'vue';
import { fetchSessions, formatDate } from '@/helpers/qags.js';
import LoadingState from '@components/LoadingState.vue';
import ErrorState from '@components/ErrorState.vue';
import EmptyState from '@components/EmptyState.vue';

const sessions = ref([]);
const loading = ref(false);
const error = ref(false);

onMounted(async () => {
    loading.value = true;
    try {
        sessions.value = await fetchSessions();
    } catch {
        error.value = true;
    } finally {
        loading.value = false;
    }
});
</script>
