from flask_sqlalchemy import SQLAlchemy
from sqlalchemy import Index
from datetime import datetime

db = SQLAlchemy()

class Admin(db.Model):
    __tablename__ = 'admin'
    id = db.Column(db.Integer, primary_key=True)
    username = db.Column(db.String(100), unique=True)
    email = db.Column(db.String(120), unique=True)
    password_hash = db.Column(db.String(255))

class Student(db.Model):
    __tablename__ = 'student'
    id = db.Column(db.Integer, primary_key=True)
    name = db.Column(db.String(100))
    email = db.Column(db.String(120))
    branch = db.Column(db.String(50))
    cgpa = db.Column(db.Float)
    applications = db.relationship('Application', backref='student')
    Index('idx_student_name_id', 'name', 'id')  

class Company(db.Model):
    __tablename__ = 'company'
    id = db.Column(db.Integer, primary_key=True)
    name = db.Column(db.String(100))
    industry = db.Column(db.String(50))
    hr_contact = db.Column(db.String(120))  
    website = db.Column(db.String(255))  
    is_approved = db.Column(db.Boolean, default=False)
    drives = db.relationship('PlacementDrive', backref='company')
    Index('idx_company_name_id', 'name', 'id')  

class PlacementDrive(db.Model):
    __tablename__ = 'placement_drive'
    id = db.Column(db.Integer, primary_key=True)
    title = db.Column(db.String(100))
    job_description = db.Column(db.String(200))
    eligibility_criteria = db.Column(db.String(500))  
    deadline = db.Column(db.DateTime)
    status = db.Column(db.String(20), default='pending')
    company_id = db.Column(db.Integer, db.ForeignKey('company.id'))
    applications = db.relationship('Application', backref='drive')

class Application(db.Model):
    __tablename__ = 'application'
    id = db.Column(db.Integer, primary_key=True)
    status = db.Column(db.String(20), default='applied')
    applied_date = db.Column(db.DateTime, default=datetime.utcnow)
    student_id = db.Column(db.Integer, db.ForeignKey('student.id'))
    drive_id = db.Column(db.Integer, db.ForeignKey('placement_drive.id'))
    drive = db.relationship('PlacementDrive', backref='applications')