<template>
    <div
        class="rounded-2xl border border-slate-200 bg-white overflow-hidden"
    >
        <!-- En-tête groupe -->
        <button
            class="w-full flex items-center justify-between px-5 py-4 cursor-pointer hover:bg-slate-50 transition-colors"
            @click="isOpen = !isOpen"
        >
            <div class="flex items-center gap-3">
                <span
                    class="inline-block h-3 w-3 rounded-full shrink-0"
                    :style="{ backgroundColor: couleur }"
                />
                <span class="text-sm font-bold text-primary-800">
                    {{ groupe.developpe || groupe.abrev }}
                </span>
                <span class="text-xs text-primary-500">
                    {{ questions.length }} question{{ questions.length > 1 ? 's' : '' }}
                </span>
            </div>
            <i
                class="fa-solid fa-chevron-down text-primary-300 text-xs transition-transform duration-200"
                :class="{ 'rotate-180': isOpen }"
            />
        </button>

        <!-- Liste des questions -->
        <div
            class="grid transition-[grid-template-rows] duration-200 ease-in-out"
            :class="isOpen ? 'grid-rows-[1fr]' : 'grid-rows-[0fr]'"
        >
            <div class="overflow-hidden">
                <div class="divide-y divide-slate-100 border-t border-slate-100">
                    <QagItem
                        v-for="qag in questions"
                        :key="qag.uid"
                        :qag="qag"
                    />
                </div>
            </div>
        </div>
    </div>
</template>

<script setup>
import { ref } from 'vue';
import { groupes } from '@/helpers/partis.js';
import QagItem from '@components/qags/QagItem.vue';

const props = defineProps({
    groupe: { type: Object, required: true },
    questions: { type: Array, required: true },
    defaultOpen: { type: Boolean, default: false },
});

const isOpen = ref(props.defaultOpen);

const couleur = groupes[props.groupe.abrev]?.couleur || '#aaaaaa';
</script>
