import { useState } from "react";
import { useNavigate } from "react-router-dom";
import "./Register.css";

function Register() {

    const navigate = useNavigate();

    const [fullName, setFullName] = useState("");
    const [email, setEmail] = useState("");
    const [password, setPassword] = useState("");
    const [confirmPassword, setConfirmPassword] = useState("");
   

    const [message,setMessage] = useState("");
    const [messageType,setMessageType] = useState("");
    const [errors, setErrors] = useState({});

    const handleInputChange = (field, value, setter) => {
        setter(value);
        setErrors((prev) =>{
            const newErrors = { ...prev};
            delete newErrors [field];
            return newErrors;
        });
    };
// register handle function
    const handleRegister = async (e) => {

        e.preventDefault();

        setMessage("");
        setErrors({});

        try {

            const response = await fetch(
                "http://localhost:5001/api/register",
                {
                    method: "POST",

                    headers: {
                        "Content-Type": "application/json"
                    },

                    body: JSON.stringify({
                        fullName,
                        email,
                        password,
                        confirmPassword
                    })
                }
            );


            const data = await response.json();


            if (!response.ok) {
                if (data.errors) {
                    setErrors(data.errors);
                } else {
                    setErrors({});
                }

                if (data.message && !data.errors) {
                    setMessage(data.message);
                    setMessageType("error");
                }
                return;
            }

// Registration successfully

            setMessage("Registration successful");
            setMessageType("success");
            setErrors({});

 //Login after 1.5second
            setTimeout(() => {
            
                navigate("/login");
            
            }, 1500);



        } catch (errors) {

            console.log(errors);

            setMessage("Unable to connect to server");
            setMessageType("error");
        }
    };


    return (

        <div className="register-page">

            <div className="register-container">

                <h1>Create Account</h1>

                <p className="register-subtitle">
                    Create your account to start shopping
                </p>


                <form onSubmit={handleRegister} noValidate>

                    <div className="input-group">

                        <label>Full Name</label>

                        <input
                            type="text"
                            placeholder="Enter your full name"
                            value={fullName}
                            onChange={(e) =>
                                handleInputChange(
                                    "fullName",
                                    e.target.value,
                                    setFullName
                                )
                            }
                            
                        />
                        {errors.fullName && (
                            <p className="field-error">
                                {errors.fullName}
                            </p>
                        )}

                    </div>


                    <div className="input-group">

                        <label>Email</label>

                        <input
                            type="email"
                            placeholder="Enter your email"
                            value={email}
                            onChange={(e) =>
                                handleInputChange(
                                    "email",
                                    e.target.value,
                                    setEmail
                                )
                            }
                            
                        />
                        {errors.email &&(
                            <p className="field-error">
                                {errors.email}
                            </p>
                        )}

                    </div>


                    <div className="input-group">

                        <label>Password</label>

                        <input
                            type="password"
                            placeholder="Create a password"
                            value={password}
                            onChange={(e) =>
                                handleInputChange (
                                    "password",
                                    e.target.value,
                                    setPassword
                                ) 
                            }
                            
                        />
                        {errors.password && (
                            <p className="field-error">
                                {errors.password}
                            </p>
                        )}

                    </div>


                    <div className="input-group">

                        <label>Confirm Password</label>

                        <input
                            type="password"
                            placeholder="Confirm your password"
                            value={confirmPassword}
                            onChange={(e) =>
                                handleInputChange("confirmPassword",
                                    e.target.value,
                                    setConfirmPassword)
                            }
                            
                        />
                        {errors.confirmPassword && (
                         <p className="field-error">
                                {errors.confirmPassword}
                                </p>
                                )}
                    </div>

                    {/* Message */}
                    {message && (
                        <p className={`form-message ${messageType}`}>
                            {message}
                        </p>
                    )}

                    <button
                        type="submit"
                        className="register-btn"
                    >
                        Register
                    </button>

                </form>


                <p className="login-text">

                    Already have an account?

                    <button
                        type="button"
                        className="link-btn"
                        onClick={() =>
                            navigate("/login")
                        }
                    >
                        Login
                    </button>

                </p>

            </div>

        </div>
    );
}

export default Register;