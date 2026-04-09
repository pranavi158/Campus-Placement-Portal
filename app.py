from flask import Flask, render_template, request, redirect, url_for, session, flash
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
            return redirect(url_for('admin_dashboard'))
        elif session['role'] == 'company':
            return redirect(url_for('company_dashboard'))
        elif session['role'] == 'student':
            return redirect(url_for('student_dashboard'))
    return redirect(url_for('login'))


@app.route('/login', methods=['GET', 'POST'])
def login():
    if request.method == 'POST':
        role = request.form.get('role')
        username_or_email = request.form.get('username_or_email')
        password = request.form.get('password')

        user = None
        if role == 'admin':
            user = Admin.query.filter_by(username=username_or_email).first()
        elif role == 'company':
            user = Company.query.filter_by(email=username_or_email).first()
        elif role == 'student':
            user = Student.query.filter_by(email=username_or_email).first()
        else:
            flash('Invalid role selected.', 'danger')
            return redirect(url_for('login'))

        if user:
            if check_password_hash(user.password_hash, password):
                if role in ['company', 'student'] and user.is_blacklisted:
                    flash('Your account has been blacklisted.', 'danger')
                    return redirect(url_for('login'))

                if role == 'company' and not user.is_approved:
                    flash('Your company account is pending admin approval.', 'warning')
                    return redirect(url_for('login'))

                session['user_id'] = user.id
                session['role'] = role
                if role == 'admin':
                    session['name'] = user.username
                else:
                    session['name'] = user.name
                
                flash('Login successful!', 'success')
                return redirect(url_for('home'))
            else:
                flash('Invalid credentials.', 'danger')
        else:
            flash('User not found.', 'danger')
            
    return render_template('login.html')


@app.route('/register/student', methods=['GET', 'POST'])
def register_student():
    if request.method == 'POST':
        name = request.form.get('name')
        email = request.form.get('email')
        password = request.form.get('password')
        branch = request.form.get('branch')
        cgpa = request.form.get('cgpa')

        existing_student = Student.query.filter_by(email=email).first()
        if existing_student:
            flash('Email already registered!', 'danger')
            return redirect(url_for('register_student'))
        
        hashed_password = generate_password_hash(password)
        student = Student(
            name=name, email=email, password_hash=hashed_password,
            branch=branch, cgpa=float(cgpa) if cgpa else 0.0
        )
        db.session.add(student)
        db.session.commit()
        
        flash('Student registration successful! You can now log in.', 'success')
        return redirect(url_for('login'))
        
    return render_template('register_student.html')


@app.route('/register/company', methods=['GET', 'POST'])
def register_company():
    if request.method == 'POST':
        name = request.form.get('name')
        email = request.form.get('email')
        password = request.form.get('password')
        industry = request.form.get('industry')
        hr_contact = request.form.get('hr_contact')
        website = request.form.get('website')

        existing_company = Company.query.filter_by(email=email).first()
        if existing_company:
            flash('Email already registered!', 'danger')
            return redirect(url_for('register_company'))
        
        hashed_password = generate_password_hash(password)
        company = Company(
            name=name, email=email, password_hash=hashed_password,
            industry=industry, hr_contact=hr_contact, website=website
        )
        db.session.add(company)
        db.session.commit()
        
        flash('Company registration successful! Please wait for admin approval.', 'success')
        return redirect(url_for('login'))
        
    return render_template('register_company.html')


@app.route('/logout')
def logout():
    session.clear()
    flash('Logged out successfully.', 'info')
    return redirect(url_for('login'))


# --- ADMIN ROUTES ---

@app.route('/admin')
def admin_dashboard():
    if session.get('role') != 'admin':
        return redirect(url_for('login'))
        
    students = Student.query.count()
    companies = Company.query.count()
    drives = PlacementDrive.query.count()
    applications = Application.query.count()
    
    return render_template('admin/dashboard.html', students=students, companies=companies, drives=drives, applications=applications)


@app.route('/admin/companies')
def admin_companies():
    if session.get('role') != 'admin':
        return redirect(url_for('login'))
        
    search = request.args.get('search', '')
    if search:
        companies = Company.query.filter(Company.name.ilike(f'%{search}%')).all()
    else:
        companies = Company.query.all()
        
    return render_template('admin/manage_companies.html', companies=companies)


@app.route('/admin/companies/approve/<int:company_id>')
def approve_company(company_id):
    if session.get('role') != 'admin':
        return redirect(url_for('login'))
        
    company = db.session.get(Company, company_id)
    if company:
        company.is_approved = True
        db.session.commit()
        flash(f'{company.name} approved successfully.', 'success')
        
    return redirect(url_for('admin_companies'))


@app.route('/admin/companies/blacklist/<int:company_id>')
def blacklist_company(company_id):
    if session.get('role') != 'admin':
        return redirect(url_for('login'))
        
    company = db.session.get(Company, company_id)
    if company:
        if company.is_blacklisted:
            company.is_blacklisted = False
            flash(f'{company.name} Un-blacklisted successfully.', 'success')
        else:
            company.is_blacklisted = True
            flash(f'{company.name} Blacklisted successfully.', 'success')
        db.session.commit()
        
    return redirect(url_for('admin_companies'))


@app.route('/admin/students')
def admin_students():
    if session.get('role') != 'admin':
        return redirect(url_for('login'))
        
    search = request.args.get('search', '')
    if search:
        students = Student.query.filter((Student.name.ilike(f'%{search}%')) | (Student.id == search) | (Student.email.ilike(f'%{search}%'))).all()
    else:
        students = Student.query.all()
        
    return render_template('admin/manage_students.html', students=students)


@app.route('/admin/students/blacklist/<int:student_id>')
def blacklist_student(student_id):
    if session.get('role') != 'admin':
        return redirect(url_for('login'))
        
    student = db.session.get(Student, student_id)
    if student:
        if student.is_blacklisted:
            student.is_blacklisted = False
            flash(f'{student.name} Un-blacklisted successfully.', 'success')
        else:
            student.is_blacklisted = True
            flash(f'{student.name} Blacklisted successfully.', 'success')
        db.session.commit()
        
    return redirect(url_for('admin_students'))


@app.route('/admin/drives')
def admin_drives():
    if session.get('role') != 'admin':
        return redirect(url_for('login'))
        
    drives = PlacementDrive.query.all()
    return render_template('admin/manage_drives.html', drives=drives)


@app.route('/admin/drives/approve/<int:drive_id>')
def approve_drive(drive_id):
    if session.get('role') != 'admin':
        return redirect(url_for('login'))
        
    drive = db.session.get(PlacementDrive, drive_id)
    if drive:
        drive.status = 'approved'
        db.session.commit()
        flash(f'Drive {drive.title} approved!', 'success')
        
    return redirect(url_for('admin_drives'))


@app.route('/admin/drives/reject/<int:drive_id>')
def reject_drive(drive_id):
    if session.get('role') != 'admin':
        return redirect(url_for('login'))
        
    drive = db.session.get(PlacementDrive, drive_id)
    if drive:
        drive.status = 'rejected'
        db.session.commit()
        flash(f'Drive {drive.title} rejected!', 'warning')
        
    return redirect(url_for('admin_drives'))


@app.route('/admin/applications')
def admin_applications():
    if session.get('role') != 'admin':
        return redirect(url_for('login'))
        
    applications = Application.query.all()
    return render_template('admin/manage_applications.html', applications=applications)


# --- COMPANY ROUTES ---

@app.route('/company')
def company_dashboard():
    if session.get('role') != 'company':
        return redirect(url_for('login'))
        
    company = db.session.get(Company, session['user_id'])
    drives = PlacementDrive.query.filter_by(company_id=company.id).all()
    
    return render_template('company/dashboard.html', company=company, drives=drives)


@app.route('/company/profile', methods=['GET', 'POST'])
def company_profile():
    if session.get('role') != 'company':
        return redirect(url_for('login'))
        
    company = db.session.get(Company, session['user_id'])
    
    if request.method == 'POST':
        company.name = request.form.get('name')
        company.industry = request.form.get('industry')
        company.hr_contact = request.form.get('hr_contact')
        company.website = request.form.get('website')
        
        db.session.commit()
        session['name'] = company.name
        flash('Company profile updated.', 'success')
        return redirect(url_for('company_profile'))
        
    return render_template('company/profile.html', company=company)


@app.route('/company/drive/create', methods=['GET', 'POST'])
def create_drive():
    if session.get('role') != 'company':
        return redirect(url_for('login'))
        
    company = db.session.get(Company, session['user_id'])
    if not company.is_approved:
        flash('You must be approved by an Admin to create placement drives.', 'warning')
        return redirect(url_for('company_dashboard'))
        
    if request.method == 'POST':
        title = request.form.get('title')
        job_description = request.form.get('job_description')
        eligibility_criteria = request.form.get('eligibility_criteria')
        deadline_str = request.form.get('deadline')
        
        if deadline_str:
            deadline = datetime.strptime(deadline_str, '%Y-%m-%d')
        else:
            deadline = None

        new_drive = PlacementDrive(
            title=title, 
            job_description=job_description,
            eligibility_criteria=eligibility_criteria, 
            deadline=deadline,
            company_id=session['user_id'],
            status='pending'
        )
        db.session.add(new_drive)
        db.session.commit()
        
        flash('Drive created successfully! Awaiting admin approval.', 'success')
        return redirect(url_for('company_dashboard'))
        
    return render_template('company/create_drive.html')


@app.route('/company/drive/edit/<int:drive_id>', methods=['GET', 'POST'])
def edit_drive(drive_id):
    if session.get('role') != 'company':
        return redirect(url_for('login'))
        
    company = db.session.get(Company, session['user_id'])
    if not company.is_approved:
        flash('You must be approved by an Admin to edit placement drives.', 'warning')
        return redirect(url_for('company_dashboard'))
        
    drive = db.session.get(PlacementDrive, drive_id)
    if not drive or drive.company_id != session['user_id']:
        flash('Unauthorized access.', 'danger')
        return redirect(url_for('company_dashboard'))
        
    if request.method == 'POST':
        drive.title = request.form.get('title')
        drive.job_description = request.form.get('job_description')
        drive.eligibility_criteria = request.form.get('eligibility_criteria')
        deadline_str = request.form.get('deadline')
        
        if deadline_str:
            drive.deadline = datetime.strptime(deadline_str, '%Y-%m-%d')
            
        db.session.commit()
        flash('Drive updated successfully.', 'success')
        return redirect(url_for('company_dashboard'))
        
    return render_template('company/edit_drive.html', drive=drive)


@app.route('/company/drive/close/<int:drive_id>')
def close_drive(drive_id):
    if session.get('role') != 'company':
        return redirect(url_for('login'))
        
    drive = db.session.get(PlacementDrive, drive_id)
    if drive and drive.company_id == session['user_id']:
        drive.status = 'closed'
        db.session.commit()
        flash('Drive has been closed.', 'success')
        
    return redirect(url_for('company_dashboard'))


@app.route('/company/drive/delete/<int:drive_id>')
def delete_drive(drive_id):
    if session.get('role') != 'company':
        return redirect(url_for('login'))
        
    drive = db.session.get(PlacementDrive, drive_id)
    if drive and drive.company_id == session['user_id']:
        Application.query.filter_by(drive_id=drive.id).delete()
        db.session.delete(drive)
        db.session.commit()
        flash('Drive has been deleted.', 'success')
        
    return redirect(url_for('company_dashboard'))


@app.route('/company/drive/<int:drive_id>/applications')
def view_applications(drive_id):
    if session.get('role') != 'company':
        return redirect(url_for('login'))
        
    drive = db.session.get(PlacementDrive, drive_id)
    if not drive or drive.company_id != session['user_id']:
        flash('Unauthorized access.', 'danger')
        return redirect(url_for('company_dashboard'))
    
    applications = Application.query.filter_by(drive_id=drive.id).all()
    return render_template('company/view_applications.html', drive=drive, applications=applications)


@app.route('/company/application/<int:app_id>/status', methods=['POST'])
def update_application_status(app_id):
    if session.get('role') != 'company':
        return redirect(url_for('login'))
        
    application = db.session.get(Application, app_id)
    if not application or application.drive.company_id != session['user_id']:
        flash('Unauthorized.', 'danger')
        return redirect(url_for('company_dashboard'))
    
    status = request.form.get('status')
    if status in ['Applied', 'Shortlisted', 'Selected', 'Rejected']:
        application.status = status
        db.session.commit()
        flash('Application status updated.', 'success')
        
    return redirect(url_for('view_applications', drive_id=application.drive_id))


# --- STUDENT ROUTES ---

@app.route('/student')
def student_dashboard():
    if session.get('role') != 'student':
        return redirect(url_for('login'))
        
    drives = PlacementDrive.query.filter_by(status='approved').all()
    
    student_id = session['user_id']
    applied_drive_ids = []
    
    my_applications = Application.query.filter_by(student_id=student_id).all()
    for app in my_applications:
        applied_drive_ids.append(app.drive_id)
        
    return render_template('student/dashboard.html', drives=drives, applied_drive_ids=applied_drive_ids)


@app.route('/student/apply/<int:drive_id>', methods=['POST'])
def apply_drive(drive_id):
    if session.get('role') != 'student':
        return redirect(url_for('login'))
        
    student_id = session['user_id']
    existing_application = Application.query.filter_by(student_id=student_id, drive_id=drive_id).first()
    
    if existing_application:
        flash('You have already applied for this drive.', 'warning')
        return redirect(url_for('student_dashboard'))
    
    application = Application(student_id=student_id, drive_id=drive_id)
    db.session.add(application)
    db.session.commit()
    
    flash('Successfully applied to the drive!', 'success')
    return redirect(url_for('student_dashboard'))


@app.route('/student/applications')
def student_applications():
    if session.get('role') != 'student':
        return redirect(url_for('login'))
        
    student_id = session['user_id']
    applications = Application.query.filter_by(student_id=student_id).all()
    
    return render_template('student/my_applications.html', applications=applications)


@app.route('/student/profile', methods=['GET', 'POST'])
def student_profile():
    if session.get('role') != 'student':
        return redirect(url_for('login'))
        
    student = db.session.get(Student, session['user_id'])
    
    if request.method == 'POST':
        student.name = request.form.get('name')
        student.branch = request.form.get('branch')
        
        cgpa = request.form.get('cgpa')
        if cgpa:
            student.cgpa = float(cgpa)
            
        student.resume_url = request.form.get('resume_url')
        
        db.session.commit()
        session['name'] = student.name
        flash('Profile updated.', 'success')
        return redirect(url_for('student_profile'))
        
    return render_template('student/profile.html', student=student)


if __name__ == '__main__':
    app.run(debug=True, port=5000)