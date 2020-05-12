import React, { useState, useEffect } from "react";
import { Router, navigate } from "@reach/router";
import Navigation from "./Components/Navigation";
import Protected from "./Components/Protected";
import Login from "./Components/Login";
import Content from "./Components/Content";
import Register from "./Components/Register";

export const UserContext = React.createContext([]);

function App() {
  const [user, setUser] = useState({});
  const [loading, setLoading] = useState(true);

  const logOutCallback = async () => {
    await fetch("http://localhost:4000/logout", {
      method: "POST",
      credentials: "include",
    });
    // clear user from context
    setUser({});
    // navigate to start page
    navigate("/");
  };

  // First thing, get a new accesstoken if a refreshtoken exists

  useEffect(() => {
    async function checkRefreshToken() {
      const result = await (
        await fetch("http://localhost:4000/refresh_token", {
          method: "POST",
          credentials: "include", // needed to inlcude the cookie
          headers: {
            "Content-Type": "application/json",
          },
        })
      ).json();
      setUser({
        accesstoken: result.accesstoken,
      });
      setLoading(false);
    }
    checkRefreshToken();
  }, []);

  if (loading) return <div>Loading</div>;

  return (
    <UserContext.Provider value={[user, setUser]}>
      <div className="app">
        <Navigation logOutCallback={logOutCallback} />
        <Router id="router">
          <Login path="login" />
          <Register path="register" />
          <Protected path="protected" />
          <Content path="/" />
        </Router>
      </div>
    </UserContext.Provider>
  );
}

export default App;
