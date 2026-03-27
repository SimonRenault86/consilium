// Génère les positions des 577 sièges de l'hémicycle en arcs concentriques
// Retourne un tableau de { seatId, row, col, x, y }

const TOTAL_SEATS = 577;
const ROWS = 16;
const INNER_RADIUS = 130;
const OUTER_RADIUS = 530;
const ANGLE_START = 0.09;
const ANGLE_END = Math.PI - 0.09;
const CENTER_X = 550;
const CENTER_Y = 560;

const generateSeats = () => {
    const rowSpacing = (OUTER_RADIUS - INNER_RADIUS) / (ROWS - 1);

    // On calcule l'arc de chaque rangée pour distribuer les sièges proportionnellement
    const rows = [];
    let totalArc = 0;
    for (let i = 0; i < ROWS; i++) {
        const radius = INNER_RADIUS + i * rowSpacing;
        const arcLength = (ANGLE_END - ANGLE_START) * radius;
        rows.push({ radius, arcLength });
        totalArc += arcLength;
    }

    // Distribution proportionnelle, puis ajustement pour atteindre exactement 577
    let distributed = 0;
    const seatsPerRow = rows.map(r => {
        const count = Math.round((r.arcLength / totalArc) * TOTAL_SEATS);
        distributed += count;
        return count;
    });

    // Correction du delta sur la rangée du milieu
    const delta = TOTAL_SEATS - distributed;
    seatsPerRow[Math.floor(ROWS / 2)] += delta;

    // Génération des coordonnées
    const seats = [];
    let seatId = 1;
    for (let row = 0; row < ROWS; row++) {
        const radius = rows[row].radius;
        const count = seatsPerRow[row];
        for (let col = 0; col < count; col++) {
            // Angle réparti uniformément sur l'arc
            const angle = ANGLE_START + ((ANGLE_END - ANGLE_START) * (col + 0.5)) / count;
            const x = CENTER_X - radius * Math.cos(angle);
            const y = CENTER_Y - radius * Math.sin(angle);
            seats.push({ seatId, row, col, x: Math.round(x * 100) / 100, y: Math.round(y * 100) / 100 });
            seatId++;
        }
    }

    return seats;
};

// On pré-calcule une seule fois
const seats = generateSeats();

export const VIEWBOX_WIDTH = 1100;
export const VIEWBOX_HEIGHT = 600;
export const SEAT_RADIUS = 7;

export default seats;
