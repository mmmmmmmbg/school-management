// پنل مدیر

class AdminPanel {
    constructor() {
        this.session = Utils.checkSession();
        if (!this.session || this.session.role !== 'admin') {
            window.location.href = '../index.html';
            return;
        }
        this.user = Auth.getCurrentUser();
        this.init();
    }

    init() {
        this.loadDashboardStats();
        this.setupNavigation();
        this.loadStudentsList();
        this.loadTeachersList();
        this.loadAnnouncementsList();
        this.loadAllExams();
        this.loadSettings();
    }

    loadDashboardStats() {
        const users = Utils.getFromLocal('users') || [];
        const students = users.filter(u => u.role === 'student').length;
        const teachers = users.filter(u => u.role === 'teacher').length;
        const exams = (Utils.getFromLocal('exams') || []).length;
        document.getElementById('statStudents').textContent = students;
        document.getElementById('statTeachers').textContent = teachers;
        document.getElementById('statExams').textContent = exams;
    }

    setupNavigation() {
        document.querySelectorAll('.sidebar-menu a[data-section]').forEach(link => {
            link.addEventListener('click', (e) => {
                e.preventDefault();
                const target = link.getAttribute('data-section');
                document.querySelectorAll('.sidebar-menu a').forEach(l => l.classList.remove('active'));
                link.classList.add('active');
                document.querySelectorAll('.section').forEach(s => s.classList.add('hidden'));
                document.getElementById(target).classList.remove('hidden');
            });
        });
    }

    // مدیریت دانش‌آموزان
    loadStudentsList() {
        const students = (Utils.getFromLocal('users') || []).filter(u => u.role === 'student');
        const tbody = document.getElementById('studentsTableBody');
        tbody.innerHTML = students.map(s => `
            <tr>
                <td>${s.name}</td>
                <td>${s.nationalCode}</td>
                <td>${s.class}</td>
                <td>
                    <button class="btn btn-sm btn-warning" onclick="AdminPanel.editStudent('${s.id}')">ویرایش</button>
                    <button class="btn btn-sm btn-danger" onclick="AdminPanel.deleteStudent('${s.id}')">حذف</button>
                    <button class="btn btn-sm btn-primary" onclick="AdminPanel.openReportCard('${s.id}')">کارنامه</button>
                </td>
            </tr>
        `).join('');
    }

    addStudent() {
        const name = document.getElementById('studentNameInput').value;
        const nationalCode = document.getElementById('studentNationalCode').value;
        const className = document.getElementById('studentClassInput').value;
        const password = document.getElementById('studentPassword').value || '123456';
        
        if (!name || !nationalCode || !className) {
            Utils.showToast('فیلدهای ضروری را پر کنید', 'error');
            return;
        }

        const users = Utils.getFromLocal('users') || [];
        users.push({
            id: Utils.generateId(),
            name: name,
            nationalCode: nationalCode,
            password: password,
            role: 'student',
            class: className,
            avatar: ''
        });
        Utils.saveToLocal('users', users);
        Utils.showToast('دانش‌آموز با موفقیت اضافه شد', 'success');
        this.loadStudentsList();
    }

    static deleteStudent(id) {
        if (confirm('آیا از حذف این دانش‌آموز اطمینان دارید؟')) {
            let users = Utils.getFromLocal('users') || [];
            users = users.filter(u => u.id !== id);
            Utils.saveToLocal('users', users);
            Utils.showToast('دانش‌آموز حذف شد', 'success');
            new AdminPanel().loadStudentsList();
        }
    }

    static editStudent(id) {
        const users = Utils.getFromLocal('users') || [];
        const student = users.find(u => u.id === id);
        if (student) {
            const newName = prompt('نام جدید:', student.name);
            const newClass = prompt('کلاس جدید:', student.class);
            if (newName && newClass) {
                student.name = newName;
                student.class = newClass;
                Utils.saveToLocal('users', users);
                Utils.showToast('اطلاعات ویرایش شد', 'success');
                new AdminPanel().loadStudentsList();
            }
        }
    }

    static openReportCard(studentId) {
        const users = Utils.getFromLocal('users') || [];
        const student = users.find(u => u.id === studentId);
        const reportCards = Utils.getFromLocal('reportCards') || [];
        const studentCards = reportCards.filter(c => c.studentId === studentId);
        
        const modal = document.getElementById('reportCardModal');
        document.getElementById('reportCardStudentName').textContent = student.name;
        
        const tbody = document.getElementById('reportCardTableBody');
        tbody.innerHTML = studentCards.map(c => `
            <tr>
                <td>${c.date}</td>
                <td>${c.courses}</td>
                <td>${c.grades}</td>
                <td>${c.average}</td>
                <td><button class="btn btn-sm btn-danger" onclick="AdminPanel.deleteReportCard('${c.id}')">حذف</button></td>
            </tr>
        `).join('');
        
        document.getElementById('saveReportCard').onclick = function() {
            const courses = document.getElementById('coursesInput').value;
            const grades = document.getElementById('gradesInput').value;
            const average = document.getElementById('averageInput').value;
            
            reportCards.push({
                id: Utils.generateId(),
                studentId: studentId,
                date: new Date().toISOString(),
                courses: courses,
                grades: grades,
                average: average
            });
            Utils.saveToLocal('reportCards', reportCards);
            Utils.showToast('کارنامه ثبت شد', 'success');
            Utils.closeModal('reportCardModal');
        };
        
        Utils.openModal('reportCardModal');
    }

    static deleteReportCard(cardId) {
        let cards = Utils.getFromLocal('reportCards') || [];
        cards = cards.filter(c => c.id !== cardId);
        Utils.saveToLocal('reportCards', cards);
        Utils.showToast('کارنامه حذف شد', 'success');
        Utils.closeModal('reportCardModal');
    }

    // مدیریت معلمان
    loadTeachersList() {
        const teachers = (Utils.getFromLocal('users') || []).filter(u => u.role === 'teacher');
        const tbody = document.getElementById('teachersTableBody');
        tbody.innerHTML = teachers.map(t => `
            <tr>
                <td>${t.name}</td>
                <td>${t.nationalCode}</td>
                <td>
                    <button class="btn btn-sm btn-warning" onclick="AdminPanel.editTeacher('${t.id}')">ویرایش</button>
                    <button class="btn btn-sm btn-danger" onclick="AdminPanel.deleteTeacher('${t.id}')">حذف</button>
                </td>
            </tr>
        `).join('');
    }

    addTeacher() {
        const name = document.getElementById('teacherNameInput').value;
        const nationalCode = document.getElementById('teacherNationalCode').value;
        const password = document.getElementById('teacherPassword').value || '123456';
        
        if (!name || !nationalCode) {
            Utils.showToast('فیلدها را پر کنید', 'error');
            return;
        }

        const users = Utils.getFromLocal('users') || [];
        users.push({
            id: Utils.generateId(),
            name: name,
            nationalCode: nationalCode,
            password: password,
            role: 'teacher',
            class: '',
            avatar: ''
        });
        Utils.saveToLocal('users', users);
        Utils.showToast('معلم اضافه شد', 'success');
        this.loadTeachersList();
    }

    static deleteTeacher(id) {
        if (confirm('حذف معلم؟')) {
            let users = Utils.getFromLocal('users') || [];
            users = users.filter(u => u.id !== id);
            Utils.saveToLocal('users', users);
            Utils.showToast('معلم حذف شد', 'success');
            new AdminPanel().loadTeachersList();
        }
    }

    // اطلاعیه‌ها
    loadAnnouncementsList() {
        const announcements = Utils.getFromLocal('announcements') || [];
        const container = document.getElementById('announcementsAdminList');
        container.innerHTML = announcements.map(a => `
            <div class="card mb-2">
                <h4>${a.title}</h4>
                <button class="btn btn-sm btn-danger" onclick="AdminPanel.deleteAnnouncement('${a.id}')">حذف</button>
            </div>
        `).join('');
    }

    addAnnouncement() {
        const title = document.getElementById('announcementTitle').value;
        const content = document.getElementById('announcementContent').value;
        const image = document.getElementById('announcementImage').value;
        const file = document.getElementById('announcementFile').value;
        
        const announcements = Utils.getFromLocal('announcements') || [];
        announcements.push({
            id: Utils.generateId(),
            title: title,
            content: content,
            image: image,
            file: file,
            date: new Date().toISOString()
        });
        Utils.saveToLocal('announcements', announcements);
        Utils.showToast('اطلاعیه منتشر شد', 'success');
        this.loadAnnouncementsList();
    }

    static deleteAnnouncement(id) {
        let announcements = Utils.getFromLocal('announcements') || [];
        announcements = announcements.filter(a => a.id !== id);
        Utils.saveToLocal('announcements', announcements);
        Utils.showToast('اطلاعیه حذف شد', 'success');
        new AdminPanel().loadAnnouncementsList();
    }

    // مدیریت آزمون‌ها (مشاهده)
    loadAllExams() {
        const exams = Utils.getFromLocal('exams') || [];
        const tbody = document.getElementById('adminExamsBody');
        tbody.innerHTML = exams.map(e => `
            <tr>
                <td>${e.title}</td>
                <td>${e.teacherId}</td>
                <td>${e.questions.length} سوال</td>
                <td><button class="btn btn-sm btn-danger" onclick="AdminPanel.deleteExam('${e.id}')">حذف</button></td>
            </tr>
        `).join('');
    }

    static deleteExam(id) {
        let exams = Utils.getFromLocal('exams') || [];
        exams = exams.filter(e => e.id !== id);
        Utils.saveToLocal('exams', exams);
        Utils.showToast('آزمون حذف شد', 'success');
        new AdminPanel().loadAllExams();
    }

    // تنظیمات
    loadSettings() {
        const settings = Utils.getFromLocal('settings') || {};
        document.getElementById('groqApiKey').value = settings.groqApiKey || '';
        document.getElementById('mistralApiKey').value = settings.mistralApiKey || '';
    }

    saveSettings() {
        const groqApiKey = document.getElementById('groqApiKey').value;
        const mistralApiKey = document.getElementById('mistralApiKey').value;
        Utils.saveToLocal('settings', { groqApiKey, mistralApiKey });
        Utils.showToast('تنظیمات ذخیره شد', 'success');
    }

    backupData() {
        const data = {
            users: Utils.getFromLocal('users'),
            exams: Utils.getFromLocal('exams'),
            reportCards: Utils.getFromLocal('reportCards'),
            announcements: Utils.getFromLocal('announcements'),
            books: Utils.getFromLocal('books'),
            settings: Utils.getFromLocal('settings')
        };
        const blob = new Blob([JSON.stringify(data)], {type: 'application/json'});
        const link = document.createElement('a');
        link.href = URL.createObjectURL(blob);
        link.download = `backup-${new Date().toISOString()}.json`;
        link.click();
        Utils.showToast('نسخه پشتیبان تهیه شد', 'success');
    }
}

document.addEventListener('DOMContentLoaded', () => {
    window.adminPanel = new AdminPanel();
});
