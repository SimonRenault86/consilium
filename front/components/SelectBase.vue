<template>
    <div
        ref="containerRef"
        class="relative"
    >
        <button
            type="button"
            class="flex items-center justify-between gap-2 border bg-white font-medium transition hover:shadow-sm cursor-pointer select-none"
            :class="[
                sizeClass.button,
                buttonClass,
                modelValue.length
                    ? 'border-slate-400 text-slate-800'
                    : 'border-slate-200 text-slate-600 hover:border-slate-300'
            ]"
            @click="open = !open"
        >
            <span class="text-left truncate">{{ buttonLabel }}</span>
            <span class="flex items-center gap-1 shrink-0">
                <span
                    v-if="modelValue.length"
                    class="inline-flex items-center justify-center rounded-full bg-slate-800 text-white font-semibold"
                    :class="sizeClass.badge"
                >{{ modelValue.length }}</span>
                <span
                    v-if="modelValue.length"
                    class="text-slate-400 hover:text-slate-700 transition-colors leading-none"
                    role="button"
                    aria-label="Effacer"
                    @click.stop="$emit('update:modelValue', [])"
                >
                    <i class="fa-solid fa-xmark" />
                </span>
                <svg
                    class="text-slate-400 transition-transform duration-150"
                    :class="[sizeClass.icon, open ? 'rotate-180' : '']"
                    fill="none"
                    stroke="currentColor"
                    stroke-width="2"
                    viewBox="0 0 24 24"
                >
                    <path d="m6 9 6 6 6-6" />
                </svg>
            </span>
        </button>

        <Transition name="dropdown">
            <div
                v-if="open"
                class="absolute left-0 top-full mt-1.5 z-50 w-64 bg-white border border-slate-200 rounded-xl shadow-lg overflow-hidden"
            >
                <div class="max-h-72 overflow-y-auto py-1">
                    <label
                        v-for="opt in options"
                        :key="opt.value"
                        class="flex items-center gap-2.5 px-3 py-2 hover:bg-slate-50 cursor-pointer select-none"
                    >
                        <input
                            type="checkbox"
                            :checked="modelValue.includes(opt.value)"
                            class="rounded accent-slate-700 cursor-pointer shrink-0"
                            @change="toggle(opt.value)"
                        >
                        <img
                            v-if="opt.logo"
                            :src="opt.logo"
                            :alt="opt.label"
                            class="h-4 w-auto object-contain shrink-0"
                        >
                        <span
                            v-else-if="opt.color"
                            class="inline-block w-2.5 h-2.5 rounded-full shrink-0"
                            :style="{ background: opt.color }"
                        />
                        <span class="text-sm text-slate-700 truncate">{{ opt.label }}</span>
                    </label>

                    <div
                        v-if="!options.length"
                        class="px-3 py-4 text-xs text-slate-400 text-center"
                    >
                        Aucune option disponible
                    </div>
                </div>

                <div
                    v-if="modelValue.length"
                    class="border-t border-slate-100 px-3 py-2"
                >
                    <button
                        type="button"
                        class="text-xs text-slate-400 hover:text-slate-700 transition-colors cursor-pointer"
                        @click="$emit('update:modelValue', [])"
                    >
                        Tout effacer
                    </button>
                </div>
            </div>
        </Transition>
    </div>
</template>

<script setup>
import { ref, computed, onMounted, onUnmounted } from 'vue';


const SIZE_CLASSES = {
    sm: { button: 'px-3 py-1 text-xs rounded-sm', badge: 'text-[10px] px-1.5 py-0.5 min-w-[18px]', icon: 'w-3 h-3' },
    md: { button: 'px-4 py-2 text-sm rounded-md', badge: 'text-xs px-1.5 py-0.5 min-w-[20px]', icon: 'w-3.5 h-3.5' },
    lg: { button: 'px-5 py-3 text-base rounded-md', badge: 'text-sm px-2 py-1 min-w-[24px]', icon: 'w-4 h-4' },
};

const props = defineProps({
    modelValue: { type: Array, default: () => [] },
    options: { type: Array, default: () => [] },
    placeholder: { type: String, default: 'Sélectionner…' },
    size: { type: String, default: 'md', validator: v => ['sm', 'md', 'lg'].includes(v) },
    buttonClass: { type: String, default: '' },
});

const sizeClass = computed(() => SIZE_CLASSES[props.size] ?? SIZE_CLASSES.md);

const emit = defineEmits(['update:modelValue']);

const open = ref(false);
const containerRef = ref(null);

const buttonLabel = computed(() => {
    if (!props.modelValue.length) return props.placeholder;
    if (props.modelValue.length === 1) {
        return props.options.find(o => o.value === props.modelValue[0])?.label ?? props.modelValue[0];
    }
    return `${props.modelValue.length} sélectionnés`;
});

const toggle = value => {
    if (props.modelValue.includes(value)) {
        emit('update:modelValue', props.modelValue.filter(v => v !== value));
    } else {
        emit('update:modelValue', [...props.modelValue, value]);
    }
};

const handleOutsideClick = e => {
    if (containerRef.value && !containerRef.value.contains(e.target)) {
        open.value = false;
    }
};

onMounted(() => document.addEventListener('mousedown', handleOutsideClick));
onUnmounted(() => document.removeEventListener('mousedown', handleOutsideClick));
</script>

<style scoped>
.dropdown-enter-active,
.dropdown-leave-active {
    transition: opacity 0.15s ease, transform 0.15s ease;
}
.dropdown-enter-from,
.dropdown-leave-to {
    opacity: 0;
    transform: translateY(-4px);
}
</style>
