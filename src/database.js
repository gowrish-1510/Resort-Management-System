import OracleDB from "oracledb";

OracleDB.outFormat= OracleDB.OUT_FORMAT_OBJECT;

const passcode="1234";
let connection;


 async function connect(){
      connection= await OracleDB.getConnection({
        user: "system",
        password:passcode,
        connectString:"127.0.0.1:1521/XE"
    });
   return connection;
}

export { connect };