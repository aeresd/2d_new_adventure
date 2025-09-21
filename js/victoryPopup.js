/**
 * 胜利弹窗模块
 * 负责处理胜利弹窗的显示和交互逻辑
 */
class VictoryPopup {
    constructor() {
        this.victoryPopup = document.getElementById('victory-popup');
        this.victoryTitle = document.getElementById('victory-title');
        this.victoryLevelName = document.getElementById('victory-level-name');
        this.victoryMessage = document.getElementById('victory-message');
        this.victoryCombo = document.getElementById('victory-combo');
        this.nextLevelButton = document.getElementById('next-level-btn');
        this.backToLevelsButton = document.getElementById('back-to-levels-btn');
        
        this.currentLevelId = null;
        this.currentLevelData = null;
        
        this.init();
    }
    
    /**
     * 初始化胜利弹窗
     */
    init() {
        this.bindEvents();
        this.bindCustomEvents();
        console.log('胜利弹窗模块已初始化');
    }

    /**
     * 绑定自定义事件
     */
    bindCustomEvents() {
        // 监听解救消息更新事件
        document.addEventListener('updateVictoryMessage', (event) => {
            if (this.victoryMessage) {
                let currentMessage = this.victoryMessage.textContent;
                
                // 处理解救消息
                if (event.detail.rescueMessage) {
                    // 移除之前的解救信息（如果有的话）
                    currentMessage = currentMessage.split('\n\n解救友军：')[0];
                    // 添加新的解救信息
                    currentMessage += event.detail.rescueMessage;
                }
                
                // 处理损失消息
                if (event.detail.lossMessage) {
                    // 移除之前的损失信息（如果有的话）
                    currentMessage = currentMessage.split('\n\n损失友军：')[0];
                    // 添加新的损失信息
                    currentMessage += event.detail.lossMessage;
                }
                
                this.victoryMessage.textContent = currentMessage;
            }
        });
    }
    
    /**
     * 绑定事件监听器
     */
    bindEvents() {
        // 下一关按钮
        if (this.nextLevelButton) {
            this.nextLevelButton.addEventListener('click', () => {
                this.onNextLevel();
            });
        }
        
        // 返回关卡选择按钮
        if (this.backToLevelsButton) {
            this.backToLevelsButton.addEventListener('click', () => {
                this.onBackToLevels();
            });
        }
        
        
        // 键盘事件支持
        document.addEventListener('keydown', (event) => {
            this.handleKeyPress(event);
        });
    }
    
    /**
     * 处理键盘按键事件
     * @param {KeyboardEvent} event - 键盘事件对象
     */
    handleKeyPress(event) {
        // 只有在胜利弹窗显示时才处理键盘事件
        if (!this.victoryPopup || this.victoryPopup.style.display !== 'flex') {
            return;
        }
        
        switch(event.key) {
            case 'Escape':
                this.hide();
                break;
            case 'Enter':
                this.onNextLevel();
                break;
            case 'Backspace':
                this.onBackToLevels();
                break;
        }
    }
    
    /**
     * 显示胜利弹窗
     * @param {string} levelId - 关卡ID
     * @param {Object} levelData - 关卡数据
     * @param {Object} gameStats - 游戏统计
     */
    show(levelId, levelData, gameStats = {}) {
        this.currentLevelId = levelId;
        this.currentLevelData = levelData;
        
        // 更新弹窗内容
        this.updateContent(levelData, gameStats);
        
        // 显示弹窗
        this.victoryPopup.style.display = 'flex';
        
        // 添加显示动画
        this.victoryPopup.style.opacity = '0';
        this.victoryPopup.style.transform = 'scale(0.8)';
        
        requestAnimationFrame(() => {
            this.victoryPopup.style.transition = 'all 0.3s ease-out';
            this.victoryPopup.style.opacity = '1';
            this.victoryPopup.style.transform = 'scale(1)';
        });
        
        console.log(`胜利弹窗已显示 - 关卡 ${levelId}: ${levelData.name}`);
    }
    
    /**
     * 隐藏胜利弹窗
     */
    hide() {
        if (this.victoryPopup) {
            this.victoryPopup.style.transition = 'all 0.2s ease-in';
            this.victoryPopup.style.opacity = '0';
            this.victoryPopup.style.transform = 'scale(0.8)';
            
            setTimeout(() => {
                this.victoryPopup.style.display = 'none';
            }, 200);
        }
        
        console.log('胜利弹窗已隐藏');
    }
    
    /**
     * 更新弹窗内容
     * @param {Object} levelData - 关卡数据
     * @param {Object} gameStats - 游戏统计
     */
    updateContent(levelData, gameStats) {
        // 更新关卡名称
        if (this.victoryLevelName) {
            this.victoryLevelName.textContent = levelData.name || '关卡完成';
        }
        
        // 更新胜利消息（包含解救友军信息）
        if (this.victoryMessage) {
            let message = gameStats.message || '恭喜您成功击败了所有敌人！';
            
            // 添加解救友军信息
            if (gameStats.rescueMessage) {
                message += gameStats.rescueMessage;
            }
            
            this.victoryMessage.textContent = message;
        }
        
        // 更新最高连击
        if (this.victoryCombo) {
            this.victoryCombo.textContent = gameStats.maxCombo || 0;
        }
        
        // 更新下一关按钮文本
        if (this.nextLevelButton) {
            const nextLevelId = parseInt(this.currentLevelId) + 1;
            if (nextLevelId <= 6) {
                this.nextLevelButton.textContent = `下一关 (${nextLevelId})`;
                this.nextLevelButton.style.display = 'block';
            } else {
                this.nextLevelButton.style.display = 'none';
            }
        }
    }
    
    /**
     * 下一关按钮点击处理
     */
    onNextLevel() {
        const nextLevelId = parseInt(this.currentLevelId) + 1;
        
        if (nextLevelId <= 6) {
            console.log(`进入下一关: ${nextLevelId}`);
            
            // 隐藏胜利弹窗
            this.hide();
            
            // 触发下一关事件
            const event = new CustomEvent('nextLevel', {
                detail: { 
                    currentLevel: this.currentLevelId,
                    nextLevel: nextLevelId.toString()
                }
            });
            document.dispatchEvent(event);
        } else {
            console.log('已经是最后一关了');
            this.onBackToLevels();
        }
    }
    
    /**
     * 返回关卡选择按钮点击处理
     */
    onBackToLevels() {
        console.log('返回关卡选择');
        
        // 隐藏胜利弹窗
        this.hide();
        
        // 触发返回关卡选择事件
        const event = new CustomEvent('backToLevelSelect', {
            detail: { from: 'victoryPopup' }
        });
        document.dispatchEvent(event);
    }
    
    /**
     * 检查是否已显示
     * @returns {boolean} 是否已显示
     */
    isVisible() {
        return this.victoryPopup && this.victoryPopup.style.display === 'flex';
    }
}

// 导出胜利弹窗类
if (typeof module !== 'undefined' && module.exports) {
    module.exports = VictoryPopup;
}
