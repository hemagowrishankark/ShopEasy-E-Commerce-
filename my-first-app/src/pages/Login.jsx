import { useState } from "react";
import { useNavigate } from "react-router-dom";
import "./Login.css";

function Login() {

    const navigate = useNavigate();

    const [email, setEmail] = useState("");
    const [password, setPassword] = useState("");

    const [message,setMessage] = useState("");
    const [messageType,setMessageType] = useState("");
    const [errors, setErrors] = useState({});

    const handleLogin = async (e) => {

        e.preventDefault();

        setMessage("");
        setErrors({});
        try {

            const response = await fetch(
                "http://localhost:5001/api/login",
                {
                    method: "POST",

                    headers: {
                        "Content-Type": "application/json"
                    },

                    body: JSON.stringify({
                        email,
                        password
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

// JWT save

            localStorage.setItem("token", data.token);
            localStorage.setItem("userEmail", email.toLowerCase());

// login success message
            setMessage("Login Successful");
            setMessageType("success");
            setErrors({});

            window.dispatchEvent(new Event("authChanged"));

// Login success navigation
            const ADMIN_EMAILS = ["shopeasy@gmail.com", "admin@gmail.com"];
            setTimeout(() => {
                if (ADMIN_EMAILS.includes(email.trim().toLowerCase())) {
                    navigate("/admin");
                } else {
                    navigate("/");
                }
            }, 1000);
            

        } catch (error) {

            console.log(error);

            setMessage("Unable to connect to server");
            setMessageType("error");
        }
    };


    return (
        <div className="login-page">

            <div className="login-container">

                 <div className="login-icon">
                    👤
                </div>

                <h1>Welcome Back </h1>

                <p className="login-subtitle">
                    Login to continue shopping
                </p>


                <form onSubmit={handleLogin} noValidate>

                    <div className="input-group">

                        <label>Email</label>

                        <input
                            type="email"
                            placeholder="Enter your email"
                            value={email}
                            onChange={(e) =>
                                setEmail(e.target.value)
                            }
                            required     
                        />
                        {errors.email &&(
                            <p className="field-error">
                                {errors.email}
                            </p>
                        )
                        }
                       

                    </div>


                    <div className="input-group">

                        <label>Password</label>

                        <input
                            type="password"
                            placeholder="Enter your password"
                            value={password}
                            onChange={(e) =>
                                setPassword(e.target.value)
                            }
                           required 
                        />
                        {errors.password && (
                            <p className="field-error">
                                {errors.password}
                            </p>
                        )}

                    </div>
      
                 {message && (
                <p className={`form-message ${messageType}`}>
                     {message}
                </p>
                )}

                    <button
                        type="submit"
                        className="login-btn"
                    >
                        Login
                    </button>

                </form>


                <p className="register-text">

                    Don't have an account?

                    <button
                        type="button"
                        className="link-btn"
                        onClick={() =>
                            navigate("/register")
                        }
                    >
                        Register
                    </button>

                </p>

            </div>

        </div>
    );
}

export default Login;