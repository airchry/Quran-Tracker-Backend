import { Router } from "express"
import pool from "../config/db.js"

const router = Router();

router.get("/", async (req, res) => {
    try {
        const { playerId, player, surah } = req.query;

        const result = await pool.query(
            `SELECT surah_number AS surah, verse_number AS verse 
             FROM completed_verses 
             WHERE player_id=$1 AND player=$2 AND surah_number=$3`,
            [playerId, player, surah]
        );

        res.json(result.rows);
    } catch (err) {
        console.error(err);
        res.status(500).json({ error: "Gagal mengambil data" });
    }
});

router.get("/progress", async (req, res) => {
    try {
        const { playerId, player } = req.query;

        const result = await pool.query(
            "SELECT COUNT(*) FROM completed_verses WHERE player_id=$1 AND player=$2",
            [playerId, player]
        );
        console.log(result.rows);

        const total = Number(result.rows[0]?.count || 0);

        res.json({ total });
    } catch (err) {
        console.error(err);
        res.status(500).json({ error: "Gagal mengambil progress" });
    }
})

router.get("/surah-progress", async (req, res) => {
    try {
        const { playerId, player } = req.query;

        const result = await pool.query(`
            SELECT surah_number AS surah, COUNT(*) AS total_done
            FROM completed_verses
            WHERE player_id=$1 AND player=$2
            GROUP BY surah_number
        `, [playerId, player]);

        res.json(result.rows);
    } catch (err) {
        console.error(err);
        res.status(500).json({ error: "Gagal mengambil surah progress"});
    }
})

router.post("/", async (req, res) => {
    try {
        const { playerId, surah, verse } = req.body;
        console.log(req.body);

        const existing = await pool.query("SELECT * FROM completed_verses WHERE player=$1 AND surah_number=$2 AND verse_number=$3", [playerId, surah, verse]);

        if (existing.rows.length > 0) {
            await pool.query("DELETE FROM completed_verses WHERE player=$1 AND surah_number=$2 AND verse_number=$3", [playerId, surah, verse]);
        } else {
            await pool.query("INSERT INTO completed_verses (player, surah_number, verse_number) VALUES ($1, $2, $3)", [playerId, surah, verse]);
        }
        
        res.json({ success: true });
    } catch (err) {
        console.error(err);
        res.status(500).json({ error: "Server error" });
    }
})

router.post("/complete", async (req, res) => {
    const { playerId, player, surahNumber, verseNumber } = req.body;
    console.log(playerId, player);
    const expPerVerse = 10;

    try {
        const result = await pool.query(
            `INSERT INTO completed_verses 
            (player_id, player, surah_number, verse_number)
            VALUES ($1, $2, $3, $4)
            ON CONFLICT DO NOTHING
            RETURNING *`,
            [playerId, player, surahNumber, verseNumber]
        );

        if (result.rows.length > 0) {
            const column = player === "player1"
                ? "player1_exp"
                : "player2_exp";

            await pool.query(
                `UPDATE players 
                 SET ${column} = ${column} + $1 
                 WHERE id = $2`,
                [expPerVerse, playerId]
            );
        }

        res.json({ message: "Verse processed" });

    } catch (err) {
        console.error(err);
        res.status(500).json({ error: "Error" });
    }
});

router.delete("/", async (req, res) => {
    try {
        const { playerId, player, surah, verse } = req.body;

        await pool.query(
            `DELETE FROM completed_verses 
             WHERE player_id=$1 AND player=$2 
             AND surah_number=$3 AND verse_number=$4`,
            [playerId, player, surah, verse]
        );

        const column = player === "player1" ? "player1_exp" : "player2_exp";

        await pool.query(
            `UPDATE players SET ${column} = ${column} - 10 WHERE id = $1`,
            [playerId]
        );

        res.json({ success: true });
    } catch (err) {
        console.error(err);
        res.status(500).json({ error: "Gagal menghapus ayat" });
    }
});

router.delete("/reset", async (req, res) => {
    const { playerId, player } = req.query;

    await pool.query(
        `DELETE FROM completed_verses 
         WHERE player_id = $1 AND player = $2`,
        [playerId, player]
    );

    res.json({ message: "Reset success" });
});

export default router