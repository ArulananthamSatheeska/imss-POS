import React, { useState } from 'react';

const AttendanceShiftManagement = () => {
    const [shifts, setShifts] = useState([]);
    const [newShift, setNewShift] = useState({
        name: '',
        startTime: '',
        endTime: ''
    });

    const handleInputChange = (e) => {
        const { name, value } = e.target;
        setNewShift({
            ...newShift,
            [name]: value
        });
    };

    const handleAddShift = (e) => {
        e.preventDefault();
        if (newShift.name && newShift.startTime && newShift.endTime) {
            setShifts([...shifts, newShift]);
            setNewShift({
                name: '',
                startTime: '',
                endTime: ''
            });
        }
    };

    const handleDeleteShift = (index) => {
        const updatedShifts = shifts.filter((_, i) => i !== index);
        setShifts(updatedShifts);
    };

    return (
        <div>
            <h1>Attendance Shift Management</h1>

            <form onSubmit={handleAddShift}>
                <div>
                    <label>Shift Name:</label>
                    <input
                        type="text"
                        name="name"
                        value={newShift.name}
                        onChange={handleInputChange}
                        required
                    />
                </div>
                <div>
                    <label>Start Time:</label>
                    <input
                        type="time"
                        name="startTime"
                        value={newShift.startTime}
                        onChange={handleInputChange}
                        required
                    />
                </div>
                <div>
                    <label>End Time:</label>
                    <input
                        type="time"
                        name="endTime"
                        value={newShift.endTime}
                        onChange={handleInputChange}
                        required
                    />
                </div>
                <button type="submit">Add Shift</button>
            </form>

            <h2>Shifts</h2>
            <ul>
                {shifts.map((shift, index) => (
                    <li key={index}>
                        <strong>{shift.name}</strong>: {shift.startTime} - {shift.endTime}
                        <button onClick={() => handleDeleteShift(index)}>Delete</button>
                    </li>
                ))}
            </ul>
        </div>
    );
};

export default AttendanceShiftManagement;