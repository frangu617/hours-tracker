from flask import Flask, request, jsonify
from flask_sqlalchemy import SQLAlchemy
from flask_cors import CORS
from datetime import datetime
import pytz

app = Flask(__name__)
CORS(app)

# Configure SQLite database
app.config['SQLALCHEMY_DATABASE_URI'] = 'sqlite:///worked_hours.db'
app.config['SQLALCHEMY_TRACK_MODIFICATIONS'] = False
db = SQLAlchemy(app)

# Define the Employee model
class Employee(db.Model):
    id = db.Column(db.String(20), primary_key=True)  # Predetermined unique ID
    name = db.Column(db.String(50), nullable=False)
    work_entries = db.relationship('WorkEntry', backref='employee', lazy=True)

# Define the WorkEntry model
class WorkEntry(db.Model):
    id = db.Column(db.Integer, primary_key=True)
    employee_id = db.Column(db.String(20), db.ForeignKey('employee.id'), nullable=False)
    date = db.Column(db.Date, nullable=False)
    day_of_week = db.Column(db.String(20), nullable=False)
    time_in = db.Column(db.Time, nullable=False)
    time_out = db.Column(db.Time)

# Routes
@app.route('/add-employee', methods=['POST'])
def add_employee():
    data = request.json
    # Check if ID already exists
    if Employee.query.get(data['id']):
        return jsonify({'error': 'Employee ID already exists'}), 400
    new_employee = Employee(
        id=data['id'], 
        name=data['name']
    )
    db.session.add(new_employee)
    db.session.commit()
    return jsonify({'message': 'Employee added successfully!', 'employee_id': new_employee.id})

@app.route('/delete-employee/<int:employee_id>', methods=['DELETE'])
def delete_employee(employee_id):
    employee = Employee.query.get(employee_id)
    if not employee:
        return jsonify({'error': 'Employee not found'}), 404
    db.session.delete(employee)
    db.session.commit()
    return jsonify({'message': 'Employee deleted successfully!'})

@app.route('/get-employee/<int:employee_id>', methods=['GET'])
def get_employee(employee_id):
    employee = Employee.query.get(employee_id)
    if not employee:
        return jsonify({'error': 'Employee not found'}), 404
    return jsonify({'id': employee.id, 'name': employee.name})

@app.route('/get-employees', methods=['GET'])
def get_employees():
    employees = Employee.query.all()
    result = [{'id': employee.id, 'name': employee.name, 'work_entries': [entry.id for entry in employee.work_entries]} for employee in employees]
    return jsonify(result)

from datetime import datetime
import pytz

# Set your desired time zone (replace 'America/New_York' with your local time zone)
LOCAL_TIMEZONE = pytz.timezone('America/New_York')

@app.route('/clock-in', methods=['POST'])
def clock_in():
    data = request.json
    employee = Employee.query.get(data['employee_id'])
    if not employee:
        return jsonify({'error': 'Employee not found'}), 404

    now = datetime.now(LOCAL_TIMEZONE)  # Use local time zone
    entry = WorkEntry(
        employee_id=employee.id,
        date=now.date(),
        day_of_week=now.strftime('%A'),
        time_in=now.time()
    )
    db.session.add(entry)
    db.session.commit()
    return jsonify({'message': 'Clocked in successfully!', 'entry_id': entry.id})

@app.route('/clock-out/<int:entry_id>', methods=['POST'])
def clock_out(entry_id):
    entry = WorkEntry.query.get(entry_id)
    if not entry:
        return jsonify({'error': 'Entry not found'}), 404

    now = datetime.now(LOCAL_TIMEZONE)  # Use local time zone
    entry.time_out = now.time()
    db.session.commit()
    return jsonify({'message': 'Clocked out successfully!'})


@app.route('/entries', methods=['GET'])
def get_entries():
    entries = WorkEntry.query.all()
    result = [
        {
            'id': entry.id,
            'employee_id': entry.employee_id,
            'employee_name': entry.employee.name,
            'date': entry.date.isoformat(),
            'day_of_week': entry.day_of_week,
            'time_in': entry.time_in.strftime('%H:%M:%S'),
            'time_out': entry.time_out.strftime('%H:%M:%S') if entry.time_out else None
        }
        for entry in entries
    ]
    return jsonify(result)

@app.route('/entries', methods=['POST'])
def add_custom_entry():
    data = request.json
    employee = Employee.query.get(data['employee_id'])
    if not employee:
        return jsonify({'error': 'Employee not found'}), 404

    new_entry = WorkEntry(
        employee_id=employee.id,
        date=datetime.strptime(data['date'], '%Y-%m-%d').date(),
        day_of_week=datetime.strptime(data['date'], '%Y-%m-%d').strftime('%A'),
        time_in=datetime.strptime(data['time_in'], '%H:%M:%S').time(),
        time_out=datetime.strptime(data['time_out'], '%H:%M:%S').time() if data['time_out'] else None
    )
    db.session.add(new_entry)
    db.session.commit()

    return jsonify({
        'id': new_entry.id,
        'date': new_entry.date.isoformat(),
        'day_of_week': new_entry.day_of_week,
        'time_in': new_entry.time_in.strftime('%H:%M:%S'),
        'time_out': new_entry.time_out.strftime('%H:%M:%S') if new_entry.time_out else None
    })

@app.route('/delete-entry/<int:entry_id>', methods=['DELETE'])
def delete_entry(entry_id):
    entry = WorkEntry.query.get(entry_id)
    if not entry:
        return jsonify({'error': 'Entry not found'}), 404
    db.session.delete(entry)
    db.session.commit()
    return jsonify({'message': 'Entry deleted successfully!'})

@app.route('/export', methods=['GET'])
def export_data():
    entries = WorkEntry.query.all()
    csv_data = "id,employee_id,employee_name,date,day_of_week,time_in,time_out\n"
    for entry in entries:
        csv_data += f"{entry.id},{entry.employee_id},{entry.employee.name},{entry.date},{entry.day_of_week},{entry.time_in},{entry.time_out or ''}\n"
    return csv_data, 200, {'Content-Type': 'text/csv'}

if __name__ == '__main__':
    with app.app_context():
        db.create_all()  # Create tables
    app.run(debug=True)
