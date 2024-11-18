import { useState } from "react";
import { useNavigate } from "react-router-dom";
import axios from "axios";

const LoginPage = () => {
  const [employeeId, setEmployeeId] = useState("");
  const navigate = useNavigate();

  const handleLogin = async () => {
    try {
      const response = await axios.get(
        `http://127.0.0.1:5000/get-employee/${employeeId}`
      );
      if (response.data) {
        navigate("/clock", { state: { employeeId } });
      } else {
        alert("Employee not found!");
      }
    } catch (error) {
      alert("Error logging in. Please try again.");
    }
  };

  return (
    <div style={{ padding: "2rem" }}>
      <h1>Login</h1>
      <input
        type="text"
        placeholder="Enter Employee Number"
        value={employeeId}
        onChange={(e) => setEmployeeId(e.target.value)}
      />
      <button onClick={handleLogin}>Login</button>
    </div>
  );
};

export default LoginPage;
