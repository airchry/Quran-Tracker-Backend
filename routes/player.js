import { Router } from "express"
import pool from "../config/db.js"

const router = Router();

router.get("/", async (req, res) => {
    try {
        const result = await pool.query(
            "SELECT * FROM players WHERE id = 1"
        );

        res.json(result.rows[0]);
    } catch (err) {
        console.error(err);
        res.status(500).json({ error: "Server error" });
    }
});

router.get("/:id", async (req, res) => {
    const { id } = req.params;

    try {
        const result = await pool.query(
            "SELECT * FROM players WHERE id = $1",
            [id]
        );

        res.json(result.rows[0]);
    } catch (err) {
        console.error(err);
        res.status(500).json({ error: "Server error" });
    }
});

router.put("/", async (req, res) => {
    const { player1Name, player2Name } = req.body;

    try {
        const result = await pool.query(
            "UPDATE players SET player1_name = $1, player2_name = $2 WHERE id = 1 RETURNING *",
            [player1Name, player2Name]
        );

        res.json(result.rows[0]);
    } catch (err) {
        console.error(err);
        res.status(500).json({ error: "Server error" });
    }
});

export default router