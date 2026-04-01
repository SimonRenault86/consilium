<template>
    <a
        :href="href"
        class="inline-flex items-center gap-1.5 font-medium transition-colors"
        :class="[variants[type], sizes[size]]"
        v-bind="$attrs"
    >
        <slot />
    </a>
</template>

<script setup>
defineProps({
    href: { type: String, required: true },
    type: { type: String, default: 'primary' },
    size: { type: String, default: 'md' },
});

const variants = {
    primary: 'bg-primary-700 text-white ring-1 ring-inset ring-primary-700 hover:bg-primary-800 hover:ring-primary-800',
    secondary: 'bg-secondary-600 text-white ring-1 ring-inset ring-secondary-600 hover:bg-secondary-700 hover:ring-secondary-700',
};

const sizes = {
    sm: 'px-3 py-1 text-xs rounded-sm',
    md: 'px-4 py-2 text-sm rounded-md',
    lg: 'px-5 py-3 text-base rounded-md',
};
</script>

<style scoped>
a:hover {
    text-decoration: none;
}
</style>
