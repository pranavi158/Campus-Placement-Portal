from flask_sqlalchemy import SQLAlchemy
from werkzeug.security import generate_password_hash
from datetime import datetime

db = SQLAlchemy()

class Admin(db.Model):
    __tablename__ = 'admin'
    id = db.Column(db.Integer, primary_key=True)
    username = db.Column(db.String(100), unique=True)
    pas = db.Column(db.String(255))

class Student(db.Model):
    __tablename__ = 'student'
    id = db.Column(db.Integer, primary_key=True)
    name = db.Column(db.String(100))
    email = db.Column(db.String(120), unique=True)
    pas = db.Column(db.String(255))
    branch = db.Column(db.String(50))
    cgpa = db.Column(db.Float)
    resume = db.Column(db.String(255))
    blacklisted = db.Column(db.Boolean, default=False)
    application = db.relationship('Application', backref='student', lazy=True)

class Company(db.Model):
    __tablename__ = 'company'
    id = db.Column(db.Integer, primary_key=True)
    name = db.Column(db.String(100))
    email = db.Column(db.String(120), unique=True)
    pas = db.Column(db.String(255))
    idy = db.Column(db.String(50))
    hr = db.Column(db.String(120))  
    site = db.Column(db.String(255))  
    appr = db.Column(db.Boolean, default=False)
    blacklisted = db.Column(db.Boolean, default=False)
    drive = db.relationship('PlacementDrive', backref='company', lazy=True)

class PlacementDrive(db.Model):
    __tablename__ = 'pdrive'
    id = db.Column(db.Integer, primary_key=True)
    title = db.Column(db.String(100))
    jd = db.Column(db.String(500))
    eligibility = db.Column(db.String(500))  
    deadline = db.Column(db.DateTime)
    status = db.Column(db.String(20), default='pending') # pending, approved, rejected, closed
    cmpyID = db.Column(db.Integer, db.ForeignKey('company.id'))
    application = db.relationship('Application', backref='drive', lazy=True)

class Application(db.Model):
    __tablename__ = 'application'
    id = db.Column(db.Integer, primary_key=True)
    status = db.Column(db.String(20), default='applied') # applied, shortlisted, selected, rejected
    appDate = db.Column(db.DateTime, default=datetime.utcnow)
    stdID = db.Column(db.Integer, db.ForeignKey('student.id'))
    driveID = db.Column(db.Integer, db.ForeignKey('pdrive.id'))

def init_db(app):
    with app.app_context():
        db.create_all()
        if not Admin.query.filter_by(username='admin').first():
            admin = Admin(
                username='admin',
                pas=generate_password_hash('admin')
            )
            db.session.add(admin)
            db.session.commit()