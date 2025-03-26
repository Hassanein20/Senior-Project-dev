import React from "react";

const Registration = () => {
  return (
    <form className='formRegistration'>
      <h3>Sign UP</h3>
      <div className='inputs'>
        <label className='email'>Email: </label>
        <input className='inemail' autoFocus />
      </div>
      <div className='inputs'>
        <label className='pass'>Password: </label>
        <input className='inpass' type='password' />
      </div>
      <input type='submit' value='submit' className='RSubmit' />
    </form>
  );
};

export default Registration;
