from flask import Flask, render_template, request, redirect, session, flash
from werkzeug.security import generate_password_hash, check_password_hash
from model import db, init_db, Admin, Student, Company, PlacementDrive, Application
from datetime import datetime

app = Flask(__name__)
app.config['SECRET_KEY'] = 'supersecretkey'
app.config['SQLALCHEMY_DATABASE_URI'] = 'sqlite:///placements.db'
app.config['SQLALCHEMY_TRACK_MODIFICATIONS'] = False

db.init_app(app)
init_db(app)


@app.route('/')
def home():
    if 'role' in session:
        if session['role'] == 'admin':
            return redirect('/admin')
        elif session['role'] == 'company':
            return redirect('/company')
        elif session['role'] == 'student':
            return redirect('/student')
    return redirect('/login')


@app.route('/login', methods=['GET', 'POST'])
def login():
    if request.method == 'POST':
        role = request.form.get('role')
        email = request.form.get('email')
        pas = request.form.get('pas')

        user = None
        if role == 'admin':
            user = Admin.query.filter_by(username=email).first()
        elif role == 'company':
            user = Company.query.filter_by(email=email).first()
        elif role == 'student':
            user = Student.query.filter_by(email=email).first()
        else:
            flash('Invalid role', 'danger')
            return redirect('/login')

        if user:
            if check_password_hash(user.pas, pas):
                if role in ['company', 'student'] and user.blacklisted:
                    flash('Your account is blacklisted', 'danger')
                    return redirect('/login')

                if role == 'company' and not user.appr:
                    flash('Pending Approval', 'warning')
                    return redirect('/login')

                session['user_id'] = user.id
                session['role'] = role
                if role == 'admin':
                    session['name'] = user.username
                else:
                    session['name'] = user.name
                
                flash('Login successful!', 'success')
                return redirect('/')
            else:
                flash('Invalid', 'danger')
        else:
            flash('User not found', 'danger')
            
    return render_template('login.html')


@app.route('/register/student', methods=['GET', 'POST'])
def studentReg():
    if request.method == 'POST':
        name = request.form.get('name')
        email = request.form.get('email')
        pas = request.form.get('pas')
        branch = request.form.get('branch')
        cgpa = request.form.get('cgpa')

        existing_student = Student.query.filter_by(email=email).first()
        if existing_student:
            flash('Already registered!', 'danger')
            return redirect('/register/student')
        
        hashed_password = generate_password_hash(pas)
        student = Student(
            name=name, email=email, pas=hashed_password,
            branch=branch, cgpa=float(cgpa) if cgpa else 0.0
        )
        db.session.add(student)
        db.session.commit()
        
        flash('Registration successful!', 'success')
        return redirect('/login')
        
    return render_template('studentReg.html')


@app.route('/register/company', methods=['GET', 'POST'])
def companyReg():
    if request.method == 'POST':
        name = request.form.get('name')
        email = request.form.get('email')
        pas = request.form.get('pas')
        industry = request.form.get('idy')
        hr_contact = request.form.get('hr')
        website = request.form.get('site')

        existing_company = Company.query.filter_by(email=email).first()
        if existing_company:
            flash('Already registered!', 'danger')
            return redirect('/register/company')
        
        hashed_password = generate_password_hash(pas)
        company = Company(
            name=name, email=email, pas=hashed_password,
            idy=industry, hr=hr_contact, site=website
        )
        db.session.add(company)
        db.session.commit()
        
        flash('Registration successful!', 'success')
        return redirect('/login')
        
    return render_template('companyReg.html')


@app.route('/logout')
def logout():
    session.clear()
    flash('Logged out', 'info')
    return redirect('/login')


@app.route('/admin')
def admin_dashboard():
    if session.get('role') != 'admin':
        return redirect('/login')
        
    students = Student.query.count()
    companies = Company.query.count()
    drives = PlacementDrive.query.count()
    applications = Application.query.count()
    
    return render_template('admin/dashboard.html', students=students, companies=companies, drives=drives, applications=applications)


@app.route('/admin/companies')
def admin_companies():
    if session.get('role') != 'admin':
        return redirect('/login')
        
    search = request.args.get('search', '')
    if search:
        companies = Company.query.filter(Company.name.ilike(f'%{search}%')).all()
    else:
        companies = Company.query.all()
        
    return render_template('admin/manageCom.html', companies=companies)


@app.route('/admin/companies/approve/<int:company_id>')
def apprCom(company_id):
    if session.get('role') != 'admin':
        return redirect('/login')
        
    company = db.session.get(Company, company_id)
    if company:
        company.appr = True
        db.session.commit()
        flash(f'{company.name} approved.', 'success')
        
    return redirect('/admin/companies')


@app.route('/admin/companies/blacklist/<int:company_id>')
def blacklistCom(company_id):
    if session.get('role') != 'admin':
        return redirect('/login')
        
    company = db.session.get(Company, company_id)
    if company:
        if company.blacklisted:
            company.blacklisted = False
            flash(f'{company.name} Blacklist Removed', 'success')
        else:
            company.blacklisted = True
            flash(f'{company.name} Blacklisted', 'success')
        db.session.commit()
        
    return redirect('/admin/companies')


@app.route('/admin/students')
def adminSearchSt():
    if session.get('role') != 'admin':
        return redirect('/login')
        
    search = request.args.get('search', '')
    if search:
        students = Student.query.filter((Student.name.ilike(f'%{search}%')) | (Student.id == search) | (Student.email.ilike(f'%{search}%'))).all()
    else:
        students = Student.query.all()
        
    return render_template('admin/manageSt.html', students=students)


@app.route('/admin/students/blacklist/<int:student_id>')
def blacklistStudent(student_id):
    if session.get('role') != 'admin':
        return redirect('/login')
        
    student = db.session.get(Student, student_id)
    if student:
        if student.blacklisted:
            student.blacklisted = False
            flash(f'{student.name} Blacklist Removed', 'success')
        else:
            student.blacklisted = True
            flash(f'{student.name} Blacklisted', 'success')
        db.session.commit()
        
    return redirect('/admin/students')


@app.route('/admin/drives')
def adminDrives():
    if session.get('role') != 'admin':
        return redirect('/login')
        
    drives = PlacementDrive.query.all()
    return render_template('admin/manageDrives.html', drives=drives)


@app.route('/admin/drives/approve/<int:drive_id>')
def approve_drive(drive_id):
    if session.get('role') != 'admin':
        return redirect('/login')
        
    drive = db.session.get(PlacementDrive, drive_id)
    if drive:
        drive.status = 'approved'
        db.session.commit()
        flash(f'Drive {drive.title} approved', 'success')
        
    return redirect('/admin/drives')


@app.route('/admin/drives/reject/<int:drive_id>')
def reject_drive(drive_id):
    if session.get('role') != 'admin':
        return redirect('/login')
        
    drive = db.session.get(PlacementDrive, drive_id)
    if drive:
        drive.status = 'rejected'
        db.session.commit()
        flash(f'Drive {drive.title} rejected', 'warning')
        
    return redirect('/admin/drives')


@app.route('/admin/applications')
def adminApp():
    if session.get('role') != 'admin':
        return redirect('/login')
        
    applications = Application.query.all()
    return render_template('admin/manageApp.html', applications=applications)


@app.route('/company')
def cDashboard():
    if session.get('role') != 'company':
        return redirect('/login')
        
    company = db.session.get(Company, session['user_id'])
    drives = PlacementDrive.query.filter_by(cmpyID=company.id).all()
    
    return render_template('company/dashboard.html', company=company, drives=drives)


@app.route('/company/profile', methods=['GET', 'POST'])
def cProfile():
    if session.get('role') != 'company':
        return redirect('/login')
        
    company = db.session.get(Company, session['user_id'])
    
    if request.method == 'POST':
        company.name = request.form.get('name')
        company.idy = request.form.get('idy')
        company.hr = request.form.get('hr')
        company.site = request.form.get('site')
        
        db.session.commit()
        session['name'] = company.name
        flash('Company profile updated.', 'success')
        return redirect('/company/profile')
        
    return render_template('company/profile.html', company=company)


@app.route('/company/drive/create', methods=['GET', 'POST'])
def createDrive():
    if session.get('role') != 'company':
        return redirect('/login')
        
    company = db.session.get(Company, session['user_id'])
    if not company.appr:
        flash('Wait for approval', 'warning')
        return redirect('/company')
        
    if request.method == 'POST':
        title = request.form.get('title')
        jd = request.form.get('jd')
        eligibility = request.form.get('eligibility')
        deadline_str = request.form.get('deadline')
        
        if deadline_str:
            deadline = datetime.strptime(deadline_str, '%Y-%m-%d')
        else:
            deadline = None

        new_drive = PlacementDrive(
            title=title,
            jd=jd,
            eligibility=eligibility,
            deadline=deadline,
            cmpyID=session['user_id'],
            status='pending'
        )
        db.session.add(new_drive)
        db.session.commit()
        
        flash('Successful, Wait for approval', 'success')
        return redirect('/company')
        
    return render_template('company/createDrive.html')


@app.route('/company/drive/edit/<int:drive_id>', methods=['GET', 'POST'])
def edit_drive(drive_id):
    if session.get('role') != 'company':
        return redirect('/login')
        
    company = db.session.get(Company, session['user_id'])
    if not company.appr:
        flash('Wait for approval', 'warning')
        return redirect('/company')
        
    drive = db.session.get(PlacementDrive, drive_id)
    if not drive or drive.cmpyID != session['user_id']:
        flash('Unauthorized', 'danger')
        return redirect('/company')
        
    if request.method == 'POST':
        drive.title = request.form.get('title')
        drive.jd = request.form.get('jd')
        drive.eligibility = request.form.get('eligibility')
        deadline_str = request.form.get('deadline')
        
        if deadline_str:
            drive.deadline = datetime.strptime(deadline_str, '%Y-%m-%d')
            
        db.session.commit()
        flash('Update Done', 'success')
        return redirect('/company')
        
    return render_template('company/editDrive.html', drive=drive)


@app.route('/company/drive/close/<int:drive_id>')
def close_drive(drive_id):
    if session.get('role') != 'company':
        return redirect('/login')
        
    drive = db.session.get(PlacementDrive, drive_id)
    if drive and drive.cmpyID == session['user_id']:
        drive.status = 'closed'
        db.session.commit()
        flash('Closed', 'success')
        
    return redirect('/company')


@app.route('/company/drive/delete/<int:drive_id>')
def delete_drive(drive_id):
    if session.get('role') != 'company':
        return redirect('/login')
        
    drive = db.session.get(PlacementDrive, drive_id)
    if drive and drive.cmpyID == session['user_id']:
        Application.query.filter_by(driveID=drive.id).delete()
        db.session.delete(drive)
        db.session.commit()
        flash('Deleted', 'success')
        
    return redirect('/company')


@app.route('/company/drive/<int:drive_id>/applications')
def view_applications(drive_id):
    if session.get('role') != 'company':
        return redirect('/login')
        
    drive = db.session.get(PlacementDrive, drive_id)
    if not drive or drive.cmpyID != session['user_id']:
        flash('Unauthorized', 'danger')
        return redirect('/company')
    
    applications = Application.query.filter_by(driveID=drive.id).all()
    return render_template('company/viewApp.html', drive=drive, applications=applications)


@app.route('/company/application/<int:app_id>/status', methods=['POST'])
def updateAppStatus(app_id):
    if session.get('role') != 'company':
        return redirect('/login')
        
    application = db.session.get(Application, app_id)
    if not application or application.drive.cmpyID != session['user_id']:
        flash('Unauthorized', 'danger')
        return redirect('/company')
    
    status = request.form.get('status')
    if status in ['Applied', 'Shortlisted', 'Selected', 'Rejected']:
        application.status = status
        db.session.commit()
        flash('Status updated', 'success')
        
    return redirect(f'/company/drive/{application.driveID}/applications')


@app.route('/student')
def student_dashboard():
    if session.get('role') != 'student':
        return redirect('/login')
        
    drives = PlacementDrive.query.filter_by(status='approved').all()
    
    student_id = session['user_id']
    appliedDriveID = []
    
    my_applications = Application.query.filter_by(stdID=student_id).all()
    for app in my_applications:
        appliedDriveID.append(app.driveID)
        
    return render_template('student/dashboard.html', drives=drives, appliedDriveID=appliedDriveID)


@app.route('/student/apply/<int:drive_id>', methods=['POST'])
def apply_drive(drive_id):
    if session.get('role') != 'student':
        return redirect('/login')
        
    student_id = session['user_id']
    existing_application = Application.query.filter_by(stdID=student_id, driveID=drive_id).first()
    
    if existing_application:
        flash('Already applied.', 'warning')
        return redirect('/student')
    
    application = Application(stdID=student_id, driveID=drive_id)
    db.session.add(application)
    db.session.commit()
    
    flash('Successfully applied!', 'success')
    return redirect('/student')


@app.route('/student/applications')
def student_applications():
    if session.get('role') != 'student':
        return redirect('/login')
        
    stID = session['user_id']
    applications = Application.query.filter_by(stdID=stID).all()
    
    return render_template('student/viewAppSt.html', applications=applications)


@app.route('/student/profile', methods=['GET', 'POST'])
def stProfile():
    if session.get('role') != 'student':
        return redirect('/login')
        
    student = db.session.get(Student, session['user_id'])
    
    if request.method == 'POST':
        student.name = request.form.get('name')
        student.branch = request.form.get('branch')
        
        cgpa = request.form.get('cgpa')
        if cgpa:
            student.cgpa = float(cgpa)
            
        student.resume = request.form.get('resume')
        
        db.session.commit()
        session['name'] = student.name
        flash('Profile updated', 'success')
        return redirect('/student/profile')
        
    return render_template('student/profile.html', student=student)


@app.errorhandler(404)
def page_not_found(e):
    return render_template('404.html'), 404

@app.errorhandler(500)
def internal_server_error(e):
    return render_template('500.html'), 500


if __name__ == '__main__':
    app.run(debug=True, port=5000)