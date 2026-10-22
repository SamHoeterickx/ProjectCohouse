// Mock data: 1 house, 4 users, expenses/settlements/recurring/activity for analytics.
// Run: node scripts/seed-mock.mjs   (idempotent: re-running replaces the mock house + users)
// Logins: see MOCK_LOGINS.md
import 'dotenv/config';
import { config } from 'dotenv';
import pg from 'pg';
import bcrypt from 'bcrypt';
import { randomUUID, randomBytes } from 'node:crypto';

config({ path: 'env/.env.development' });

const PASSWORD = 'Mock-Cohouse-2026!';
const USERS = [
    { key: 'lotte', name: 'Lotte Peeters', email: 'lotte@mock.test', role: 'admin' },
    { key: 'maarten', name: 'Maarten Claes', email: 'maarten@mock.test', role: 'member' },
    { key: 'sofie', name: 'Sofie Janssens', email: 'sofie@mock.test', role: 'member' },
    { key: 'jonas', name: 'Jonas Willems', email: 'jonas@mock.test', role: 'member' },
];

const client = new pg.Client({
    host: process.env.DB_HOST, port: Number(process.env.DB_PORT),
    user: process.env.DB_USER, password: process.env.DB_PASSWORD, database: process.env.DB_NAME,
});

let seed = 42;
const rnd = () => ((seed = (seed * 1664525 + 1013904223) % 4294967296) / 4294967296);
const pick = (a) => a[Math.floor(rnd() * a.length)];
const between = (a, b) => Math.round(a + rnd() * (b - a));
const iso = (d) => d.toISOString().slice(0, 10);
const daysAgo = (n) => { const d = new Date(); d.setUTCDate(d.getUTCDate() - n); return d; };

function equalSplit(total, ids) {
    const base = Math.floor(total / ids.length);
    let rest = total - base * ids.length;
    return ids.map((id) => ({ id, amount: base + (rest-- > 0 ? 1 : 0), shares: null }));
}
function sharesSplit(total, weights) {
    const sum = Object.values(weights).reduce((a, b) => a + b, 0);
    const ids = Object.keys(weights);
    const out = ids.map((id) => ({ id, amount: Math.floor((total * weights[id]) / sum), shares: weights[id] }));
    out[0].amount += total - out.reduce((a, s) => a + s.amount, 0);
    return out;
}

await client.connect();
await client.query('BEGIN');
try {
    // cleanup previous mock data
    const old = await client.query(`select uuid from "user" where email like '%@mock.test'`);
    const oldIds = old.rows.map((r) => r.uuid);
    await client.query(`delete from house where name = 'Kot Mock'`); // cascades expenses, settlements, activity, memberships
    if (oldIds.length) {
        await client.query(`delete from expense_item_user where "userUuid" = any($1)`, [oldIds]);
        await client.query(`delete from "user" where uuid = any($1)`, [oldIds]);
    }

    const hash = await bcrypt.hash(PASSWORD + process.env.BCRYPT_PEPPER, Number(process.env.BCRYPT_SALT_ROUNDS ?? 12));
    const u = {};
    for (const user of USERS) {
        u[user.key] = randomUUID();
        await client.query(
            `insert into "user"(uuid,name,email,password,created_at,updated_at) values($1,$2,$3,$4,$5,$5)`,
            [u[user.key], user.name, user.email, hash, daysAgo(200)],
        );
    }
    const all = USERS.map((x) => u[x.key]);

    const houseId = randomUUID();
    await client.query(
        `insert into house(uuid,address,name,currency,"inviteCode",created_at,updated_at) values($1,$2,'Kot Mock','EUR',$3,$4,$4)`,
        [houseId, 'Naamsestraat 42, 3000 Leuven', randomBytes(8).toString('hex'), daysAgo(200)],
    );
    for (const user of USERS) {
        await client.query(`insert into house_user(uuid,"userUuid","houseUuid",role) values($1,$2,$3,$4)`, [randomUUID(), u[user.key], houseId, user.role]);
    }

    const activity = async (userId, action, entity, payload, when) =>
        client.query(
            `insert into activity(uuid,action,entity_uuid,payload,created_at,"houseUuid","userUuid") values($1,$2,$3,$4,$5,$6,$7)`,
            [randomUUID(), action, entity, payload ? JSON.stringify(payload) : null, when, houseId, userId],
        );

    await activity(u.lotte, 'house_created', houseId, { name: 'Kot Mock' }, daysAgo(200));
    for (const k of ['maarten', 'sofie', 'jonas']) await activity(u[k], 'member_joined', u[k], null, daysAgo(199));

    async function addExpense({ title, store, category, amount, date, paidBy, splitType = 'equal', splits, recurringId = null, notes = null, auto = false }) {
        const id = randomUUID();
        const when = new Date(date + 'T18:00:00Z');
        await client.query(
            `insert into expense(uuid,title,store,category,notes,amount_in_cents,currency,date,split_type,"paidByUuid","addedByUuid","houseUuid","recurringExpenseUuid",created_at,updated_at)
             values($1,$2,$3,$4,$5,$6,'EUR',$7,$8,$9,$9,$10,$11,$12,$12)`,
            [id, title, store, category, notes, amount, date, splitType, paidBy, houseId, recurringId, when],
        );
        for (const s of splits) {
            await client.query(`insert into expense_split(uuid,"expenseUuid","userUuid",amount_in_cents,shares) values($1,$2,$3,$4,$5)`, [randomUUID(), id, s.id, s.amount, s.shares]);
        }
        await activity(auto ? null : paidBy, 'expense_created', id, { title, amount_in_cents: amount, recurring: Boolean(recurringId) }, when);
    }

    // recurring expenses: rent, internet, streaming
    const recurring = [
        { title: 'Huur', category: 'rent', amount: 192000, interval: 'monthly', paidBy: u.lotte, startDaysAgo: 180, store: null },
        { title: 'Internet & TV', category: 'utilities', amount: 5990, interval: 'monthly', paidBy: u.maarten, startDaysAgo: 175, store: 'Telenet' },
        { title: 'Netflix', category: 'subscriptions', amount: 1799, interval: 'monthly', paidBy: u.sofie, startDaysAgo: 170, store: 'Netflix' },
        { title: 'Poetsvrouw', category: 'household', amount: 6000, interval: 'weekly', paidBy: u.jonas, startDaysAgo: 98, store: null },
    ];
    for (const r of recurring) {
        const rid = randomUUID();
        const start = daysAgo(r.startDaysAgo);
        const step = r.interval === 'weekly' ? 7 : 30;
        const dates = [];
        for (let d = new Date(start); d <= new Date(); d = new Date(d.getTime() + step * 86400000)) dates.push(new Date(d));
        const next = new Date(dates[dates.length - 1].getTime() + step * 86400000);
        await client.query(
            `insert into recurring_expense(uuid,"houseUuid",title,category,notes,amount_in_cents,"paidByUuid","createdByUuid",split_type,participants,interval,start_date,occurrences,next_date,end_date,active,created_at,updated_at)
             values($1,$2,$3,$4,null,$5,$6,$6,'equal',$7,$8,$9,$10,$11,null,true,$12,$12)`,
            [rid, houseId, r.title, r.category, r.amount, r.paidBy, JSON.stringify(all.map((userUuid) => ({ userUuid }))), r.interval, iso(start), dates.length, iso(next), start],
        );
        await activity(r.paidBy, 'recurring_created', rid, { title: r.title }, start);
        for (const d of dates) {
            await addExpense({ title: r.title, store: r.store, category: r.category, amount: r.amount, date: iso(d), paidBy: r.paidBy, splits: equalSplit(r.amount, all), recurringId: rid, auto: true });
        }
    }

    // one-off expenses spread over ~6 months
    const templates = [
        { title: 'Wekelijkse boodschappen', store: pick(['Delhaize', 'Colruyt', 'Aldi', 'Albert Heijn']), category: 'groceries', range: [4500, 11500], n: 40 },
        { title: 'Afhaalpizza', store: 'Domino\'s', category: 'restaurant', range: [3200, 6800], n: 8 },
        { title: 'Sushi avond', store: 'Sumo', category: 'restaurant', range: [5500, 11000], n: 5 },
        { title: 'Schoonmaakproducten', store: 'Action', category: 'household', range: [1200, 3800], n: 8 },
        { title: 'Elektriciteit', store: 'Engie', category: 'utilities', range: [9500, 14500], n: 6 },
        { title: 'Water', store: 'Aquafin', category: 'utilities', range: [3500, 5500], n: 3 },
        { title: 'Bioscoop', store: 'Kinepolis', category: 'entertainment', range: [3000, 5200], n: 4 },
        { title: 'Huisfeestje drank', store: 'Drankencentrale', category: 'entertainment', range: [4500, 9000], n: 3 },
        { title: 'Trein naar Brussel', store: 'NMBS', category: 'transport', range: [1100, 2800], n: 4 },
        { title: 'Nieuwe stofzuiger', store: 'MediaMarkt', category: 'household', range: [7900, 15900], n: 1 },
        { title: 'Verjaardagstaart', store: 'Bakkerij Jan', category: 'other', range: [2500, 4200], n: 2 },
    ];
    const payerWeights = [u.lotte, u.lotte, u.maarten, u.maarten, u.maarten, u.sofie, u.sofie, u.jonas];
    for (const t of templates) {
        for (let i = 0; i < t.n; i++) {
            const paidBy = pick(payerWeights);
            const amount = between(...t.range);
            const roll = rnd();
            let splitType = 'equal';
            let splits = equalSplit(amount, all);
            if (roll > 0.88) { // exact: payer + one other
                const other = pick(all.filter((x) => x !== paidBy));
                const half = Math.round(amount * 0.35);
                splitType = 'exact';
                splits = [{ id: paidBy, amount: amount - half, shares: null }, { id: other, amount: half, shares: null }];
            } else if (roll > 0.78) { // shares: one person skips, one weighs double
                splitType = 'shares';
                const w = { [u.lotte]: 1, [u.maarten]: 2, [u.sofie]: 1, [u.jonas]: 1 };
                splits = sharesSplit(amount, w);
            }
            await addExpense({ title: t.title, store: t.store, category: t.category, amount, date: iso(daysAgo(between(1, 175))), paidBy, splitType, splits });
        }
    }

    // settlements
    const settlements = [
        { from: u.jonas, to: u.lotte, amount: 25000, days: 120 },
        { from: u.sofie, to: u.maarten, amount: 18000, days: 90 },
        { from: u.jonas, to: u.maarten, amount: 12000, days: 60 },
        { from: u.sofie, to: u.lotte, amount: 15000, days: 30 },
        { from: u.jonas, to: u.lotte, amount: 8000, days: 9 },
    ];
    for (const s of settlements) {
        const id = randomUUID();
        const when = daysAgo(s.days);
        await client.query(
            `insert into settlement(uuid,"houseUuid","fromUserUuid","toUserUuid",amount_in_cents,date,notes,"addedByUuid",created_at,updated_at) values($1,$2,$3,$4,$5,$6,'Overschrijving',$3,$7,$7)`,
            [id, houseId, s.from, s.to, s.amount, iso(when), when],
        );
        await activity(s.from, 'settlement_created', id, { from_user: s.from, to_user: s.to, amount_in_cents: s.amount }, when);
    }

    await client.query('COMMIT');
    const c = await client.query(`select (select count(*) from expense where "houseUuid"=$1) e, (select count(*) from settlement where "houseUuid"=$1) s, (select count(*) from activity where "houseUuid"=$1) a`, [houseId]);
    console.log('Seed klaar:', c.rows[0]);
} catch (e) {
    await client.query('ROLLBACK');
    throw e;
} finally {
    await client.end();
}
