const express = require("express");
const { connection } = require("./connector");
const router = express.Router();

router.get("/totalRecovered", async (req, res) => {
  try {
    const totalRecovered = await connection.aggregate([
      {
        $group: {
          _id: "total",
          recovered: { $sum: "$recovered" },
        },
      },
    ]);
    res.json({ data: totalRecovered[0] });
  } catch (err) {
    console.log(err);
    res.status(500).send("Internal Server error");
  }
});

router.get("/totalActive", async (req, res) => {
  try {
    const totalActive = await connection.aggregate([
      {
        $group: {
          _id: "total",
          active: {
            $sum: { $subtract: ["$infected", "$recovered"] },
          },
        },
      },
    ]);
    res.json({ data: totalActive[0] });
  } catch (error) {
    res.status(500).send("Internal Server error");
  }
});
router.get("/totalDeath", async (req, res) => {
  try {
    const totalDeath = await connection.aggregate([
      {
        $group: {
          _id: "total",
          death: { $sum: "$death" },
        },
      },
    ]);
    res.json({ data: totalDeath[0] });
  } catch (err) {
    console.log(err);
    res.status(500).send("Internal Server error");
  }
});
router.get("/hotspotStates", async (req, res) => {
  try {
    const hotspotStates = await connection.aggregate([
      {
        $addFields: {
          rate: {
            $round: [
              {
                $divide: [
                  { $subtract: ["$infected", "$recovered"] },
                  "$infected",
                ],
              },
              5,
            ],
          },
        },
      },
      { $match: { rate: { $gt: 0.1 } } },
      {
        $project: {
          _id: 0,
          state: "$name",
          rate: 1,
          state: 1,
        },
      },
    ]);
    res.json({ data: hotspotStates });
  } catch (err) {
    res.status(501).send("Server error");
  }
});
router.get("/healthyStates", async (req, res) => {
  try {
    const healthyStates = await connection.aggregate([
      {
        $addFields: {
          mortality: {
            $round: [
              {
                $divide: ["$death", "$infected"],
              },
              5,
            ],
          },
        },
      },
      { $match: { mortality: { $lt: 0.005 } } },
      {
        $project: {
          _id: 0,
          state: "$name",
          mortality: 1,
          state: 1,
        },
      },
    ]);
    res.json({ data: healthyStates });
  } catch (err) {
    res.status(501).send("Server error");
  }
});

module.exports = router;
