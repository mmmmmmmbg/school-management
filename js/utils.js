// فایل ابزارهای عمومی پروژه

class Utils {
    // مدیریت Toast
    static showToast(message, type = 'info') {
        const container = document.getElementById('toast-container') || this.createToastContainer();
        const toast = document.createElement('div');
        toast.className = `toast ${type}`;
        toast.textContent = message;
        container.appendChild(toast);
        setTimeout(() => {
            toast.style.animation = 'slideDown 0.3s ease reverse';
            setTimeout(() => toast.remove(), 300);
        }, 3000);
    }

    static createToastContainer() {
        const container = document.createElement('div');
        container.id = 'toast-container';
        container.className = 'toast-container';
        document.body.appendChild(container);
        return container;
    }

    // مدیریت Modal
    static openModal(modalId) {
        const modal = document.getElementById(modalId);
        if (modal) modal.classList.add('active');
    }

    static closeModal(modalId) {
        const modal = document.getElementById(modalId);
        if (modal) modal.classList.remove('active');
    }

    // مدیریت localStorage
    static saveToLocal(key, data) {
        localStorage.setItem(key, JSON.stringify(data));
    }

    static getFromLocal(key) {
        const data = localStorage.getItem(key);
        return data ? JSON.parse(data) : null;
    }

    // بررسی session کاربر
    static checkSession() {
        const session = this.getFromLocal('session');
        if (!session || !session.loggedIn) {
            window.location.href = '../index.html';
            return null;
        }
        return session;
    }

    // خروج از سیستم
    static logout() {
        localStorage.removeItem('session');
        window.location.href = '../index.html';
    }

    // تولید شناسه یکتا
    static generateId() {
        return Date.now().toString(36) + Math.random().toString(36).substr(2);
    }

    // فرمت تاریخ
    static formatDate(dateString) {
        return new Date(dateString).toLocaleDateString('fa-IR');
    }
}
