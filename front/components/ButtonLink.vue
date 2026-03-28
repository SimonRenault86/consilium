<template>
    <a
        :href="href"
        class="inline-flex items-center gap-1.5 text-xs font-medium text-slate-600 hover:text-slate-900 border border-slate-200 hover:border-slate-400 rounded-lg px-3 py-1.5 transition-colors bg-white"
        v-bind="$attrs"
    >
        <slot />
    </a>
</template>

<script setup>
defineProps({
    href: { type: String, required: true },
});
</script>

<style scoped>
a:hover {
    text-decoration: none;
}
</style>
