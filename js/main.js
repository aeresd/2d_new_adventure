/**
 * 游戏主入口文件
 * 负责初始化所有模块并启动游戏
 * 设计为模块化，确保与未来库（Matter.js, Three.js, React等）的兼容性
 */

// 等待DOM加载完成
document.addEventListener('DOMContentLoaded', function() {
    console.log('DOM加载完成，开始初始化游戏...');
    
    // 初始化游戏模块
    let gameManager, mainMenu, levelSelect, popup, victoryPopup, inputSystem, collisionSystem, projectileSystem, pauseMenu, audioManager;
    
    try {
        // 创建游戏管理器实例
        gameManager = new GameManager();
        
        // 创建主菜单实例
        mainMenu = new MainMenu();
        
        // 创建关卡选择实例
        levelSelect = new LevelSelect();
        
        // 创建弹窗实例
        popup = new Popup();
        
        // 创建胜利弹窗实例
        victoryPopup = new VictoryPopup();
        
        // 创建输入系统实例
        inputSystem = new InputSystem();
        
        // 创建碰撞系统实例
        collisionSystem = new CollisionSystem();
        
        // 创建投射物系统实例
        projectileSystem = new ProjectileSystem();
        
        // 创建暂停菜单实例
        pauseMenu = new PauseMenu();
        
        // 创建音频管理器实例
        audioManager = new AudioManager();
        
        console.log('所有游戏模块初始化完成');
        
        // 将模块实例暴露到全局作用域，便于调试和未来库集成
        window.gameModules = {
            gameManager,
            mainMenu,
            levelSelect,
            popup,
            victoryPopup,
            inputSystem,
            collisionSystem,
            projectileSystem,
            pauseMenu,
            audioManager
        };
        
        // 初始化系统间的连接
        projectileSystem.setCollisionSystem(collisionSystem);
        
        // 暴露全局API，供未来库使用
        window.GameAPI = {
            // 游戏状态管理
            getGameState: () => gameManager.getGameState(),
            updateGameState: (newState) => gameManager.updateGameState(newState),
            
            // 输入系统控制
            getInputState: () => inputSystem.getGameState(),
            resetInputSystem: () => inputSystem.resetGameState(),
            setInputDifficulty: (difficulty) => inputSystem.setDifficulty(difficulty),
            
            // 倒计时控制
            setTimerDuration: (duration) => inputSystem.setTimerDuration(duration),
            getTimerConfig: () => inputSystem.getTimerConfig(),
            
            // 角色控制
            showCharacters: () => inputSystem.showCharacters(),
            hideCharacters: () => inputSystem.hideCharacters(),
            playAttackAnimation: (character) => inputSystem.playAttackAnimation(character),
            playDefendAnimation: (character) => inputSystem.playDefendAnimation(character),
            playHitAnimation: (character) => inputSystem.playHitAnimation(character),
            
            // 血条控制
            updatePlayerHealth: (health, maxHealth) => inputSystem.updatePlayerHealth(health, maxHealth),
            updateEnemyHealth: (health, maxHealth) => inputSystem.updateEnemyHealth(health, maxHealth),
            damagePlayer: (damage) => inputSystem.damagePlayer(damage),
            damageEnemy: (damage) => inputSystem.damageEnemy(damage),
            resetHealth: () => inputSystem.resetHealth(),
            getHealthStatus: () => inputSystem.getHealthStatus(),
            
            // 关卡管理
            getCurrentLevel: () => gameManager.gameState.currentLevel,
            switchToLevel: (levelId) => {
                const levelData = levelSelect.getLevelData(levelId);
                if (levelData) {
                    gameManager.enterLevel(levelId, levelData);
                }
            },
            
            // 事件系统（供未来库监听）
            addEventListener: (eventName, callback) => {
                document.addEventListener(eventName, callback);
            },
            removeEventListener: (eventName, callback) => {
                document.removeEventListener(eventName, callback);
            },
            
            // 碰撞系统控制
            checkCollision: () => collisionSystem.checkPlayerEnemyCollision(),
            setCollisionEnabled: (enabled) => collisionSystem.setCollisionEnabled(enabled),
            setCollisionConfig: (characterType, config) => collisionSystem.setCollisionConfig(characterType, config),
            setCollisionDebug: (enabled) => collisionSystem.setDebugMode(enabled),
            getCollisionStatus: () => collisionSystem.getCollisionStatus(),
            updateEnemyCollisionByType: (enemyType) => collisionSystem.updateEnemyCollisionByType(enemyType),
            
            // 投射物系统控制
            fireProjectile: (startPos, targetPos) => projectileSystem.fireProjectile(startPos, targetPos),
            fireAtEnemy: () => projectileSystem.fireAtEnemy(),
            setProjectileActive: (active) => projectileSystem.setActive(active),
            setProjectileConfig: (config) => projectileSystem.setConfig(config),
            getProjectileStatus: () => projectileSystem.getStatus(),
            clearProjectiles: () => projectileSystem.clearAllProjectiles(),
            setProjectileCollisionCenterVisualization: (enabled) => projectileSystem.setCollisionCenterVisualization(enabled),
            
            // 倒计时系统控制
            startCountdown: () => inputSystem.startCountdown(),
            stopCountdown: () => inputSystem.stopCountdown(),
            setEnemyConfig: (config) => inputSystem.setEnemyConfig(config),
            getEnemyConfig: () => inputSystem.getEnemyConfig(),
            
            // 敌人状态管理
            setEnemyState: (state) => inputSystem.setEnemyState(state),
            getEnemyState: () => inputSystem.getEnemyState(),
            updateEnemyAppearance: () => inputSystem.updateEnemyAppearance(),
            
            // 玩家状态管理
            setPlayerState: (state) => inputSystem.setPlayerState(state),
            getPlayerState: () => inputSystem.getPlayerState(),
            playPlayerAttackAnimation: () => inputSystem.playPlayerAttackAnimation(),
            
            // 调试工具
            showHealthBarCoordinates: () => inputSystem.showHealthBarCoordinates(),
            
            // 测试玩家动画（调试用）
            testPlayerHit: () => inputSystem.setPlayerState('hit'),
            testPlayerAttack: () => inputSystem.setPlayerState('attacking'),
            
            // 模块访问（供未来库直接使用）
            getModule: (moduleName) => {
                return window.gameModules[moduleName];
            }
        };
        
        console.log('游戏已准备就绪！');
        console.log('GameAPI已暴露，可供未来库使用');
        
        // 启动物理更新循环
        startPhysicsLoop();
        
    } catch (error) {
        console.error('游戏初始化失败:', error);
        alert('游戏初始化失败，请刷新页面重试');
    }
});

// 添加全局错误处理
window.addEventListener('error', function(event) {
    console.error('全局错误:', event.error);
});

// 添加未处理的Promise拒绝处理
window.addEventListener('unhandledrejection', function(event) {
    console.error('未处理的Promise拒绝:', event.reason);
});

// 投射物系统更新循环
function startPhysicsLoop() {
    function updatePhysics() {
        if (window.gameModules?.projectileSystem) {
            window.gameModules.projectileSystem.update();
        }
        requestAnimationFrame(updatePhysics);
    }
    updatePhysics();
}

// 导出主要类（如果使用模块系统）
if (typeof module !== 'undefined' && module.exports) {
    module.exports = {
        GameManager,
        MainMenu,
        LevelSelect,
        Popup,
        InputSystem,
        CollisionSystem,
        ProjectileSystem
    };
}



