/**
 * 关卡选择模块
 * 负责处理关卡选择界面的显示和交互逻辑
 */
class LevelSelect {
    constructor() {
        this.levelSelectElement = document.getElementById('level-select');
        this.backButton = document.getElementById('back-to-menu-btn');
        this.levelIcons = document.querySelectorAll('.level-icon');
        
        // 关卡数据配置
        this.levelData = {
            1: {
                name: '村庄堡垒',
                description: '一个被木栅栏围绕的宁静村庄，适合新手冒险者开始他们的旅程。',
                enemies: '圆头耄耋',
                image: 'map_select/tiny_map_1.png'
            },
            2: {
                name: '森林村庄',
                description: '隐藏在茂密森林中的神秘村庄，需要小心森林中的危险生物。',
                enemies: '哥布林（主要）：可能掉落村民\n骷髅：可能掉落骑士\n史莱姆：可能掉落弓手\n圆头耄耋',
                image: 'map_select/tiny_map_2.png'
            },
            3: {
                name: '军事哨站',
                description: '一个戒备森严的军事前哨，里面驻扎着训练有素的士兵。',
                enemies: '骷髅（主要）：可能掉落骑士\n哥布林：可能掉落村民\n史莱姆：可能掉落弓手\n圆头耄耋',
                image: 'map_select/tiny_map_3.png'
            },
            4: {
                name: '长城防线',
                description: '古老的长城防御工事，需要突破坚固的城墙和守卫。',
                enemies: '史莱姆（主要）：可能掉落弓手\n哥布林：可能掉落村民\n骷髅：可能掉落骑士\n圆头耄耋',
                image: 'map_select/tiny_map_4.png'
            },
            5: {
                name: '石桥通道',
                description: '横跨河流的石桥，是通往主城的必经之路，但充满了陷阱。',
                enemies: '史莱姆（主要）：可能掉落弓手\n哥布林：可能掉落村民\n骷髅：可能掉落骑士\n圆头耄耋',
                image: 'map_select/tiny_map_5.png'
            },
            6: {
                name: '主城城堡',
                description: '最终的目标！宏伟的城堡中隐藏着最强大的敌人和珍贵的宝藏。',
                enemies: '哥布林：可能掉落村民\n骷髅：可能掉落骑士\n史莱姆：可能掉落弓手\n圆头耄耋（最终Boss）',
                image: 'map_select/tiny_map_6.png'
            }
        };

        this.init();
    }

    /**
     * 初始化关卡选择界面
     */
    init() {
        this.bindEvents();
        this.setupLevelIcons();
        console.log('关卡选择模块已初始化');
    }

    /**
     * 绑定事件监听器
     */
    bindEvents() {
        // 返回主菜单按钮
        this.backButton.addEventListener('click', () => {
            this.onBackToMenu();
        });

        // 关卡图标点击事件
        this.levelIcons.forEach(icon => {
            icon.addEventListener('click', (event) => {
                const levelId = event.currentTarget.dataset.level;
                this.onLevelClick(levelId);
            });

            // 添加悬停效果
            icon.addEventListener('mouseenter', (event) => {
                this.onLevelHover(event.currentTarget, true);
            });

            icon.addEventListener('mouseleave', (event) => {
                this.onLevelHover(event.currentTarget, false);
            });
        });

        // 添加键盘事件支持
        document.addEventListener('keydown', (event) => {
            this.handleKeyPress(event);
        });
    }

    /**
     * 设置关卡图标
     */
    setupLevelIcons() {
        this.levelIcons.forEach(icon => {
            const levelId = icon.dataset.level;
            const levelInfo = this.levelData[levelId];
            
            if (levelInfo) {
                // 设置关卡名称
                const nameElement = icon.querySelector('.level-name');
                if (nameElement) {
                    nameElement.textContent = levelInfo.name;
                }
            }
        });
    }

    /**
     * 处理键盘按键事件
     * @param {KeyboardEvent} event - 键盘事件对象
     */
    handleKeyPress(event) {
        // 只有在关卡选择界面显示时才处理键盘事件
        if (!this.levelSelectElement.classList.contains('active')) {
            return;
        }

        switch(event.key) {
            case 'Escape':
                this.onBackToMenu();
                break;
            case '1':
            case '2':
            case '3':
            case '4':
            case '5':
            case '6':
                const levelId = parseInt(event.key);
                this.onLevelClick(levelId.toString());
                break;
        }
    }

    /**
     * 关卡图标悬停处理
     * @param {HTMLElement} icon - 关卡图标元素
     * @param {boolean} isHovering - 是否悬停
     */
    onLevelHover(icon, isHovering) {
        const levelId = icon.dataset.level;
        const levelInfo = this.levelData[levelId];
        
        if (isHovering) {
            // 添加悬停效果
            icon.style.transform = 'translate(-50%, -50%) scale(1.05)';
            console.log(`悬停在关卡 ${levelId}: ${levelInfo.name}`);
        } else {
            // 移除悬停效果
            icon.style.transform = 'translate(-50%, -50%) scale(1)';
        }
    }

    /**
     * 关卡点击处理
     * @param {string} levelId - 关卡ID
     */
    onLevelClick(levelId) {
        const levelInfo = this.levelData[levelId];
        
        if (!levelInfo) {
            console.error(`未找到关卡 ${levelId} 的数据`);
            return;
        }

        console.log(`关卡 ${levelId} 被点击: ${levelInfo.name}`);

        // 添加点击动画效果
        const icon = document.querySelector(`[data-level="${levelId}"]`);
        if (icon) {
            icon.style.transform = 'translate(-50%, -50%) scale(0.95)';
            setTimeout(() => {
                icon.style.transform = 'translate(-50%, -50%) scale(1)';
            }, 150);
        }

        // 特殊处理：村庄堡垒显示队伍编辑弹窗
        if (levelId === '1') {
            if (window.villageFortressPopup) {
                window.villageFortressPopup.showPopup();
            } else {
                console.error('村庄堡垒弹窗未初始化');
            }
            return;
        }

        // 其他关卡触发自定义事件，通知弹窗模块显示关卡详情
        const event = new CustomEvent('levelSelected', {
            detail: { 
                levelId: levelId,
                levelData: levelInfo
            }
        });
        document.dispatchEvent(event);
    }

    /**
     * 返回主菜单处理
     */
    onBackToMenu() {
        console.log('返回主菜单按钮被点击');
        
        // 添加按钮点击动画效果
        this.backButton.style.transform = 'scale(0.95)';
        setTimeout(() => {
            this.backButton.style.transform = 'scale(1)';
        }, 150);

        // 触发自定义事件，通知游戏管理器切换回主菜单
        const event = new CustomEvent('backToMenu', {
            detail: { from: 'levelSelect' }
        });
        document.dispatchEvent(event);
    }

    /**
     * 显示关卡选择界面
     */
    show() {
        this.levelSelectElement.classList.add('active');
        this.resetLevelIcons();
        console.log('关卡选择界面已显示');
    }

    /**
     * 隐藏关卡选择界面
     */
    hide() {
        this.levelSelectElement.classList.remove('active');
        console.log('关卡选择界面已隐藏');
    }

    /**
     * 重置关卡图标状态
     */
    resetLevelIcons() {
        this.levelIcons.forEach(icon => {
            icon.style.transform = 'translate(-50%, -50%) scale(1)';
        });
        
        this.backButton.style.transform = 'scale(1)';
        console.log('关卡图标状态已重置');
    }

    /**
     * 获取关卡数据
     * @param {string} levelId - 关卡ID
     * @returns {Object|null} 关卡数据对象
     */
    getLevelData(levelId) {
        return this.levelData[levelId] || null;
    }

    /**
     * 获取所有关卡数据
     * @returns {Object} 所有关卡数据
     */
    getAllLevelData() {
        return this.levelData;
    }
}

// 导出关卡选择类
if (typeof module !== 'undefined' && module.exports) {
    module.exports = LevelSelect;
}


