import React from "react";
import { useNavigate } from "react-router-dom";
import { useAuth } from "../Context/AuthContext";
import Standard from "../Components/Users/Standard";

const User = () => {
  const { currentUser, loading } = useAuth();
  const navigate = useNavigate();

  // If still loading auth state, show loading spinner
  if (loading) {
    return (
      <div
        className='d-flex justify-content-center align-items-center'
        style={{ height: "100vh" }}
      >
        <div className='spinner-border text-primary' role='status'>
          <span className='visually-hidden'>Loading...</span>
        </div>
      </div>
    );
  }

  // If not authenticated, redirect to sign in
  if (!currentUser) {
    navigate("/SignIn");
    return null;
  }

  return (
    <>
      <Standard />
    </>
  );
};

export default User;
