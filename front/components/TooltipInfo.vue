<template>
    <div
        class="relative group inline-flex items-center"
        @click.stop
    >
        <i class="fa-solid fa-circle-info text-secondary-500 hover:text-secondary-600 transition text-sm cursor-pointer" />
        <div class="absolute left-1/2 -translate-x-1/2 bottom-full mb-2 w-72 bg-secondary-500 text-white text-xs rounded-xl px-3 py-2.5 shadow-lg opacity-0 group-hover:opacity-100 transition-opacity pointer-events-none z-50 leading-relaxed">
            <slot />
            <div class="absolute left-1/2 -translate-x-1/2 top-full w-0 h-0 border-x-4 border-x-transparent border-t-4 border-t-secondary-500" />
        </div>
    </div>
</template>
