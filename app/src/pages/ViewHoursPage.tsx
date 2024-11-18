import React, { useState, useEffect } from "react";
import { useLocation } from "react-router-dom";
import axios from "axios";
import jsPDF from "jspdf";

const ViewHoursPage = () => {
  const { state } = useLocation();
  const { employeeId } = state;
  const [entries, setEntries] = useState([]);

  useEffect(() => {
    const fetchEntries = async () => {
      try {
        const response = await axios.get(
          `http://127.0.0.1:5000/entries?employee_id=${employeeId}`
        );
        setEntries(response.data);
      } catch (error) {
        console.error("Error fetching entries:", error);
      }
    };

    fetchEntries();
  }, [employeeId]);

  const handleExport = () => {
    const doc = new jsPDF();
    doc.text(`Hours for Employee: ${employeeId}`, 10, 10);
    entries.forEach((entry, index) => {
      doc.text(
        `${index + 1}. Date: ${entry.date}, Day: ${entry.day_of_week}, In: ${
          entry.time_in
        }, Out: ${entry.time_out || "N/A"}`,
        10,
        20 + index * 10
      );
    });
    doc.save("hours.pdf");
  };

  return (
    <div style={{ padding: "2rem" }}>
      <h1>Hours Worked</h1>
      <ul>
        {entries.map((entry) => (
          <li key={entry.id}>
            Date: {entry.date}, Day: {entry.day_of_week}, In: {entry.time_in},
            Out: {entry.time_out || "N/A"}
          </li>
        ))}
      </ul>
      <button onClick={handleExport}>Export as PDF</button>
    </div>
  );
};

export default ViewHoursPage;
