<template>
    <div
        v-if="loading || rapport"
        class="rounded-2xl border border-secondary-200 bg-secondary-50 px-5 py-4"
    >
        <!-- Skeleton loader -->
        <template v-if="loading">
            <div class="flex items-start gap-3">
                <div class="mt-0.5 h-7 w-7 shrink-0 rounded-full bg-secondary-200 animate-pulse" />
                <div class="flex-1 space-y-2 pt-0.5">
                    <div class="h-3 w-32 rounded bg-secondary-200 animate-pulse" />
                    <div class="h-3 w-full rounded bg-secondary-200 animate-pulse" />
                    <div class="h-3 w-4/5 rounded bg-secondary-200 animate-pulse" />
                </div>
            </div>
        </template>

        <template v-else-if="rapport">
            <div class="flex items-start gap-3">
                <div class="mt-0.5 flex h-7 w-7 shrink-0 items-center justify-center rounded-full bg-secondary-200 text-secondary-600">
                    <i class="fa-solid fa-wand-magic-sparkles text-[10px]" />
                </div>
                <div class="min-w-0 flex-1">
                    <div class="flex flex-wrap items-baseline gap-x-2 gap-y-0.5 mb-1.5">
                        <span class="text-xs font-bold text-secondary-600 uppercase tracking-wide">
                            Semaine du {{ labelSemaine }}
                        </span>
                    </div>
                    <p class="text-sm text-primary-700 leading-relaxed line-clamp-3">
                        {{ rapport.narratif }}
                    </p>
                    <a
                        :href="`/semaine/${rapport.semaineDebut}`"
                        class="inline-flex items-center gap-1 mt-2 text-xs font-semibold text-secondary-600 hover:text-secondary-700 transition-colors"
                    >
                        Voir le rapport complet
                        <i class="fa-solid fa-arrow-right text-[10px]" />
                    </a>
                </div>
            </div>
        </template>
    </div>
</template>

<script setup>
import { ref, computed, onMounted } from 'vue';

const loading = ref(true);
const rapport = ref(null);

onMounted(async () => {
    try {
        const res = await fetch('/api/rapport-hebdo/latest');
        if (res.ok) rapport.value = await res.json();
    } catch {
        // silencieux : on n'affiche rien si ça échoue
    } finally {
        loading.value = false;
    }
});

const labelSemaine = computed(() => {
    if (!rapport.value) return '';
    const d = new Date(rapport.value.semaineDebut + 'T12:00:00');
    const f = new Date(rapport.value.semaineFin + 'T12:00:00');
    const opts = { day: 'numeric', month: 'long' };
    const optsY = { day: 'numeric', month: 'long', year: 'numeric' };
    return `${d.toLocaleDateString('fr-FR', opts)} – ${f.toLocaleDateString('fr-FR', optsY)}`;
});
</script>
