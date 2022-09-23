const express = require("express");
const Express = express();
Express.use(express.json());

const path = require("path");
const { open } = require("sqlite");
const sqlite3 = require("sqlite3");

const dbPath = path.join(__dirname, "cricketMatchDetails.db");

let db = null;

const initializeDbAndServer = async () => {
  try {
    db = await open({
      filename: dbPath,
      driver: sqlite3.Database,
    });
    Express.listen(3000, () => {
      console.log("Server Running at http://localhost:3000/");
    });
  } catch (e) {
    console.log(`DB Error: ${e.message}`);
    process.exit(1);
  }
};
initializeDbAndServer();

//return a list of all the players from the team
//API 1

const convertPlayerToResponseObject = (objectItem) => {
  return {
    playerId: objectItem.player_id,
    playerName: objectItem.player_name,
    matchId: objectItem.match_id,
    match: objectItem.match,
    year: objectItem.year,
    playerMatchId: objectItem.player_match_id,
    score: objectItem.score,
    fours: objectItem.fours,
    sixes: objectItem.sixes,
  };
};

Express.get("/players/", async (request, response) => {
  const getPlayersQuery = `select * from player_details`;
  const playersArray = await db.all(getPlayersQuery);
  response.send(
    playersArray.map((eachPlayer) => convertPlayerToResponseObject(eachPlayer))
  );
});

//Returns a specific player based on the player ID
//API 2

Express.get("/players/:playerId/", async (request, response) => {
  const { playerId } = request.params;
  const getPlayerQuery = `select * from player_details where player_id = ${playerId}`;
  const playerArray = await db.get(getPlayerQuery);
  response.send(convertPlayerToResponseObject(playerArray));
});

//Updates the details of a specific player based on the player ID
//API 3

Express.put("/players/:playerId/", async (request, response) => {
  const { playerId } = request.params;
  const { playerName } = request.body;
  const updatePlayerQuery = `
  UPDATE 
    player_details 
  SET
    player_name='${playerName}'
  WHERE 
    player_id=${playerId};`;

  await db.run(updatePlayerQuery);
  response.send("Player Details Updated");
});

//Returns the match details of a specific match
//API 4

Express.get("/matches/:matchId/", async (request, response) => {
  const { matchId } = request.params;
  const matchQuery = `select * from match_details where match_id = ${matchId}`;
  const matchDetailsQuery = await db.get(matchQuery);
  response.send(convertPlayerToResponseObject(matchDetailsQuery));
});

//Returns a list of all the matches of a player
//API 5

Express.get("/players/:playerId/matches", async (request, response) => {
  const { playerId } = request.params;
  const playerMatchDetailsQuery = `select match_details.match_id, match_details.match, match_details.year from match_details inner join player_match_score on match_details.match_id = player_match_score.match_id where player_id = ${playerId}`;
  const playerMatchResponse = await db.all(playerMatchDetailsQuery);
  response.send(
    playerMatchResponse.map((eachPlayer) =>
      convertPlayerToResponseObject(eachPlayer)
    )
  );
});

//Returns a list of players of a specific match
//API 6

Express.get("/matches/:matchId/players", async (request, response) => {
  const { matchId } = request.params;
  const playerMatchQuery = `select player_details.player_id, player_details.player_name from player_details inner join player_match_score on player_details.player_id = player_match_score.player_id where match_id = ${matchId}`;
  const playerDetailsResponse = await db.all(playerMatchQuery);
  response.send(
    playerDetailsResponse.map((eachArr) =>
      convertPlayerToResponseObject(eachArr)
    )
  );
});

//Returns the statistics of the total score, fours, sixes of a specific player based on the player ID
//API 7
Express.get("/players/:playerId/playerScores/", async (request, response) => {
  const { playerId } = request.params;
  const getPlayerScoreQuery = `
    SELECT
      player_match_score.player_id AS playerId,
      player_details.player_name AS playerName,
      sum(player_match_score.score) AS totalScore,
      sum(player_match_score.fours) AS totalFours,
      sum(player_match_score.sixes) AS totalSixes
    FROM player_match_score 
      NATURAL JOIN player_details
    WHERE
      player_id = ${playerId};`;
  const playerMatches = await db.all(getPlayerScoreQuery);
  response.send(playerMatches);
});

module.exports = Express;
