
module.exports = class Queries{

     checkIfExists(conn, id){
        console.log("CHECKING");
        console.log(id);
        let returnValue = false;
        conn.query("SELECT COUNT(id) FROM user where id =" + "\'" + id + "\'", function(err, rows, fields){
            if(err) {
                console.log(err);
                return err;
            }
            console.log(typeof rows[0]['COUNT(id)']);
            if(parseInt(rows[0]['COUNT(id)']) != 0){
                console.log('does indeed exist');
                returnValue = true;
            }
        })
        console.log("19 " + returnValue);
        setTimeout(() => {
            console.log("21: " + returnValue);
            return returnValue;
    },500)
    }

    newUser(conn, id){
        console.log("creating user");
        conn.query("INSERT INTO user (id, username) VALUES(" + '\"' + id + '\" ' + ',' + null + ')', function(err, rows, fields){
            if(err){
                console.log(err);
                return err;
            }
            console.log(rows);
        });
    }

}