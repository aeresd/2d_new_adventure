/**
 * 暂停菜单模块
 * 负责处理游戏暂停和恢复功能
 */
class PauseMenu {
    constructor() {
        this.pauseButton = document.getElementById('pause-button');
        this.pauseMenu = document.getElementById('pause-menu');
        this.resumeButton = document.getElementById('resume-game-btn');
        this.backToLevelsButton = document.getElementById('back-to-levels-from-pause-btn');
        
        this.isPaused = false;
        
        this.init();
    }

    /**
     * 初始化暂停菜单
     */
    init() {
        this.bindEvents();
        console.log('暂停菜单已初始化');
    }

    /**
     * 绑定事件监听器
     */
    bindEvents() {
        // 暂停按钮点击事件
        this.pauseButton.addEventListener('click', () => {
            this.togglePause();
        });

        // 继续游戏按钮点击事件
        this.resumeButton.addEventListener('click', () => {
            this.resumeGame();
        });

        // 返回关卡选择按钮点击事件
        this.backToLevelsButton.addEventListener('click', () => {
            this.backToLevelSelect();
        });

        // ESC键暂停/恢复游戏
        document.addEventListener('keydown', (event) => {
            if (event.key === 'Escape') {
                // 只有在关卡场景中才处理ESC键
                const levelScene = document.getElementById('level-scene');
                if (levelScene && levelScene.classList.contains('active')) {
                    this.togglePause();
                }
            }
        });

        // 点击暂停菜单背景关闭菜单
        this.pauseMenu.addEventListener('click', (event) => {
            if (event.target === this.pauseMenu) {
                this.resumeGame();
            }
        });
    }

    /**
     * 切换暂停状态
     */
    togglePause() {
        if (this.isPaused) {
            this.resumeGame();
        } else {
            this.pauseGame();
        }
    }

    /**
     * 暂停游戏
     */
    pauseGame() {
        this.isPaused = true;
        
        // 显示暂停菜单
        this.pauseMenu.classList.add('active');
        
        // 暂停游戏系统
        const inputSystem = window.gameModules?.inputSystem;
        if (inputSystem) {
            inputSystem.pauseGame();
        }
        
        // 暂停投射物系统
        const projectileSystem = window.gameModules?.projectileSystem;
        if (projectileSystem) {
            projectileSystem.pause();
        }
        
        // 暂停音频
        const audioManager = window.gameModules?.audioManager;
        if (audioManager) {
            audioManager.setMuted(true);
        }
        
        console.log('游戏已暂停');
    }

    /**
     * 恢复游戏
     */
    resumeGame() {
        this.isPaused = false;
        
        // 隐藏暂停菜单
        this.pauseMenu.classList.remove('active');
        
        // 恢复游戏系统
        const inputSystem = window.gameModules?.inputSystem;
        if (inputSystem) {
            inputSystem.resumeGame();
        }
        
        // 恢复投射物系统
        const projectileSystem = window.gameModules?.projectileSystem;
        if (projectileSystem) {
            projectileSystem.resume();
        }
        
        // 恢复音频
        const audioManager = window.gameModules?.audioManager;
        if (audioManager) {
            audioManager.setMuted(false);
        }
        
        console.log('游戏已恢复');
    }

    /**
     * 返回关卡选择
     */
    backToLevelSelect() {
        // 恢复游戏系统（避免状态混乱）
        const inputSystem = window.gameModules?.inputSystem;
        if (inputSystem) {
            inputSystem.resumeGame();
        }
        
        // 恢复投射物系统
        const projectileSystem = window.gameModules?.projectileSystem;
        if (projectileSystem) {
            projectileSystem.resume();
        }
        
        // 恢复音频
        const audioManager = window.gameModules?.audioManager;
        if (audioManager) {
            audioManager.setMuted(false);
        }
        
        // 重置暂停状态
        this.isPaused = false;
        this.pauseMenu.classList.remove('active');
        
        // 触发返回关卡选择事件
        const event = new CustomEvent('backToLevelSelect');
        document.dispatchEvent(event);
        
        console.log('返回关卡选择');
    }

    /**
     * 检查是否暂停
     * @returns {boolean} 是否暂停
     */
    isGamePaused() {
        return this.isPaused;
    }
}

// 导出暂停菜单类
if (typeof module !== 'undefined' && module.exports) {
    module.exports = PauseMenu;
}
