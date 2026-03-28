import { Router } from 'express';
import { readFileSync, readdirSync } from 'fs';
import { fileURLToPath } from 'url';
import path from 'path';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const router = Router();

const VOTES_DIR = path.join(__dirname, '../../../front/helpers/brut/votes');

const numFromFilename = f => parseInt(f.replace('VTANR5L17V', '').replace('.json', ''), 10);

const allVoteFiles = readdirSync(VOTES_DIR)
    .filter(f => f.endsWith('.json'))
    .sort((a, b) => numFromFilename(b) - numFromFilename(a));

const parseVoteFile = filename => {
    const raw = JSON.parse(readFileSync(path.join(VOTES_DIR, filename), 'utf8'));
    const s = raw.scrutin;

    const groupesArr = (() => {
        const g = s.ventilationVotes?.organe?.groupes?.groupe || [];
        return Array.isArray(g) ? g : [g];
    })();

    const votantsMap = {};
    for (const g of groupesArr) {
        const dn = g.vote?.decompteNominatif;
        if (!dn) continue;
        const extract = (section, position) => {
            if (!section?.votant) return;
            const arr = Array.isArray(section.votant) ? section.votant : [section.votant];
            for (const v of arr) votantsMap[v.acteurRef] = position;
        };
        extract(dn.pours, 'pour');
        extract(dn.contres, 'contre');
        extract(dn.abstentions, 'abstention');
    }

    return {
        uid: s.uid,
        numero: parseInt(s.numero, 10),
        dateScrutin: s.dateScrutin,
        titre: s.titre,
        sort: s.sort?.code || null,
        demandeur: s.demandeur?.texte || null,
        synthese: {
            votants: parseInt(s.syntheseVote?.nombreVotants || '0', 10),
            pour: parseInt(s.syntheseVote?.decompte?.pour || '0', 10),
            contre: parseInt(s.syntheseVote?.decompte?.contre || '0', 10),
            abstentions: parseInt(s.syntheseVote?.decompte?.abstentions || '0', 10),
        },
        votantsMap,
    };
};

router.get('/', (req, res) => {
    const { from, to, limit = '10', q } = req.query;

    const dateRe = /^\d{4}-\d{2}-\d{2}$/;
    if ((from && !dateRe.test(from)) || (to && !dateRe.test(to))) {
        return res.status(400).json({ error: 'Format de date invalide' });
    }

    const maxLimit = Math.min(parseInt(limit, 10) || 10, 200);
    const search = q ? String(q).toLowerCase().trim() : null;

    const results = [];
    for (const f of allVoteFiles) {
        if (results.length >= maxLimit) break;
        try {
            const vote = parseVoteFile(f);
            if (from && vote.dateScrutin < from) continue;
            if (to && vote.dateScrutin > to) continue;
            if (search && !vote.titre.toLowerCase().includes(search)) continue;
            results.push(vote);
        } catch (e) {
            // fichier corrompu, on saute
        }
    }
    res.json(results);
});

export default router;
