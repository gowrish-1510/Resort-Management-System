import { connect } from "../database.js";
let dbconnection;

async function checkParty(req, res, next) {
    try {
        if (!dbconnection)
            dbconnection = await connect();

        const result = await dbconnection.execute(`SELECT email FROM party_hall WHERE email = :email`, [req.body.email]);
        if (result.rows.length > 0) {
            res.send(`<h1>Email already registered</h1>`);
            return; // Exit the middleware
        }

          let Arrdate= new Date(req.body.arrdate);

        const check = await dbconnection.execute(`SELECT arrdate, event_time FROM party_hall WHERE arrdate = :arrdate AND event_time = :event_time`, [Arrdate, req.body.event_time]);
        if (check.rows.length > 0) {
            res.send(`<h1>The slot you have chosen is already full. Sorry for the inconvenience</h1>`);
            return; // Exit the middleware chain if slot is already full
        }

        // If email is not registered and slot is available, proceed to the next middleware/get req
        next();
    } catch (err) {
        console.error('Error:', err);
        res.status(500).send(`<h1>Internal server error</h1>`);
    }
}

export { checkParty };
