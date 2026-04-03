<template>
    <div
        ref="trigger"
        class="relative inline-flex items-center"
        @mouseenter="show"
        @mouseleave="hide"
        @click.stop
    >
        <i
            class="fa-solid fa-circle-info text-secondary-500 hover:text-secondary-600 transition cursor-pointer"
            :class="size === 'sm' ? 'text-xs' : 'text-sm'"
        />
        <Teleport to="body">
            <div
                v-if="visible"
                class="fixed z-[9999] bg-secondary-500 text-white text-xs rounded-xl px-3 py-2.5 shadow-lg leading-relaxed pointer-events-none"
                :class="size === 'sm' ? 'w-56' : 'w-72'"
                :style="tooltipStyle"
            >
                <slot />
                <div class="absolute left-1/2 -translate-x-1/2 top-full w-0 h-0 border-x-4 border-x-transparent border-t-4 border-t-secondary-500" />
            </div>
        </Teleport>
    </div>
</template>

<script setup>
import { ref } from 'vue';

const props = defineProps({
    size: { type: String, default: 'md' },
});

const trigger = ref(null);
const visible = ref(false);
const tooltipStyle = ref({});

const show = () => {
    const rect = trigger.value.getBoundingClientRect();
    tooltipStyle.value = {
        top: `${rect.top - 8}px`,
        left: `${rect.left + rect.width / 2}px`,
        transform: 'translate(-50%, -100%)',
    };
    visible.value = true;
};

const hide = () => { visible.value = false; };
</script>
