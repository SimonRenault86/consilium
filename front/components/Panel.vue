<template>
    <!-- Fullscreen overlay -->
    <Teleport to="body">
        <div
            v-if="isFullscreen"
            class="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4 sm:p-8"
            @click.self="isFullscreen = false"
        >
            <div class="flex max-h-[90vh] w-full max-w-5xl flex-col overflow-hidden rounded-sm border border-slate-200 bg-white shadow-xl">
                <div class="flex shrink-0 items-center justify-between border-b border-slate-100 px-4 py-3">
                    <span class="text-xs font-semibold uppercase tracking-widest text-primary-500">{{ title }}</span>
                    <button
                        class="cursor-pointer text-primary-300 transition-colors hover:text-primary-700"
                        title="Fermer"
                        @click="isFullscreen = false"
                    >
                        <i class="fa-solid fa-xmark" />
                    </button>
                </div>
                <div class="overflow-y-auto px-4 py-4 sm:px-6 sm:py-6">
                    <slot />
                </div>
            </div>
        </div>
    </Teleport>

    <div class="self-start">
        <!-- Panel principal -->
        <section
            class="bg-white shadow-xs"
            :class="fullscreen || embedUrl ? 'rounded-t-sm' : 'rounded-sm'"
        >
            <div
                class="w-full flex items-center justify-between px-4 py-3 cursor-pointer select-none"
                @click="isOpen = !isOpen"
            >
                <div class="flex items-center gap-2">
                    <span class="text-xs font-semibold text-primary-500 uppercase tracking-widest">{{ title }}</span>
                    <TooltipInfo v-if="tooltip">
                        {{ tooltip }}
                    </TooltipInfo>
                </div>
                <i
                    class="fa-solid fa-chevron-down text-primary-300 text-xs transition-transform duration-200"
                    :class="{ 'rotate-180': isOpen }"
                />
            </div>

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

            <!-- Embed code -->
            <div
                v-if="embedUrl && showEmbed"
                class="border-t border-slate-100 bg-white px-4 py-3"
            >
                <p class="mb-2 text-xs font-semibold uppercase tracking-wide text-primary-500">
                    Code d'intégration (iframe)
                </p>
                <div class="flex items-center gap-2">
                    <code class="flex-1 truncate rounded border border-slate-200 bg-white px-3 py-2 font-mono text-xs text-primary-700">{{ iframeCode }}</code>
                    <button
                        class="cursor-pointer shrink-0 rounded px-3 py-2 text-xs font-semibold text-white transition-colors"
                        :class="copied ? 'bg-emerald-500' : 'bg-secondary-500 hover:bg-secondary-600'"
                        @click="copyEmbed"
                    >
                        {{ copied ? 'Copié !' : 'Copier' }}
                    </button>
                </div>
            </div>
        </section>

        <!-- Boutons extérieurs collés, coins arrondis seulement en bas -->
        <div
            v-if="fullscreen || embedUrl"
            class="flex items-center gap-1"
        >
            <button
                v-if="fullscreen"
                class="cursor-pointer flex items-center gap-1.5 rounded-b-lg rounded-t-none px-2.5 py-1 text-xs font-medium text-primary-400 transition-colors bg-white hover:bg-slate-100 hover:text-primary-700 rounded-lg"
                @click="isFullscreen = true"
            >
                <i class="fa-solid fa-expand text-[10px]" />
                Plein écran
            </button>
            <button
                v-if="embedUrl"
                class="cursor-pointer flex items-center gap-1.5 rounded-b-lg rounded-t-none px-2.5 py-1 text-xs font-medium text-primary-400 transition-colors bg-white hover:bg-slate-100 hover:text-primary-700 rounded-lg"
                @click="showEmbed = !showEmbed"
            >
                <i class="fa-solid fa-code text-[10px]" />
                Intégrer
            </button>
        </div>
    </div>
</template>

<script setup>
import { ref, computed } from 'vue';
import TooltipInfo from '@components/TooltipInfo.vue';

const props = defineProps({
    title: { type: String, required: true },
    defaultOpen: { type: Boolean, default: true },
    tooltip: { type: String, default: null },
    fullscreen: { type: Boolean, default: null },
    embedUrl: { type: String, default: null },
});

const isOpen = ref(props.defaultOpen);
const isFullscreen = ref(false);
const showEmbed = ref(false);
const copied = ref(false);

const iframeCode = computed(() =>
    props.embedUrl
        ? `<iframe src="${props.embedUrl}" width="100%" height="600" frameborder="0" loading="lazy"></iframe>`
        : ''
);

const copyEmbed = async () => {
    await navigator.clipboard.writeText(iframeCode.value);
    copied.value = true;
    setTimeout(() => { copied.value = false; }, 2000);
};
</script>

