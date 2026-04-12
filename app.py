from flask import Flask, render_template, request, redirect, session, flash
from os import *  
from werkzeug.security import generate_password_hash, check_password_hash
from model import db, init_db, Admin, Student, Company, Drive, Application
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
        r = session['role']
        if r == 'admin':
            return redirect('/admin')
        elif r == 'company':
            return redirect('/company')
        elif r == 'student':
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
            if check_password_hash(user.password, pas):
                if role in ['company', 'student']:
                    if user.blacklisted:
                        flash('Your account is blacklisted', 'danger')
                        return redirect('/login')

                if role == 'company' and not user.approved:
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
def student_registration():
    if request.method == 'POST':
        name = request.form.get('name')
        email = request.form.get('email')
        pas = request.form.get('pas')
        branch = request.form.get('branch')
        cgpa = request.form.get('cgpa')

        check  =   Student.query.filter_by( email=   email ).first()  
        if check:
            flash('Already registered!', 'danger')
            return redirect('/register/student')

        hashed = generate_password_hash(pas)

        cgpa_val = 0.0
        if cgpa:
            cgpa_val = float(cgpa)

        student = Student(
            name=name, email=email, password=hashed,
            branch=branch, cgpa=cgpa_val
        )
        db.session.add(student)
        db.session.commit()

        flash('Registration successful!', 'success')
        return redirect('/login')

    return render_template('studentReg.html')

@app.route('/register/company', methods=['GET', 'POST'])
def company_registration():
    if request.method == 'POST':
        name = request.form.get('name')
        email = request.form.get('email')
        pas = request.form.get('pas')
        idy = request.form.get('idy')
        hr = request.form.get('hr')
        site = request.form.get('site')

        comExists = Company.query.filter_by(email=email).first()
        if comExists:
            flash('Already registered!', 'danger')
            return redirect('/register/company')

        hashed = generate_password_hash(pas)
        company = Company(
            name=name, email=email, password=hashed,
            industry=idy, hr=hr, site=site
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

    stds = Student.query.count()
    cmps = Company.query.count()
    drs = Drive.query.count()
    appls = Application.query.count()

    return render_template('admin/dashboard.html', students=stds, companies=cmps, drives=drs, applications=appls)

@app.route('/admin/companies')
def manage_companies():
    if session.get('role') != 'admin':
        return redirect('/login')

    search = request.args.get('search', '')
    if search:
        cmps = Company.query.filter(Company.name.ilike(f'%{search}%')).all()
    else:
        cmps = Company.query.all()

    return render_template('admin/manageCom.html', companies=cmps)

@app.route('/admin/companies/approve/<int:company_id>')
def approve_company(company_id):
    if session.get('role') != 'admin':
        return redirect('/login')

    company = db.session.get(Company, company_id)
    if company:
        company.approved = True
        db.session.commit()
        flash(f'{company.name} approved.', 'success')

    return redirect('/admin/companies')

@app.route('/admin/companies/blacklist/<int:company_id>')
def blacklist_company(company_id):
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
def admin_search_students():
    if session.get('role') != 'admin':
        return redirect('/login')

    search = request.args.get('search', '')
    if search:
        student = Student.query.filter(
            (Student.name.ilike(f'%{search}%')) |
            (Student.id == search) |
            (Student.email.ilike(f'%{search}%'))
        ).all()
    else:
        student = Student.query.all()

    return render_template('admin/manageSt.html', students=student)

@app.route('/admin/students/blacklist/<int:student_id>')
def blacklist_student(student_id):
    if session.get('role') != 'admin':
        return redirect('/login')

    student = db.session.get(Student, student_id)
    if student:
        if student.blacklisted:
            student.blacklisted = False
            flash('%s Blacklist Removed' % student.name, 'success')  
        else:
            student.blacklisted = True
            flash(f'{student.name} Blacklisted', 'success')
        db.session.commit()

    return redirect('/admin/students')

@app.route('/admin/drives')
def admin_drives():
    if session.get('role') != 'admin':
        return redirect('/login')

    drives = Drive.query.all()
    return render_template('admin/manageDrives.html', drives=drives)

@app.route('/admin/drives/approve/<int:drive_id>')
def approve_drive(drive_id):
    if session.get('role') != 'admin':
        return redirect('/login')

    drive = db.session.get(Drive, drive_id)
    if drive:
        drive.status = 'approved'
        db.session.commit()
        flash(f'Drive {drive.title} approved', 'success')

    return redirect('/admin/drives')

@app.route('/admin/drives/reject/<int:drive_id>')
def reject_drive(drive_id):
    if session.get('role') != 'admin':
        return redirect('/login')

    drive = db.session.get(Drive, drive_id)
    if drive:
        drive.status = 'rejected'
        db.session.commit()
        flash(f'Drive {drive.title} rejected', 'warning')

    return redirect('/admin/drives')

@app.route('/admin/applications')
def admin_applications():
    if session.get('role') != 'admin':
        return redirect('/login')

    appls = Application.query.all()
    return render_template('admin/manageApp.html', applications=appls)

@app.route('/company')
def company_dashboard():
    if session.get('role') != 'company':
        return redirect('/login')

    company = db.session.get(Company, session['user_id'])
    drives = Drive.query.filter_by(company_id=company.id).all()

    return render_template('company/dashboard.html', company=company, drives=drives)

@app.route('/company/profile', methods=['GET', 'POST'])
def company_profile():
    if session.get('role') != 'company':
        return redirect('/login')

    company = db.session.get(Company, session['user_id'])

    if request.method == 'POST':
        company.name = request.form.get('name')
        company.industry = request.form.get('idy')
        company.hr = request.form.get('hr')
        company.site = request.form.get('site')

        db.session.commit()
        session['name'] = company.name
        flash('Profile updated', 'success')
        return redirect('/company/profile')

    return render_template('company/profile.html', company=company)

@app.route('/company/drive/create', methods=['GET', 'POST'])
def create_drive():
    if session.get('role') != 'company':
        return redirect('/login')

    company = db.session.get(Company, session['user_id'])
    if not company.approved:
        flash('Wait for approval', 'warning')
        return redirect('/company')

    if request.method == 'POST':
        title = request.form.get('title')
        jd = request.form.get('jd')
        el = request.form.get('eligibility')
        dd = request.form.get('deadline')

        deadline_val = None
        if dd:
            deadline_val = datetime.strptime(dd, '%Y-%m-%d')

        new_drive = Drive(
            title=title,
            jd=jd,
            eligibility=el,
            deadline=deadline_val,
            company_id=session['user_id'],
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
    if not company.approved:
        flash('Wait for approval', 'warning')
        return redirect('/company')

    drive = db.session.get(Drive, drive_id)
    if not drive or drive.company_id != session['user_id']:
        flash('Unauthorized', 'danger')
        return redirect('/company')

    if request.method == 'POST':
        drive.title = request.form.get('title')
        drive.jd = request.form.get('jd')
        drive.eligibility = request.form.get('eligibility')
        dd = request.form.get('deadline')

        if dd:
            drive.deadline = datetime.strptime(dd, '%Y-%m-%d')

        db.session.commit()
        flash('Update Done', 'success')
        return redirect('/company')

    return render_template('company/editDrive.html', drive=drive)

@app.route('/company/drive/close/<int:drive_id>')
def close_drive(drive_id):
    if session.get('role') != 'company':
        return redirect('/login')

    drive = db.session.get(Drive, drive_id)
    if drive and drive.company_id == session['user_id']:
        drive.status = 'closed'
        db.session.commit()
        flash('Closed', 'success')

    return redirect('/company')

@app.route('/company/drive/delete/<int:drive_id>')
def delete_drive(drive_id):
    if session.get('role') != 'company':\
        return redirect('/login')

    drive = db.session.get(Drive, drive_id)
    if drive and drive.company_id == session['user_id']:
        Application.query.filter_by(drive_id=drive.id).delete()
        db.session.delete(drive)
        db.session.commit()
        flash('Deleted', 'success')

    return redirect('/company')

@app.route('/company/drive/<int:drive_id>/applications')
def view_applications(drive_id):
    if session.get('role') != 'company':
        return redirect('/login')

    drive = db.session.get(Drive, drive_id)
    if not drive or drive.company_id != session['user_id']:
        flash('Unauthorized', 'danger')
        return redirect('/company')

    applications = Application.query.filter_by(drive_id=drive.id).all()
    return render_template('company/viewApp.html', drive=drive, applications=applications)

@app.route('/company/application/<int:app_id>/status', methods=['POST'])
def update_appstatus(app_id):
    if session.get('role') != 'company':
        return redirect('/login')

    applied = db.session.get(Application, app_id)
    if not applied or applied.drive.company_id != session['user_id']:
        flash('Unauthorized', 'danger')
        return redirect('/company')

    status = request.form.get('status')
    valid_status = ['Applied', 'Shortlisted', 'Selected', 'Rejected']
    if status in valid_status:
        applied.status = status
        db.session.commit()
        flash('Status updated', 'success')

    return redirect(f'/company/drive/{applied.drive_id}/applications')

@app.route('/student')
def student_dashboard():
    if session.get('role') != 'student':
        return redirect('/login')

    drives = Drive.query.filter_by(status='approved').all()

    student_id = session['user_id']
    AppliedDriveIDs = []  

    applications = Application.query.filter_by(student_id=student_id).all()
    for a in applications:
        AppliedDriveIDs.append(a.drive_id)

    return render_template('student/dashboard.html', drives=drives, appliedDriveID=AppliedDriveIDs)

@app.route('/student/apply/<int:drive_id>', methods=['POST'])
def apply_drive(drive_id):
    if session.get('role') != 'student':
        return redirect('/login')

    student_id = session['user_id']

    eApp = Application.query.filter_by(student_id=student_id, drive_id=drive_id).first()
    if eApp:
        flash('Already applied.', 'warning')
        return redirect('/student')

    application = Application(student_id=student_id, drive_id=drive_id)
    db.session.add(application)
    db.session.commit()

    flash('Successfully applied!', 'success')
    return redirect('/student')

@app.route('/student/applications')
def student_applications():
    if session.get('role') != 'student':
        return redirect('/login')

    student_id = session['user_id']
    appls = Application.query.filter_by(student_id=student_id).all()

    return render_template('student/viewAppSt.html', applications=appls)

@app.route('/student/profile', methods=['GET', 'POST'])
def student_profile():
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

# error handling
@app.errorhandler(404)
def page_not_found(e):
    return render_template('404.html'), 404

@app.errorhandler(500)
def internal_server_error(e):
    return render_template('500.html'), 500

if __name__ == '__main__':
    app.run(debug=True, port=5000)