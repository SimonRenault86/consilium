<template>
    <div v-if="hasData">
        <div class="relative h-48">
            <Line
                :data="chartData"
                :options="chartOptions"
                :plugins="[lastValuePlugin]"
            />
        </div>
        <div class="flex flex-wrap gap-x-4 gap-y-1 mt-3">
            <span class="flex items-center gap-1.5 text-xs text-primary-500">
                <svg
                    width="20"
                    height="6"
                    viewBox="0 0 20 6"
                    class="flex-shrink-0"
                >
                    <defs>
                        <linearGradient
                            id="part-grad"
                            x1="0%"
                            y1="0%"
                            x2="100%"
                            y2="0%"
                        >
                            <stop
                                offset="0%"
                                stop-color="rgb(239,68,68)"
                            />
                            <stop
                                offset="100%"
                                stop-color="rgb(34,197,94)"
                            />
                        </linearGradient>
                    </defs>
                    <line
                        x1="0"
                        y1="3"
                        x2="20"
                        y2="3"
                        stroke="url(#part-grad)"
                        stroke-width="2"
                    />
                </svg>
                Participation
            </span>
            <span
                v-if="hasNationalAvg"
                class="flex items-center gap-1.5 text-xs text-primary-500"
            >
                <svg
                    width="20"
                    height="6"
                    viewBox="0 0 20 6"
                    class="flex-shrink-0"
                >
                    <line
                        x1="0"
                        y1="3"
                        x2="20"
                        y2="3"
                        stroke="#9ca3af"
                        stroke-width="1.5"
                        stroke-dasharray="5,3"
                    />
                </svg>
                Moyenne nationale
            </span>
            <span
                v-if="trendData"
                class="flex items-center gap-1.5 text-xs text-primary-500"
            >
                <svg
                    width="20"
                    height="6"
                    viewBox="0 0 20 6"
                    class="flex-shrink-0"
                >
                    <line
                        x1="0"
                        y1="3"
                        x2="20"
                        y2="3"
                        stroke="#9ca3af"
                        stroke-width="1.5"
                        stroke-dasharray="3,5"
                    />
                </svg>
                Tendance de participation
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

const history = ref([]);
const hasData = computed(() => history.value.length >= 1);

// ─── Palette rouge→vert identique à AssemblyMap ──────────────────────────────

const scoreColorFromValue = v => {
    const t = Math.max(0, Math.min(100, v)) / 100;
    const r = Math.round(239 + (34 - 239) * t);
    const g = Math.round(68 + (197 - 68) * t);
    const b = Math.round(68 + (94 - 68) * t);
    return `rgb(${r},${g},${b})`;
};

const lastScore = computed(() => {
    for (let i = history.value.length - 1; i >= 0; i--) {
        const v = history.value[i].scoreParticipation;
        if (v != null) return Math.round(v * 100);
    }
    return null;
});
const lastScoreColor = computed(() =>
    lastScore.value != null ? scoreColorFromValue(lastScore.value) : '#9ca3af'
);

// ─── Moyenne nationale ───────────────────────────────────────────────────────

const nationalAvgData = computed(() =>
    history.value.map(r => r.nationalAvg != null ? Math.round(r.nationalAvg * 100) : null)
);
const hasNationalAvg = computed(() => nationalAvgData.value.some(v => v != null));

// ─── Tendance linéaire (régression simple) ───────────────────────────────────

const trendData = computed(() => {
    const raw = history.value.map(r => r.scoreParticipation != null ? Math.round(r.scoreParticipation * 100) : null);
    const pts = raw.map((y, x) => ({ x, y })).filter(p => p.y != null);
    if (pts.length < 3) return null;
    const n = pts.length;
    const sumX = pts.reduce((s, p) => s + p.x, 0);
    const sumY = pts.reduce((s, p) => s + p.y, 0);
    const sumXY = pts.reduce((s, p) => s + p.x * p.y, 0);
    const sumXX = pts.reduce((s, p) => s + p.x * p.x, 0);
    const denom = n * sumXX - sumX * sumX;
    if (denom === 0) return null;
    const slope = (n * sumXY - sumX * sumY) / denom;
    const intercept = (sumY - slope * sumX) / n;
    return raw.map((_, i) => Math.round(Math.max(0, Math.min(100, slope * i + intercept)) * 10) / 10);
});

// ─── Plugin : badge valeur du dernier point ──────────────────────────────────

const lastValuePlugin = {
    id: 'lastValueLabel',
    afterDatasetsDraw (chart) {
        const meta = chart.getDatasetMeta(0);
        const dataset = chart.data.datasets[0];
        if (!meta?.data?.length) return;
        let lastIdx = -1;
        for (let i = dataset.data.length - 1; i >= 0; i--) {
            if (dataset.data[i] != null) { lastIdx = i; break; }
        }
        if (lastIdx === -1) return;
        const point = meta.data[lastIdx];
        const value = dataset.data[lastIdx];
        const { ctx } = chart;
        const text = `${value} %`;
        ctx.save();
        ctx.font = 'bold 11px system-ui, sans-serif';
        const tw = ctx.measureText(text).width;
        const pw = tw + 12;
        const ph = 18;
        const px = Math.min(Math.max(point.x - pw / 2, 2), chart.width - pw - 2);
        const py = Math.max(point.y - 30, 2);
        ctx.fillStyle = dataset.borderColor;
        ctx.beginPath();
        if (ctx.roundRect) {
            ctx.roundRect(px, py, pw, ph, 4);
        } else {
            ctx.rect(px, py, pw, ph);
        }
        ctx.fill();
        ctx.fillStyle = '#ffffff';
        ctx.textAlign = 'center';
        ctx.textBaseline = 'middle';
        ctx.fillText(text, px + pw / 2, py + ph / 2);
        ctx.restore();
    },
};

// ─── Données du graphique ────────────────────────────────────────────────────

const chartData = computed(() => {
    const scores = history.value.map(r => r.scoreParticipation != null ? Math.round(r.scoreParticipation * 100) : null);

    const datasets = [
        {
            label: 'Participation',
            data: scores,
            // borderColor utilisé par le badge (dernier score) ; les segments sont recolorés via `segment`
            borderColor: lastScoreColor.value,
            backgroundColor: 'rgba(148,163,184,0.07)',
            borderWidth: 2.5,
            pointRadius: history.value.length < 3 ? 5 : 3,
            pointHoverRadius: 7,
            pointBackgroundColor: scores.map(v => v != null ? scoreColorFromValue(v) : '#9ca3af'),
            pointBorderColor: '#ffffff',
            pointBorderWidth: 2,
            tension: 0.4,
            fill: true,
            spanGaps: true,
            clip: false,
            order: 1,
            segment: {
                borderColor: ctx => {
                    const y0 = ctx.p0.parsed.y;
                    const y1 = ctx.p1.parsed.y;
                    return scoreColorFromValue(((y0 ?? y1) + (y1 ?? y0)) / 2);
                },
            },
        },
    ];

    if (hasNationalAvg.value) {
        datasets.push({
            label: 'Moyenne nationale',
            data: nationalAvgData.value,
            borderColor: '#9ca3af',
            backgroundColor: 'transparent',
            borderWidth: 1.5,
            borderDash: [5, 4],
            pointRadius: 0,
            pointHoverRadius: 5,
            pointBackgroundColor: '#9ca3af',
            tension: 0.4,
            fill: false,
            spanGaps: true,
            clip: false,
            order: 2,
        });
    }

    if (trendData.value) {
        datasets.push({
            label: 'Tendance de participation',
            data: trendData.value,
            borderColor: '#9ca3af',
            backgroundColor: 'transparent',
            borderWidth: 1.5,
            borderDash: [3, 6],
            pointRadius: 0,
            pointHoverRadius: 0,
            tension: 0,
            fill: false,
            spanGaps: true,
            clip: false,
            order: 3,
        });
    }

    return {
        labels: history.value.map(r => {
            const [y, m] = r.dateMaj.slice(0, 7).split('-');
            return `${m}/${y}`;
        }),
        datasets,
    };
});

const chartOptions = {
    responsive: true,
    maintainAspectRatio: false,
    interaction: { mode: 'index', intersect: false },
    layout: { padding: { top: 34, right: 4, bottom: 0, left: 4 } },
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
