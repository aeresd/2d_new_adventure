/**
 * 游戏管理器模块
 * 负责管理游戏的整体状态和页面跳转逻辑
 */
class GameManager {
    constructor() {
        this.currentScreen = 'mainMenu';
        this.gameState = {
            isInitialized: false,
            currentLevel: null,
            playerData: {
                level: 1,
                experience: 0,
                unlockedLevels: [1] // 默认解锁第一关
            }
        };

        // 屏幕元素引用
        this.screens = {
            mainMenu: document.getElementById('main-menu'),
            levelSelect: document.getElementById('level-select'),
            levelScene: document.getElementById('level-scene')
        };

        this.init();
    }

    /**
     * 初始化游戏管理器
     */
    init() {
        this.bindEvents();
        this.loadGameData();
        this.gameState.isInitialized = true;
        console.log('游戏管理器已初始化');
    }

    /**
     * 绑定全局事件监听器
     */
    bindEvents() {
        // 监听开始游戏事件
        document.addEventListener('gameStart', (event) => {
            this.startGame();
        });

        // 监听新手教程开始事件
        document.addEventListener('tutorialStart', (event) => {
            this.startTutorial();
        });

        // 监听返回主菜单事件
        document.addEventListener('backToMenu', (event) => {
            this.backToMainMenu();
        });

        // 监听关卡确认事件
        document.addEventListener('levelConfirmed', (event) => {
            this.enterLevel(event.detail.levelId, event.detail.levelData);
        });

        // 监听返回关卡选择事件
        document.addEventListener('backToLevelSelect', (event) => {
            this.backToLevelSelect();
        });

        // 监听开始关卡事件
        document.addEventListener('startLevel', (event) => {
            this.startLevelGame();
        });
        
        // 监听胜利事件
        document.addEventListener('victory', (event) => {
            this.handleVictory(event.detail);
        });
        
        // 监听下一关事件
        document.addEventListener('nextLevel', (event) => {
            this.handleNextLevel(event.detail);
        });

        // 监听输入系统事件
        document.addEventListener('inputSystemEvent', (event) => {
            this.handleInputSystemEvent(event.detail);
        });

        // 监听玩家死亡事件
        document.addEventListener('playerDeath', (event) => {
            this.handlePlayerDeath();
        });

        // 监听敌人死亡事件
        document.addEventListener('enemyDeath', (event) => {
            this.handleEnemyDeath();
        });

        // 监听窗口大小变化事件
        window.addEventListener('resize', () => {
            this.handleResize();
        });

        // 监听页面加载完成事件
        window.addEventListener('load', () => {
            this.onPageLoad();
        });

        // 监听页面卸载事件
        window.addEventListener('beforeunload', () => {
            this.saveGameData();
        });
    }

    /**
     * 页面加载完成处理
     */
    onPageLoad() {
        console.log('页面加载完成，游戏准备就绪');
        this.updateGameScale();
        this.showMainMenu();
    }

    /**
     * 开始游戏
     */
    startGame() {
        console.log('开始游戏');
        this.switchScreen('levelSelect');
    }

    /**
     * 开始新手教程
     */
    startTutorial() {
        console.log('开始新手教程');
        
        // 设置新手教程队伍配置
        this.setTutorialTeamConfig();
        
        // 进入新手教程关卡
        this.enterTutorialLevel();
    }

    /**
     * 设置新手教程队伍配置
     */
    setTutorialTeamConfig() {
        // 设置新手教程专用队伍配置：弓手x2 村民x2
        const tutorialTeamConfig = {
            archer: 2,
            villager: 2,
            knight: 0
        };
        
        // 更新村庄堡垒弹窗的队伍配置
        if (window.villageFortressPopup) {
            window.villageFortressPopup.setTeamConfig(tutorialTeamConfig);
        }
        
        // 同步到存档系统
        if (window.saveManager) {
            window.saveManager.updateTeamConfig(tutorialTeamConfig);
        }
        
        console.log('新手教程队伍配置已设置:', tutorialTeamConfig);
    }

    /**
     * 进入新手教程关卡
     */
    enterTutorialLevel() {
        const tutorialLevelData = {
            name: '新手教程',
            description: '学习游戏基本操作和战斗机制',
            enemies: '圆头耄耋（教程）',
            image: 'campaign/tiny_map1.png'
        };
        
        // 更新游戏状态
        this.gameState.currentLevel = 'tutorial';
        
        // 显示关卡场景
        this.showLevelScene('tutorial', tutorialLevelData);
        
        // 设置敌人配置
        this.setEnemyForLevel('tutorial', false);
        
        // 隐藏新手教程中的未知重生点
        this.hideTutorialUnknownSpawn();
        
        // 隐藏新手教程中的关卡信息UI
        this.hideTutorialLevelUI();
        
        // 启动新手教程流程
        this.startTutorialFlow();
    }

    /**
     * 启动新手教程流程
     */
    startTutorialFlow() {
        // 延迟一点时间后开始教程
        setTimeout(() => {
            this.showTutorialPopup('boss_intro');
        }, 1000);
    }

    /**
     * 显示新手教程弹窗
     * @param {string} popupType - 弹窗类型
     */
    showTutorialPopup(popupType) {
        // 檢查是否在新手教程中，如果不是則不顯示教程彈窗
        if (this.gameState.currentLevel !== 'tutorial') {
            console.log('非新手教程狀態，跳過教程彈窗:', popupType);
            return;
        }

        // 暂停游戏
        const inputSystem = window.gameModules?.inputSystem;
        if (inputSystem) {
            inputSystem.pauseGame();
        }

        // 创建教程弹窗
        const popup = this.createTutorialPopup(popupType);
        document.body.appendChild(popup);
        
        // 显示弹窗
        popup.style.display = 'flex';
        
        // 绑定点击事件
        popup.addEventListener('click', () => {
            this.handleTutorialPopupClick(popupType);
            document.body.removeChild(popup);
        });
    }

    /**
     * 创建新手教程弹窗
     * @param {string} popupType - 弹窗类型
     * @returns {HTMLElement} 弹窗元素
     */
    createTutorialPopup(popupType) {
        const popup = document.createElement('div');
        popup.className = 'tutorial-popup-overlay';
        popup.style.cssText = `
            position: fixed;
            top: 0;
            left: 0;
            width: 100%;
            height: 100%;
            background: rgba(0, 0, 0, 0.8);
            display: flex;
            justify-content: center;
            align-items: center;
            z-index: 1000;
            cursor: pointer;
        `;

        const content = document.createElement('div');
        content.className = 'tutorial-popup-content';
        content.style.cssText = `
            background: #2c3e50;
            border: 3px solid #e74c3c;
            border-radius: 15px;
            padding: 30px;
            max-width: 600px;
            text-align: center;
            color: white;
            font-family: 'Arial', sans-serif;
            position: relative;
            box-shadow: 0 10px 30px rgba(0, 0, 0, 0.5);
        `;

        const text = document.createElement('div');
        text.style.cssText = `
            font-size: 18px;
            line-height: 1.6;
            margin-bottom: 20px;
            white-space: pre-line;
        `;

        const continueText = document.createElement('div');
        continueText.style.cssText = `
            position: absolute;
            bottom: 10px;
            right: 15px;
            font-size: 12px;
            color: #bdc3c7;
            font-style: italic;
        `;
        continueText.textContent = '点击鼠标继续';

        // 根据弹窗类型设置文本内容
        switch (popupType) {
            case 'boss_intro':
                text.textContent = '圆头耄耋：哦豁? 又有新来的想要打败我的楞头青吗？有趣~\n\n嘶哈!吃我一击!哈!';
                break;
            case 'damage_warning':
                text.textContent = '请小心，敌人的任何攻击都可能让你的队伍损失队友，当敌人血条下方的倒计时结束时就会发动一次攻击，请当心';
                break;
            case 'attack_instruction':
                text.textContent = '请按照下方的方向指引输入对应的WASD／上下左右的方向键予以还击，每完整的输入一次键位序列将可以发动一次攻击，连续成功输入一定次数后下一次攻击将可以打断敌人的攻击';
                break;
            case 'player_defeat':
                text.textContent = '圆头耄耋：切，算你走运';
                break;
            case 'enemy_defeat':
                text.textContent = '圆头耄耋：哈！不可能，我竟然输了，但这只是我的分身。我会在最终之地等你！哈！';
                break;
            case 'tutorial_complete':
                text.textContent = '村庄突袭事件暂时告一段落了，但是大魔王圆头耄耋的威胁还没有消失，请勇者再次打败他。\n\n每次打败敌人都有几率可以解救友军，你可以逐步的解放周边的地区来积攒力量\n\n亦或是前往城堡进行斩首行动';
                break;
        }

        content.appendChild(text);
        content.appendChild(continueText);
        popup.appendChild(content);

        return popup;
    }

    /**
     * 处理新手教程弹窗点击
     * @param {string} popupType - 弹窗类型
     */
    handleTutorialPopupClick(popupType) {
        switch (popupType) {
            case 'boss_intro':
                // Boss介绍后，强制敌人攻击
                this.forceEnemyAttack();
                break;
            case 'damage_warning':
                // 伤害警告后，显示攻击说明
                setTimeout(() => {
                    this.showTutorialPopup('attack_instruction');
                }, 500);
                break;
            case 'attack_instruction':
                // 攻击说明后，直接开始游戏
                this.startTutorialGame();
                break;
            case 'player_defeat':
            case 'enemy_defeat':
                // 战斗结束后，显示完成弹窗
                setTimeout(() => {
                    this.showTutorialPopup('tutorial_complete');
                }, 500);
                break;
            case 'tutorial_complete':
                // 教程完成，返回关卡选择
                this.completeTutorial();
                break;
        }
    }

    /**
     * 强制敌人攻击
     */
    forceEnemyAttack() {
        const inputSystem = window.gameModules?.inputSystem;
        if (inputSystem) {
            // 播放敌人攻击动画
            inputSystem.setEnemyState('attacking');
            
            // 延迟一点时间后对玩家造成伤害，让攻击动画先播放
            setTimeout(() => {
                inputSystem.damagePlayer(10);
            }, 500);
            
            // 显示伤害警告弹窗
            setTimeout(() => {
                this.showTutorialPopup('damage_warning');
            }, 1500);
        }
    }

    /**
     * 恢复教程游戏
     */
    resumeTutorialGame() {
        const inputSystem = window.gameModules?.inputSystem;
        if (inputSystem) {
            inputSystem.resumeGame();
        }
    }

    /**
     * 开始新手教程游戏
     */
    startTutorialGame() {
        // 只有在新手教程中才隐藏关卡信息UI
        if (this.gameState.currentLevel === 'tutorial') {
            this.hideLevelUI();
        }
        
        // 恢复游戏系统
        const inputSystem = window.gameModules?.inputSystem;
        if (inputSystem) {
            // 恢复游戏系统
            inputSystem.resumeGame();
            // 延迟一点时间后重新开始
            setTimeout(() => {
                inputSystem.startNewSequence();
                console.log('新手教程游戏已开始');
            }, 100);
        }
    }

    /**
     * 完成新手教程
     */
    completeTutorial() {
        // 清除教程狀態
        this.gameState.currentLevel = null;
        this.gameState.isInTutorial = false;
        
        // 返回关卡选择界面
        this.switchScreen('levelSelect');
        
        // 重置队伍配置为默认值
        this.resetTeamConfigToDefault();
        
        console.log('新手教程已完成，狀態已重置');
    }

    /**
     * 重置队伍配置为默认值
     */
    resetTeamConfigToDefault() {
        const defaultTeamConfig = {
            archer: 1,
            villager: 1,
            knight: 1
        };
        
        // 更新村庄堡垒弹窗的队伍配置
        if (window.villageFortressPopup) {
            window.villageFortressPopup.setTeamConfig(defaultTeamConfig);
        }
        
        // 同步到存档系统
        if (window.saveManager) {
            window.saveManager.updateTeamConfig(defaultTeamConfig);
        }
        
        console.log('队伍配置已重置为默认值:', defaultTeamConfig);
    }

    /**
     * 处理玩家死亡
     */
    handlePlayerDeath() {
        // 只有在新手教程中才显示特殊弹窗
        if (this.gameState.currentLevel === 'tutorial') {
            this.showTutorialPopup('player_defeat');
        }
    }

    /**
     * 处理敌人死亡
     */
    handleEnemyDeath() {
        // 只有在新手教程中才显示特殊弹窗
        if (this.gameState.currentLevel === 'tutorial') {
            this.showTutorialPopup('enemy_defeat');
        }
    }

    /**
     * 隐藏新手教程中的未知重生点
     */
    hideTutorialUnknownSpawn() {
        const inputSystem = window.gameModules?.inputSystem;
        if (inputSystem && inputSystem.unknownSpawnElement) {
            inputSystem.unknownSpawnElement.style.display = 'none';
            console.log('新手教程中的未知重生点已隐藏');
        }
    }

    /**
     * 隐藏新手教程中的关卡信息UI
     */
    hideTutorialLevelUI() {
        const levelUI = document.querySelector('.level-ui');
        if (levelUI) {
            levelUI.style.display = 'none';
            console.log('新手教程中的关卡信息UI已隐藏');
        }
    }

    /**
     * 返回主菜单
     */
    backToMainMenu() {
        console.log('返回主菜单');
        this.switchScreen('mainMenu');
    }

    /**
     * 进入关卡
     * @param {string} levelId - 关卡ID
     * @param {Object} levelData - 关卡数据
     */
    enterLevel(levelId, levelData) {
        console.log(`进入关卡 ${levelId}: ${levelData.name}`);
        
        // 更新游戏状态
        this.gameState.currentLevel = levelId;
        
        // 跳转到关卡场景
        this.showLevelScene(levelId, levelData);
    }

    /**
     * 显示关卡场景
     * @param {string} levelId - 关卡ID
     * @param {Object} levelData - 关卡数据
     */
    showLevelScene(levelId, levelData) {
        // 获取关卡背景图片路径
        const backgroundImage = this.getLevelBackgroundImage(levelId);
        
        // 更新关卡背景图片
        const levelBgImg = document.getElementById('level-bg-img');
        if (levelBgImg) {
            levelBgImg.src = backgroundImage;
            levelBgImg.alt = `${levelData.name}背景`;
        }
        
        // 控制地面线条显示（所有关卡都隐藏）
        const groundLine = document.getElementById('ground-line');
        if (groundLine) {
            groundLine.style.display = 'none';
        }
        
        // 控制天空背景显示（仅关卡5显示）
        const skyBackground = document.getElementById('sky-background');
        if (skyBackground) {
            if (levelId === '5') {
                skyBackground.style.display = 'block';
            } else {
                skyBackground.style.display = 'none';
            }
        }
        
        // 更新关卡信息
        const levelTitle = document.getElementById('level-scene-title');
        const levelDesc = document.getElementById('level-scene-desc');
        
        if (levelTitle) levelTitle.textContent = levelData.name;
        if (levelDesc) levelDesc.textContent = levelData.description;
        
        // 绑定关卡场景事件
        this.bindLevelSceneEvents();
        
        // 切换到关卡场景
        this.switchScreen('levelScene');
        
        // 根据关卡设置敌人类型（但不启动游戏）
        this.setEnemyForLevel(levelId, false);
        
        // 确保关卡信息UI显示（新手教程除外）
        if (levelId !== 'tutorial') {
            this.showLevelUI();
        }
        
        // 触发关卡场景显示事件
        const event = new CustomEvent('levelSceneShown', {
            detail: { levelId, levelData }
        });
        document.dispatchEvent(event);
        
        console.log(`关卡场景已显示: ${levelData.name}`);
    }

    /**
     * 根据关卡设置敌人类型
     * @param {string} levelId - 关卡ID
     * @param {boolean} startGame - 是否立即启动游戏，默认为true
     */
    setEnemyForLevel(levelId, startGame = true) {
        const inputSystem = window.gameModules?.inputSystem;
        if (!inputSystem) return;
        
        // 关卡敌人配置
        const levelEnemyConfig = {
            'tutorial': {
                type: 'enemy-four', // 新手教程：敌人四（猫）
                level: 1,
                countdownDuration: 10,
                damage: 10,
                health: 10,
                respawnRange: { min: 0, max: 0 } // 新手教程：不重生
            },
            '1': {
                type: 'enemy-four', // 关卡1：敌人四（猫）- 村庄堡垒
                level: 1,
                countdownDuration: 10,
                damage: 10,
                health: 10,
                respawnRange: { min: 1, max: 2 } // 村庄堡垒：1-2次
            },
            '2': {
                type: 'enemy-one', // 关卡2：敌人一（哥布林）- 森林村庄
                level: 2,
                countdownDuration: 10, // 森林村庄：10秒
                damage: 7, // 使用敌人一的基础攻击力
                respawnRange: { min: 2, max: 4 }, // 森林村庄：2-4次
                firstEnemyMustBe: 'enemy-one', // 第一个敌人必须是敌人一
                enemyTypes: [
                    { type: 'enemy-one', probability: 0.65 },
                    { type: 'enemy-two', probability: 0.18 },
                    { type: 'enemy-three', probability: 0.15 },
                    { type: 'enemy-four', probability: 0.02 }
                ]
            },
            '3': {
                type: 'enemy-two', // 关卡3：敌人二（骷髅）- 军事哨站
                level: 3,
                countdownDuration: 10, // 军事哨站：10秒
                damage: 15, // 使用敌人二的基础攻击力
                respawnRange: { min: 2, max: 4 }, // 军事哨站：2-4次
                firstEnemyMustBe: 'enemy-two', // 第一个敌人必须是敌人二
                enemyTypes: [
                    { type: 'enemy-one', probability: 0.30 },
                    { type: 'enemy-two', probability: 0.50 },
                    { type: 'enemy-three', probability: 0.17 },
                    { type: 'enemy-four', probability: 0.03 }
                ]
            },
            '4': {
                type: 'enemy-four', // 关卡4：敌人四（猫）- 长城防线（临时使用敌人四）
                level: 4,
                countdownDuration: 10, // 长城防线：10秒
                damage: 25, // 使用敌人四的基础攻击力
                respawnRange: { min: 2, max: 4 }, // 长城防线：2-4次
                firstEnemyMustBe: 'enemy-three', // 第一个敌人必须是敌人三
                enemyTypes: [
                    { type: 'enemy-one', probability: 0.17 },
                    { type: 'enemy-two', probability: 0.20 },
                    { type: 'enemy-three', probability: 0.60 },
                    { type: 'enemy-four', probability: 0.03 }
                ]
            },
            '5': {
                type: 'enemy-three', // 关卡5：敌人三（史莱姆）- 石桥通道
                level: 5,
                countdownDuration: 9, // 石桥通道：9秒
                damage: 7, // 使用敌人三的基础攻击力
                respawnRange: { min: 3, max: 6 }, // 石桥通道：3-6次
                firstEnemyTypes: ['enemy-one', 'enemy-two', 'enemy-three'], // 第一个敌人从1/2/3中随机
                enemyTypes: [
                    { type: 'enemy-one', probability: 0.30 },
                    { type: 'enemy-two', probability: 0.30 },
                    { type: 'enemy-three', probability: 0.37 },
                    { type: 'enemy-four', probability: 0.03 }
                ]
            },
            '6': {
                type: 'enemy-four', // 关卡6：敌人四（猫）- 主城城堡
                level: 6,
                countdownDuration: 8, // 主城城堡：8秒
                damage: 25, // 使用敌人四的基础攻击力
                respawnRange: { min: 7, max: 10 }, // 主城城堡：7-10次
                firstEnemyTypes: ['enemy-one', 'enemy-two', 'enemy-three'], // 第一个敌人从1/2/3中随机
                enemyTypes: [
                    { type: 'enemy-one', probability: 0.30 },
                    { type: 'enemy-two', probability: 0.30 },
                    { type: 'enemy-three', probability: 0.30 },
                    { type: 'enemy-four', probability: 0.10 }
                ],
                lastEnemyMustBe: 'enemy-four' // 最后一个敌人必须是敌人四
            }
        };
        
        const config = levelEnemyConfig[levelId];
        if (config) {
            inputSystem.setEnemyConfig(config);
            console.log(`关卡 ${levelId} 敌人已设置为: ${config.type}`);
            console.log(`关卡 ${levelId} 重生次数范围: ${config.respawnRange.min}-${config.respawnRange.max}次`);
            
            // 如果不需要立即启动游戏，则暂停游戏系统
            if (!startGame) {
                inputSystem.pauseGame();
                console.log(`关卡 ${levelId} 已暂停，等待玩家点击开始关卡`);
            }
        } else {
            console.warn(`关卡 ${levelId} 没有配置敌人`);
        }
    }

    /**
     * 获取关卡背景图片路径
     * @param {string} levelId - 关卡ID
     * @returns {string} 背景图片路径
     */
    getLevelBackgroundImage(levelId) {
        const backgroundMap = {
            '2': 'campaign/tiny_map1.png',
            '3': 'campaign/tiny_map2.png',
            '4': 'campaign/tiny_map3.png',
            '5': 'campaign/tiny_map4.png',
            '6': 'campaign/tiny_map5.png'
        };
        
        return backgroundMap[levelId] || 'campaign/tiny_map1.png';
    }

    /**
     * 绑定关卡场景事件
     */
    bindLevelSceneEvents() {
        const backButton = document.getElementById('back-to-level-select');
        const startButton = document.getElementById('start-level');
        
        if (backButton) {
            backButton.addEventListener('click', () => {
                const event = new CustomEvent('backToLevelSelect');
                document.dispatchEvent(event);
            });
        }
        
        if (startButton) {
            startButton.addEventListener('click', () => {
                const event = new CustomEvent('startLevel');
                document.dispatchEvent(event);
            });
        }
    }

    /**
     * 返回关卡选择
     */
    backToLevelSelect() {
        // 显示关卡信息UI
        this.showLevelUI();
        
        // 触发关卡场景隐藏事件
        const event = new CustomEvent('levelSceneHidden');
        document.dispatchEvent(event);
        
        console.log('返回关卡选择界面');
        this.switchScreen('levelSelect');
    }

    /**
     * 开始关卡游戏
     */
    startLevelGame() {
        console.log('开始关卡游戏');
        // 隐藏关卡信息UI，显示游戏界面
        this.hideLevelUI();
        
        // 恢复游戏系统
        const inputSystem = window.gameModules?.inputSystem;
        if (inputSystem) {
            // 恢复游戏系统
            inputSystem.resumeGame();
            // 延迟一点时间后重新开始
            setTimeout(() => {
                inputSystem.startNewSequence();
                console.log('输入系统已重新启动');
            }, 100);
        }
        
        // 确保投射物系统激活
        const projectileSystem = window.gameModules?.projectileSystem;
        if (projectileSystem) {
            projectileSystem.setActive(true);
            projectileSystem.resume();
            console.log('投射物系统已激活');
        }
    }

    /**
     * 隐藏关卡信息UI
     */
    hideLevelUI() {
        const levelUI = document.querySelector('.level-ui');
        if (levelUI) {
            levelUI.style.display = 'none';
        }
    }

    /**
     * 显示关卡信息UI
     */
    showLevelUI() {
        const levelUI = document.querySelector('.level-ui');
        if (levelUI) {
            levelUI.style.display = 'block';
        }
    }
    
    /**
     * 处理胜利事件
     * @param {Object} detail - 胜利事件详情
     */
    handleVictory(detail) {
        const victoryPopup = window.gameModules?.victoryPopup;
        if (victoryPopup) {
            victoryPopup.show(detail.levelId, detail.levelData, detail.gameStats);
            console.log(`胜利弹窗已显示 - 关卡 ${detail.levelId}`);
        }
    }
    
    /**
     * 处理下一关事件
     * @param {Object} detail - 下一关事件详情
     */
    handleNextLevel(detail) {
        const nextLevelId = detail.nextLevel;
        const levelSelect = window.gameModules?.levelSelect;
        
        if (levelSelect) {
            const levelData = levelSelect.getLevelData(nextLevelId);
            if (levelData) {
                // 解锁下一关
                this.unlockLevel(nextLevelId);
                
                // 进入下一关
                this.enterLevel(nextLevelId, levelData);
                
                console.log(`已进入下一关: ${nextLevelId}`);
            } else {
                console.warn(`关卡 ${nextLevelId} 不存在`);
            }
        }
    }

    /**
     * 处理输入系统事件
     * @param {Object} eventDetail - 事件详情
     */
    handleInputSystemEvent(eventDetail) {
        const { type, data } = eventDetail;
        
        switch (type) {
            case 'correct':
                console.log('正确输入:', data.direction, '连击:', data.combo);
                break;
            case 'wrong':
                console.log('错误输入，期望:', data.expected);
                break;
            case 'sequenceComplete':
                console.log('序列完成！分数:', data.score, '最大连击:', data.maxCombo);
                this.updateGameScore(data.score, data.maxCombo);
                break;
        }
    }

    /**
     * 更新游戏分数
     * @param {number} score - 当前分数
     * @param {number} maxCombo - 最大连击
     */
    updateGameScore(score, maxCombo) {
        // 这里可以添加分数显示更新逻辑
        // 例如：更新UI显示、保存最高分等
        this.gameState.playerData.score = score;
        this.gameState.playerData.maxCombo = maxCombo;
        this.saveGameData();
    }

    /**
     * 切换屏幕
     * @param {string} screenName - 屏幕名称
     */
    switchScreen(screenName) {
        if (!this.screens[screenName]) {
            console.error(`未找到屏幕: ${screenName}`);
            return;
        }

        // 隐藏所有屏幕
        Object.values(this.screens).forEach(screen => {
            screen.classList.remove('active');
        });

        // 显示目标屏幕
        this.screens[screenName].classList.add('active');
        this.currentScreen = screenName;

        console.log(`切换到屏幕: ${screenName}`);
    }

    /**
     * 显示主菜单
     */
    showMainMenu() {
        this.switchScreen('mainMenu');
    }

    /**
     * 显示关卡选择界面
     */
    showLevelSelect() {
        this.switchScreen('levelSelect');
    }

    /**
     * 处理窗口大小变化
     */
    handleResize() {
        this.updateGameScale();
        console.log('窗口大小已变化，重新调整画布');
    }

    /**
     * 更新游戏缩放比例
     */
    updateGameScale() {
        const gameContent = document.querySelector('.game-content');
        if (!gameContent) return;

        const container = document.getElementById('game-container');
        const containerWidth = container.clientWidth;
        const containerHeight = container.clientHeight;
        
        // 计算缩放比例，保持1080p比例
        const scaleX = containerWidth / 1920;
        const scaleY = containerHeight / 1080;
        const scale = Math.min(scaleX, scaleY);
        
        // 应用缩放
        gameContent.style.transform = `scale(${scale})`;
        
        console.log(`游戏缩放比例: ${scale.toFixed(3)}`);
    }

    /**
     * 加载游戏数据
     */
    loadGameData() {
        try {
            const savedData = localStorage.getItem('pixelAdventureGameData');
            if (savedData) {
                const data = JSON.parse(savedData);
                this.gameState = { ...this.gameState, ...data };
                console.log('游戏数据已加载');
            }
        } catch (error) {
            console.error('加载游戏数据失败:', error);
        }
    }

    /**
     * 保存游戏数据
     */
    saveGameData() {
        try {
            localStorage.setItem('pixelAdventureGameData', JSON.stringify(this.gameState));
            console.log('游戏数据已保存');
        } catch (error) {
            console.error('保存游戏数据失败:', error);
        }
    }

    /**
     * 获取当前屏幕
     * @returns {string} 当前屏幕名称
     */
    getCurrentScreen() {
        return this.currentScreen;
    }

    /**
     * 获取游戏状态
     * @returns {Object} 游戏状态对象
     */
    getGameState() {
        return this.gameState;
    }

    /**
     * 更新游戏状态
     * @param {Object} newState - 新的状态数据
     */
    updateGameState(newState) {
        this.gameState = { ...this.gameState, ...newState };
        this.saveGameData();
    }

    /**
     * 解锁关卡
     * @param {string} levelId - 关卡ID
     */
    unlockLevel(levelId) {
        if (!this.gameState.playerData.unlockedLevels.includes(levelId)) {
            this.gameState.playerData.unlockedLevels.push(levelId);
            this.saveGameData();
            console.log(`关卡 ${levelId} 已解锁`);
        }
    }

    /**
     * 检查关卡是否已解锁
     * @param {string} levelId - 关卡ID
     * @returns {boolean} 是否已解锁
     */
    isLevelUnlocked(levelId) {
        return this.gameState.playerData.unlockedLevels.includes(levelId);
    }

    /**
     * 重置游戏数据
     */
    resetGameData() {
        this.gameState = {
            isInitialized: true,
            currentLevel: null,
            playerData: {
                level: 1,
                experience: 0,
                unlockedLevels: [1]
            }
        };
        this.saveGameData();
        console.log('游戏数据已重置');
    }
}

// 导出游戏管理器类
if (typeof module !== 'undefined' && module.exports) {
    module.exports = GameManager;
}


