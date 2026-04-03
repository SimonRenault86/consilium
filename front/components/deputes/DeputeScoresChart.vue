<template>
    <div v-if="hasData">
        <div class="relative h-48">
            <Line
                :data="chartData"
                :options="chartOptions"
            />
        </div>
        <div class="flex flex-wrap gap-x-4 gap-y-1 mt-3">
            <span
                v-for="serie in series"
                :key="serie.key"
                class="flex items-center gap-1.5 text-xs text-primary-500"
            >
                <span
                    class="inline-block w-2 h-2 rounded-full flex-shrink-0"
                    :style="{ backgroundColor: serie.color }"
                />
                {{ serie.label }}
            </span>
        </div>
    </div>
</template>

<script setup>
import { ref, computed, onMounted } from 'vue';
import { Line } from 'vue-chartjs';
import {
    Chart as ChartJS,
    CategoryScale,
    LinearScale,
    PointElement,
    LineElement,
    Tooltip,
    Filler,
} from 'chart.js';
ChartJS.register(CategoryScale, LinearScale, PointElement, LineElement, Tooltip, Filler);

const props = defineProps({
    deputeId: { type: String, required: true },
});

const series = [
    { key: 'scoreParticipation', label: 'Participation', color: '#3b82f6', fill: '#3b82f614' },
    { key: 'scoreParticipationSpecialite', label: 'Implication dans sa spécialité', color: '#8b5cf6', fill: '#8b5cf614' },
    { key: 'scoreLoyaute', label: 'Loyauté au groupe', color: '#10b981', fill: '#10b98114' },
];

const history = ref([]);

const hasData = computed(() => history.value.length >= 1);

const chartData = computed(() => ({
    labels: history.value.map(r => {
        const [y, m] = r.dateMaj.slice(0, 7).split('-');
        return `${m}/${y}`;
    }),
    datasets: series.map(s => ({
        label: s.label,
        data: history.value.map(r => r[s.key] != null ? Math.round(r[s.key] * 100) : null),
        borderColor: s.color,
        backgroundColor: s.fill,
        borderWidth: 2.5,
        pointRadius: history.value.length < 3 ? 5 : 3,
        pointHoverRadius: 7,
        pointBackgroundColor: s.color,
        pointBorderColor: '#ffffff',
        pointBorderWidth: 2,
        tension: 0.4,
        fill: true,
        spanGaps: true,
        clip: false,
    })),
}));

const chartOptions = {
    responsive: true,
    maintainAspectRatio: false,
    interaction: { mode: 'index', intersect: false },
    layout: { padding: { top: 28, right: 4, bottom: 0, left: 4 } },
    plugins: {
        legend: { display: false },
        tooltip: {
            backgroundColor: '#111111',
            titleColor: '#d6d6d6',
            bodyColor: '#ffffff',
            padding: { x: 12, y: 10 },
            cornerRadius: 10,
            callbacks: {
                label: ctx => ` ${ctx.dataset.label} : ${ctx.parsed.y != null ? ctx.parsed.y + ' %' : '—'}`,
            },
        },
    },
    scales: {
        x: {
            grid: { display: false },
            border: { display: false },
            ticks: { color: '#b0b0b0', font: { size: 11 } },
        },
        y: {
            min: 0,
            max: 100,
            border: { display: false },
            ticks: {
                color: '#b0b0b0',
                font: { size: 11 },
                stepSize: 25,
                callback: v => v + ' %',
                padding: 4,
            },
            grid: { color: '#f0f0f0', lineWidth: 1 },
        },
    },
};

onMounted(async () => {
    try {
        const res = await fetch(`/api/deputes/${props.deputeId}/scores-history`);
        if (!res.ok) return;
        history.value = await res.json();
    } catch {
        // pas d'historique disponible — le composant se masque
    }
});
</script>
