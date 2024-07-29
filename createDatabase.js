const mysql = require('mysql2');
 
const con = mysql.createConnection({
    host: "localhost",
    user: "root",
    password: "root"
});
 
con.connect(function (err) {
   if (err) throw err;
   console.log("Connected to MySQL!");
});
 
// CREATE DATABASE
// con.query("CREATE DATABASE mydb", function (err, result) {
//     if (err) throw err;
//     console.log("Database created");
// });


// SHOW DATABASE
con.query("SHOW DATABASES", function (err, result) {
   if (err) throw err;
   console.log(result);
});

// TO SELECT DATABASE
con.query("USE mydb",function (err, result) {
   if (err) throw err;
   console.log(result);
});

// // CREATE TABLE
// con.query("CREATE TABLE customers (id INT AUTO_INCREMENT PRIMARY KEY, name VARCHAR(255), address VARCHAR(255))", function (err) {
//    if (err) throw err;
//    console.log("Table created");
// });

// // SHOW TABLES
// con.query("SHOW tables", function (err, result) {
//    if (err) throw err;
//    console.log(result);
// });

//INSERT DATA
var values = [  
   ['1', 'Aditya', 'aditya@gail.com'],  
   ['2', 'Code For Geek', 'codeforgeek@gmail.com'], 
]; 

con.query("INSERT INTO customers VALUES ?", [values], function (err, result) {
   if (err) throw err;
   console.log("Number of records inserted: " + result.affectedRows);
});