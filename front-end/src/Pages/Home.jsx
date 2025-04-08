import { React, useState, useEffect } from "react";
import NavBar from "../Components/NavBar/NavBar";
import HomeSec from "../Components/HomeSec/HomeSec";
import AboutSec from "../Components/About/AboutSec";
const Home = () => {
  const [activeSection, setActiveSection] = useState("Home");

  useEffect(() => {
    const observer = new IntersectionObserver(
      (entries) => {
        entries.forEach((entry) => {
          if (entry.isIntersecting) {
            setActiveSection(entry.target.id);
          }
        });
      },
      {
        threshold: 0.5,
        rootMargin: "-80px 0px 0px 0px", // Adjust for navbar height
      }
    );

    const sections = document.querySelectorAll("section[id]");
    sections.forEach((section) => observer.observe(section));

    return () => observer.disconnect();
  }, []);
  return (
    <>
      <header
        className='header'
        style={{ position: "fixed", width: "100vw", zIndex: "1000" }}
      >
        <NavBar activeSection={activeSection} />
      </header>
      <section id='Home' style={{ paddingTop: "12.8vh" }}>
        <HomeSec />
      </section>
      <section id='About'>
        <AboutSec />
      </section>
    </>
  );
};

export default Home;
