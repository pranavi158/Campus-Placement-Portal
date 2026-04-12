from flask_sqlalchemy import SQLAlchemy
from werkzeug.security import generate_password_hash
from datetime import datetime
from sqlalchemy import *  

db = SQLAlchemy()

class Admin(db.Model):
    __tablename__ = 'admin'
    id = db.Column(db.Integer, primary_key=True)
    username = db.Column(db.String(100), unique=True)
    password = db.Column(db.String(50))

# stores all students
class Student(db.Model):
    __tablename__ = 'student'
    id = db.Column(db.Integer, primary_key=True)
    name = db.Column(db.String(100))
    email = db.Column(db.String(150), unique=True)
    password = db.Column(db.String(50))
    branch = db.Column(db.String(50))
    cgpa = db.Column(db.Float)
    resume = db.Column(db.String(300))
    blacklisted = db.Column(db.Boolean, default=False)
    application = db.relationship('Application', backref='student', lazy=True)

# company data
class Company(db.Model):
    __tablename__ = 'company'
    id = db.Column(db.Integer, primary_key=True)
    name = db.Column(db.String(100))
    email = db.Column(db.String(150), unique=True)
    password = db.Column(db.String(50))
    industry = db.Column(db.String(50))
    hr = db.Column(db.String(100))
    site = db.Column(db.String(300))
    approved = db.Column(db.Boolean, default=False)
    blacklisted = db.Column(db.Boolean, default=False)
    drive = db.relationship('Drive', backref='company', lazy=True)

# drive data
class Drive(db.Model):
    __tablename__ = 'pdrive'
    id = db.Column(db.Integer, primary_key=True)
    title = db.Column(db.String(100))
    jd = db.Column(db.String(250))
    eligibility = db.Column(db.String(100))
    deadline = db.Column(db.DateTime)
    status = db.Column(db.String(20), default='pending')
    company_id = db.Column(db.Integer, db.ForeignKey('company.id')) 
    application = db.relationship('Application', backref='drive', lazy=True)

# app data
class Application(db.Model):
    __tablename__ = 'application'
    id = db.Column(db.Integer, primary_key=True)
    status = db.Column(db.String(20), default='applied')
    applied_date = db.Column(db.DateTime, default=datetime.utcnow)
    student_id = db.Column(db.Integer, db.ForeignKey('student.id'))
    drive_id = db.Column(db.Integer, db.ForeignKey('pdrive.id'))

def init_db(  app  ): 
    temp = []
    with app.app_context():
        db.create_all()
        # checking if admin exists
        ExistsAdmin = Admin.query.filter_by(username='admin').first() 
        if ExistsAdmin is None:
            if not ExistsAdmin:
                admin_name = "%s" % 'admin'  
                a = Admin(username=admin_name, password=generate_password_hash(admin_name))
                db.session.add(a)
                # commit changes
                db.session.commit()

def compapprove(cid):
    comp = Company.query.get(cid)

    if comp:
        if not comp.approved:
            comp.approved = True
            db.session.commit()