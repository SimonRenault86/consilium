<template>
    <div class="px-5 py-3">
        <!-- Résumé cliquable -->
        <button
            class="w-full text-left cursor-pointer"
            @click="isOpen = !isOpen"
        >
            <div class="flex flex-col gap-3">
                <div class="flex items-start gap-3">
                    <div class="flex-1 min-w-0">
                        <div class="flex items-center gap-2 flex-wrap">
                            <ScrutinCategorie
                                v-if="qag.categorie"
                                :categorie="qag.categorie"
                                :sous-categorie="qag.sousCategorie"
                            />
                        </div>
                        <p class="mt-1 text-sm font-bold text-primary-800 leading-snug">
                            {{ qag.analyse || 'Question sans titre' }}
                        </p>
                        <p class="mt-0.5 text-xs text-primary-500">
                            <span v-if="auteurNom">{{ auteurNom }} ·</span>
                            <span>{{ qag.ministre.abrege }}</span>
                        </p>
                    </div>
                    <i
                        class="fa-solid fa-chevron-down shrink-0 mt-1 text-primary-300 text-xs transition-transform duration-200"
                        :class="{ 'rotate-180': isOpen }"
                    />
                </div>

                <!-- ── Acteurs concernés ── -->
                <div class="grid grid-cols-2 gap-2">
                    <!-- Auteur de la question -->
                    <div
                        v-if="qag.auteur.ref"
                        class="flex items-center justify-between rounded-xl border border-primary-200 bg-primary-50 px-3 py-2 hover:bg-primary-100 transition-colors cursor-pointer h-full"
                        @click="goto(`/depute/${auteurSlug}`)"
                    >
                        <div class="flex gap-2.5">
                            <div class="relative shrink-0 w-10 h-10">
                                <img
                                    :src="`/elus/${qag.auteur.ref}.jpg`"
                                    :alt="auteurNom"
                                    class="w-10 h-10 rounded-full object-cover"
                                    @error="e => { e.target.style.display='none'; e.target.nextElementSibling.style.display='flex'; }"
                                >
                                <div class="w-10 h-10 rounded-full bg-primary-200 text-primary-700 text-xs font-bold absolute inset-0 hidden items-center justify-center">
                                    {{ initials(qag.auteur.prenom, qag.auteur.nom) }}
                                </div>
                                <!-- Logo groupe en badge -->
                                <a
                                    v-if="auteurGroupe?.logo"
                                    :href="`/partis/${qag.groupe.abrev}`"
                                    class="absolute -bottom-0.5 -right-0.5 w-4 h-4 rounded-full bg-white border border-slate-200 flex items-center justify-center overflow-hidden"
                                    @click.stop
                                >
                                    <img
                                        :src="auteurGroupe.logo"
                                        :alt="qag.groupe.abrev"
                                        class="w-3 h-3 object-contain"
                                    >
                                </a>
                            </div>
                            <div class="min-w-0">
                                <p class="text-xs font-bold text-primary-800 leading-tight">
                                    {{ auteurNom }}
                                </p>
                                <p class="text-xs text-primary-500 leading-tight mt-0.5 min-w-0">
                                    <a
                                        :href="`/partis/${qag.groupe.abrev}`"
                                        :title="qag.groupe.developpe || qag.groupe.abrev"
                                        class="hover:underline line-clamp-1"
                                        @click.stop
                                    >{{ qag.groupe.developpe || qag.groupe.abrev }}</a>
                                </p>
                                <p
                                    v-if="auteurDepute?.departementNom"
                                    class="text-xs text-primary-400 leading-tight mt-0.5"
                                >
                                    <i class="fa-solid fa-location-dot mr-0.5" />{{ auteurDepute.departementNom }}
                                </p>
                                <p
                                    v-if="auteurDepute?.job"
                                    :title="auteurDepute.job"
                                    class="text-xs text-primary-400 leading-tight mt-0.5 italic line-clamp-1"
                                >
                                    {{ auteurDepute.job }}
                                </p>
                            </div>
                        </div>
                        <span class="ml-1 shrink-0 rounded-full bg-primary-100 border border-primary-200 px-2 py-0.5 text-xs text-primary-600 font-medium">
                            Question
                        </span>
                    </div>

                    <!-- Ministre répondant -->
                    <div class="flex items-center justify-between rounded-xl border border-secondary-200 bg-secondary-50 px-3 py-2 h-full">
                        <div class="flex gap-2.5">
                            <div class="relative shrink-0 w-9 h-9">
                                <img
                                    v-if="qag.ministre.acteurId"
                                    :src="`/elus/${qag.ministre.acteurId}.jpg`"
                                    :alt="ministreNom"
                                    class="w-9 h-9 rounded-full object-cover"
                                    @error="e => { e.target.style.display='none'; e.target.nextElementSibling.style.display='flex'; }"
                                >
                                <div
                                    class="w-9 h-9 rounded-full bg-secondary-100 text-secondary-700 text-xs font-bold absolute inset-0 items-center justify-center"
                                    :class="qag.ministre.acteurId ? 'hidden' : 'flex'"
                                >
                                    <i class="fa-solid fa-user-tie text-xs" />
                                </div>
                            </div>
                            <div class="min-w-0">
                                <p class="text-xs font-bold text-secondary-800 leading-tight">
                                    {{ ministreNom || qag.ministre.abrege }}
                                </p>
                                <p
                                    :title="qag.ministre.developpe"
                                    class="text-xs text-secondary-500 leading-tight mt-0.5 line-clamp-1"
                                >
                                    {{ qag.ministre.developpe }}
                                </p>
                            </div>
                        </div>
                        <span class="ml-1 shrink-0 rounded-full bg-secondary-100 border border-secondary-200 px-2 py-0.5 text-xs text-secondary-700 font-medium">
                            Réponse
                        </span>
                    </div>
                </div>
            </div>
        </button>

        <!-- Contenu déroulant -->
        <div
            class="grid transition-[grid-template-rows] duration-200 ease-in-out"
            :class="isOpen ? 'grid-rows-[1fr]' : 'grid-rows-[0fr]'"
        >
            <div class="overflow-hidden">
                <div class="mt-3 space-y-4">
                    <!-- ── Transcript ── -->
                    <p
                        v-if="!segments.length"
                        class="text-sm text-primary-500 italic"
                    >
                        Texte non disponible.
                    </p>

                    <!-- eslint-disable vue/no-v-html -->
                    <div
                        v-else
                        class="space-y-2"
                    >
                        <template
                            v-for="(seg, i) in segments"
                            :key="i"
                        >
                            <!-- Interjection : ligne compacte -->
                            <div
                                v-if="seg.type === 'interjection'"
                                class="flex flex-col items-start gap-1 pl-2 border-l-2 border-slate-200"
                            >
                                <!-- Avatar mini si député identifié -->
                                <template v-if="seg.depute">
                                    <a
                                        :href="`/depute/${seg.depute.slug}`"
                                        class="shrink-0 mt-0.5 flex items-center gap-1.5 no-underline group"
                                    >
                                        <div class="relative w-5 h-5 shrink-0">
                                            <img
                                                :src="`/elus/${seg.depute.id}.jpg`"
                                                :alt="seg.speaker"
                                                class="w-5 h-5 rounded-full object-cover"
                                                @error="e => { e.target.style.display='none'; e.target.nextElementSibling.style.display='flex'; }"
                                            >
                                            <div class="w-5 h-5 rounded-full bg-slate-200 text-slate-600 text-[8px] font-bold absolute inset-0 hidden items-center justify-center">
                                                {{ seg.initials }}
                                            </div>
                                        </div>
                                        <span class="text-xs font-semibold text-primary-500 group-hover:text-primary-700 leading-tight">{{ seg.speaker }}.</span>
                                        <a
                                            v-if="seg.groupeLogo"
                                            :href="`/partis/${seg.depute.groupeAbrev}`"
                                            class="shrink-0 mt-0.5"
                                            @click.stop
                                        >
                                            <img
                                                :src="seg.groupeLogo"
                                                :alt="seg.depute.groupeAbrev"
                                                class="w-3.5 h-3.5 object-contain opacity-60 hover:opacity-90"
                                            >
                                        </a>
                                    </a>
                                </template>
                                <span
                                    v-else
                                    class="shrink-0 text-xs font-semibold text-primary-400 mt-0.5 leading-tight"
                                >{{ seg.speaker }}.</span>
                                <span
                                    class="text-xs text-primary-400 italic leading-relaxed [&_i]:not-italic"
                                    v-html="seg.text"
                                />
                            </div>

                            <!-- Prise de parole complète -->
                            <div
                                v-else
                                :class="bubbleWrapClass(seg.type)"
                            >
                                <div
                                    class="rounded-xl border overflow-hidden"
                                    :class="borderClass(seg.type)"
                                >
                                    <!-- En-tête locuteur -->
                                    <component
                                        :is="seg.depute ? 'a' : 'div'"
                                        :href="seg.depute ? `/depute/${seg.depute.slug}` : undefined"
                                        class="flex items-center gap-2.5 px-3.5 py-2.5 no-underline"
                                        :class="[headerBgClass(seg.type), seg.depute ? 'hover:brightness-95 transition-[filter]' : '']"
                                    >
                                        <div class="relative shrink-0 w-8 h-8">
                                            <img
                                                v-if="seg.photoId"
                                                :src="`/elus/${seg.photoId}.jpg`"
                                                :alt="seg.speaker"
                                                class="w-8 h-8 rounded-full object-cover"
                                                @error="e => { e.target.style.display='none'; e.target.nextElementSibling.style.display='flex'; }"
                                            >
                                            <div
                                                class="w-8 h-8 rounded-full text-xs font-bold absolute inset-0 items-center justify-center"
                                                :class="[seg.photoId ? 'hidden' : 'flex', avatarClass(seg.type)]"
                                            >
                                                <i
                                                    v-if="seg.type === 'president'"
                                                    class="fa-solid fa-gavel text-xs"
                                                />
                                                <span v-else>{{ seg.initials }}</span>
                                            </div>
                                        </div>
                                        <div class="min-w-0 flex-1">
                                            <p
                                                class="text-xs font-bold leading-tight"
                                                :class="nameClass(seg.type)"
                                            >
                                                {{ seg.speaker }}
                                                <i
                                                    v-if="seg.depute"
                                                    class="fa-solid fa-arrow-up-right-from-square text-[9px] ml-0.5 opacity-40"
                                                />
                                            </p>
                                            <p
                                                v-if="seg.role"
                                                class="text-xs leading-tight opacity-60 italic mt-0.5"
                                            >
                                                {{ seg.role }}
                                            </p>
                                            <p
                                                v-else-if="seg.depute"
                                                class="text-xs leading-tight opacity-50 mt-0.5"
                                            >
                                                <a
                                                    :href="`/partis/${seg.depute.groupeAbrev}`"
                                                    class="hover:opacity-80"
                                                    @click.stop
                                                >{{ seg.depute.groupeAbrev }}</a>
                                                <span v-if="seg.depute.departementNom"> · {{ seg.depute.departementNom }}</span>
                                            </p>
                                            <!-- Fallback auteur : groupe issu des données QaG -->
                                            <p
                                                v-else-if="seg.type === 'auteur' && qag.groupe?.abrev"
                                                class="text-xs leading-tight opacity-50 mt-0.5"
                                            >
                                                <a
                                                    :href="`/partis/${qag.groupe.abrev}`"
                                                    class="hover:opacity-80"
                                                    @click.stop
                                                >{{ qag.groupe.developpe || qag.groupe.abrev }}</a>
                                            </p>
                                        </div>
                                        <!-- Logo du parti -->
                                        <img
                                            v-if="seg.groupeLogo"
                                            :src="seg.groupeLogo"
                                            :alt="seg.depute?.groupeAbrev"
                                            class="shrink-0 w-5 h-5 object-contain opacity-70"
                                        >
                                    </component>

                                    <!-- Texte -->
                                    <div
                                        class="px-4 py-3 text-sm text-primary-800 leading-relaxed bg-white [&_i]:text-primary-400 [&_a]:hidden [&_strong]:font-semibold"
                                        v-html="seg.text"
                                    />
                                </div>
                            </div>
                        </template>
                    </div>
                    <!-- eslint-enable vue/no-v-html -->
                </div>
            </div>
        </div>
    </div>
</template>

<script setup>
import { ref, computed } from 'vue';
import { deputesMap } from '@/helpers/deputes.js';
import { groupes } from '@/helpers/partis.js';
import ScrutinCategorie from '@components/scrutins/ScrutinCategorie.vue';

const props = defineProps({
    qag: { type: Object, required: true },
});

const isOpen = ref(false);

// ── Helpers ─────────────────────────────────────────────────────────────────

const toSlug = s => s
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-|-$/g, '');

const normalize = s => s
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .toLowerCase()
    .replace(/^(mme\.?|m\.?)\s+/i, '')
    .replace(/,.*$/, '')
    .trim();

const initials = (prenom, nom) =>
    [(prenom || '')[0], (nom || '')[0]].join('').toUpperCase() || '?';

const goto = url => { window.location.href = url; };

// ── Acteurs principaux ───────────────────────────────────────────────────────

const auteurNom = computed(() => {
    const { prenom, nom, civ } = props.qag.auteur;
    if (!nom) return null;
    return [civ, prenom, nom].filter(Boolean).join(' ');
});

const auteurSlug = computed(() => {
    const { prenom, nom } = props.qag.auteur;
    return prenom && nom ? toSlug(`${prenom} ${nom}`) : '';
});

const auteurGroupe = computed(() => groupes[props.qag.groupe?.abrev] ?? null);

const ministreNom = computed(() => {
    const { prenom, nom } = props.qag.ministre;
    if (!nom) return null;
    return prenom ? `${prenom} ${nom}` : nom;
});

// ── Lookup des députés par nom normalisé ─────────────────────────────────────
// deputesMap est réactif (shallowRef) → segments se recalcule quand les données arrivent

const deputeByNorm = computed(() => {
    const m = new Map();
    for (const d of deputesMap.value.values()) {
        // Clé principale : prenom + nom
        m.set(normalize(`${d.prenom} ${d.nom}`), d);
        // Clé secondaire : nom seul (pour les cas "M. Dupont")
        const nomOnly = normalize(d.nom);
        if (!m.has(nomOnly)) m.set(nomOnly, d);
    }
    return m;
});

const findDepute = speakerRaw => {
    const spn = normalize(speakerRaw);
    return deputeByNorm.value.get(spn) ?? null;
};

// Présidente de l'Assemblée nationale — identifiée dans deputesMap par son nom
const presidenteAN = computed(() => findDepute('Yaël Braun-Pivet'));

// Député auteur trouvé dans la map (pour infos complémentaires)
const auteurDepute = computed(() => findDepute(`${props.qag.auteur.prenom || ''} ${props.qag.auteur.nom || ''}`));

// ── Classification ───────────────────────────────────────────────────────────

const classifyType = speaker => {
    const spn = normalize(speaker);
    if (spn.includes('president')) return 'president';

    const auteur = props.qag.auteur;
    if (auteur?.nom) {
        const an = normalize(`${auteur.prenom || ''} ${auteur.nom}`);
        if (spn === an || spn.includes(an) || an.includes(spn)) return 'auteur';
    }

    const ministre = props.qag.ministre;
    if (ministre?.nom) {
        const mn = normalize(`${ministre.prenom || ''} ${ministre.nom}`);
        if (spn === mn || spn.includes(mn) || mn.includes(spn)) return 'ministre';
    }

    return 'other';
};

// ── Parsing du transcript ────────────────────────────────────────────────────

const segments = computed(() => {
    if (!props.qag.texteReponse) return [];

    const html = props.qag.texteReponse
        .replace(/<script\b[^<]*(?:(?!<\/script>)<[^<]*)*<\/script>/gi, '')
        .replace(/<\/?p[^>]*>/gi, '');

    const result = [];
    const chunks = html.split(/(?=<strong)/i);

    for (const chunk of chunks) {
        if (!chunk.trim()) continue;
        const m = chunk.match(/^<strong[^>]*>([\s\S]*?)<\/strong>([\s\S]*)/i);
        if (!m) continue;

        const speaker = m[1].replace(/<[^>]*>/g, '').trim().replace(/\s*[.,]\s*$/, '').trim();
        if (!speaker) continue;

        let rest = m[2];

        // Rôle éventuel dans un <i> immédiatement après </strong>
        let role = null;
        const im = rest.match(/^<i[^>]*>([\s\S]*?)<\/i>/i);
        if (im) {
            role = im[1].replace(/<[^>]*>/g, '').replace(/\s*[.,]\s*$/, '').trim() || null;
            rest = rest.slice(im[0].length);
        }

        const text = rest.trim().replace(/(<br\s*\/?>[\s\u00a0]*)+$/gi, '').trim();
        const plainLen = text.replace(/<[^>]*>/g, '').trim().length;
        const baseType = classifyType(speaker);
        const type = plainLen < 120 && baseType === 'other' ? 'interjection' : baseType;

        const photoId = type === 'auteur'
            ? (props.qag.auteur.ref || null)
            : type === 'ministre'
                ? (props.qag.ministre.acteurId || null)
                : null;

        // Cherche un député dans la map selon le type
        const depute = type === 'president'
            ? presidenteAN.value
            : (type === 'other' || type === 'interjection' || type === 'auteur')
                ? findDepute(speaker)
                : null;

        // Override du rôle pour la présidente
        const resolvedRole = type === 'president'
            ? "Présidente de l'Assemblée nationale"
            : role;

        // Logo du parti : depuis le député trouvé, ou fallback depuis les données QaG
        const groupeLogo = depute
            ? (groupes[depute.groupeAbrev]?.logo ?? null)
            : (type === 'auteur' ? (groupes[props.qag.groupe?.abrev]?.logo ?? null) : null);

        result.push({
            speaker,
            role: resolvedRole,
            text,
            type,
            photoId: photoId ?? (depute ? depute.id : null),
            initials: initials(
                type === 'auteur' ? props.qag.auteur.prenom : type === 'ministre' ? props.qag.ministre.prenom : null,
                type === 'auteur' ? props.qag.auteur.nom : type === 'ministre' ? props.qag.ministre.nom : speaker,
            ),
            depute,
            groupeLogo,
        });
    }

    return result;
});

// ── Styles ───────────────────────────────────────────────────────────────────

const BORDER = { auteur: 'border-primary-200', ministre: 'border-secondary-200', president: 'border-amber-200', other: 'border-slate-200' };
const HEADER_BG = { auteur: 'bg-primary-50', ministre: 'bg-secondary-50', president: 'bg-amber-50', other: 'bg-slate-50' };
const NAME_CLS = { auteur: 'text-primary-800', ministre: 'text-secondary-800', president: 'text-amber-800', other: 'text-primary-700' };
const AVATAR = { auteur: 'bg-primary-100 text-primary-700', ministre: 'bg-secondary-100 text-secondary-700', president: 'bg-amber-100 text-amber-700', other: 'bg-slate-200 text-slate-600' };
const BUBBLE = { auteur: 'pr-12 sm:pr-20', ministre: 'pl-12 sm:pl-20' };

const borderClass = t => BORDER[t] ?? 'border-slate-200';
const headerBgClass = t => HEADER_BG[t] ?? 'bg-slate-50';
const nameClass = t => NAME_CLS[t] ?? 'text-primary-700';
const avatarClass = t => AVATAR[t] ?? 'bg-slate-200 text-slate-600';
const bubbleWrapClass = t => BUBBLE[t] ?? '';
</script>
