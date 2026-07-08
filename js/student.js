// پنل دانش‌آموز - تمام امکانات

class StudentPanel {
    constructor() {
        this.session = Utils.checkSession();
        if (!this.session || this.session.role !== 'student') {
            window.location.href = '../index.html';
            return;
        }
        this.user = Auth.getCurrentUser();
        this.init();
    }

    init() {
        this.loadUserInfo();
        this.setupNavigation();
        this.loadReportCard();
        this.loadAnnouncements();
        this.loadBooks();
        this.loadExams();
        this.initAI();
    }

    loadUserInfo() {
        document.getElementById('studentName').textContent = this.user.name;
        document.getElementById('studentClass').textContent = this.user.class || 'ثبت نشده';
        document.getElementById('studentCode').textContent = this.user.nationalCode;
        // آواتار
        const avatar = this.user.avatar ? `<img src="${this.user.avatar}" alt="آواتار">` : '<i class="fas fa-user-circle fa-3x"></i>';
        document.getElementById('profileAvatar').innerHTML = avatar;
    }

    editProfile() {
        const newAvatar = prompt('آدرس تصویر پروفایل جدید را وارد کنید:', this.user.avatar);
        if (newAvatar !== null) {
            const users = Utils.getFromLocal('users');
            const userIndex = users.findIndex(u => u.id === this.user.id);
            users[userIndex].avatar = newAvatar;
            Utils.saveToLocal('users', users);
            this.user = Auth.getCurrentUser();
            this.loadUserInfo();
            Utils.showToast('پروفایل با موفقیت به‌روزرسانی شد', 'success');
        }
    }

    setupNavigation() {
        const navLinks = document.querySelectorAll('.sidebar-menu a');
        const sections = document.querySelectorAll('.section');
        
        navLinks.forEach(link => {
            link.addEventListener('click', (e) => {
                e.preventDefault();
                const target = link.getAttribute('data-section');
                
                navLinks.forEach(l => l.classList.remove('active'));
                link.classList.add('active');
                
                sections.forEach(s => s.classList.add('hidden'));
                document.getElementById(target).classList.remove('hidden');
            });
        });
    }

    // کارنامه
    loadReportCard() {
        const reportCards = Utils.getFromLocal('reportCards') || [];
        const studentCards = reportCards.filter(c => c.studentId === this.user.id);
        const tbody = document.getElementById('reportCardBody');
        
        if (studentCards.length === 0) {
            tbody.innerHTML = '<tr><td colspan="4">کارنامه‌ای ثبت نشده است</td></tr>';
            return;
        }

        tbody.innerHTML = studentCards.map(card => `
            <tr>
                <td>${Utils.formatDate(card.date)}</td>
                <td>${card.courses}</td>
                <td>${card.grades}</td>
                <td>${card.average}</td>
            </tr>
        `).join('');
    }

    // اطلاعیه‌ها
    loadAnnouncements() {
        const announcements = Utils.getFromLocal('announcements') || [];
        const container = document.getElementById('announcementsList');
        
        if (announcements.length === 0) {
            container.innerHTML = '<p class="text-center">اطلاعیه‌ای موجود نیست</p>';
            return;
        }

        container.innerHTML = announcements.map(a => `
            <div class="card mb-2">
                <h4>${a.title}</h4>
                <p>${a.content}</p>
                ${a.image ? `<img src="${a.image}" style="max-width: 200px;">` : ''}
                ${a.file ? `<a href="${a.file}" target="_blank">دانلود فایل</a>` : ''}
                <small>${Utils.formatDate(a.date)}</small>
            </div>
        `).join('');
    }

    // کتابخانه
    loadBooks() {
        const books = Utils.getFromLocal('books') || [];
        const container = document.getElementById('booksList');
        
        if (books.length === 0) {
            container.innerHTML = '<p class="text-center">کتابی در کتابخانه موجود نیست</p>';
            return;
        }

        container.innerHTML = books.map(book => `
            <div class="card">
                <h4>${book.title}</h4>
                <p>نویسنده: ${book.author}</p>
                ${book.fileData ? `<button class="btn btn-primary btn-sm" onclick="StudentPanel.downloadBook('${book.id}')">دانلود</button>` : ''}
            </div>
        `).join('');
    }

    static downloadBook(bookId) {
        const books = Utils.getFromLocal('books') || [];
        const book = books.find(b => b.id === bookId);
        if (book && book.fileData) {
            const link = document.createElement('a');
            link.href = book.fileData;
            link.download = book.title;
            link.click();
        }
    }

    // آزمون‌ها
    loadExams() {
        const exams = Utils.getFromLocal('exams') || [];
        const studentExams = exams.filter(e => 
            e.sentTo === 'all' || 
            (e.sentTo === 'class' && e.className === this.user.class) ||
            (Array.isArray(e.studentIds) && e.studentIds.includes(this.user.id))
        );
        const container = document.getElementById('examsList');
        
        if (studentExams.length === 0) {
            container.innerHTML = '<p class="text-center">آزمونی برای شما ارسال نشده است</p>';
            return;
        }

        container.innerHTML = studentExams.map(exam => {
            const result = (Utils.getFromLocal('examResults') || []).find(r => r.examId === exam.id && r.studentId === this.user.id);
            const taken = !!result;
            return `
                <div class="card">
                    <h4>${exam.title}</h4>
                    <p>تعداد سوالات: ${exam.questions.length}</p>
                    ${taken ? 
                        `<p class="text-success">نمره: ${result.score}/${exam.questions.length}</p>` :
                        `<button class="btn btn-primary" onclick="StudentPanel.takeExam('${exam.id}')">شرکت در آزمون</button>`
                    }
                </div>
            `;
        }).join('');
    }

    static takeExam(examId) {
        const exams = Utils.getFromLocal('exams') || [];
        const exam = exams.find(e => e.id === examId);
        if (!exam) return;

        const modal = document.getElementById('examModal');
        const container = document.getElementById('examQuestions');
        
        container.innerHTML = `
            <h3>${exam.title}</h3>
            <form id="examForm">
                ${exam.questions.map((q, i) => `
                    <div class="mb-2">
                        <p><strong>${i+1}. ${q.question}</strong></p>
                        ${q.options.map((opt, j) => `
                            <label><input type="radio" name="q${i}" value="${j}"> ${opt}</label><br>
                        `).join('')}
                    </div>
                `).join('')}
                <button type="submit" class="btn btn-success">ثبت پاسخ‌ها</button>
            </form>
        `;
        
        modal.classList.add('active');
        
        document.getElementById('examForm').addEventListener('submit', function(e) {
            e.preventDefault();
            let score = 0;
            exam.questions.forEach((q, i) => {
                const selected = document.querySelector(`input[name="q${i}"]:checked`);
                if (selected && parseInt(selected.value) === q.correctAnswer) {
                    score++;
                }
            });
            
            const results = Utils.getFromLocal('examResults') || [];
            results.push({
                examId: exam.id,
                studentId: Utils.checkSession().userId,
                score: score,
                date: new Date().toISOString()
            });
            Utils.saveToLocal('examResults', results);
            
            modal.classList.remove('active');
            Utils.showToast(`نمره شما: ${score} از ${exam.questions.length}`, 'success');
            new StudentPanel().loadExams(); // رفرش
        });
    }

    // هوش مصنوعی با Groq
    initAI() {
        this.chatHistory = document.getElementById('chatHistory');
        this.chatInput = document.getElementById('chatInput');
        
        document.getElementById('sendMessage').addEventListener('click', () => this.sendMessage());
        document.getElementById('newChat').addEventListener('click', () => this.clearChat());
        document.getElementById('deleteHistory').addEventListener('click', () => this.clearChat());
        
        this.loadChatHistory();
    }

    loadChatHistory() {
        const history = Utils.getFromLocal(`chat_${this.user.id}`) || [];
        this.chatHistory.innerHTML = history.map(msg => `
            <div class="chat-message ${msg.role}">
                <div class="message-content">${msg.content}</div>
            </div>
        `).join('');
        this.chatHistory.scrollTop = this.chatHistory.scrollHeight;
    }

    async sendMessage() {
        const message = this.chatInput.value.trim();
        if (!message) return;
        
        // افزودن پیام کاربر
        const history = Utils.getFromLocal(`chat_${this.user.id}`) || [];
        history.push({ role: 'user', content: message });
        Utils.saveToLocal(`chat_${this.user.id}`, history);
        this.loadChatHistory();
        this.chatInput.value = '';
        
        // دریافت پاسخ از Groq
        const apiKey = Utils.getFromLocal('settings')?.groqApiKey;
        if (!apiKey) {
            Utils.showToast('کلید API هوش مصنوعی تنظیم نشده است', 'error');
            return;
        }
        
        try {
            const response = await fetch('https://api.groq.com/openai/v1/chat/completions', {
                method: 'POST',
                headers: {
                    'Authorization': `Bearer ${apiKey}`,
                    'Content-Type': 'application/json'
                },
                body: JSON.stringify({
                    model: 'llama3-8b-8192',
                    messages: [
                        { role: 'system', content: 'شما یک معلم راهنما هستید. به سوالات درسی پاسخ دهید.' },
                        ...history
                    ]
                })
            });
            
            const data = await response.json();
            const botMessage = data.choices[0].message.content;
            
            history.push({ role: 'bot', content: botMessage });
            Utils.saveToLocal(`chat_${this.user.id}`, history);
            this.loadChatHistory();
        } catch (error) {
            Utils.showToast('خطا در ارتباط با هوش مصنوعی', 'error');
        }
    }

    clearChat() {
        Utils.saveToLocal(`chat_${this.user.id}`, []);
        this.loadChatHistory();
    }

    copyLastMessage() {
        const history = Utils.getFromLocal(`chat_${this.user.id}`) || [];
        const lastBotMsg = [...history].reverse().find(m => m.role === 'bot');
        if (lastBotMsg) {
            navigator.clipboard.writeText(lastBotMsg.content);
            Utils.showToast('پاسخ کپی شد', 'success');
        }
    }
}

// راه‌اندازی پنل پس از لود صفحه
document.addEventListener('DOMContentLoaded', () => {
    window.studentPanel = new StudentPanel();
});
