<template>
    <section class="bg-white rounded-2xl shadow-sm border border-slate-200 p-5 sm:p-8 mb-6">
        <div
            v-if="loading"
            class="h-16 animate-pulse bg-slate-100 rounded-xl"
        />
        <div
            v-else-if="depute"
            class="flex flex-col sm:flex-row items-center sm:items-start gap-4 sm:gap-6 text-center sm:text-left"
        >
            <!-- Photo -->
            <div class="flex-shrink-0 relative w-20 h-20 sm:w-24 sm:h-24">
                <img
                    :src="`/elus/${depute.id}.jpg`"
                    :alt="`Photo de ${depute.prenom} ${depute.nom}`"
                    class="w-20 h-20 sm:w-24 sm:h-24 rounded-full object-cover border border-slate-100"
                    @error="showInitiales = true"
                >
                <div
                    v-if="showInitiales"
                    class="w-20 h-20 sm:w-24 sm:h-24 rounded-full bg-slate-200 text-slate-600 text-2xl font-bold absolute inset-0 flex items-center justify-center"
                >
                    {{ depute.prenom[0] }}{{ depute.nom[0] }}
                </div>
            </div>

            <!-- Infos -->
            <div class="flex-1 min-w-0">
                <h1 class="text-2xl sm:text-3xl font-bold text-slate-900">
                    {{ depute.civ }} {{ depute.prenom }} {{ depute.nom }}
                </h1>

                <!-- Groupe -->
                <div
                    v-if="depute.groupe"
                    class="flex items-center justify-center sm:justify-start gap-2 mt-2"
                >
                    <img
                        v-if="depute.groupeLogo"
                        :src="depute.groupeLogo"
                        :alt="depute.groupe"
                        class="h-5 object-contain"
                    >
                    <span
                        v-else
                        class="text-xs font-bold px-1.5 py-0.5 rounded"
                        :style="depute.groupeCouleur
                            ? { backgroundColor: depute.groupeCouleur + '22', color: depute.groupeCouleur }
                            : {}"
                    >{{ depute.groupeAbrev }}</span>
                    <span class="text-slate-600 text-sm">{{ depute.groupe }}</span>
                </div>

                <!-- Méta secondaire -->
                <div class="flex flex-wrap items-center justify-center sm:justify-start gap-x-3 gap-y-1 mt-2 text-xs text-slate-500">
                    <span v-if="depute.departementNom">
                        <i class="fa-solid fa-location-dot mr-1" />{{ depute.departementNom }}{{ depute.departementCode ? ` (${depute.departementCode})` : '' }}
                    </span>
                    <span v-if="depute.job">
                        <i class="fa-solid fa-briefcase mr-1" />{{ depute.job }}
                    </span>
                    <span v-if="depute.nombreMandats">
                        <i class="fa-solid fa-star mr-1" />{{ depute.nombreMandats }} mandat{{ depute.nombreMandats > 1 ? 's' : '' }}
                    </span>
                </div>
            </div>
        </div>
    </section>
</template>

<script setup>
import { ref, onMounted } from 'vue';

const props = defineProps({
    deputeId: { type: String, required: true },
});

const depute = ref(null);
const loading = ref(true);
const showInitiales = ref(false);

onMounted(async () => {
    try {
        const res = await fetch(`/api/deputes/${props.deputeId}`);
        if (res.ok) depute.value = await res.json();
    } finally {
        loading.value = false;
    }
});
</script>
