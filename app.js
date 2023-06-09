const express = require("express");
const { open } = require("sqlite");
const sqlite3 = require("sqlite3");
const path = require("path");

const databasePath = path.join(__dirname, "cricketMatchDetails.db");

const app = express();
app.use(express.json());

let database = null;

const initializeDbAndServer = async () => {
  try {
    database = await open({
      filename: databasePath,
      driver: sqlite3.Database,
    });
    app.listen(3000, () =>
      console.log("Server Running at http://localhost:3000/")
    );
  } catch (error) {
    console.log(`DB Error: '${error.message}'`);
    process.exit(1);
  }
};

initializeDbAndServer();

convertPlayerDbObjectToResponseObject = (dbObject) => {
  return {
    playerId: dbObject.player_id,
    playerName: dbObject.player_name,
  };
};

convertMatchDbObjectToResponseObject = (dbObject) => {
  return {
    matchId: dbObject.match_id,
    match: dbObject.match,
    year: dbObject.year,
  };
};

app.get("/players/", async (request, response) => {
  const getPlayersQuery = `
    SELECT 
      * 
    FROM 
     player_details;`;
  const players = await database.all(getPlayersQuery);
  response.send(
    players.map((eachPlayer) =>
      convertPlayerDbObjectToResponseObject(eachPlayer)
    )
  );
});

app.get("/players/:playerId/", async (request, response) => {
  const { playerId } = request.params;
  const getPlayerQuery = `
    SELECT 
      *
    FROM 
      player_details 
    WHERE 
      player_id = ${playerId};`;
  const player = await database.get(getPlayerQuery);
  response.send(convertPlayerDbObjectToResponseObject(player));
});

app.put("/players/:playerId/", async (request, response) => {
  const { playerId } = request.params;
  const { playerName } = request.body;
  const updatePlayerQuery = `
    UPDATE 
      player_details 
    SET 
      player_name = '${playerName}'
    WHERE 
       player_id = ${playerId};`;

  await database.run(updatePlayerQuery);
  response.send("Player Details Updated");
});

app.get("/matches/:matchId/", async (request, response) => {
  const { matchId } = request.params;
  const getMatchQuery = ` 
    SELECT 
      * 
    FROM 
     match_details 
    WHERE 
     match_id = ${matchId};`;

  const match = await database.get(getMatchQuery);
  response.send(convertMatchDbObjectToResponseObject(match));
});

app.get("/players/:playerId/matches/", async (request, response) => {
  const { playerId } = request.params;
  const getPlayerMatchQuery = `
    SELECT 
      * 
    FROM 
     match_details 
    NATURAL JOIN player_match_score 
    WHERE 
    player_id = ${playerId};`;

  const playerMatch = await database.all(getPlayerMatchQuery);
  response.send(
    playerMatch.map((eachPlayer) =>
      convertMatchDbObjectToResponseObject(eachPlayer)
    )
  );
});

app.get("/matches/:matchId/players", async (request, response) => {
  const { matchId } = request.params;
  const getPlayersQuery = `
    SELECT 
     * 
    FROM 
     player_details 
    NATURAL JOIN player_match_score 
    WHERE 
    match_id = ${matchId};`;
  const playerDetails = await database.all(getPlayersQuery);
  response.send(
    playerDetails.map((eachPlayer) =>
      convertPlayerDbObjectToResponseObject(eachPlayer)
    )
  );
});

app.get("/players/:playerId/playerScores", async (request, response) => {
  const { playerId } = request.params;
  const getPlayerStatsQuery = `
    SELECT 
      player_id AS playerID,
      player_name AS playerName,
      SUM(score) AS totalScore,
      SUM(fours) AS totalFours,
      SUM(sixes) AS totalSixes 
    FROM player_match_score 
    NATURAL JOIN player_details 
    WHERE player_id = '${playerId}';`;
  const playerStats = await database.get(getPlayerStatsQuery);
  response.send(playerStats);
});

module.exports = app;
