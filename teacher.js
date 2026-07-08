// پنل معلم

class TeacherPanel {
    constructor() {
        this.session = Utils.checkSession();
        if (!this.session || this.session.role !== 'teacher') {
            window.location.href = '../index.html';
            return;
        }
        this.user = Auth.getCurrentUser();
        this.init();
    }

    init() {
        this.loadUserInfo();
        this.setupNavigation();
        this.loadExams();
        this.loadStudents();
        this.setupCreateExam();
    }

    loadUserInfo() {
        document.getElementById('teacherName').textContent = this.user.name;
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

    // بارگذاری آزمون‌های ساخته شده
    loadExams() {
        const exams = Utils.getFromLocal('exams') || [];
        const teacherExams = exams.filter(e => e.teacherId === this.user.id);
        const tbody = document.getElementById('teacherExamsBody');
        
        if (teacherExams.length === 0) {
            tbody.innerHTML = '<tr><td colspan="4">آزمونی ساخته نشده است</td></tr>';
            return;
        }

        tbody.innerHTML = teacherExams.map(exam => `
            <tr>
                <td>${exam.title}</td>
                <td>${exam.questions.length} سوال</td>
                <td>${Utils.formatDate(exam.createdAt)}</td>
                <td>
                    <button class="btn btn-sm btn-primary" onclick="TeacherPanel.viewResults('${exam.id}')">نتایج</button>
                    <button class="btn btn-sm btn-warning" onclick="TeacherPanel.editExam('${exam.id}')">ویرایش</button>
                    <button class="btn btn-sm btn-danger" onclick="TeacherPanel.deleteExam('${exam.id}')">حذف</button>
                </td>
            </tr>
        `).join('');
    }

    // تنظیمات ساخت آزمون با Mistral
    setupCreateExam() {
        document.getElementById('generateExam').addEventListener('click', () => this.generateExamWithAI());
        document.getElementById('sendExam').addEventListener('click', () => this.sendExam());
    }

    async generateExamWithAI() {
        const pdfFile = document.getElementById('pdfUpload').files[0];
        const questionCount = document.getElementById('questionCount').value;
        const questionType = document.getElementById('questionType').value;
        const chapter = document.getElementById('chapter').value;
        const difficulty = document.getElementById('difficulty').value;

        if (!pdfFile) {
            Utils.showToast('لطفاً فایل PDF را آپلود کنید', 'error');
            return;
        }

        const apiKey = Utils.getFromLocal('settings')?.mistralApiKey;
        if (!apiKey) {
            Utils.showToast('کلید API میسترال تنظیم نشده است', 'error');
            return;
        }

        Utils.showToast('در حال تولید آزمون...', 'info');

        // در اینجا به دلیل محدودیت مرورگر، محتوای PDF را نمی‌توان خواند. 
        // راه‌حل: ارسال نام فایل و تنظیمات به API و درخواست تولید سوالات فرضی
        // در محیط واقعی باید PDF به یک سرور پروکسی ارسال شود.
        try {
            const response = await fetch('https://api.mistral.ai/v1/chat/completions', {
                method: 'POST',
                headers: {
                    'Authorization': `Bearer ${apiKey}`,
                    'Content-Type': 'application/json'
                },
                body: JSON.stringify({
                    model: 'mistral-large-latest',
                    messages: [{
                        role: 'user',
                        content: `تولید ${questionCount} سوال ${questionType} از فصل ${chapter} با سختی ${difficulty}. فقط سوالات را با ۴ گزینه برگردان.`
                    }]
                })
            });

            const data = await response.json();
            const generatedText = data.choices[0].message.content;
            
            // تجزیه سوالات (ساده‌سازی شده)
            const questions = this.parseGeneratedQuestions(generatedText, questionCount);
            
            // نمایش برای ویرایش
            this.showGeneratedQuestions(questions);
        } catch (error) {
            Utils.showToast('خطا در ارتباط با هوش مصنوعی', 'error');
        }
    }

    parseGeneratedQuestions(text, count) {
        // تبدیل متن تولید شده به آرایه سوالات
        const lines = text.split('\n').filter(l => l.trim());
        const questions = [];
        for (let i = 0; i < count && i < lines.length; i++) {
            questions.push({
                question: lines[i],
                options: ['گزینه ۱', 'گزینه ۲', 'گزینه ۳', 'گزینه ۴'],
                correctAnswer: 0
            });
        }
        return questions;
    }

    showGeneratedQuestions(questions) {
        const container = document.getElementById('generatedQuestions');
        container.innerHTML = `
            <h4>سوالات تولید شده (قابل ویرایش)</h4>
            ${questions.map((q, i) => `
                <div class="card mb-2">
                    <div class="form-group">
                        <label>سوال ${i+1}</label>
                        <input type="text" class="question-text" value="${q.question}" data-index="${i}">
                    </div>
                    <div class="grid grid-2">
                        ${q.options.map((opt, j) => `
                            <div class="form-group">
                                <label>گزینه ${j+1}</label>
                                <input type="text" class="option-text" value="${opt}" data-qindex="${i}" data-oindex="${j}">
                            </div>
                        `).join('')}
                    </div>
                    <div class="form-group">
                        <label>پاسخ صحیح (شماره گزینه)</label>
                        <input type="number" class="correct-answer" value="${q.correctAnswer}" min="0" max="3" data-index="${i}">
                    </div>
                </div>
            `).join('')}
        `;
        container.classList.remove('hidden');
        window.generatedQuestions = questions;
    }

    sendExam() {
        const students = Utils.getFromLocal('users')?.filter(u => u.role === 'student') || [];
        const sendTo = document.getElementById('sendTo').value;
        const selectedClass = document.getElementById('classSelect').value;
        const title = prompt('عنوان آزمون:');
        
        if (!title) return;
        
        const exam = {
            id: Utils.generateId(),
            teacherId: this.user.id,
            title: title,
            questions: window.generatedQuestions,
            createdAt: new Date().toISOString(),
            sentTo: sendTo,
            className: sendTo === 'class' ? selectedClass : null,
            studentIds: sendTo === 'selected' ? this.getSelectedStudents() : null
        };

        const exams = Utils.getFromLocal('exams') || [];
        exams.push(exam);
        Utils.saveToLocal('exams', exams);
        
        Utils.showToast('آزمون با موفقیت ارسال شد', 'success');
        document.getElementById('generatedQuestions').classList.add('hidden');
        this.loadExams();
    }

    getSelectedStudents() {
        // در حالت واقعی یک پنجره انتخاب باز می‌شود
        return [];
    }

    static viewResults(examId) {
        const results = Utils.getFromLocal('examResults') || [];
        const examResults = results.filter(r => r.examId === examId);
        const users = Utils.getFromLocal('users');
        
        let resultText = examResults.map(r => {
            const student = users.find(u => u.id === r.studentId);
            return `${student?.name}: ${r.score}`;
        }).join('\n');
        
        alert(resultText || 'نتیجه‌ای ثبت نشده');
    }

    static editExam(examId) {
        // بارگذاری آزمون برای ویرایش
        const exams = Utils.getFromLocal('exams');
        const exam = exams.find(e => e.id === examId);
        if (exam) {
            window.generatedQuestions = exam.questions;
            document.getElementById('generatedQuestions').classList.remove('hidden');
        }
    }

    static deleteExam(examId) {
        if (confirm('آزمون حذف شود؟')) {
            let exams = Utils.getFromLocal('exams') || [];
            exams = exams.filter(e => e.id !== examId);
            Utils.saveToLocal('exams', exams);
            Utils.showToast('آزمون حذف شد', 'success');
            new TeacherPanel().loadExams();
        }
    }

    loadStudents() {
        const students = (Utils.getFromLocal('users') || []).filter(u => u.role === 'student');
        const select = document.getElementById('studentSelect');
        if (select) {
            select.innerHTML = students.map(s => `<option value="${s.id}">${s.name} - ${s.class}</option>`).join('');
        }
    }
}

document.addEventListener('DOMContentLoaded', () => {
    window.teacherPanel = new TeacherPanel();
});