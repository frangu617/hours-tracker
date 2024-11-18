import React, { useEffect, useState } from "react";
import { useLocation, useNavigate } from "react-router-dom";
import axios from "axios";

const ClockPage: React.FC = () => {
  const { state } = useLocation();
  const { employeeId } = state as { employeeId: string };
  const [lastAction, setLastAction] = useState<"Clock In" | "Clock Out" | null>(
    null
  );
  const navigate = useNavigate();

  const fetchLastEntry = async () => {
    try {
      const response = await axios.get(
        `http://127.0.0.1:5000/entries?employee_id=${employeeId}`
      );
      const entries = response.data;
      if (entries.length > 0) {
        const lastEntry = entries[entries.length - 1];
        setLastAction(lastEntry.time_out ? "Clock In" : "Clock Out");
      } else {
        setLastAction("Clock In");
      }
    } catch (error) {
      console.error("Error fetching last entry:", error);
    }
  };

  useEffect(() => {
    fetchLastEntry();
  }, [employeeId]);

  const handleClockAction = async () => {
    try {
      if (lastAction === "Clock In") {
        await axios.post("http://127.0.0.1:5000/clock-in", {
          employee_id: employeeId,
        });
      } else {
        const response = await axios.get(
          `http://127.0.0.1:5000/entries?employee_id=${employeeId}`
        );
        const lastEntry = response.data[response.data.length - 1];
        await axios.post(`http://127.0.0.1:5000/clock-out/${lastEntry.id}`);
      }
      alert(
        `Successfully ${
          lastAction === "Clock In" ? "Clocked In" : "Clocked Out"
        }!`
      );
      fetchLastEntry(); // Refresh the last action dynamically
    } catch (error) {
      console.error("Error performing clock action:", error);
      alert("An error occurred. Please try again.");
    }
  };

  return (
    <div style={{ padding: "2rem" }}>
      <h1>
        {lastAction === "Clock In" ? "Ready to Clock In" : "Ready to Clock Out"}
      </h1>
      <button onClick={handleClockAction}>{lastAction}</button>
      <button
        onClick={() => navigate("/view-hours", { state: { employeeId } })}
      >
        View Hours
      </button>
    </div>
  );
};

export default ClockPage;
