<template>
    <section class="bg-white rounded-2xl shadow-sm border border-slate-200 overflow-hidden self-start">
        <button
            class="w-full flex items-center justify-between px-4 sm:px-6 py-4 text-left cursor-pointer"
            @click="isOpen = !isOpen"
        >
            <span class="text-xs font-semibold text-primary-500 uppercase tracking-widest">{{ title }}</span>
            <i
                class="fa-solid fa-chevron-down text-primary-300 text-xs transition-transform duration-200"
                :class="{ 'rotate-180': isOpen }"
            />
        </button>
        <div
            class="grid transition-[grid-template-rows] duration-200 ease-in-out"
            :class="isOpen ? 'grid-rows-[1fr]' : 'grid-rows-[0fr]'"
        >
            <div class="overflow-hidden">
                <div class="border-t border-slate-100 px-4 sm:px-6 py-4 sm:py-6">
                    <slot />
                </div>
            </div>
        </div>
    </section>
</template>

<script setup>
import { ref } from 'vue';

const props = defineProps({
    title: { type: String, required: true },
    defaultOpen: { type: Boolean, default: true },
});

const isOpen = ref(props.defaultOpen);
</script>

