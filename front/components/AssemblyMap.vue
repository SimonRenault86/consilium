<template>
    <div class="flex items-end justify-center px-4 pt-10">
        <div class="w-full max-w-[760px]">
            <div class="hemicycle relative flex w-full aspect-[2/1] items-center justify-center border-2 border-dashed border-indigo-400 bg-gradient-to-b from-primary-100 to-primary-200">
                <div class="relative z-10 flex flex-col items-center gap-1.5 pt-8">
                    <span class="text-lg font-bold text-primary-800">Hémicycle — Assemblée Nationale</span>
                    <span class="text-[0.8125rem] font-medium text-primary-500">577 sièges · Données ouvertes</span>
                    <span class="mt-1 text-xs text-slate-400">La carte interactive sera affichée ici</span>
                </div>
            </div>
        </div>
    </div>
</template>

<script setup></script>

<style lang="scss" scoped>
/* Forme elliptique de l'hémicycle — non exprimable en classes Tailwind */
.hemicycle {
    border-radius: 50% 50% 0 0 / 100% 100% 0 0;

    &::before {
        content: '';
        position: absolute;
        inset: 15%;
        bottom: 0;
        background: #f8fafc;
        border-radius: 50% 50% 0 0 / 100% 100% 0 0;
        border-top: 2px dashed var(--color-primary-200);
    }
}
</style>
