<template>
    <div>
        <!-- Recap IA (phrase choc) -->
        <div
            v-if="analyse.recap"
            class="flex items-start gap-2 bg-secondary-100 rounded-xl px-4 py-3 mb-5"
        >
            <i class="fa-solid fa-quote-left text-secondary-400 text-xs mt-0.5 flex-shrink-0" />
            <p class="text-sm font-medium text-secondary-700 leading-snug italic">
                {{ analyse.recap }}
            </p>
        </div>

        <!-- Résumé global IA -->
        <p
            v-if="analyse.resume"
            class="text-sm text-primary-600 leading-relaxed mb-5"
        >
            {{ analyse.resume }}
        </p>

        <!-- Ligne par catégorie -->
        <div class="space-y-3">
            <div
                v-for="item in analyse.coherence"
                :key="item.categorie"
                class="rounded-xl border border-slate-100 p-4"
            >
                <!-- En-tête : badge catégorie + nombre de QAGs -->
                <div class="flex items-center justify-between mb-3">
                    <span
                        class="text-xs font-semibold px-2.5 py-1 rounded-full text-white"
                        :style="{ backgroundColor: item.couleur }"
                    >{{ item.categorie }}</span>
                    <span class="text-xs text-primary-400">
                        {{ item.nb_qags }} question{{ item.nb_qags > 1 ? 's' : '' }} au gouvernement
                    </span>
                </div>

                <!-- Compteurs de votes -->
                <div class="grid grid-cols-4 gap-2 mb-3 text-center">
                    <div>
                        <div class="text-xs text-primary-400 mb-0.5">
                            Pour
                        </div>
                        <div class="text-sm font-bold text-emerald-600">
                            {{ item.nb_pour }}
                        </div>
                    </div>
                    <div>
                        <div class="text-xs text-primary-400 mb-0.5">
                            Contre
                        </div>
                        <div class="text-sm font-bold text-red-500">
                            {{ item.nb_contre }}
                        </div>
                    </div>
                    <div>
                        <div class="text-xs text-primary-400 mb-0.5">
                            Abst.
                        </div>
                        <div class="text-sm font-bold text-amber-500">
                            {{ item.nb_abstention }}
                        </div>
                    </div>
                    <div>
                        <div class="text-xs text-primary-400 mb-0.5">
                            Scrutins
                        </div>
                        <div class="text-sm font-bold text-primary-700">
                            {{ item.nb_votes }}
                        </div>
                    </div>
                </div>

                <!-- Insight IA -->
                <p
                    v-if="item.insight"
                    class="text-sm text-primary-600 border-l-2 pl-3 leading-snug"
                    :style="{ borderColor: item.couleur }"
                >
                    {{ item.insight }}
                </p>
            </div>
        </div>
    </div>
</template>

<script setup>
defineProps({
    analyse: { type: Object, required: true },
});
</script>
