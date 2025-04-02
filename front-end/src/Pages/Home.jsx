import React from "react";
import NavBar from "../Components/NavBar/NavBar";
import HomeSec from "../Components/HomeSec/HomeSec";
const Home = () => {
  return (
    <>
      <header className='header'>
        <NavBar />
      </header>
      <section id='Home'>
        <HomeSec />
      </section>
    </>
  );
};

export default Home;
