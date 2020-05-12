require("dotenv/config");
const db_config = require("./config.js");
const express = require("express");
const cookieParser = require("cookie-parser");
const cors = require("cors");
const { verify } = require("jsonwebtoken");
const { hash, compare } = require("bcryptjs");
const mysql = require("mysql");
const {
  createAccessToken,
  createRefreshToken,
  sendAccessToken,
  sendRefreshToken,
} = require("./tokens.js");
const { fakeDB } = require("./fakeDB.js");
const { isAuth } = require("./isAuth.js");

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

// user express middleware to cookie handling
app.use(cookieParser());

app.use(
  cors({
    origin: "http://localhost:3000",
    credentials: true,
  })
);

// needed to be able to read body data
app.use(express.json()); // to support JSON-encoded bodies
app.use(express.urlencoded({ extended: true })); // support URL-encoded bodies

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

app.get("/createuserstable", (req, res) => {
  let sql =
    "Create Table Users (User_Id Numeric(6) PRIMARY KEY, First_Name Varchar(20),  Last_Name Varchar(25) NOT NULL,  Email Varchar(20))";
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

// 1. regiser a user
app.post("/register", async (req, res) => {
  const { email, password } = req.body;
  try {
    //1. check if user existed

    const user = fakeDB.find((user) => user.email === email);
    if (user) throw new Error("User already existed");

    // 2. if use not existed, has the password

    const hashedPassword = await hash(password, 10);

    //3. insert the user in 'database'

    fakeDB.push({
      id: fakeDB.length,
      email: email,
      password: hashedPassword,
    });
    res.send({ message: "user created" });
    console.log(fakeDB);
  } catch (err) {
    res.send({
      error: `${err.message}`,
    });
  }
});

// 2. login a user

app.post("/login", async (req, res) => {
  const { email, password } = req.body;

  try {
    // 1. find user in the database, if not exist send error

    const user = fakeDB.find((user) => user.email === email);
    if (!user) throw new Error("user not exist");
    // 2. compare crypted passowrd and see if it checks out
    const valid = await compare(password, user.password);
    if (!valid) throw new Error("Passord not corred");

    // 3. create refresh and accesstoken
    const accesstoken = createAccessToken(user.id);
    const refreshtoken = createRefreshToken(user.id);

    //4. put refresh token in the database
    user.refreshtoken = refreshtoken;

    console.log(fakeDB);
    // 5. send token refreshtoken as a cookie and accesstoken as a regular response
    sendRefreshToken(res, refreshtoken);
    sendAccessToken(req, res, accesstoken);
  } catch (err) {
    res.send({
      error: `${err.message}`,
    });
  }
});
// 3. logout a user
app.post("/logout", (_req, res) => {
  res.clearCookie("refreshtoken", { path: "/refresh_token" });
  return res.send({
    message: "logged out",
  });
});

// 4. setup a protected route
app.post("/protected", async (req, res) => {
  try {
    const userId = isAuth(req);
    if (userId !== null)
      res.send({
        data: "this is protected data",
      });
  } catch (err) {
    res.send({
      error: `${err.message}`,
    });
  }
});

// 5. get a new accesstoken with a refresh  token
app.post("/refresh_token", (req, res) => {
  const token = req.cookies.refreshtoken;
  // if we don't have a token in our request
  if (!token)
    return res.send({
      accesstoken: "",
    });
  // we have a token, let's verify it
  let payload = null;
  try {
    payload = verify(token, process.env.REFRESH_TOKEN_SECRET);
  } catch (err) {
    return res.send({ accesstoken: "" });
  }

  // token is valid, check if user exited
  const user = fakeDB.find((user) => user.id === payload.userId);
  if (!user) return res.send({ accesstoken: "" });

  // user exist, check if refreshtoken exist on user
  if (user.refreshtoken !== token) {
    return res.send({ accesstoken: "" });
  }
  // token exist, create new refresh and accesstoekn
  const accesstoken = createAccessToken(user.id);
  const refreshtoken = createRefreshToken(user.id);

  user.refreshtoken = refreshtoken;

  // all good to go, send new refreshtoken and accesstoken
  sendRefreshToken(res, refreshtoken);
  return res.send({ accesstoken });
});

app.listen(process.env.PORT, () => {
  console.log(`server listening on PORT ${process.env.PORT}`);
});
