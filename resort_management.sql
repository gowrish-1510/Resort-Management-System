CREATE TABLE room_booking(
    id VARCHAR(8),
    first_name VARCHAR(20) NOT NULL,
    last_name VARCHAR(20) NOT NULL,
    phone_no NUMBER(10) NOT NULL unique,
    email VARCHAR(25) NOT NULL,
    departure DATE NOT NULL,
    arrival DATE NOT NULL,
    no_guests NUMBER(2) NOT NULL,
    room_type VARCHAR(15),
    PRIMARY KEY(id)
);

CREATE TABLE party_hall(
    id VARCHAR(8),
    first_name VARCHAR(20) NOT NULL,
    last_name VARCHAR(20) NOT NULL,
    phone_no NUMBER(10) NOT NULL unique,
    email VARCHAR(25) NOT NULL,
    arrdate DATE NOT NULL,
    event_time VARCHAR(20) NOT NULL,
    event_type VARCHAR(20) NOT NULL,
    cuisine VARCHAR(15),
    PRIMARY KEY(id)
);

CREATE TABLE Admin (
    admin_id INT PRIMARY KEY,
    admin_name VARCHAR(10),
    phone_no VARCHAR(10) NOT NULL,
    passcode VARCHAR(10),
    salary DECIMAL(10, 2) NOT NULL
);

CREATE TABLE Chef (
    chef_id VARCHAR(5) PRIMARY KEY,
    name VARCHAR(20) NOT NULL,
    phone_no NUMBER(10) NOT NULL,
    email VARCHAR(30) NOT NULL,
    hire_date DATE NOT NULL,
    cuisine VARCHAR(20) NOT NULL CHECK (cuisine in('North indian','South indian','Continental')),
    salary DECIMAL(10, 2) NOT NULL
);

CREATE TABLE Employee (
    employee_id VARCHAR(5) PRIMARY KEY,
    name VARCHAR(20) NOT NULL,
    phone_no NUMBER(10) NOT NULL,
    email VARCHAR(30) NOT NULL,
    hire_date DATE NOT NULL,
    position VARCHAR(50) NOT NULL,
    maintaining VARCHAR(20) CHECK (maintaining in('Room','Party')),
    salary DECIMAL(10, 2) NOT NULL
);

CREATE TABLE Room (
    room_number NUMBER(10) NOT NULL,
    room_type VARCHAR(20) NOT NULL,
    max_capacity INT NOT NULL,
    price_per_night DECIMAL(10, 2) NOT NULL,
    PRIMARY KEY(room_type)
);

CREATE TABLE Party (
    hall_name VARCHAR(50) NOT NULL,
    capacity INT NOT NULL,
    price_per_hour DECIMAL(10, 2) NOT NULL
);

CREATE TABLE Poor_performance(
    id VARCHAR(5),
    name VARCHAR(20),
    email VARCHAR(30),
    PRIMARY KEY(id)
)

-->pl sql blocks
CREATE OR REPLACE TRIGGER check_salary_update
AFTER UPDATE OF salary ON Employee
FOR EACH ROW

BEGIN
    IF :NEW.salary < :OLD.salary THEN
        INSERT INTO Poor_performance (id, name, email)
        VALUES (:OLD.employee_id, :OLD.name, :OLD.email);
    END IF;
END;
/



