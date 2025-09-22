/**
 * 投射物系统模块
 * 负责处理投射物的生成、移动、碰撞检测和销毁
 */
class ProjectileSystem {
    constructor() {
        this.projectiles = [];
        this.fragments = []; // 碎片数组
        this.isActive = true;
        this.isPaused = false;
        this.collisionSystem = null;
        this.pendingDamage = 0; // 累积的待处理伤害
        
        // 投射物配置
        this.config = {
            width: 100, // 调整为素材实际尺寸
            height: 50, // 调整为素材实际尺寸
            speed: 12, // 投射物速度（提高速度）
            gravity: 0.1, // 重力影响（进一步减小重力）
            damage:6, // 
            angleRange: 10, // 角度变化范围（度）（减小范围）
            baseAngle: 0, // 基础角度
            trailLength: 5, // 轨迹长度
        // 分裂效果配置
        fragmentCount: {min: 4, max: 8}, // 分裂成4-8个碎片
        fragmentSize: 40, // 碎片大小，调整为素材实际尺寸
        fragmentLifetime: 6000, // 碎片存在时间6秒
        fragmentGravity: 0.3, // 碎片重力
        fragmentSpeed: 3, // 碎片初始速度
        groundLevel: 0.7 // 地面水平线位置（屏幕高度的70%）
        };
        
        this.init();
    }
    
    /**
     * 初始化投射物系统
     */
    init() {
        this.bindEvents();
        console.log('投射物系统已初始化');
    }
    
    /**
     * 绑定事件监听器
     */
    bindEvents() {
        // 监听序列完成事件
        document.addEventListener('inputSystemEvent', (event) => {
            console.log('投射物系统收到事件:', event.detail);
            if (event.detail.type === 'sequenceComplete') {
                console.log('序列完成，准备发射投射物');
                console.log('投射物系统状态 - isActive:', this.isActive, 'isPaused:', this.isPaused);
                this.fireAtEnemy();
            }
        });
        
        // 监听游戏开始事件，确保投射物系统激活
        document.addEventListener('startLevel', () => {
            console.log('游戏开始，激活投射物系统');
            this.setActive(true);
            this.resume();
        });
    }
    
    /**
     * 设置碰撞系统引用
     * @param {CollisionSystem} collisionSystem - 碰撞系统实例
     */
    setCollisionSystem(collisionSystem) {
        this.collisionSystem = collisionSystem;
    }
    
    /**
     * 获取角色碰撞体积中心点
     * @param {string} characterType - 'player' 或 'enemy'
     * @returns {Object|null} 中心点坐标 {x, y}
     */
    getCharacterCollisionCenter(characterType) {
        const element = document.getElementById(characterType);
        if (!element) return null;
        
        const rect = element.getBoundingClientRect();
        const config = this.collisionSystem?.collisionConfig?.[characterType] || 
                      (characterType === 'player' ? {width: 120, height: 160, offsetX: 0, offsetY: 0} : 
                       {width: 180, height: 240, offsetX: 0, offsetY: 0});
        
        return {
            x: rect.left + config.width / 2 + config.offsetX,
            y: rect.top + config.height / 2 + config.offsetY
        };
    }
    
    /**
     * 向敌人发射投射物
     */
    fireAtEnemy() {
        console.log('fireAtEnemy 被调用，isActive:', this.isActive, 'isPaused:', this.isPaused);
        if (!this.isActive || this.isPaused) {
            console.log('投射物系统未激活或已暂停，无法发射');
            return;
        }
        
        // 检查敌人是否存在且可见
        const enemyElement = document.getElementById('enemy');
        if (!enemyElement || enemyElement.style.display === 'none') {
            // 敌人不存在或已死亡，累积伤害
            this.pendingDamage += this.config.damage;
            console.log(`敌人已死亡，累积伤害: ${this.pendingDamage}`);
            return;
        }
        
        // 获取玩家和敌人的碰撞体积中心点
        const playerCenter = this.getCharacterCollisionCenter('player');
        const enemyCenter = this.getCharacterCollisionCenter('enemy');
        
        if (!playerCenter || !enemyCenter) {
            console.warn('无法获取玩家或敌人的碰撞体积中心');
            // 如果无法获取敌人位置，也累积伤害
            this.pendingDamage += this.config.damage;
            console.log(`无法获取敌人位置，累积伤害: ${this.pendingDamage}`);
            return;
        }
        
        // 计算投射物起始位置（玩家中心对齐）
        const startPos = {
            x: playerCenter.x - this.config.width / 2,
            y: playerCenter.y - this.config.height / 2
        };
        
        // 获取敌人碰撞体积配置
        const enemyCollisionConfig = this.collisionSystem?.collisionConfig?.enemy || {width: 180, height: 240, offsetX: 0, offsetY: 0};
        
        // 计算敌人碰撞体积头顶中间的位置
        const targetPos = {
            x: enemyCenter.x, // X轴居中
            y: enemyCenter.y - enemyCollisionConfig.height / 2 // Y轴在头顶位置
        };
        
        console.log('玩家碰撞体积中心:', playerCenter);
        console.log('敌人碰撞体积中心:', enemyCenter);
        console.log('敌人碰撞体积尺寸:', enemyCollisionConfig);
        console.log('发射点:', startPos);
        console.log('目标点（敌人头顶）:', targetPos);
        
        // 生成随机角度
        const randomAngle = this.generateRandomAngle(startPos, targetPos);
        
        // 创建投射物
        this.createProjectile(startPos, targetPos, randomAngle);
        
        console.log('向敌人头顶发射投射物');
    }

    /**
     * 应用累积的伤害到新敌人
     */
    applyPendingDamage() {
        if (this.pendingDamage > 0) {
            console.log(`应用累积伤害: ${this.pendingDamage}`);
            
            // 获取inputSystem实例
            const inputSystem = window.gameModules?.inputSystem;
            if (inputSystem) {
                // 直接对敌人造成累积伤害
                inputSystem.damageEnemy(this.pendingDamage);
            }
            
            // 重置累积伤害
            this.pendingDamage = 0;
        }
    }

    /**
     * 清空累积伤害
     */
    clearPendingDamage() {
        this.pendingDamage = 0;
        console.log('清空累积伤害');
    }
    
    /**
     * 生成随机角度
     * @param {Object} startPos - 起始位置
     * @param {Object} targetPos - 目标位置
     * @returns {number} 角度（弧度）
     */
    generateRandomAngle(startPos, targetPos) {
        // 计算基础角度
        const dx = targetPos.x - startPos.x;
        const dy = targetPos.y - startPos.y;
        const baseAngle = Math.atan2(dy, dx);
        
        // 添加随机偏移（减小范围确保能击中）
        const randomOffset = (Math.random() - 0.5) * 2 * (this.config.angleRange * Math.PI / 180) * 0.5;
        return baseAngle + randomOffset;
    }
    
    /**
     * 创建投射物
     * @param {Object} startPos - 起始位置
     * @param {Object} targetPos - 目标位置
     * @param {number} angle - 发射角度
     */
    createProjectile(startPos, targetPos, angle) {
        // 计算距离和所需速度
        const dx = targetPos.x - startPos.x;
        const dy = targetPos.y - startPos.y;
        const distance = Math.sqrt(dx * dx + dy * dy);
        
        // 根据距离调整速度，确保能到达目标
        const adjustedSpeed = Math.max(this.config.speed, distance * 0.02);
        
        const projectile = {
            id: Date.now() + Math.random(),
            element: null,
            x: startPos.x,
            y: startPos.y,
            vx: Math.cos(angle) * adjustedSpeed,
            vy: Math.sin(angle) * adjustedSpeed,
            targetX: targetPos.x,
            targetY: targetPos.y,
            hasHit: false,
            originalSpeed: adjustedSpeed
            // 移除 lifeTime 和 created 属性，投射物将永久存在
        };
        
        console.log('投射物参数:', {
            distance: distance,
            angle: angle * 180 / Math.PI,
            speed: adjustedSpeed,
            velocity: {x: projectile.vx, y: projectile.vy}
        });
        
        // 创建DOM元素
        this.createProjectileElement(projectile);
        
        // 添加到投射物列表
        this.projectiles.push(projectile);
        
        console.log('创建投射物:', projectile.id);
    }
    
    /**
     * 创建投射物DOM元素
     * @param {Object} projectile - 投射物对象
     */
    createProjectileElement(projectile) {
        const element = document.createElement('div');
        element.className = 'projectile';
        element.style.left = projectile.x + 'px';
        element.style.top = projectile.y + 'px';
        element.style.width = this.config.width + 'px';
        element.style.height = this.config.height + 'px';
        
        // 设置初始旋转角度
        const angle = Math.atan2(projectile.vy, projectile.vx) * 180 / Math.PI;
        element.style.transform = `rotate(${angle}deg)`;
        
        document.body.appendChild(element);
        projectile.element = element;
    }
    
    /**
     * 更新所有投射物
     */
    update() {
        if (!this.isActive || this.isPaused) return;
        
        const currentTime = Date.now();
        
        // 更新碰撞体积中心点标记
        this.updateCollisionCenterMarkers();
        
        for (let i = this.projectiles.length - 1; i >= 0; i--) {
            const projectile = this.projectiles[i];
            
            // 更新位置
            this.updateProjectilePosition(projectile);
            
            // 检查碰撞
            if (!projectile.hasHit) {
                this.checkProjectileCollision(projectile, i);
            }
        }
        
        // 更新碎片
        this.updateFragments();
    }
    
    /**
     * 更新投射物位置
     * @param {Object} projectile - 投射物对象
     */
    updateProjectilePosition(projectile) {
        // 获取敌人中心点作为轨迹限制线
        const enemyCenter = this.getCharacterCollisionCenter('enemy');
        
        if (enemyCenter) {
            // 计算投射物中心点
            const projectileCenterY = projectile.y + this.config.height / 2;
            
            // 如果投射物中心低于敌人中心线，限制其Y位置
            if (projectileCenterY > enemyCenter.y) {
                // 将投射物限制在敌人中心线以上
                projectile.y = enemyCenter.y - this.config.height / 2;
                // 如果垂直速度向下，则将其设为0
                if (projectile.vy > 0) {
                    projectile.vy = 0;
                }
            }
            
            // 应用重力（只在投射物中心高于敌人中心线时）
            if (projectileCenterY < enemyCenter.y) {
                projectile.vy += this.config.gravity;
            }
        } else {
            // 如果没有敌人信息，正常应用重力
            projectile.vy += this.config.gravity;
        }
        
        // 更新位置
        projectile.x += projectile.vx;
        projectile.y += projectile.vy;
        
        // 更新DOM元素位置
        if (projectile.element) {
            projectile.element.style.left = projectile.x + 'px';
            projectile.element.style.top = projectile.y + 'px';
            
            // 更新旋转角度
            const angle = Math.atan2(projectile.vy, projectile.vx) * 180 / Math.PI;
            projectile.element.style.transform = `rotate(${angle}deg)`;
        }
    }
    
    /**
     * 检查投射物碰撞
     * @param {Object} projectile - 投射物对象
     * @param {number} index - 投射物索引
     */
    checkProjectileCollision(projectile, index) {
        // 获取敌人碰撞体积中心点
        const enemyCenter = this.getCharacterCollisionCenter('enemy');
        if (!enemyCenter) return;
        
        // 投射物中心点
        const projectileCenterX = projectile.x + this.config.width / 2;
        const projectileCenterY = projectile.y + this.config.height / 2;
        
        // 获取敌人碰撞体积配置
        const enemyCollisionConfig = this.collisionSystem?.collisionConfig?.enemy || {width: 180, height: 240, offsetX: 0, offsetY: 0};
        
        // 计算敌人碰撞体积的边界
        const enemyLeft = enemyCenter.x - enemyCollisionConfig.width / 2;
        const enemyRight = enemyCenter.x + enemyCollisionConfig.width / 2;
        const enemyTop = enemyCenter.y - enemyCollisionConfig.height / 2;
        const enemyBottom = enemyCenter.y + enemyCollisionConfig.height / 2;
        
        // 检查投射物是否在敌人碰撞体积范围内（包括头顶区域）
        const isInEnemyBounds = projectileCenterX >= enemyLeft - 30 && // 增加30px容错范围
                               projectileCenterX <= enemyRight + 30 &&
                               projectileCenterY >= enemyTop - 50 && // 头顶区域增加50px容错
                               projectileCenterY <= enemyBottom + 30;
        
        // 调试信息
        if (Math.random() < 0.05) { // 5%概率输出调试信息
            console.log('投射物中心:', {x: projectileCenterX, y: projectileCenterY});
            console.log('敌人碰撞体积中心:', enemyCenter);
            console.log('敌人碰撞体积边界:', {
                left: enemyLeft, right: enemyRight, 
                top: enemyTop, bottom: enemyBottom
            });
            console.log('是否在敌人范围内:', isInEnemyBounds);
        }
        
        // 检查是否击中
        if (isInEnemyBounds) {
            this.handleProjectileHit(projectile, index);
            return;
        }
        
        // 备用检测：检查投射物是否已经越过敌人（防止错过）
        const timeElapsed = Date.now() - projectile.created;
        if (timeElapsed > 800) { // 0.8秒后开始备用检测
            const isPastEnemy = this.checkIfProjectilePassedEnemy(projectile, enemyCenter.x, enemyCenter.y);
            if (isPastEnemy) {
                console.log('备用检测：投射物已越过敌人，强制击中');
                this.handleProjectileHit(projectile, index);
            }
        }
    }
    
    /**
     * 检测矩形碰撞
     * @param {Object} rect1 - 第一个矩形
     * @param {Object} rect2 - 第二个矩形
     * @returns {boolean} 是否碰撞
     */
    checkRectCollision(rect1, rect2) {
        return rect1.x < rect2.x + rect2.width &&
               rect1.x + rect1.width > rect2.x &&
               rect1.y < rect2.y + rect2.height &&
               rect1.y + rect1.height > rect2.y;
    }
    
    /**
     * 检查投射物是否已经越过敌人
     * @param {Object} projectile - 投射物对象
     * @param {number} enemyCenterX - 敌人中心X坐标
     * @param {number} enemyCenterY - 敌人中心Y坐标
     * @returns {boolean} 是否已越过
     */
    checkIfProjectilePassedEnemy(projectile, enemyCenterX, enemyCenterY) {
        const projectileCenterX = projectile.x + this.config.width / 2;
        const projectileCenterY = projectile.y + this.config.height / 2;
        
        // 检查投射物是否在敌人附近（扩大范围）
        const dx = projectileCenterX - enemyCenterX;
        const dy = projectileCenterY - enemyCenterY;
        const distance = Math.sqrt(dx * dx + dy * dy);
        
        // 如果距离小于100px，认为已经接近敌人
        return distance <= 100;
    }
    
    /**
     * 处理投射物击中
     * @param {Object} projectile - 投射物对象
     * @param {number} index - 投射物索引
     */
    handleProjectileHit(projectile, index) {
        projectile.hasHit = true;
        
        // 扣除敌人血量
        this.damageEnemy();
        
        // 检查连击数，如果是3的倍数则重置敌人倒计时
        this.checkComboResetCountdown();
        
        // 显示击中效果
        this.showHitEffect(projectile);
        
        // 创建分裂效果
        this.createFragments(projectile);
        
        // 触发击中事件
        this.triggerHitEvent(projectile);
        
        // 触发音效事件
        const hitEvent = new CustomEvent('projectileHit');
        document.dispatchEvent(hitEvent);
        
        // 销毁投射物
        this.destroyProjectile(projectile, index);
        
        console.log('投射物击中敌人，扣除10%血量，创建分裂效果');
    }
    
    /**
     * 检查连击数并重置倒计时
     */
    checkComboResetCountdown() {
        const inputSystem = window.gameModules?.inputSystem;
        if (inputSystem && inputSystem.combo > 0 && inputSystem.combo % 3 === 0) {
            console.log(`连击数达到 ${inputSystem.combo}，重置敌人倒计时`);
            inputSystem.resetCountdown();
            inputSystem.startCountdown();
        }
    }
    
    /**
     * 触发击中事件
     * @param {Object} projectile - 投射物对象
     */
    triggerHitEvent(projectile) {
        const event = new CustomEvent('inputSystemEvent', {
            detail: {
                type: 'projectileHit',
                data: {
                    projectileId: projectile.id,
                    damage: this.config.damage,
                    timestamp: Date.now()
                }
            }
        });
        document.dispatchEvent(event);
    }
    
    /**
     * 扣除敌人血量
     */
    damageEnemy() {
        const inputSystem = window.gameModules?.inputSystem;
        if (inputSystem) {
            // 获取当前血量
            const healthStatus = inputSystem.getHealthStatus();
            const currentHealth = healthStatus.enemy.current;
            const maxHealth = healthStatus.enemy.max;
            
            // 计算基础伤害（固定伤害）
            const baseDamage = this.config.damage;
            
            // 获取友军加成
            const bonuses = inputSystem.calculateTeamBonuses();
            const damageMultiplier = 1 + bonuses.projectileDamageBonus;
            const finalDamage = Math.ceil(baseDamage * damageMultiplier);
            
            const newHealth = Math.max(0, currentHealth - finalDamage);
            
            // 更新血量
            inputSystem.updateEnemyHealth(newHealth, maxHealth);
            
            // 触发敌人受击动画
            inputSystem.playHitAnimation('enemy');
            
            console.log(`敌人受到 ${finalDamage} 点伤害（基础${baseDamage}，友军一加成${Math.round(bonuses.projectileDamageBonus * 100)}%），剩余血量: ${newHealth}/${maxHealth}`);
            
            // 检查敌人是否死亡
            if (newHealth <= 0) {
                inputSystem.handleEnemyDeath();
            }
        }
    }
    
    /**
     * 显示击中效果
     * @param {Object} projectile - 投射物对象
     */
    showHitEffect(projectile) {
        // 创建击中效果元素
        const hitEffect = document.createElement('div');
        hitEffect.className = 'projectile-hit-effect';
        hitEffect.style.left = projectile.x + 'px';
        hitEffect.style.top = projectile.y + 'px';
        hitEffect.style.position = 'fixed';
        hitEffect.style.width = '40px';
        hitEffect.style.height = '40px';
        hitEffect.style.background = 'radial-gradient(circle, #ff6b00, #ff0000)';
        hitEffect.style.borderRadius = '50%';
        hitEffect.style.pointerEvents = 'none';
        hitEffect.style.zIndex = '1000';
        hitEffect.style.animation = 'hitEffectExplosion 0.5s ease-out forwards';
        
        document.body.appendChild(hitEffect);
        
        // 移除效果元素
        setTimeout(() => {
            if (hitEffect.parentNode) {
                hitEffect.parentNode.removeChild(hitEffect);
            }
        }, 500);
    }
    
    /**
     * 销毁投射物
     * @param {Object} projectile - 投射物对象
     * @param {number} index - 投射物索引
     */
    destroyProjectile(projectile, index) {
        // 移除DOM元素
        if (projectile.element && projectile.element.parentNode) {
            projectile.element.parentNode.removeChild(projectile.element);
        }
        
        // 从列表中移除
        this.projectiles.splice(index, 1);
        
        console.log('投射物已销毁:', projectile.id);
    }
    
    /**
     * 设置系统激活状态
     * @param {boolean} active - 是否激活
     */
    setActive(active) {
        this.isActive = active;
        console.log('投射物系统', active ? '已激活' : '已停用');
    }

    /**
     * 暂停投射物系统
     */
    pause() {
        this.isPaused = true;
        console.log('投射物系统已暂停');
    }

    /**
     * 恢复投射物系统
     */
    resume() {
        this.isPaused = false;
        console.log('投射物系统已恢复');
    }
    
    /**
     * 设置配置
     * @param {Object} config - 新配置
     */
    setConfig(config) {
        this.config = { ...this.config, ...config };
        console.log('投射物配置已更新:', this.config);
    }
    
    /**
     * 手动配置投射物尺寸
     * @param {number} width - 投射物宽度
     * @param {number} height - 投射物高度
     */
    setProjectileSize(width, height) {
        this.config.width = width;
        this.config.height = height;
        console.log(`投射物尺寸已设置为: ${width}x${height}px`);
    }
    
    /**
     * 手动配置分裂物尺寸
     * @param {number} size - 分裂物尺寸（正方形）
     */
    setFragmentSize(size) {
        this.config.fragmentSize = size;
        console.log(`分裂物尺寸已设置为: ${size}x${size}px`);
    }
    
    /**
     * 手动配置分裂物尺寸（矩形）
     * @param {number} width - 分裂物宽度
     * @param {number} height - 分裂物高度
     */
    setFragmentSizeRect(width, height) {
        this.config.fragmentSize = Math.max(width, height); // 使用较大值作为正方形尺寸
        console.log(`分裂物尺寸已设置为: ${width}x${height}px`);
    }
    
    /**
     * 获取当前尺寸配置
     * @returns {Object} 当前尺寸配置
     */
    getSizeConfig() {
        return {
            projectile: {
                width: this.config.width,
                height: this.config.height
            },
            fragment: {
                size: this.config.fragmentSize
            }
        };
    }
    
    /**
     * 预设配置：小尺寸
     */
    setSmallSize() {
        this.setProjectileSize(16, 8);
        this.setFragmentSize(8);
        console.log('已设置为小尺寸');
    }
    
    /**
     * 预设配置：中等尺寸
     */
    setMediumSize() {
        this.setProjectileSize(24, 12);
        this.setFragmentSize(12);
        console.log('已设置为中等尺寸');
    }
    
    /**
     * 预设配置：大尺寸
     */
    setLargeSize() {
        this.setProjectileSize(32, 16);
        this.setFragmentSize(16);
        console.log('已设置为大尺寸');
    }
    
    /**
     * 预设配置：超大尺寸
     */
    setXLargeSize() {
        this.setProjectileSize(48, 24);
        this.setFragmentSize(24);
        console.log('已设置为超大尺寸');
    }
    
    /**
     * 重置为默认尺寸
     */
    resetToDefaultSize() {
        this.setProjectileSize(24, 12);
        this.setFragmentSize(12);
        console.log('已重置为默认尺寸');
    }
    
    /**
     * 清除所有投射物
     */
    clearAllProjectiles() {
        this.projectiles.forEach(projectile => {
            if (projectile.element && projectile.element.parentNode) {
                projectile.element.parentNode.removeChild(projectile.element);
            }
        });
        this.projectiles = [];
        
        // 同时清除所有碎片
        this.clearAllFragments();
        
        console.log('所有投射物和碎片已清除');
    }
    
    /**
     * 获取系统状态
     * @returns {Object} 系统状态
     */
    getStatus() {
        return {
            isActive: this.isActive,
            projectileCount: this.projectiles.length,
            config: this.config
        };
    }
    
    /**
     * 启用/禁用碰撞体积中心点可视化
     * @param {boolean} enabled - 是否启用
     */
    setCollisionCenterVisualization(enabled) {
        if (enabled) {
            this.createCollisionCenterMarkers();
        } else {
            this.removeCollisionCenterMarkers();
        }
    }
    
    /**
     * 创建碰撞体积中心点标记
     */
    createCollisionCenterMarkers() {
        this.removeCollisionCenterMarkers(); // 先移除现有的
        
        // 创建玩家中心点标记
        const playerCenter = this.getCharacterCollisionCenter('player');
        if (playerCenter) {
            const playerMarker = document.createElement('div');
            playerMarker.id = 'player-collision-center-marker';
            playerMarker.style.position = 'fixed';
            playerMarker.style.left = (playerCenter.x - 5) + 'px';
            playerMarker.style.top = (playerCenter.y - 5) + 'px';
            playerMarker.style.width = '10px';
            playerMarker.style.height = '10px';
            playerMarker.style.background = '#4a90e2';
            playerMarker.style.borderRadius = '50%';
            playerMarker.style.border = '2px solid white';
            playerMarker.style.zIndex = '2000';
            playerMarker.style.pointerEvents = 'none';
            document.body.appendChild(playerMarker);
        }
        
        // 创建敌人中心点标记
        const enemyCenter = this.getCharacterCollisionCenter('enemy');
        if (enemyCenter) {
            const enemyMarker = document.createElement('div');
            enemyMarker.id = 'enemy-collision-center-marker';
            enemyMarker.style.position = 'fixed';
            enemyMarker.style.left = (enemyCenter.x - 5) + 'px';
            enemyMarker.style.top = (enemyCenter.y - 5) + 'px';
            enemyMarker.style.width = '10px';
            enemyMarker.style.height = '10px';
            enemyMarker.style.background = '#e74c3c';
            enemyMarker.style.borderRadius = '50%';
            enemyMarker.style.border = '2px solid white';
            enemyMarker.style.zIndex = '2000';
            enemyMarker.style.pointerEvents = 'none';
            document.body.appendChild(enemyMarker);
        }
    }
    
    /**
     * 移除碰撞体积中心点标记
     */
    removeCollisionCenterMarkers() {
        const playerMarker = document.getElementById('player-collision-center-marker');
        const enemyMarker = document.getElementById('enemy-collision-center-marker');
        
        if (playerMarker) playerMarker.remove();
        if (enemyMarker) enemyMarker.remove();
    }
    
    /**
     * 更新碰撞体积中心点标记位置
     */
    updateCollisionCenterMarkers() {
        const playerMarker = document.getElementById('player-collision-center-marker');
        const enemyMarker = document.getElementById('enemy-collision-center-marker');
        
        if (playerMarker) {
            const playerCenter = this.getCharacterCollisionCenter('player');
            if (playerCenter) {
                playerMarker.style.left = (playerCenter.x - 5) + 'px';
                playerMarker.style.top = (playerCenter.y - 5) + 'px';
            }
        }
        
        if (enemyMarker) {
            const enemyCenter = this.getCharacterCollisionCenter('enemy');
            if (enemyCenter) {
                enemyMarker.style.left = (enemyCenter.x - 5) + 'px';
                enemyMarker.style.top = (enemyCenter.y - 5) + 'px';
            }
        }
    }
    
    /**
     * 创建分裂碎片
     * @param {Object} projectile - 原始投射物对象
     */
    createFragments(projectile) {
        // 生成随机数量（4-8个）
        const fragmentCount = Math.floor(Math.random() * (this.config.fragmentCount.max - this.config.fragmentCount.min + 1)) + this.config.fragmentCount.min;
        const fragmentSize = this.config.fragmentSize;
        const fragmentSpeed = this.config.fragmentSpeed;
        const fragmentLifetime = this.config.fragmentLifetime;
        
        // 从碰撞处生成碎片（投射物中心位置）
        const spawnX = projectile.x + this.config.width / 2;
        const spawnY = projectile.y + this.config.height / 2;
        
        for (let i = 0; i < fragmentCount; i++) {
            // 计算随机角度
            const angle = (Math.PI * 2 * i) / fragmentCount + (Math.random() - 0.5) * 0.5;
            
            // 计算随机速度
            const speed = fragmentSpeed + Math.random() * 2;
            
            // 计算随机尺寸（0.6~1.0倍）
            const sizeMultiplier = 0.6 + Math.random() * 0.4; // 0.6 + 0~0.4 = 0.6~1.0
            const randomSize = Math.floor(fragmentSize * sizeMultiplier);
            
            const fragment = {
                id: Date.now() + Math.random() + i,
                element: null,
                x: spawnX - randomSize / 2,
                y: spawnY - randomSize / 2,
                vx: Math.cos(angle) * speed,
                vy: Math.sin(angle) * speed,
                created: Date.now(),
                lifetime: fragmentLifetime,
                size: randomSize,
                onGround: false // 是否在地面上
            };
            
            // 创建碎片DOM元素
            this.createFragmentElement(fragment);
            
            // 添加到碎片数组
            this.fragments.push(fragment);
        }
        
        console.log(`创建了 ${fragmentCount} 个碎片，尺寸范围: ${Math.floor(fragmentSize * 0.6)}px - ${fragmentSize}px`);
    }
    
    /**
     * 创建碎片DOM元素
     * @param {Object} fragment - 碎片对象
     */
    createFragmentElement(fragment) {
        const element = document.createElement('div');
        element.className = 'projectile-fragment';
        element.style.position = 'fixed';
        element.style.left = fragment.x + 'px';
        element.style.top = fragment.y + 'px';
        element.style.width = fragment.size + 'px';
        element.style.height = fragment.size + 'px';
        element.style.opacity = '0.8';
        
        document.body.appendChild(element);
        fragment.element = element;
    }
    
    /**
     * 更新所有碎片
     */
    updateFragments() {
        if (!this.isActive || this.isPaused) return;
        
        const currentTime = Date.now();
        
        for (let i = this.fragments.length - 1; i >= 0; i--) {
            const fragment = this.fragments[i];
            
            // 检查生存时间
            if (currentTime - fragment.created > fragment.lifetime) {
                this.destroyFragment(fragment, i);
                continue;
            }
            
            // 如果碎片已经在地面上，停止移动
            if (!fragment.onGround) {
                // 计算地面水平线位置
                const groundY = window.innerHeight * this.config.groundLevel;
                
                // 检查是否接触地面
                const fragmentBottom = fragment.y + fragment.size;
                if (fragmentBottom >= groundY) {
                    // 碎片接触地面
                    fragment.y = groundY - fragment.size;
                    fragment.vy = 0;
                    fragment.vx = 0;
                    fragment.onGround = true;
                    console.log('碎片已着陆:', fragment.id);
                } else {
                    // 应用重力
                    fragment.vy += this.config.fragmentGravity;
                    
                    // 更新位置
                    fragment.x += fragment.vx;
                    fragment.y += fragment.vy;
                }
            }
            
            // 更新DOM元素位置
            if (fragment.element) {
                fragment.element.style.left = fragment.x + 'px';
                fragment.element.style.top = fragment.y + 'px';
                
                // 根据生存时间调整透明度
                const lifeProgress = (currentTime - fragment.created) / fragment.lifetime;
                const opacity = Math.max(0.1, 0.8 - lifeProgress * 0.7);
                fragment.element.style.opacity = opacity;
            }
        }
    }
    
    /**
     * 销毁碎片
     * @param {Object} fragment - 碎片对象
     * @param {number} index - 碎片索引
     */
    destroyFragment(fragment, index) {
        // 移除DOM元素
        if (fragment.element && fragment.element.parentNode) {
            fragment.element.parentNode.removeChild(fragment.element);
        }
        
        // 从列表中移除
        this.fragments.splice(index, 1);
        
        console.log('碎片已销毁:', fragment.id);
    }
    
    /**
     * 清除所有碎片
     */
    clearAllFragments() {
        this.fragments.forEach(fragment => {
            if (fragment.element && fragment.element.parentNode) {
                fragment.element.parentNode.removeChild(fragment.element);
            }
        });
        this.fragments = [];
        console.log('所有碎片已清除');
    }
}

// 导出投射物系统类
if (typeof module !== 'undefined' && module.exports) {
    module.exports = ProjectileSystem;
}
