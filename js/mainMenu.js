/**
 * 主界面模块
 * 负责处理主菜单的显示和交互逻辑
 */
class MainMenu {
    constructor() {
        this.startButton = document.getElementById('start-game-btn');
        this.continueButton = document.getElementById('continue-game-btn');
        this.exitButton = document.getElementById('exit-game-btn');
        this.mainMenuElement = document.getElementById('main-menu');
        
        // 存档覆盖确认弹窗元素
        this.overwritePopup = document.getElementById('save-overwrite-popup');
        this.confirmOverwriteBtn = document.getElementById('confirm-overwrite-btn');
        this.cancelOverwriteBtn = document.getElementById('cancel-overwrite-btn');
        
        this.init();
    }

    /**
     * 初始化主菜单
     */
    init() {
        this.bindEvents();
        this.updateContinueButtonVisibility();
        console.log('主菜单模块已初始化');
    }

    /**
     * 绑定事件监听器
     */
    bindEvents() {
        // 开始游戏按钮点击事件
        this.startButton.addEventListener('click', () => {
            this.onStartGame();
        });

        // 继续游戏按钮点击事件
        this.continueButton.addEventListener('click', () => {
            this.onContinueGame();
        });

        // 退出游戏按钮点击事件
        this.exitButton.addEventListener('click', () => {
            this.onExitGame();
        });

        // 存档覆盖确认弹窗事件
        this.confirmOverwriteBtn.addEventListener('click', () => {
            this.confirmOverwrite();
        });

        this.cancelOverwriteBtn.addEventListener('click', () => {
            this.cancelOverwrite();
        });

        // 添加键盘事件支持
        document.addEventListener('keydown', (event) => {
            this.handleKeyPress(event);
        });
    }

    /**
     * 处理键盘按键事件
     * @param {KeyboardEvent} event - 键盘事件对象
     */
    handleKeyPress(event) {
        // 只有在主菜单显示时才处理键盘事件
        if (!this.mainMenuElement.classList.contains('active')) {
            return;
        }

        switch(event.key) {
            case 'Enter':
            case ' ':
                this.onStartGame();
                break;
            case 'Escape':
                this.onExitGame();
                break;
        }
    }

    /**
     * 开始游戏按钮点击处理
     */
    onStartGame() {
        console.log('开始游戏按钮被点击');
        
        // 添加按钮点击动画效果
        this.startButton.style.transform = 'scale(0.95)';
        setTimeout(() => {
            this.startButton.style.transform = 'scale(1)';
        }, 150);

        // 检查是否有存档
        if (window.saveManager && window.saveManager.hasSave()) {
            // 有存档，显示覆盖确认弹窗
            this.showOverwritePopup();
        } else {
            // 没有存档，直接开始新游戏
            this.startNewGame();
        }
    }

    /**
     * 继续游戏按钮点击处理
     */
    onContinueGame() {
        console.log('继续游戏按钮被点击');
        
        // 添加按钮点击动画效果
        this.continueButton.style.transform = 'scale(0.95)';
        setTimeout(() => {
            this.continueButton.style.transform = 'scale(1)';
        }, 150);

        // 检查是否有存档
        if (window.saveManager && window.saveManager.hasSave()) {
            // 应用存档数据到游戏
            window.saveManager.applySaveToGame();
            
            // 触发自定义事件，通知游戏管理器切换到关卡选择界面
            const event = new CustomEvent('gameStart', {
                detail: { from: 'mainMenu', isContinue: true }
            });
            document.dispatchEvent(event);
        } else {
            console.log('没有存档可以继续');
            alert('没有找到存档，请先开始新游戏');
        }
    }

    /**
     * 开始新游戏
     */
    startNewGame() {
        // 创建新存档
        if (window.saveManager) {
            window.saveManager.createNewSave();
        }
        
        // 触发自定义事件，通知游戏管理器切换到关卡选择界面
        const event = new CustomEvent('gameStart', {
            detail: { from: 'mainMenu', isContinue: false }
        });
        document.dispatchEvent(event);
    }

    /**
     * 显示存档覆盖确认弹窗
     */
    showOverwritePopup() {
        if (this.overwritePopup) {
            this.overwritePopup.style.display = 'flex';
        }
    }

    /**
     * 隐藏存档覆盖确认弹窗
     */
    hideOverwritePopup() {
        if (this.overwritePopup) {
            this.overwritePopup.style.display = 'none';
        }
    }

    /**
     * 确认覆盖存档
     */
    confirmOverwrite() {
        console.log('确认覆盖存档');
        this.hideOverwritePopup();
        this.startNewGame();
    }

    /**
     * 取消覆盖存档
     */
    cancelOverwrite() {
        console.log('取消覆盖存档');
        this.hideOverwritePopup();
    }

    /**
     * 更新继续游戏按钮的可见性
     */
    updateContinueButtonVisibility() {
        if (this.continueButton) {
            const hasSave = window.saveManager && window.saveManager.hasSave();
            this.continueButton.style.display = hasSave ? 'block' : 'none';
        }
    }

    /**
     * 退出游戏按钮点击处理
     */
    onExitGame() {
        console.log('退出游戏按钮被点击');
        
        // 添加按钮点击动画效果
        this.exitButton.style.transform = 'scale(0.95)';
        setTimeout(() => {
            this.exitButton.style.transform = 'scale(1)';
        }, 150);

        // 显示确认对话框
        if (confirm('确定要退出游戏吗？')) {
            this.closeGame();
        }
    }

    /**
     * 关闭游戏
     */
    closeGame() {
        console.log('游戏正在关闭...');
        
        // 在真实环境中，这里可以执行清理工作
        // 在浏览器环境中，我们只能关闭当前标签页
        if (window.close) {
            window.close();
        } else {
            // 如果无法关闭窗口，显示提示信息
            alert('请手动关闭浏览器标签页');
        }
    }

    /**
     * 显示主菜单
     */
    show() {
        this.mainMenuElement.classList.add('active');
        this.updateContinueButtonVisibility();
        console.log('主菜单已显示');
    }

    /**
     * 隐藏主菜单
     */
    hide() {
        this.mainMenuElement.classList.remove('active');
        console.log('主菜单已隐藏');
    }

    /**
     * 重置主菜单状态
     */
    reset() {
        // 重置按钮状态
        this.startButton.style.transform = 'scale(1)';
        this.exitButton.style.transform = 'scale(1)';
        
        console.log('主菜单状态已重置');
    }
}

// 导出主菜单类
if (typeof module !== 'undefined' && module.exports) {
    module.exports = MainMenu;
}



