/**
 * 碰撞检测系统
 * 负责处理玩家和敌人之间的碰撞检测
 */
class CollisionSystem {
    constructor() {
        this.collisionEnabled = true;
        this.debugMode = false; // 调试模式，显示碰撞框
        
        // 碰撞体积配置 - 可根据实际素材调整
        this.collisionConfig = {
            player: {
                width: 120,  // 对应玩家模型宽度
                height: 160, // 对应玩家模型高度
                offsetX: 0,  // X轴偏移
                offsetY: 0   // Y轴偏移
            },
            enemy: {
                width: 180,  // 默认敌人尺寸
                height: 240, // 默认敌人尺寸
                offsetX: 0,  // X轴偏移
                offsetY: 0   // Y轴偏移
            }
        };
        
        // 碰撞框元素（用于调试显示）
        this.debugElements = {
            player: null,
            enemy: null
        };
        
        this.init();
    }
    
    /**
     * 初始化碰撞系统
     */
    init() {
        this.createDebugElements();
        console.log('碰撞系统已初始化');
    }
    
    /**
     * 创建调试元素
     */
    createDebugElements() {
        // 创建玩家碰撞框
        this.debugElements.player = document.createElement('div');
        this.debugElements.player.className = 'collision-debug-player';
        this.debugElements.player.style.cssText = `
            position: absolute;
            border: 2px solid #00ff00;
            background: rgba(0, 255, 0, 0.1);
            pointer-events: none;
            z-index: 1000;
            display: none;
        `;
        document.body.appendChild(this.debugElements.player);
        
        // 创建敌人碰撞框
        this.debugElements.enemy = document.createElement('div');
        this.debugElements.enemy.className = 'collision-debug-enemy';
        this.debugElements.enemy.style.cssText = `
            position: absolute;
            border: 2px solid #ff0000;
            background: rgba(255, 0, 0, 0.1);
            pointer-events: none;
            z-index: 1000;
            display: none;
        `;
        document.body.appendChild(this.debugElements.enemy);
    }
    
    /**
     * 检查玩家和敌人是否碰撞
     * @returns {boolean} 是否发生碰撞
     */
    checkPlayerEnemyCollision() {
        if (!this.collisionEnabled) return false;
        
        const playerElement = document.getElementById('player');
        const enemyElement = document.getElementById('enemy');
        
        if (!playerElement || !enemyElement) return false;
        
        // 获取玩家和敌人的位置和尺寸
        const playerPos = this.getCharacterPosition('player');
        const enemyPos = this.getCharacterPosition('enemy');
        
        // 检查是否重叠
        const isColliding = this.checkOverlap(playerPos, enemyPos);
        
        // 调试模式显示碰撞框
        if (this.debugMode) {
            this.updateDebugElements(playerPos, enemyPos);
        }
        
        return isColliding;
    }
    
    /**
     * 获取角色位置和尺寸
     * @param {string} characterType - 角色类型 ('player' 或 'enemy')
     * @returns {Object} 位置和尺寸信息
     */
    getCharacterPosition(characterType) {
        const element = document.getElementById(characterType);
        if (!element) return null;
        
        const rect = element.getBoundingClientRect();
        const config = this.collisionConfig[characterType];
        
        return {
            x: rect.left + config.offsetX,
            y: rect.top + config.offsetY,
            width: config.width,
            height: config.height
        };
    }
    
    /**
     * 检查两个矩形是否重叠
     * @param {Object} rect1 - 第一个矩形
     * @param {Object} rect2 - 第二个矩形
     * @returns {boolean} 是否重叠
     */
    checkOverlap(rect1, rect2) {
        if (!rect1 || !rect2) return false;
        
        return rect1.x < rect2.x + rect2.width &&
               rect1.x + rect1.width > rect2.x &&
               rect1.y < rect2.y + rect2.height &&
               rect1.y + rect1.height > rect2.y;
    }
    
    /**
     * 更新调试元素
     * @param {Object} playerPos - 玩家位置
     * @param {Object} enemyPos - 敌人位置
     */
    updateDebugElements(playerPos, enemyPos) {
        if (this.debugElements.player && playerPos) {
            this.debugElements.player.style.left = playerPos.x + 'px';
            this.debugElements.player.style.top = playerPos.y + 'px';
            this.debugElements.player.style.width = playerPos.width + 'px';
            this.debugElements.player.style.height = playerPos.height + 'px';
            this.debugElements.player.style.display = 'block';
        }
        
        if (this.debugElements.enemy && enemyPos) {
            this.debugElements.enemy.style.left = enemyPos.x + 'px';
            this.debugElements.enemy.style.top = enemyPos.y + 'px';
            this.debugElements.enemy.style.width = enemyPos.width + 'px';
            this.debugElements.enemy.style.height = enemyPos.height + 'px';
            this.debugElements.enemy.style.display = 'block';
        }
    }
    
    /**
     * 设置碰撞配置
     * @param {string} characterType - 角色类型
     * @param {Object} config - 碰撞配置
     */
    setCollisionConfig(characterType, config) {
        if (this.collisionConfig[characterType]) {
            this.collisionConfig[characterType] = { ...this.collisionConfig[characterType], ...config };
            console.log(`${characterType} 碰撞配置已更新:`, this.collisionConfig[characterType]);
        }
    }
    
    /**
     * 根据敌人类型动态更新碰撞尺寸
     * @param {string} enemyType - 敌人类型
     */
    updateEnemyCollisionByType(enemyType) {
        const enemySizes = {
            'enemy-one': {
                width: 234,  // 敌人一放大1.3倍
                height: 312,
                offsetX: 0,
                offsetY: 0
            },
            'enemy-two': {
                width: 306,  // 敌人二放大1.7倍
                height: 408,
                offsetX: 0,
                offsetY: 0
            },
            'enemy-three': {
                width: 360,  // 敌人三放大2倍
                height: 480,
                offsetX: 0,
                offsetY: 0
            },
            'enemy-four': {
                width: 360,  // 敌人四放大2倍后的尺寸
                height: 480,
                offsetX: 0,
                offsetY: 0
            },
            'default': {
                width: 180,  // 默认敌人尺寸
                height: 240,
                offsetX: 0,
                offsetY: 0
            }
            // 未来可以添加更多敌人类型
        };
        
        if (enemySizes[enemyType]) {
            this.collisionConfig.enemy = { ...enemySizes[enemyType] };
            console.log(`敌人碰撞尺寸已更新为 ${enemyType}:`, this.collisionConfig.enemy);
        } else {
            console.warn(`未知的敌人类型: ${enemyType}`);
        }
    }
    
    /**
     * 启用/禁用碰撞检测
     * @param {boolean} enabled - 是否启用
     */
    setCollisionEnabled(enabled) {
        this.collisionEnabled = enabled;
        console.log(`碰撞检测已${enabled ? '启用' : '禁用'}`);
    }
    
    /**
     * 设置调试模式
     * @param {boolean} enabled - 是否启用调试模式
     */
    setDebugMode(enabled) {
        this.debugMode = enabled;
        if (!enabled) {
            // 隐藏调试元素
            if (this.debugElements.player) {
                this.debugElements.player.style.display = 'none';
            }
            if (this.debugElements.enemy) {
                this.debugElements.enemy.style.display = 'none';
            }
        }
        console.log(`碰撞调试模式已${enabled ? '启用' : '禁用'}`);
    }
    
    /**
     * 获取碰撞系统状态
     * @returns {Object} 碰撞系统状态
     */
    getCollisionStatus() {
        return {
            enabled: this.collisionEnabled,
            debugMode: this.debugMode,
            config: this.collisionConfig
        };
    }
    
    /**
     * 重置碰撞系统
     */
    reset() {
        this.collisionEnabled = true;
        this.debugMode = false;
        console.log('碰撞系统已重置');
    }
}

// 导出碰撞系统类
if (typeof module !== 'undefined' && module.exports) {
    module.exports = CollisionSystem;
}