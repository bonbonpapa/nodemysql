const db_config = require("./config.js");
const express = require("express");
const mysql = require("mysql");

//Create connection

const db = mysql.createConnection({
  host: "localhost",
  user: db_config.db_user,
  password: db_config.db_password,
  database: "nodemysql",
});

//Connect
db.connect((err) => {
  if (err) {
    throw err;
  }
  console.log("mySQL connected...");
});

const app = express();

//create DB
app.get("/createdb", (req, res) => {
  let sql = "CREATE DATABASE nodemysql";
  db.query(sql, (err, result) => {
    if (err) throw err;
    console.log(result);
    res.send("Databased created...");
  });
});

//create table
app.get("/createpoststable", (req, res) => {
  let sql =
    "CREATE TABLE posts(id int AUTO_INCREMENT, title VARCHAR(255), body VARCHAR(255), PRIMARY KEY(id))";
  db.query(sql, (err, result) => {
    if (err) throw err;
    console.log(result);
    res.send("Post table created");
  });
});

// insert post 1
app.get("/addpost1", (req, res) => {
  let post = { title: "Post One", body: "this is post number 1" };
  let sql = "INSERT INTO posts SET ?";
  let query = db.query(sql, post, (err, result) => {
    if (err) throw err;
    console.log(result);
    res.send("Post1 Added");
  });
});

// insert post 2
app.get("/addpost2", (req, res) => {
  let post = { title: "Post Two", body: "this is post number 2" };
  let sql = "INSERT INTO posts SET ?";
  let query = db.query(sql, post, (err, result) => {
    if (err) throw err;
    console.log(result);
    res.send("Post2 Added");
  });
});

// Select posts
app.get("/getposts", (req, res) => {
  let sql = "SELECT * FROM posts";
  let query = db.query(sql, (err, results) => {
    if (err) throw err;
    console.log(results);
    res.send("Posts fetched");
  });
});

//Select single post
app.get("/getpost/:id", (req, res) => {
  let sql = `SELECT * FROM posts WHERE id = ${req.params.id}`;
  let query = db.query(sql, (err, result) => {
    if (err) throw err;
    console.log(result);
    res.send("Post fetched");
  });
});

//Update post
app.get("/updatepost/:id", (req, res) => {
  let newTitle = "Updated title";

  let sql = `UPDATE posts SET title = '${newTitle}' WHERE id = ${req.params.id}`;
  let query = db.query(sql, (err, result) => {
    if (err) throw err;
    console.log(result);
    res.send("Post updated...");
  });
});

// Delete post

app.get("/deletepost/:id", (req, res) => {
  let sql = `DELETE FROM posts WHERE id = ${req.params.id}`;
  let query = db.query(sql, (err, result) => {
    if (err) throw err;
    console.log(result);
    res.send("Post deleted...");
  });
});

app.listen("3000", () => {
  console.log("server started on port 3000");
});
