const sqlite3 = require('sqlite3').verbose();


function getAllPromise(filename, query, params) {
  const db = new sqlite3.Database(filename);
  return new Promise((resolve, reject) => {
    db.all(query, params, (err, rows) => {
      db.close();
      if (err) reject(err);
      resolve(rows);
    })
  })
}

async function valueUsers(filename) {

  try {
    let av_query = 'SELECT * FROM AV';
    let session_query = 'SELECT * FROM sesion';
    let moodQuery = 'SELECT * FROM mood';
    let contextQuery = 'SELECT * FROM contexto';

    const AV_raw = await getAllPromise(filename, av_query, []);
    const session = await getAllPromise(filename, session_query, []);
    const mood = await getAllPromise(filename, moodQuery, []);
    const context = await getAllPromise(filename, contextQuery, []);

    return {
      AV: AV_raw.map((a) => { return [a.arousal, a.valence] }),
      sesiones: session,
      mood: mood,
      context: context
    };
  } catch (error) { throw error; }
}

async function chronData(filename) {
  try {
    let labelsQuery = 'SELECT strftime(\'%d-%m\', fecha) AS label from AV GROUP BY strftime(\'%d-%m\', fecha)';
    let arousalQuery = 'SELECT avg(arousal) AS arousal FROM AV GROUP BY strftime(\'%d-%m\', fecha)';
    let valenceQuery = 'SELECT avg(valence) AS valence FROM AV GROUP BY strftime(\'%d-%m\', fecha)';

    const labels = await getAllPromise(filename, labelsQuery, []);
    const arousal = await getAllPromise(filename, arousalQuery, []);
    const valence = await getAllPromise(filename, valenceQuery, []);

    return { labels : labels, arousal: arousal, valence: valence }
  } catch (error) { throw error; }
}

module.exports = { valueUsers, chronData };
