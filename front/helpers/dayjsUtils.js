import dayjs from 'dayjs';
import timezone from 'dayjs/plugin/timezone.js';
import utc from 'dayjs/plugin/utc.js';
import 'dayjs/locale/fr.js';

dayjs.extend(utc);
dayjs.extend(timezone);
dayjs.locale('fr');

const TZ = 'Europe/Paris';

/**
 * Retourne un objet dayjs avec le timezone Paris appliqué.
 * @param {string|Date|null} date
 */
export const dayjsParis = (date) => dayjs(date).tz(TZ);

/**
 * Formate une date en "le 31 mars à 12h31".
 * @param {string|Date|null} date
 */
export const formatUpdateTime = (date) => {
    if (!date) return null;
    const d = dayjsParis(date);
    return `le ${d.format('D MMMM')} à ${d.format('HH[h]mm')}`;
};
