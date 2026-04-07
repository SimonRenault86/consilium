<template>
    <div class="flex flex-col gap-6">
        <RapportHebdoPreview />

        <div class="flex flex-col gap-3">
            <div class="flex flex-col gap-1">
                <p class="text-primary-600 text-sm hidden sm:block">
                    Visualisez les <span class="font-extrabold text-secondary-600">577</span> sièges de l'hémicycle - Survolez un siège pour afficher le député - Cliquez pour accéder à sa fiche.
                </p>
                <p class="text-xs text-primary-500 hidden sm:block">
                    Données issues de <a
                        href="https://data.assemblee-nationale.fr"
                        class="underline text-secondary-500 hover:text-secondary-600"
                        target="_blank"
                        rel="noopener noreferrer"
                    >data.assemblee-nationale.fr</a>.
                </p>
            </div>

            <div class="grid grid-cols-1 lg:grid-cols-[1fr_380px] gap-6 items-start">
                <section class="bg-white rounded-sm shadow-sm border border-primary-200 overflow-hidden">
                    <AssemblyMap :selected-vote="selectedVote" />
                </section>

                <section class="bg-white rounded-sm shadow-sm border border-primary-200 p-4 sm:p-5 flex flex-col h-[26rem] sm:h-[30rem] lg:h-[calc(100vh-8rem)] lg:sticky lg:top-20">
                    <VotePanel @select="onVoteSelect" />
                </section>
            </div>
        </div>
    </div>
</template>

<script setup>
import { ref } from 'vue';
import AssemblyMap from '@/components/AssemblyMap.vue';
import VotePanel from '@/components/VotePanel.vue';
import RapportHebdoPreview from '@/components/rapportHebdo/RapportHebdoPreview.vue';

const selectedVote = ref(null);

const onVoteSelect = vote => {
    selectedVote.value = vote;
};
</script>
