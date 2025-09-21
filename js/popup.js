/**
 * 弹窗模块
 * 负责处理关卡详情弹窗的显示和交互逻辑
 */
class Popup {
    constructor() {
        this.popupOverlay = document.getElementById('level-popup');
        this.popupTitle = document.getElementById('popup-title');
        this.popupLevelImg = document.getElementById('popup-level-img');
        this.popupLevelName = document.getElementById('popup-level-name');
        this.popupLevelDesc = document.getElementById('popup-level-desc');
        this.popupEnemies = document.getElementById('popup-enemies');
        this.closeButton = document.getElementById('close-popup-btn');
        this.confirmButton = document.getElementById('confirm-level-btn');
        
        this.currentLevelId = null;
        this.currentLevelData = null;

        this.init();
    }

    /**
     * 初始化弹窗模块
     */
    init() {
        this.bindEvents();
        console.log('弹窗模块已初始化');
    }

    /**
     * 绑定事件监听器
     */
    bindEvents() {
        // 关闭按钮点击事件
        this.closeButton.addEventListener('click', () => {
            this.hide();
        });

        // 确认按钮点击事件
        this.confirmButton.addEventListener('click', () => {
            this.onConfirm();
        });

        // 点击遮罩层关闭弹窗
        this.popupOverlay.addEventListener('click', (event) => {
            if (event.target === this.popupOverlay) {
                this.hide();
            }
        });

        // 添加键盘事件支持
        document.addEventListener('keydown', (event) => {
            this.handleKeyPress(event);
        });

        // 监听关卡选择事件
        document.addEventListener('levelSelected', (event) => {
            this.showLevelDetails(event.detail.levelId, event.detail.levelData);
        });
    }

    /**
     * 处理键盘按键事件
     * @param {KeyboardEvent} event - 键盘事件对象
     */
    handleKeyPress(event) {
        // 只有在弹窗显示时才处理键盘事件
        if (!this.popupOverlay.classList.contains('active')) {
            return;
        }

        switch(event.key) {
            case 'Escape':
                this.hide();
                break;
            case 'Enter':
                this.onConfirm();
                break;
        }
    }

    /**
     * 显示关卡详情
     * @param {string} levelId - 关卡ID
     * @param {Object} levelData - 关卡数据
     */
    showLevelDetails(levelId, levelData) {
        this.currentLevelId = levelId;
        this.currentLevelData = levelData;

        // 更新弹窗内容
        this.updatePopupContent(levelData);
        
        // 显示弹窗
        this.show();
        
        console.log(`显示关卡 ${levelId} 的详情: ${levelData.name}`);
    }

    /**
     * 更新弹窗内容
     * @param {Object} levelData - 关卡数据
     */
    updatePopupContent(levelData) {
        // 更新标题
        this.popupTitle.textContent = '关卡详情';
        
        // 更新关卡图片
        this.popupLevelImg.src = levelData.image;
        this.popupLevelImg.alt = levelData.name;
        
        // 更新关卡名称
        this.popupLevelName.textContent = levelData.name;
        
        // 更新关卡描述
        this.popupLevelDesc.textContent = levelData.description;
        
        // 更新敌人信息
        this.popupEnemies.textContent = levelData.enemies || '暂无敌人信息';
    }


    /**
     * 确认按钮点击处理
     */
    onConfirm() {
        if (!this.currentLevelId || !this.currentLevelData) {
            console.error('没有可确认的关卡数据');
            return;
        }

        console.log(`确认进入关卡 ${this.currentLevelId}: ${this.currentLevelData.name}`);

        // 添加按钮点击动画效果
        this.confirmButton.style.transform = 'scale(0.95)';
        setTimeout(() => {
            this.confirmButton.style.transform = 'scale(1)';
        }, 150);

        // 触发自定义事件，通知游戏管理器进入关卡
        const event = new CustomEvent('levelConfirmed', {
            detail: { 
                levelId: this.currentLevelId,
                levelData: this.currentLevelData
            }
        });
        document.dispatchEvent(event);

        // 隐藏弹窗
        this.hide();
    }

    /**
     * 显示弹窗
     */
    show() {
        this.popupOverlay.classList.add('active');
        
        // 添加显示动画
        this.popupOverlay.style.opacity = '0';
        setTimeout(() => {
            this.popupOverlay.style.opacity = '1';
        }, 10);

        // 重置按钮状态
        this.resetButtons();
        
        console.log('弹窗已显示');
    }

    /**
     * 隐藏弹窗
     */
    hide() {
        // 添加隐藏动画
        this.popupOverlay.style.opacity = '0';
        
        setTimeout(() => {
            this.popupOverlay.classList.remove('active');
            this.popupOverlay.style.opacity = '1';
        }, 300);

        // 清除当前关卡数据
        this.currentLevelId = null;
        this.currentLevelData = null;
        
        console.log('弹窗已隐藏');
    }

    /**
     * 重置按钮状态
     */
    resetButtons() {
        this.closeButton.style.transform = 'scale(1)';
        this.confirmButton.style.transform = 'scale(1)';
    }

    /**
     * 检查弹窗是否显示
     * @returns {boolean} 弹窗是否显示
     */
    isVisible() {
        return this.popupOverlay.classList.contains('active');
    }

    /**
     * 获取当前选中的关卡ID
     * @returns {string|null} 当前关卡ID
     */
    getCurrentLevelId() {
        return this.currentLevelId;
    }

    /**
     * 获取当前选中的关卡数据
     * @returns {Object|null} 当前关卡数据
     */
    getCurrentLevelData() {
        return this.currentLevelData;
    }
}

// 导出弹窗类
if (typeof module !== 'undefined' && module.exports) {
    module.exports = Popup;
}



