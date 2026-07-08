// مدیریت احراز هویت و کاربران پیش‌فرض

class Auth {
    static initDefaultUsers() {
        // اگر کاربری وجود نداشته باشد، کاربران پیش‌فرض را ایجاد کن
        if (!Utils.getFromLocal('users')) {
            const defaultUsers = [
                {
                    id: 'admin-001',
                    nationalCode: '1234567890',
                    password: '789',
                    role: 'admin',
                    name: 'مدیر سیستم',
                    class: '',
                    avatar: ''
                },
                {
                    id: 'teacher-001',
                    nationalCode: '0987654321',
                    password: '456',
                    role: 'teacher',
                    name: 'معلم نمونه',
                    class: '',
                    avatar: ''
                },
                {
                    id: 'student-001',
                    nationalCode: '1111111111',
                    password: '123',
                    role: 'student',
                    name: 'دانش‌آموز نمونه',
                    class: 'دهم ریاضی',
                    avatar: ''
                }
            ];
            Utils.saveToLocal('users', defaultUsers);
        }
    }

    static login(nationalCode, password) {
        const users = Utils.getFromLocal('users') || [];
        const user = users.find(u => u.nationalCode === nationalCode && u.password === password);
        
        if (user) {
            const session = {
                loggedIn: true,
                userId: user.id,
                nationalCode: user.nationalCode,
                role: user.role,
                name: user.name,
                class: user.class,
                avatar: user.avatar,
                timestamp: new Date().getTime()
            };
            Utils.saveToLocal('session', session);
            
            // هدایت به صفحه مناسب
            switch (user.role) {
                case 'student':
                    window.location.href = 'pages/student.html';
                    break;
                case 'teacher':
                    window.location.href = 'pages/teacher.html';
                    break;
                case 'admin':
                    window.location.href = 'pages/admin.html';
                    break;
                default:
                    window.location.href = 'index.html';
            }
            return { success: true };
        } else {
            return { success: false, message: 'کد ملی یا رمز عبور اشتباه است' };
        }
    }

    static getCurrentUser() {
        const session = Utils.checkSession();
        if (!session) return null;
        const users = Utils.getFromLocal('users') || [];
        return users.find(u => u.id === session.userId);
    }
}
