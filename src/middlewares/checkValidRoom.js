import { connect } from "../database.js";

let connection;

async function CheckValid(req, res, next) {
    const arrival = req.body.arrival;
    const departure = req.body.departure;
    const email = req.body.email;

    let arrivalDate = new Date(arrival);
    let departureDate = new Date(departure);

    if (arrivalDate > departureDate) {
      res.send('<h1>Invalid arrival and departure dates!<h1>');
    }

    else{
    try {
        connection = await connect();

        const result = await connection.execute(`SELECT email FROM room_booking WHERE email = :email`,[req.body.email] );

        if (result.rows.length > 0) {
            res.send('<h1>Customer with that email already exists</h1>');
        }

        else
        next();


    } catch (err) {
        console.error("some err:", err);
        res.status(500).send('<h1>Internal Server Error</h1>');
    }
}
   
}

export { CheckValid };
