<template>
    <div class="grid grid-cols-1 lg:grid-cols-[1fr_380px] gap-6 items-start">
        <section class="bg-white rounded-2xl shadow-sm border border-primary-200 overflow-hidden">
            <AssemblyMap :selected-vote="selectedVote" />
        </section>

        <section class="bg-white rounded-2xl shadow-sm border border-primary-200 p-4 sm:p-5 flex flex-col h-[26rem] sm:h-[30rem] lg:h-[calc(100vh-8rem)] lg:sticky lg:top-20">
            <VotePanel @select="onVoteSelect" />
        </section>
    </div>
</template>

<script setup>
import { ref } from 'vue';
import AssemblyMap from '@/components/AssemblyMap.vue';
import VotePanel from '@/components/VotePanel.vue';

const selectedVote = ref(null);

const onVoteSelect = vote => {
    selectedVote.value = vote;
};
</script>
