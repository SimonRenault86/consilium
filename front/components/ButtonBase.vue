<template>
    <button
        class="inline-flex items-center gap-1.5 text-xs font-medium text-slate-600 hover:text-slate-900 border border-slate-200 hover:border-slate-400 rounded-lg px-3 py-1.5 transition-colors cursor-pointer bg-white disabled:opacity-50 disabled:cursor-not-allowed"
        v-bind="$attrs"
    >
        <slot />
    </button>
</template>
