<template>
    <div class="grid grid-cols-1 lg:grid-cols-[1fr_380px] gap-6 items-start">
        <section class="bg-white rounded-2xl shadow-sm border border-slate-200 overflow-hidden">
            <AssemblyMap :selected-vote="selectedVote" />
        </section>

        <section
            class="bg-white rounded-2xl shadow-sm border border-slate-200 p-5 flex flex-col"
            style="height: calc(100vh - 8rem); position: sticky; top: 5rem;"
        >
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
