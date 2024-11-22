import { useState, useEffect } from "react";
import { useLocation, useNavigate } from "react-router-dom";
import axios from "axios";
import jsPDF from "jspdf";

interface WorkEntry {
  id: number;
  date: string;
  day_of_week: string;
  time_in: string;
  time_out: string | null;
}

const formatDate = (dateStr: string) => {
  const [year, month, day] = dateStr.split("-").map(Number);
  const date = new Date(year, month - 1, day);
  const options: Intl.DateTimeFormatOptions = {
    year: "numeric",
    month: "long",
    day: "numeric",
  };
  return date.toLocaleDateString(undefined, options);
};

const formatTime = (timeStr: string) => {
  const [hours, minutes] = timeStr.split(":").map(Number);
  const date = new Date();
  date.setHours(hours, minutes );
  return date.toLocaleTimeString([], { hour: "numeric", minute: "2-digit", hour12: true });
};

const groupByWeek = (entries: WorkEntry[]) => {
  const weeks: { [key: string]: WorkEntry[] } = {};
  entries.forEach((entry) => {
    const date = new Date(entry.date);
    const weekStart = new Date(date);
    weekStart.setDate(date.getDate() - date.getDay()); // Start of the week (Sunday)
    const weekKey = weekStart.toISOString().split("T")[0];
    if (!weeks[weekKey]) {
      weeks[weekKey] = [];
    }
    weeks[weekKey].push(entry);
  });
  return weeks;
};

const ViewHoursPage: React.FC = () => {
  const { state } = useLocation();
  const navigate = useNavigate();
  const { employeeId } = state as { employeeId: string };
  const [employee, setEmployee] = useState<{ name: string | null }>({ name: "" });
  const [entries, setEntries] = useState<WorkEntry[]>([]);

  useEffect(() => {
    const fetchEntries = async () => {
      try {
        const response = await axios.get(
          `http://127.0.0.1:5000/entries?employee_id=${employeeId}`
        );
        setEntries(response.data);

        //fetch employee name
        const employeeResponse = await axios.get(
          `http://127.0.0.1:5000/get-employee/${employeeId}`
        );
        setEmployee(employeeResponse.data.name);

      } catch (error) {
        console.error("Error fetching entries:", error);
      }
    };

    fetchEntries();
  }, [employeeId]);

  const handleExport = () => {
    const doc = new jsPDF();
    doc.text(`Hours for Employee: ${employeeId} - ${name}`, 10, 10);

    const weeks = groupByWeek(entries);
    let y = 20;
    Object.keys(weeks).forEach((week) => {
      doc.text(`Week starting: ${formatDate(week)}`, 10, y);
      y += 10;
      weeks[week].forEach((entry) => {
        doc.text(
          `  ${entry.day_of_week}, ${formatDate(entry.date)}: Clock-In: ${formatTime(entry.time_in)}, Clock-Out: ${entry.time_out ? formatTime(
            entry.time_out) : "N/A"
          }`,
          10,
          y
        );
        y += 10;
      });
    });
    doc.save("hours.pdf");
  };

  const handleDelete = async (id: number) => {
    try {
      await axios.delete(`http://127.0.0.1:5000/delete-entry/${id}`);
      setEntries(entries.filter((entry) => entry.id !== id));
    } catch (error) {
      console.error("Error deleting entry:", error);
    }
  };

  const handleAddCustomTime = async () => {
    const today = new Date().toISOString().split("T")[0];
    const date = prompt(`Enter the date (YYYY-MM-DD):`, today); // Suggest today's date
    const timeIn = prompt("Enter the clock-in time (HH:MM:SS):");
    const timeOut = prompt("Enter the clock-out time (HH:MM:SS):");

    if (!date || !timeIn) {
      alert("Date and clock-in time are required!");
      return;
    }

    try {
      const response = await axios.post(`http://127.0.0.1:5000/entries`, {
        employee_id: employeeId,
        date,
        time_in: timeIn,
        time_out: timeOut || null,
      });

      const newEntry = response.data; // Assuming the backend returns the newly created entry
      setEntries((prevEntries) => [
        ...prevEntries,
        {
          id: newEntry.id,
          date: newEntry.date,
          day_of_week: new Date(newEntry.date).toLocaleDateString(undefined, {
            weekday: "long",
          }),
          time_in: newEntry.time_in,
          time_out: newEntry.time_out,
        },
      ]);
    } catch (error) {
      console.error("Error adding custom time:", error);
      alert("Failed to add custom time. Please try again.");
    }
  };

  const weeks = groupByWeek(entries);

  return (
    <div style={{ padding: "2rem" }}>
      <h1>Hours Worked</h1>
      <h2>
        Employee:{" "}
        {typeof employee === "string"
          ? employee
          : employee?.name
          ? employee.name
          : "N/A"}
      </h2>{" "}
      <button onClick={() => navigate(-1)}>Back</button>
      <button onClick={handleExport}>Export as PDF</button>
      <button onClick={handleAddCustomTime}>Add Custom Time</button>
      {Object.keys(weeks).map((week) => (
        <div key={week}>
          <h2>Week starting: {formatDate(week)}</h2>
          <ul className="entries">
            {weeks[week].map((entry) => (
              <li key={entry.id}>
                {entry.day_of_week}, {formatDate(entry.date)}: Clock-In:{" "}
                {formatTime(entry.time_in)}, Clock-Out:{" "}
                {entry.time_out ? formatTime(entry.time_out) : "N/A"}
                <button onClick={() => handleDelete(entry.id)}>Delete</button>
              </li>
            ))}
          </ul>
        </div>
      ))}
    </div>
  );
};

export default ViewHoursPage;
