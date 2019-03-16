
module.exports = class Queries{

    checkIfExists(conn, id){
        console.log("CHECKING");
        console.log(id);
        conn.query("SELECT COUNT(id) FROM user where id =" + "\'" + id + "\'", function(err, rows, fields){
            if(err) {
                console.log(err);
                return err;
            }
            console.log(rows[0]['COUNT(id)'] + 1);
            console.log(fields);
        })
    }

}