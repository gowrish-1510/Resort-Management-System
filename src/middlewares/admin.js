import { connect } from "../database.js";
let dbconnection;

async function adminResValid(req, res, next) {
    try {
        if (!dbconnection)
            dbconnection = await connect();

        let id = req.body.id;
        let email = req.body.email;
        let person = req.body.person_type;
        let operation = req.body.operation;
        console.log('inside adminResValid');

        if ((person == 'Customer_room') || (person == 'Customer_partyHall')) {
            if (operation == 'Update'){
                res.send(`<h1>You can't update the Customer details `);
                return;
            }

            else {
                if (person == 'Customer_room') {
                    const room = await dbconnection.execute(`SELECT * FROM room_booking WHERE id= :id AND email= :email`, [id, email]);
                    if (room.rows.length == 0) {
                        res.send(`<h1> Customer with provided ID aand Email didn't book a room`);
                        return;
                    }
                }

                else if (person == 'Customer_partyHall') {
                    const party = await dbconnection.execute(`SELECT * FROM party_hall WHERE id= :id AND email= :email`, [id, email]);
                    if (party.rows.length == 0) {
                        res.send(`<h1>Customer with provided ID and Email didn't book a Party Hall`);
                        return;
                    }
                }
            }
        }


         if (person == 'Employee') {
            const employee = await dbconnection.execute(`SELECT * FROM Employee WHERE employee_id= :id AND email= :email`,[id,email]);
            if(employee.rows.length==0){
                res.send(`<h1>Employee with provided ID and Email doesn't exist!`);
                return;
            }
        }

        else if (person == 'Chef') {
            const employee = await dbconnection.execute(`SELECT * FROM Chef WHERE chef_id= :id AND email= :email`,[id,email]);
            if(employee.rows.length==0){
                res.send(`<h1>Chef with provided ID and Email doesn't exist!`);
                return;
            }
        }
        
        next();
    }

    catch (err) {
       console.error('some err: ',err);
       res.send("<h1>Internal Server Error<h1>");
    }
}

export { adminResValid };