import express from "express";
import session from "express-session";
import bodyparser from "body-parser";
import path from "path";
import { dirname } from "path";
import { fileURLToPath } from "url";
import { v4 as uuidv4 } from 'uuid';
import OracleDB from "oracledb";
import { CheckValid } from "./middlewares/checkValidRoom.js";
import { checkParty } from "./middlewares/checkValidParty.js";
import { adminResValid } from "./middlewares/admin.js";

const app = express();
const port = 3000;
const passcode = process.env.DB_PASSWORD || "1234"; // Using environment variable for password
const __dirname = dirname(fileURLToPath(import.meta.url));
const staticPath = path.join(__dirname, "../public");
let dbconnection;

app.use(bodyparser.urlencoded({ extended: true })); // Parse incoming requests
app.use(express.static(staticPath)); // Serve static files
app.use(bodyparser.json());


//oracle db connection 
async function connect() {
    try {
        const connection = await OracleDB.getConnection({
            user: "system",
            password: passcode,
            connectString: "127.0.0.1:1521/XE"
        });
        OracleDB.outFormat = OracleDB.OUT_FORMAT_OBJECT;
        return connection;
    } catch (err) {
        console.error("Error establishing database connection:", err);
        throw err;
    }
}

app.use(session({  //implementing session based authentication
    secret: 'adminpasscodeforlogin',
    resave: true,
    saveUninitialized: true
}));

function isAuthenticated(req, res, next) {// function used for checking authentication
    if (req.session.authenticated) {
        next(); // Allow access to the next middleware 
    } else {
        res.redirect('/admin_login.html'); // Redirect to login page if not authenticated
    }
}

async function sendRoomResponse(id, first_name, last_name, phone_no, email, departure, arrival, no_guests, room_type) {
    try {
        if (!dbconnection) {
            throw new Error("Database connection not established");
        }
        const arrivalDate = new Date(arrival);
        const departureDate = new Date(departure);

        await dbconnection.execute(
            `INSERT INTO room_booking (id,first_name, last_name, phone_no, email,departure,arrival, no_guests, room_type) VALUES (:id,:first_name, :last_name, :phone_no, :email,:departure, :arrival, :no_guests, :room_type)`,
            {
                id: id,
                first_name: first_name,
                last_name: last_name,
                phone_no: phone_no,
                email: email,
                departure: departureDate,
                arrival: arrivalDate,
                no_guests: no_guests,
                room_type: room_type
            }
        );

        await dbconnection.execute("commit");
    }

    catch (err) {
        console.error("Error executing query:", err);
        throw err;
    }
}

async function sendPartyHallResponse(id, first_name, last_name, phone_no, email, arrdate, event_time, event_type, cuisine) {
    try {
        if (!dbconnection) {
            throw new Error("Database connection not established");
        }
        const dateOfParty = new Date(arrdate);

        await dbconnection.execute(`INSERT INTO party_hall(id,first_name, last_name, phone_no, email, arrdate, event_time, event_type, cuisine) VALUES(:id,:first_name, :last_name, :phone_no, :email, :arrdate, :event_time, :event_type, :cuisine)`,
            {
                id: id,
                first_name: first_name,
                last_name: last_name,
                phone_no: phone_no,
                email: email,
                arrdate: dateOfParty,
                event_time: event_time,
                event_type: event_type,
                cuisine: cuisine
            }
        );

        await dbconnection.execute(`commit`);
    }

    catch (err) {
        console.error('error executing query:', err);
        throw err;
    }

}


app.get('/', (req, res) => {
    res.sendFile(path.join(staticPath, "landing.html"));
});

app.get('/rooms(.html)?', (req, res) => {
    res.sendFile(path.join(staticPath, "rooms.html"));
});

app.get('/party_hall(.html)?', (req, res) => {
    res.sendFile(path.join(staticPath, "party_hall.html"));
});

app.get('/booking_status(.html)?', (req, res) => {
    res.sendFile(path.join(staticPath, "booking_status.html"));
})

app.get('/admin_login(.html)?', (req, res) => {
    res.sendFile(path.join(staticPath, "admin_login.html"));
});

app.get('/adminfunc.html', isAuthenticated, (req, res) => {
    res.sendFile(path.join(staticPath, "adminfunc.html"));
});

app.use('/rooms/submitted', CheckValid); //middleware for checking validness of input
//post method for rooms form submission
app.post('/rooms/submitted', async (req, res) => {
    try {
        if (!dbconnection) {
            dbconnection = await connect();
        }
        let str = uuidv4();
        let id = str.substring(0, 7);

        var first_name = req.body.first_name;
        var last_name = req.body.last_name;
        var phone_no = req.body.phone_number;
        var email = req.body.email;
        var departure = req.body.departure;
        var arrival = req.body.arrival;
        var no_guests = req.body.no_guests;
        var room_type = req.body.room_type;
        console.log(arrival);
        console.log(first_name);
        console.log(arrival)

        sendRoomResponse(id, first_name, last_name, phone_no, email, departure, arrival, no_guests, room_type);

        res.send(`<h1>Booking Successful! Your customer id is ${id}</h1><br><h2>Thank you ${first_name} for choosing us!</h2>`);
    } catch (err) {
        console.error("Error processing room submission:", err);
        res.status(500).send("Internal Server Error");
    }
});

app.use("/party_hall/submitted", checkParty);
//post method for party_hall submission
app.post("/party_hall/submitted", async (req, res) => {
    try {
        if (!dbconnection)
            dbconnection = await connect();

        var first_name = req.body.first_name;
        var last_name = req.body.last_name;
        var phone_no = req.body.phone_number;
        var email = req.body.email;
        var arrdate = req.body.arrdate;
        var event_time = req.body.event_time;
        var event_type = req.body.event_type;
        var cuisine = req.body.cuisine;
        let id_found = false;

        const result = await dbconnection.execute(
            `SELECT id FROM room_booking WHERE first_name = :first_name AND last_name = :last_name AND email = :email`,
            {
                first_name: first_name,
                last_name: last_name,
                email: email
            }
        );
        let id;
        let count = result.rows.length;
        if (count > 0) {
            // If the customer has booked a room, use the same ID for party hall booking
            id = result.rows[0].ID;//ID is capital here
        } else {
            // If the customer has not booked a room, generate a new ID
            let str = uuidv4();
            id = str.substring(0, 7);
        }
        console.log(id);

        await sendPartyHallResponse(id, first_name, last_name, phone_no, email, arrdate, event_time, event_type, cuisine);
        res.send(`<h1>Party hall Booking Successful!Your party id is ${id}</h1><br><h2>Thank you ${first_name} for partying with us!</h2>`);

    }
    catch (err) {
        console.error('processing error', err);
        res.send("Internal Server Error")
    }
});

app.post("/booking_status/response", async (req, res) => {
    try {
        const res_email = req.body.email;
        const res_id = req.body.id;

        if (!dbconnection) {
            dbconnection = await connect();
        }

        // Query room booking details
        const roomBookingQuery = `SELECT * FROM room_booking WHERE email = :email AND id = :id`;
        const roomBookingResult = await dbconnection.execute(roomBookingQuery, [res_email, res_id]);

        // Query for party_hall booking details
        const partyHallQuery = `SELECT * FROM party_hall WHERE email = :email AND id = :id`;
        const partyHallResult = await dbconnection.execute(partyHallQuery, [res_email, res_id]);

        // Combining both results
        let party = partyHallResult.rows;
        let room = roomBookingResult.rows;

        if ((party.length > 0) && (room.length > 0)) { //if both bookings are done
            res.send(`<h1> PartyHall details are:<br></h1><h2>
           Name: ${party[0].FIRST_NAME} ${party[0].LAST_NAME}<br>
           Date: ${party[0].ARRDATE}<br>
           Event: ${party[0].EVENT_TYPE}<br>
           Event_time: ${party[0].EVENT_TIME}<br>
           Cuisine: ${party[0].CUISINE} <br><br></h2>
           
           <h1> Room booking details are:<br></h1><h2>
           Name: ${room[0].FIRST_NAME} ${room[0].LAST_NAME}<br>
           Arrival : ${room[0].ARRIVAL}<br>
           Departure: ${room[0].DEPARTURE}<br>
           Room type: ${room[0].ROOM_TYPE}<br>
           Guest Count : ${room[0].NO_GUESTS} <br><br></h2>`);
        }

        else if (party.length > 0 && room.length == 0) {  //if only party_hall booking is done
            res.send(`<h1> PartyHall details are:<br></h1><h2>
           Name: ${party[0].FIRST_NAME} ${party[0].LAST_NAME}<br>
           Date: ${party[0].ARRDATE}<br>
           Event: ${party[0].EVENT_TYPE}<br>
           Event_time: ${party[0].EVENT_TIME}<br>
           Cuisine: ${party[0].CUISINE} <br><br></h2>`);
        }

        else if (party.length == 0 && room.length > 0) { // if only room booking is done
            res.send(`<h1> Room booking details are:<br></h1><h2>
         Name: ${room[0].FIRST_NAME} ${room[0].LAST_NAME}<br>
         Arrival : ${room[0].ARRIVAL}<br>
         Departure: ${room[0].DEPARTURE}<br>
         Room type: ${room[0].ROOM_TYPE}<br>
         Guest Count : ${room[0].NO_GUESTS} <br><br></h2>`);
        }
        else {  //if no booking is done for either
            res.send(`<h1>NO SUCH CUSTOMER REGISTERED!</h1>`)
        }
    } catch (err) {
        console.error('Error fetching booking details:', err);
        res.status(500).send("Internal Server Error");
    }
});

app.post('/admin_login/response', async (req, res) => {
    try {
        if (!dbconnection)
            dbconnection = await connect();

        // checking if password entered by admin matches with that present in the database
        let passrow = await dbconnection.execute(
            `SELECT * FROM Admin WHERE admin_name= :admin_name AND passcode= :passcode`, [req.body.admin_name, req.body.password]);
        if (passrow.rows.length > 0) {
            req.passGranted = 1;
            console.log('password correct');
        }

        else {
            req.passGranted = 0
            res.redirect('/admin_login');
            console.log('wrong password');
        }
    }

    catch (err) {
        console.error('some err:', err);
        res.send(`<h1>Internal server error<h1>`);
    }
    if (req.passGranted == 1) {  //if password is correct direct admin to /admin_login/response/update route
        res.sendFile(path.join(staticPath, "adminfunc.html"));
    }
});

app.use('/admin_login/response/update', adminResValid);
app.post('/admin_login/response/update', async (req, res) => {
    try {
        let id = req.body.id;
        let email = req.body.email;
        let person = req.body.person_type;
        let operation = req.body.operation;
        let salary = req.body.Salary;
       // let newsal= new Number(salary);
        if (!dbconnection)
            dbconnection = await connect();

        if (person == 'Employee') {
            if (operation == 'Update') {// update salary of employee
                console.log(salary);
                await dbconnection.execute(`UPDATE Employee SET salary= :salary WHERE employee_id= :id`, [salary, id]);
                await dbconnection.execute(`commit`);
                res.send(`<h1>Salary of Employee with id ${id} updated to ${salary}`);
            }

            else if (operation == 'Remove') { //delete employee
                await dbconnection.execute(`DELETE FROM Employee WHERE employee_id= :id and email= :email`, [id, email]);
                await dbconnection.execute(`commit`);
                res.send(`<h1>Employee with id ${id} deleted from database`);
            }

            else if (operation == 'display_info') { //display information
                
                const emp = await dbconnection.execute(`SELECT * FROM Employee WHERE employee_id= :id`, [id]);
                console.log(emp.rows[0].EMPLOYEE_ID);
                if (emp.rows.length > 0) {
                    res.send(`<h1> Employee details are:<br></h1><h2>
            id: ${emp.rows[0].EMPLOYEE_ID} <br>       
            Name: ${emp.rows[0].NAME} <br>
            Phone.no: ${emp.rows[0].PHONE_NO}<br>
            Position: ${emp.rows[0].POSITION}<br>
            Maintains: ${emp.rows[0].MAINTAINING}<br>
            Salary: ${emp.rows[0].SALARY} <br><br></h2>`);


                }
                 //else case is handled by middleware
            }
        }

        else if (person == 'Chef') {
            if (operation == 'Update') { //update salary of chef
                await dbconnection.execute(`UPDATE Chef SET salary= :salary WHERE chef_id= :id`, [salary, id]);
                await dbconnection.execute(`commit`);
                res.send(`<h1>Salary of Chef with id ${id} updated to ${salary}`);
            }

            else if (operation == 'Remove') {  //delete chef
                await dbconnection.execute(`DELETE FROM Chef WHERE chef_id= :id and email= :email`, [id, email]);
                await dbconnection.execute(`commit`);
                res.send(`<h1>Chef with id ${id} deleted from database`);
            }

            else if (operation == 'display_info') { //display information
                const chef = await dbconnection.execute(`SELECT * FROM Chef WHERE chef_id= :id`, [id]);
                if (chef.rows.length > 0) {
                    res.send(`<h1> Employee details are:<br></h1><h2>
             Id: ${chef.rows[0].CHEF_ID} <br>       
             Name: ${chef.rows[0].NAME} <br>
             Phone.no: ${chef.rows[0].PHONE_NO}<br>
             Cuisine: ${chef.rows[0].CUISINE}<br>
             Salary: ${chef.rows[0].SALARY} <br><br></h2>`);
                    //else case is handled by middleware
                }
            }
        }
    }

    catch (err) {
       console.error('some err ',err);
       res.send(`<h1>Internal server error`);
    }
});

app.listen(port, () => {
    console.log(`Server is running on port ${port}`);
});

