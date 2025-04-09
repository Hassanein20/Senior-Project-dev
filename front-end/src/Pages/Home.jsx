import { React } from "react";
import NavBar from "../Components/NavBar/NavBar";
import HomeSec from "../Components/HomeSec/HomeSec";
import AboutSec from "../Components/About/AboutSec";
const Home = () => {
  return (
    <>
      <header
        className='header'
        style={{ position: "fixed", width: "100vw", zIndex: "1000" }}
      >
        <NavBar />
      </header>
      <section id='Home' style={{ paddingTop: "8vh" }}>
        <HomeSec />
      </section>
      <section id='About'>
        <AboutSec />
      </section>
    </>
  );
};

export default Home;
