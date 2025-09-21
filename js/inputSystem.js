/**
 * 输入系统模块
 * 负责处理按键输入、随机生成和游戏逻辑
 * 设计为模块化，确保与未来库（Matter.js, Three.js, React等）的兼容性
 */
class InputSystem {
    constructor() {
        this.currentSequence = [];
        this.currentIndex = 0;
        this.isActive = false;
        this.isPaused = false;
        this.score = 0;
        this.combo = 0;
        this.maxCombo = 0;
        
        // 倒计时相关属性
        this.timerDuration = 10; // 10秒倒计时
        this.timeRemaining = 10;
        this.timerInterval = null;
        this.timerElement = null;
        this.progressElement = null;
        this.timerTextElement = null;
        
        // 血条相关属性
        this.playerHealth = 30;
        this.playerMaxHealth = 30;
        this.enemyHealth = 10; // 调整为10%以便测试
        this.enemyMaxHealth = 100;
        this.playerHealthElement = null;
        this.playerHealthFillElement = null;
        this.playerHealthTextElement = null;
        this.enemyHealthElement = null;
        this.enemyHealthFillElement = null;
        this.enemyHealthTextElement = null;
        
        // 重生系统相关属性
        this.respawnCount = 1; // 重生次数
        this.maxRespawnCount = 1; // 最大重生次数
        this.unknownSpawnElement = null;
        this.respawnCountElement = null;
        this.isRespawning = false;
        
        // 倒计时系统相关属性
        this.countdownElement = null;
        this.countdownProgressElement = null;
        this.countdownInterval = null;
        this.countdownDuration = 10; // 默认10秒倒计时
        this.countdownTimeRemaining = 10;
        this.isCountdownActive = false;
        
        // 敌人配置系统（为未来敌人种类和关卡变化预留）
        this.enemyConfig = {
            type: 'enemy-four', // 敌人类型
            level: 1, // 关卡等级
            countdownDuration: 10, // 倒计时时长
            damage: 10, // 对玩家造成的伤害
            health: 10 // 敌人血量
        };

        // 敌人类型血量配置
        this.enemyHealthConfig = {
            'enemy-one': 30,    // 敌人1：30血
            'enemy-two': 25,    // 敌人2：25血
            'enemy-three': 45,  // 敌人3：45血
            'enemy-four': 80    // 敌人4：80血
        };

        // 敌人类型攻击力配置
        this.enemyDamageConfig = {
            'enemy-one': 7,     // 敌人1：7攻击力
            'enemy-two': 15,    // 敌人2：15攻击力
            'enemy-three': 7,   // 敌人3：7攻击力
            'enemy-four': 25    // 敌人4：25攻击力
        };
        
        // 敌人类型池和概率系统
        this.enemyTypePool = null;
        this.lastEnemyMustBe = null;
        this.firstEnemyMustBe = null;
        this.firstEnemyTypes = null;
        this.isFirstEnemy = false;
        this.currentEnemyCount = 0;
        
        // 敌人状态管理
        this.enemyState = 'idle'; // idle, hit, attacking
        
        // 玩家状态管理
        this.playerState = 'idle'; // idle, hit, attacking
        
        // 方向键映射
        this.directions = ['up', 'down', 'left', 'right'];
        this.keyMap = {
            'ArrowUp': 'up',
            'ArrowDown': 'down',
            'ArrowLeft': 'left',
            'ArrowRight': 'right',
            'w': 'up',
            's': 'down',
            'a': 'left',
            'd': 'right'
        };
        
        this.init();
    }

    /**
     * 初始化输入系统
     */
    init() {
        this.bindEvents();
        this.initTimerElements();
        this.initCharacterElements();
        this.initHealthElements();
        this.initRespawnElements();
        this.initCountdownElements();
        console.log('输入系统已初始化');
    }

    /**
     * 初始化倒计时相关元素
     */
    initTimerElements() {
        this.timerElement = document.getElementById('timer-container');
        this.progressElement = document.getElementById('timer-progress');
    }

    /**
     * 初始化角色元素
     */
    initCharacterElements() {
        this.playerElement = document.getElementById('player');
        this.enemyElement = document.getElementById('enemy');
    }

    /**
     * 初始化血条元素
     */
    initHealthElements() {
        this.playerHealthElement = document.getElementById('player-health-fill');
        this.playerHealthTextElement = document.getElementById('player-health-text');
        this.enemyHealthElement = document.getElementById('enemy-health-fill');
        this.enemyHealthTextElement = document.getElementById('enemy-health-text');
    }
    
    /**
     * 初始化重生系统元素
     */
    initRespawnElements() {
        this.unknownSpawnElement = document.getElementById('unknown-spawn');
        this.respawnCountElement = document.getElementById('respawn-count');
    }
    
    /**
     * 初始化倒计时系统元素
     */
    initCountdownElements() {
        this.countdownElement = document.getElementById('enemy-countdown-line');
        this.countdownProgressElement = document.getElementById('countdown-progress');
    }

    /**
     * 绑定事件监听器
     */
    bindEvents() {
        // 键盘事件
        document.addEventListener('keydown', (event) => {
            this.handleKeyPress(event);
        });

        // 关卡场景显示时启动输入系统
        document.addEventListener('levelSceneShown', () => {
            this.startNewSequence();
            // 确保未知处显示
            this.showUnknownSpawn();
            // 延迟再次确保未知处显示（防止时序问题）
            setTimeout(() => {
                this.showUnknownSpawn();
            }, 100);
        });

        // 关卡场景隐藏时停止输入系统
        document.addEventListener('levelSceneHidden', () => {
            this.stopSequence();
            // 隐藏未知处
            this.hideUnknownSpawn();
        });
    }

    /**
     * 开始新的按键序列
     */
    startNewSequence() {
        // 如果游戏暂停，不启动新序列
        if (this.isPaused) {
            console.log('游戏已暂停，不启动新序列');
            return;
        }
        
        // 清除之前的状态
        this.clearKeyStates();
        this.stopTimer(); // 停止之前的倒计时
        
        this.generateRandomSequence();
        this.renderInputKeys();
        this.currentIndex = 0;
        this.isActive = true;
        
        // 显示角色
        this.showCharacters();
        
        // 重置倒计时
        this.timeRemaining = this.timerDuration;
        this.startTimer();
        
        // 延迟显示序列，确保渲染完成
        setTimeout(() => {
            this.updateActiveKey();
            this.showCurrentSequence();
        }, 150);
        
        // 开始倒计时
        this.startCountdown();
        
        console.log('新按键序列已生成:', this.currentSequence);
    }

    /**
     * 清除按键状态
     */
    clearKeyStates() {
        const keys = document.querySelectorAll('.input-key');
        keys.forEach(key => {
            key.classList.remove('active', 'completed', 'error');
        });
    }

    /**
     * 生成随机按键序列（4-6个按键）
     */
    generateRandomSequence() {
        const keyCount = Math.floor(Math.random() * 3) + 4; // 4-6个按键
        this.currentSequence = [];
        
        for (let i = 0; i < keyCount; i++) {
            const randomDirection = this.directions[Math.floor(Math.random() * this.directions.length)];
            this.currentSequence.push(randomDirection);
        }
    }

    /**
     * 渲染输入按键到UI
     */
    renderInputKeys() {
        const container = document.getElementById('input-keys-container');
        if (!container) {
            console.error('找不到输入按键容器: input-keys-container');
            return;
        }

        console.log('开始渲染按键，序列:', this.currentSequence);

        // 先隐藏容器，避免闪烁
        container.style.opacity = '0';
        container.style.transition = 'opacity 0.1s ease';

        // 延迟清空和重建，确保隐藏动画完成
        setTimeout(() => {
            // 清空现有按键
            container.innerHTML = '';

            // 创建按键元素
            this.currentSequence.forEach((direction, index) => {
                const keyElement = document.createElement('div');
                keyElement.className = 'input-key';
                keyElement.setAttribute('data-direction', direction);
                keyElement.setAttribute('data-index', index);
                
                // 添加点击事件
                keyElement.addEventListener('click', () => {
                    this.handleKeyClick(direction, index);
                });
                
                container.appendChild(keyElement);
            });

            console.log(`已渲染 ${this.currentSequence.length} 个按键`);
        }, 100);
    }

    /**
     * 更新当前激活的按键
     */
    updateActiveKey() {
        const keys = document.querySelectorAll('.input-key');
        keys.forEach((key, index) => {
            key.classList.remove('active', 'completed', 'error');
            
            if (index === this.currentIndex) {
                key.classList.add('active');
            } else if (index < this.currentIndex) {
                key.classList.add('completed');
            }
        });
    }

    /**
     * 处理键盘按键
     * @param {KeyboardEvent} event - 键盘事件
     */
    handleKeyPress(event) {
        if (!this.isActive) return;

        const direction = this.keyMap[event.key];
        if (direction) {
            event.preventDefault();
            this.checkInput(direction);
        }
    }

    /**
     * 处理按键点击
     * @param {string} direction - 方向
     * @param {number} index - 按键索引
     */
    handleKeyClick(direction, index) {
        if (!this.isActive) return;
        
        // 只允许按当前激活的按键
        if (index === this.currentIndex) {
            this.checkInput(direction);
        }
    }

    /**
     * 检查输入是否正确
     * @param {string} inputDirection - 输入的方向
     */
    checkInput(inputDirection) {
        const expectedDirection = this.currentSequence[this.currentIndex];
        
        if (inputDirection === expectedDirection) {
            this.handleCorrectInput();
        } else {
            this.handleWrongInput();
        }
    }

    /**
     * 处理正确输入
     */
    handleCorrectInput() {
        this.currentIndex++;
        this.score += 10; // 每次正确输入固定加分
        
        this.updateActiveKey();
        this.triggerInputEvent('correct', {
            direction: this.currentSequence[this.currentIndex - 1],
            index: this.currentIndex - 1,
            combo: this.combo,
            score: this.score
        });

        // 检查是否完成序列
        if (this.currentIndex >= this.currentSequence.length) {
            this.completeSequence();
        }
    }

    /**
     * 处理错误输入
     */
    handleWrongInput() {
        this.combo = 0; // 错误输入时重置连击
        this.triggerInputEvent('wrong', {
            expected: this.currentSequence[this.currentIndex],
            actual: this.currentSequence[this.currentIndex]
        });

        // 显示错误效果
        const currentKey = document.querySelector(`.input-key[data-index="${this.currentIndex}"]`);
        if (currentKey) {
            currentKey.classList.add('error');
            setTimeout(() => {
                currentKey.classList.remove('error');
            }, 200);
        }

        // 错误后快速重新生成新序列
        setTimeout(() => {
            this.hideCurrentSequence();
            setTimeout(() => {
                this.startNewSequence();
            }, 200);
        }, 400);
    }

    /**
     * 隐藏当前序列
     */
    hideCurrentSequence() {
        const container = document.getElementById('input-keys-container');
        if (container) {
            container.style.opacity = '0';
            container.style.transform = 'translateX(-50%) scale(0.8)';
            container.style.transition = 'all 0.2s ease';
        }
    }

    /**
     * 显示当前序列
     */
    showCurrentSequence() {
        const container = document.getElementById('input-keys-container');
        if (container) {
            // 先设置最终状态
            container.style.transform = 'translateX(-50%) scale(1)';
            container.style.transition = 'all 0.3s ease';
            
            // 强制重排，确保transform生效
            container.offsetHeight;
            
            // 然后显示
            container.style.opacity = '1';
        }
    }

    /**
     * 完成当前序列
     */
    completeSequence() {
        this.isActive = false;
        this.stopTimer(); // 停止倒计时
        
        // 完成一次完整序列，连击+1
        this.combo++;
        this.maxCombo = Math.max(this.maxCombo, this.combo);
        
        // 播放玩家攻击动画（完成序列时）
        this.playPlayerAttackAnimation();
        
        // 设置友军攻击状态
        this.setAllyState('attacking');
        
        this.triggerInputEvent('sequenceComplete', {
            sequence: this.currentSequence,
            score: this.score,
            combo: this.combo,
            maxCombo: this.maxCombo,
            timeRemaining: this.timeRemaining
        });

        console.log('序列完成！分数:', this.score, '连击:', this.combo, '剩余时间:', this.timeRemaining);

        // 显示成功效果
        this.showSuccessEffect();

        // 快速重新生成新序列
        setTimeout(() => {
            this.hideCurrentSequence();
            setTimeout(() => {
                this.startNewSequence();
            }, 150);
        }, 250);
    }

    /**
     * 显示成功效果
     */
    showSuccessEffect() {
        const keys = document.querySelectorAll('.input-key');
        keys.forEach((key, index) => {
            setTimeout(() => {
                key.classList.add('completed');
            }, index * 50); // 依次显示完成效果
        });
    }

    /**
     * 停止当前序列
     */
    stopSequence() {
        this.isActive = false;
        this.currentIndex = 0;
        this.combo = 0;
        this.stopTimer();
        this.stopCountdown();
        
        // 隐藏角色
        this.hideCharacters();
        
        // 清空按键显示
        const container = document.getElementById('input-keys-container');
        if (container) {
            container.innerHTML = '';
        }
    }

    /**
     * 暂停游戏
     */
    pauseGame() {
        this.isPaused = true;
        this.stopTimer();
        this.stopCountdown();
        console.log('游戏已暂停');
    }

    /**
     * 恢复游戏
     */
    resumeGame() {
        this.isPaused = false;
        console.log('游戏已恢复');
    }

    /**
     * 开始倒计时
     */
    startTimer() {
        // 如果游戏暂停，不启动倒计时
        if (this.isPaused) {
            console.log('游戏已暂停，不启动倒计时');
            return;
        }
        
        if (!this.timerElement || !this.progressElement) {
            console.warn('倒计时元素未找到');
            return;
        }

        // 显示倒计时容器
        this.timerElement.classList.add('active');
        
        // 更新初始显示
        this.updateTimerDisplay();
        
        // 开始倒计时
        this.timerInterval = setInterval(() => {
            this.timeRemaining -= 0.1;
            this.updateTimerDisplay();
            
            if (this.timeRemaining <= 0) {
                this.handleTimerExpired();
            }
        }, 100);
    }

    /**
     * 停止倒计时
     */
    stopTimer() {
        if (this.timerInterval) {
            clearInterval(this.timerInterval);
            this.timerInterval = null;
        }
        
        if (this.timerElement) {
            this.timerElement.classList.remove('active');
        }
    }

    /**
     * 更新倒计时显示
     */
    updateTimerDisplay() {
        if (!this.progressElement) return;

        const progress = (this.timeRemaining / this.timerDuration) * 100;
        this.progressElement.style.width = `${progress}%`;

        // 根据剩余时间改变进度条颜色
        this.progressElement.classList.remove('warning', 'danger');
        if (this.timeRemaining <= 3) {
            this.progressElement.classList.add('danger');
        } else if (this.timeRemaining <= 6) {
            this.progressElement.classList.add('warning');
        }
    }

    /**
     * 处理倒计时到期
     */
    handleTimerExpired() {
        this.stopTimer();
        this.isActive = false;
        this.combo = 0; // 倒计时结束时重置连击
        
        // 触发超时事件
        this.triggerInputEvent('timeout', {
            sequence: this.currentSequence,
            currentIndex: this.currentIndex,
            score: this.score
        });

        console.log('倒计时结束！序列超时');

        // 显示超时效果
        this.showTimeoutEffect();

        // 快速重新生成新序列
        setTimeout(() => {
            this.hideCurrentSequence();
            setTimeout(() => {
                this.startNewSequence();
            }, 150);
        }, 300);
    }

    /**
     * 显示超时效果
     */
    showTimeoutEffect() {
        const keys = document.querySelectorAll('.input-key');
        // 只对尚未输入的键位（从当前索引开始）同时显示错误效果
        for (let i = this.currentIndex; i < keys.length; i++) {
            keys[i].classList.add('error');
        }
    }

    /**
     * 触发输入事件
     * @param {string} eventType - 事件类型
     * @param {Object} data - 事件数据
     */
    triggerInputEvent(eventType, data) {
        const event = new CustomEvent('inputSystemEvent', {
            detail: {
                type: eventType,
                data: data,
                timestamp: Date.now()
            }
        });
        document.dispatchEvent(event);
    }

    /**
     * 获取当前游戏状态
     * @returns {Object} 游戏状态
     */
    getGameState() {
        return {
            isActive: this.isActive,
            currentSequence: this.currentSequence,
            currentIndex: this.currentIndex,
            score: this.score,
            combo: this.combo,
            maxCombo: this.maxCombo,
            timeRemaining: this.timeRemaining,
            timerDuration: this.timerDuration
        };
    }

    /**
     * 重置游戏状态
     */
    resetGameState() {
        this.currentSequence = [];
        this.currentIndex = 0;
        this.isActive = false;
        this.score = 0;
        this.combo = 0;
        this.maxCombo = 0;
        this.timeRemaining = this.timerDuration;
        
        // 重置血条
        this.resetHealth();
        
        // 重置重生系统
        this.resetRespawnSystem();
        
        this.stopSequence();
        console.log('游戏状态已重置');
    }

    /**
     * 设置难度（影响按键数量和速度）
     * @param {number} difficulty - 难度等级 (1-5)
     */
    setDifficulty(difficulty) {
        // 这里可以根据难度调整游戏参数
        // 例如：按键数量、显示时间、输入时间限制等
        console.log('难度设置为:', difficulty);
    }

    /**
     * 设置倒计时时长
     * @param {number} duration - 倒计时时长（秒）
     */
    setTimerDuration(duration) {
        if (duration > 0 && duration <= 60) {
            this.timerDuration = duration;
            this.timeRemaining = duration;
            console.log('倒计时时长设置为:', duration, '秒');
        } else {
            console.warn('倒计时时长必须在1-60秒之间');
        }
    }

    /**
     * 获取倒计时配置信息
     * @returns {Object} 倒计时配置
     */
    getTimerConfig() {
        return {
            duration: this.timerDuration,
            remaining: this.timeRemaining,
            isActive: this.timerInterval !== null
        };
    }

    /**
     * 显示角色
     */
    showCharacters() {
        if (this.playerElement) {
            this.playerElement.style.display = 'flex';
        }
        if (this.enemyElement) {
            this.enemyElement.style.display = 'flex';
        }
    }

    /**
     * 隐藏角色
     */
    hideCharacters() {
        if (this.playerElement) {
            this.playerElement.style.display = 'none';
        }
        if (this.enemyElement) {
            this.enemyElement.style.display = 'none';
        }
    }

    /**
     * 播放角色攻击动画
     * @param {string} character - 'player' 或 'enemy'
     */
    playAttackAnimation(character) {
        const element = character === 'player' ? this.playerElement : this.enemyElement;
        if (element) {
            element.classList.add('attacking');
            setTimeout(() => {
                element.classList.remove('attacking');
            }, 500);
        }
    }

    /**
     * 播放角色防御动画
     * @param {string} character - 'player' 或 'enemy'
     */
    playDefendAnimation(character) {
        const element = character === 'player' ? this.playerElement : this.enemyElement;
        if (element) {
            element.classList.add('defending');
            setTimeout(() => {
                element.classList.remove('defending');
            }, 300);
        }
    }

    /**
     * 播放角色受击动画
     * @param {string} character - 'player' 或 'enemy'
     */
    playHitAnimation(character) {
        const element = character === 'player' ? this.playerElement : this.enemyElement;
        if (element) {
            element.classList.add('hit');
            // 根据角色类型设置不同的动画时长
            const duration = character === 'enemy' ? 600 : 400; // 敌人动画更长
            setTimeout(() => {
                element.classList.remove('hit');
            }, duration);
        }
    }

    /**
     * 更新玩家血条
     * @param {number} health - 当前血量
     * @param {number} maxHealth - 最大血量
     */
    updatePlayerHealth(health, maxHealth = this.playerMaxHealth) {
        this.playerHealth = Math.max(0, Math.min(health, maxHealth));
        this.playerMaxHealth = maxHealth;
        
        if (this.playerHealthElement && this.playerHealthTextElement) {
            const percentage = (this.playerHealth / this.playerMaxHealth) * 100;
            this.playerHealthElement.style.width = `${percentage}%`;
            
            // 优化血量百分比显示：如果携带村民且为满血，显示100%
            const allyCounts = this.getCurrentAllyCounts();
            const hasVillagers = allyCounts.villager > 0;
            const isFullHealth = this.playerHealth >= this.playerMaxHealth;
            
            if (hasVillagers && isFullHealth) {
                this.playerHealthTextElement.textContent = '100%';
            } else {
                this.playerHealthTextElement.textContent = `${Math.round(percentage)}%`;
            }
            
            // 根据血量改变血条颜色
            this.playerHealthElement.classList.remove('warning', 'danger');
            if (this.playerHealth <= this.playerMaxHealth * 0.25) {
                this.playerHealthElement.classList.add('danger');
            } else if (this.playerHealth <= this.playerMaxHealth * 0.5) {
                this.playerHealthElement.classList.add('warning');
            }
        }
        
        // 检查玩家是否死亡
        if (this.playerHealth <= 0) {
            this.handlePlayerDeath();
        }
    }

    /**
     * 更新敌人血条
     * @param {number} health - 当前血量
     * @param {number} maxHealth - 最大血量
     */
    updateEnemyHealth(health, maxHealth = null) {
        // 如果没有指定最大血量，使用当前敌人配置的血量
        if (maxHealth === null) {
            maxHealth = this.enemyConfig.health;
        }
        
        this.enemyHealth = Math.max(0, Math.min(health, maxHealth));
        this.enemyMaxHealth = maxHealth;
        
        if (this.enemyHealthElement && this.enemyHealthTextElement) {
            const percentage = (this.enemyHealth / this.enemyMaxHealth) * 100;
            this.enemyHealthElement.style.width = `${percentage}%`;
            this.enemyHealthTextElement.textContent = `${Math.round(percentage)}%`;
        }
    }

    /**
     * 玩家受到伤害
     * @param {number} damage - 伤害值
     */
    damagePlayer(damage) {
        const bonuses = this.calculateTeamBonuses();
        
        // 计算反弹伤害
        const reflectedDamage = Math.floor(damage * bonuses.damageReflectBonus);
        
        // 实际受到的伤害
        const actualDamage = damage - reflectedDamage;
        const newHealth = this.playerHealth - actualDamage;
        this.updatePlayerHealth(newHealth);
        
        // 播放受击动画
        this.playHitAnimation('player');
        
        // 触发玩家受伤音效事件
        const hitEvent = new CustomEvent('playerHit');
        document.dispatchEvent(hitEvent);
        
        // 处理友军损失
        this.handleAllyDamage();
        
        // 如果有反弹伤害，对敌人造成伤害
        if (reflectedDamage > 0) {
            this.damageEnemy(reflectedDamage);
            console.log(`友军三反弹：反弹 ${reflectedDamage} 点伤害给敌人`);
        }
        
        console.log(`玩家受到 ${damage} 点伤害，实际受到 ${actualDamage} 点，反弹 ${reflectedDamage} 点，剩余血量: ${this.playerHealth}`);
    }

    /**
     * 处理友军损失
     */
    handleAllyDamage() {
        // 获取当前友军数量
        const allyCounts = this.getCurrentAllyCounts();
        
        // 检查每个友军类型是否有损失
        const allyTypes = ['archer', 'villager', 'knight'];
        const lostAllies = [];
        
        allyTypes.forEach(allyType => {
            if (allyCounts[allyType] > 0 && Math.random() < 0.35) { // 35%概率损失
                this.loseAlly(allyType);
                lostAllies.push(allyType);
            }
        });
        
        // 如果有友军损失，显示合并的提示
        if (lostAllies.length > 0) {
            this.showCombinedAllyLossNotification(lostAllies);
        }
    }

    /**
     * 获取当前友军数量
     */
    getCurrentAllyCounts() {
        const allyCountElement = document.getElementById('ally-count');
        const allyTwoCountElement = document.getElementById('ally-two-count');
        const allyThreeCountElement = document.getElementById('ally-three-count');

        return {
            archer: allyCountElement ? parseInt(allyCountElement.textContent.replace('x', '')) : 0,
            villager: allyTwoCountElement ? parseInt(allyTwoCountElement.textContent.replace('x', '')) : 0,
            knight: allyThreeCountElement ? parseInt(allyThreeCountElement.textContent.replace('x', '')) : 0
        };
    }

    /**
     * 计算友军加成效果
     */
    calculateTeamBonuses() {
        const allyCounts = this.getCurrentAllyCounts();
        
        return {
            // 友军一（弓手）：投射物伤害加成，每个+35%
            projectileDamageBonus: allyCounts.archer * 0.35,
            
            // 友军二（村民）：玩家血量加成，每个+20%
            playerHealthBonus: allyCounts.villager * 0.2,
            
            // 友军三（骑士）：伤害反弹，每个反弹20%
            damageReflectBonus: allyCounts.knight * 0.2
        };
    }

    /**
     * 应用友军加成到玩家血量
     */
    applyTeamBonusesToPlayerHealth() {
        const bonuses = this.calculateTeamBonuses();
        const baseHealth = 30; // 基础血量
        const bonusHealth = Math.floor(baseHealth * bonuses.playerHealthBonus);
        const newMaxHealth = baseHealth + bonusHealth;
        
        // 更新最大血量
        this.playerMaxHealth = newMaxHealth;
        
        // 如果携带村民，玩家血量设为满血状态
        const allyCounts = this.getCurrentAllyCounts();
        if (allyCounts.villager > 0) {
            this.playerHealth = newMaxHealth; // 满血状态
        } else {
            // 如果没有村民，保持当前血量比例
            const currentPercentage = this.playerHealth / this.playerMaxHealth;
            this.playerHealth = Math.floor(newMaxHealth * currentPercentage);
        }
        
        // 更新血条显示
        this.updatePlayerHealth(this.playerHealth, this.playerMaxHealth);
        
        console.log(`友军二加成：血量从30增加到${newMaxHealth}（+${bonusHealth}），当前血量: ${this.playerHealth}`);
    }

    /**
     * 失去一个友军
     * @param {string} allyType - 友军类型
     */
    loseAlly(allyType) {
        const allyNames = {
            'archer': '弓手',
            'villager': '村民', 
            'knight': '骑士'
        };

        const allyCounts = this.getCurrentAllyCounts();
        
        if (allyCounts[allyType] > 0) {
            // 减少友军数量
            const newCount = allyCounts[allyType] - 1;
            this.updateAllyCount(allyType, newCount);
            
            // 记录损失统计
            this.recordLoss(allyType);
            
            // 如果数量归零，开始消失动画
            if (newCount === 0) {
                this.startAllyFadeOut(allyType);
            }
            
            console.log(`${allyNames[allyType]}损失了一个，剩余: ${newCount}`);
        }
    }

    /**
     * 更新友军计数
     * @param {string} allyType - 友军类型
     * @param {number} count - 新数量
     */
    updateAllyCount(allyType, count) {
        const elementIds = {
            'archer': 'ally-count',
            'villager': 'ally-two-count',
            'knight': 'ally-three-count'
        };

        const element = document.getElementById(elementIds[allyType]);
        if (element) {
            element.textContent = `x${count}`;
        }

        // 根据友军数量控制DOM元素显示/隐藏
        const allyElementIds = {
            'archer': 'ally-one',
            'villager': 'ally-two',
            'knight': 'ally-three'
        };
        const allyElement = document.getElementById(allyElementIds[allyType]);
        if (allyElement) {
            if (count > 0) {
                allyElement.style.display = 'flex';
                // 移除消失动画类
                allyElement.classList.remove('ally-fading-out');
            } else {
                allyElement.style.display = 'none';
                // 添加消失动画类
                allyElement.classList.add('ally-fading-out');
            }
        }

        // 同步到村庄堡垒弹窗
        if (window.villageFortressPopup) {
            window.villageFortressPopup.teamCounts[allyType] = count;
            // 注意：不更新库存数量，库存应该保持原有数量
            window.villageFortressPopup.updateDisplay();
        }

        // 同步到存档
        if (window.saveManager) {
            const currentTeamConfig = window.saveManager.getTeamConfig();
            
            if (currentTeamConfig) {
                currentTeamConfig[allyType] = count;
                window.saveManager.updateTeamConfig(currentTeamConfig);
            }
            
            // 注意：不更新库存到存档，库存应该保持原有数量
        }

        // 重新应用友军加成（特别是友军二的血量加成）
        if (allyType === 'villager') {
            this.applyTeamBonusesToPlayerHealth();
        }
    }

    /**
     * 显示友军损失提示
     * @param {string} allyType - 友军类型
     * @param {number} remainingCount - 剩余数量
     */
    showAllyLossNotification(allyType, remainingCount) {
        const allyNames = {
            'archer': '弓手',
            'villager': '村民',
            'knight': '骑士'
        };

        // 创建损失提示元素
        const notification = document.createElement('div');
        notification.className = 'ally-loss-notification';
        notification.textContent = `${allyNames[allyType]} -1 (剩余: ${remainingCount})`;
        
        // 设置样式
        notification.style.cssText = `
            position: fixed;
            top: 50%;
            left: 50%;
            transform: translate(-50%, -50%);
            background: rgba(255, 0, 0, 0.9);
            color: white;
            padding: 10px 20px;
            border-radius: 8px;
            font-size: 1.2rem;
            font-weight: bold;
            z-index: 1000;
            pointer-events: none;
            animation: allyLossFloat 2s ease-out forwards;
        `;

        // 添加到页面
        document.body.appendChild(notification);

        // 2秒后移除
        setTimeout(() => {
            if (notification.parentNode) {
                notification.parentNode.removeChild(notification);
            }
        }, 2000);
    }

    /**
     * 显示合并的友军损失提示
     * @param {Array} lostAllies - 损失的友军类型数组
     */
    showCombinedAllyLossNotification(lostAllies) {
        const allyNames = {
            'archer': '弓手',
            'villager': '村民',
            'knight': '骑士'
        };

        // 获取当前友军数量
        const allyCounts = this.getCurrentAllyCounts();
        
        // 构建损失信息
        let lossText = '';
        if (lostAllies.length === 1) {
            const allyType = lostAllies[0];
            lossText = `${allyNames[allyType]} -1 (剩余: ${allyCounts[allyType]})`;
        } else {
            // 多个友军损失
            const lossDetails = lostAllies.map(allyType => 
                `${allyNames[allyType]} -1 (剩余: ${allyCounts[allyType]})`
            ).join('\n');
            lossText = `友军损失:\n${lossDetails}`;
        }

        // 创建损失提示元素
        const notification = document.createElement('div');
        notification.className = 'ally-loss-notification';
        notification.textContent = lossText;
        
        // 设置样式
        notification.style.cssText = `
            position: fixed;
            top: 50%;
            left: 50%;
            transform: translate(-50%, -50%);
            background: rgba(255, 0, 0, 0.9);
            color: white;
            padding: 10px 20px;
            border-radius: 8px;
            font-size: 1.2rem;
            font-weight: bold;
            z-index: 1000;
            pointer-events: none;
            animation: allyLossFloat 2s ease-out forwards;
            white-space: pre-line;
            text-align: center;
        `;

        // 添加到页面
        document.body.appendChild(notification);

        // 2秒后移除
        setTimeout(() => {
            if (notification.parentNode) {
                notification.parentNode.removeChild(notification);
            }
        }, 2000);
    }

    /**
     * 开始友军消失动画
     * @param {string} allyType - 友军类型
     */
    startAllyFadeOut(allyType) {
        const allyElementIds = {
            'archer': 'ally-one',
            'villager': 'ally-two',
            'knight': 'ally-three'
        };

        const allyElement = document.getElementById(allyElementIds[allyType]);
        if (allyElement) {
            // 添加消失动画类
            allyElement.classList.add('ally-fading-out');
            
            // 3秒后完全隐藏
            setTimeout(() => {
                allyElement.style.display = 'none';
            }, 3000);
        }
    }

    /**
     * 敌人受到伤害
     * @param {number} damage - 伤害值
     */
    damageEnemy(damage) {
        const newHealth = this.enemyHealth - damage;
        this.updateEnemyHealth(newHealth);
        
        // 播放受击动画
        this.playHitAnimation('enemy');
        
        // 设置敌人受击状态
        this.setEnemyState('hit');
        
        console.log(`敌人受到 ${damage} 点伤害，剩余血量: ${this.enemyHealth}`);
        
        // 检查敌人是否死亡
        if (newHealth <= 0) {
            this.handleEnemyDeath();
        }
    }

    /**
     * 重置血条
     */
    resetHealth() {
        this.updatePlayerHealth(this.playerMaxHealth);
        this.updateEnemyHealth(this.enemyMaxHealth);
    }

    /**
     * 获取血条状态
     * @returns {Object} 血条状态
     */
    getHealthStatus() {
        return {
            player: {
                current: this.playerHealth,
                max: this.playerMaxHealth,
                percentage: (this.playerHealth / this.playerMaxHealth) * 100
            },
            enemy: {
                current: this.enemyHealth,
                max: this.enemyMaxHealth,
                percentage: (this.enemyHealth / this.enemyMaxHealth) * 100
            }
        };
    }

    /**
     * 处理玩家死亡
     */
    handlePlayerDeath() {
        console.log('玩家死亡！游戏失败');
        
        // 停止倒计时
        this.stopCountdown();
        
        // 停止输入系统
        this.stopTimer();
        this.isActive = false;
        
        // 停止投射物系统
        const projectileSystem = window.gameModules?.projectileSystem;
        if (projectileSystem) {
            projectileSystem.isActive = false;
        }
        
        // 触发游戏失败事件
        this.triggerGameOver();
    }
    
    /**
     * 处理敌人死亡
     */
    handleEnemyDeath() {
        console.log('敌人死亡！');
        
        // 停止倒计时
        this.stopCountdown();
        
        // 处理敌人死亡时的友军解救
        this.handleEnemyDeathRescue();
        
        // 播放敌人死亡动画
        this.playEnemyDeathAnimation();
        
        // 触发敌人死亡音效事件
        const deathEvent = new CustomEvent('enemyDeath');
        document.dispatchEvent(deathEvent);
        
        // 检查是否还有重生次数
        if (this.respawnCount > 0) {
            // 等待下落动画播放完成后重生（给更多时间让下落动画完成）
            setTimeout(() => {
                this.respawnEnemy();
            }, 2000); // 给下落动画足够的时间
        } else {
            // 没有重生次数了，等待动画完成后隐藏未知处
            setTimeout(() => {
                this.hideUnknownSpawn();
                this.triggerVictory();
            }, 2000);
        }
    }

    /**
     * 处理敌人死亡时的友军解救
     */
    handleEnemyDeathRescue() {
        // 获取当前敌人类型
        const currentEnemyType = this.enemyConfig.type;
        
        // 根据敌人类型决定是否解救友军
        let allyTypeToRescue = null;
        let rescueChance = 0.5; // 50%概率
        
        switch (currentEnemyType) {
            case 'enemy-one':
                allyTypeToRescue = 'villager'; // 敌人1被打败时，50%概率解救村民
                break;
            case 'enemy-two':
                allyTypeToRescue = 'knight'; // 敌人2被打败时，50%概率解救骑士
                break;
            case 'enemy-three':
                allyTypeToRescue = 'archer'; // 敌人3被打败时，50%概率解救弓手
                break;
            case 'enemy-four':
                // 敌人4被打败时，不解救友军
                break;
        }
        
        // 如果应该解救友军，进行概率判断
        if (allyTypeToRescue && Math.random() < rescueChance) {
            console.log(`敌人死亡！有50%概率解救一个${allyTypeToRescue}`);
            
            // 记录解救统计
            this.recordRescue(allyTypeToRescue);
            
            // 显示解救友军的提示
            this.showAllyGainedNotification(allyTypeToRescue);
        }
    }

    /**
     * 记录解救统计
     */
    recordRescue(allyType) {
        const levelId = window.gameModules?.gameManager?.gameState?.currentLevel || '1';
        const rescueKey = `rescue_stats_${levelId}`;
        const rescueStats = JSON.parse(localStorage.getItem(rescueKey) || '{"archer": 0, "villager": 0, "knight": 0, "total": 0}');
        
        // 增加对应类型的友军数量
        rescueStats[allyType]++;
        rescueStats.total++;
        
        // 保存到localStorage
        localStorage.setItem(rescueKey, JSON.stringify(rescueStats));
        
        console.log(`记录解救统计: ${allyType}, 当前统计:`, rescueStats);
    }

    /**
     * 记录友军损失统计
     */
    recordLoss(allyType) {
        const levelId = window.gameModules?.gameManager?.gameState?.currentLevel || '1';
        const lossKey = `loss_stats_${levelId}`;
        const lossStats = JSON.parse(localStorage.getItem(lossKey) || '{"archer": 0, "villager": 0, "knight": 0, "total": 0}');
        
        // 增加对应类型的友军损失数量
        lossStats[allyType]++;
        lossStats.total++;
        
        // 保存到localStorage
        localStorage.setItem(lossKey, JSON.stringify(lossStats));
        
        console.log(`记录损失统计: ${allyType}, 当前统计:`, lossStats);
    }

    /**
     * 清理解救统计
     */
    clearRescueStats() {
        const levelId = window.gameModules?.gameManager?.gameState?.currentLevel || '1';
        const rescueKey = `rescue_stats_${levelId}`;
        
        // 重置解救统计
        const emptyStats = {"archer": 0, "villager": 0, "knight": 0, "total": 0};
        localStorage.setItem(rescueKey, JSON.stringify(emptyStats));
        
        console.log(`清理解救统计 - 关卡 ${levelId}`);
    }

    /**
     * 清空损失统计
     */
    clearLossStats() {
        const levelId = window.gameModules?.gameManager?.gameState?.currentLevel || '1';
        const lossKey = `loss_stats_${levelId}`;
        
        // 重置损失统计
        const emptyStats = {"archer": 0, "villager": 0, "knight": 0, "total": 0};
        localStorage.setItem(lossKey, JSON.stringify(emptyStats));
        
        console.log(`清空损失统计 - 关卡 ${levelId}`);
    }
    
    /**
     * 触发胜利
     */
    triggerVictory() {
        console.log('所有敌人已击败，触发胜利！');
        
        // 停止倒计时
        this.stopCountdown();
        
        // 停止输入系统
        this.stopSequence();
        
        // 处理战斗胜利后的友军增加逻辑
        this.handleVictoryRewards();
        
        // 获取当前关卡信息
        const gameManager = window.gameModules?.gameManager;
        const levelSelect = window.gameModules?.levelSelect;
        
        if (gameManager && levelSelect) {
            const currentLevel = gameManager.gameState.currentLevel;
            const levelData = levelSelect.getLevelData(currentLevel);
            
            // 获取解救统计
            const rescueStats = this.getRescueStats();
            
            // 获取游戏统计
            const gameStats = {
                maxCombo: this.maxCombo || 0,
                message: '恭喜您成功击败了所有敌人！',
                rescueMessage: this.formatRescueMessage(rescueStats)
            };
            
            // 触发胜利事件
            const event = new CustomEvent('victory', {
                detail: { 
                    levelId: currentLevel,
                    levelData: levelData,
                    gameStats: gameStats
                }
            });
            document.dispatchEvent(event);
        }
    }

    /**
     * 触发游戏失败事件
     */
    triggerGameOver() {
        console.log('触发游戏失败事件');
        
        // 创建游戏失败弹窗
        this.createGameOverPopup();
    }

    /**
     * 创建游戏失败弹窗
     */
    createGameOverPopup() {
        // 创建弹窗容器
        const popup = document.createElement('div');
        popup.id = 'game-over-popup';
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
            z-index: 10000;
            font-family: Arial, sans-serif;
        `;

        // 创建弹窗内容
        const content = document.createElement('div');
        content.style.cssText = `
            background: linear-gradient(135deg, #2c3e50, #34495e);
            border: 3px solid #e74c3c;
            border-radius: 15px;
            padding: 30px;
            text-align: center;
            color: white;
            max-width: 500px;
            width: 90%;
            box-shadow: 0 10px 30px rgba(0, 0, 0, 0.5);
        `;

        // 获取游戏统计
        const gameStats = {
            maxCombo: this.maxCombo || 0,
            finalHealth: this.playerHealth,
            maxHealth: this.playerMaxHealth
        };

        // 创建失败消息
        content.innerHTML = `
            <h2 style="color: #e74c3c; margin-bottom: 20px; font-size: 2em;">游戏失败</h2>
            <p style="font-size: 1.2em; margin-bottom: 20px;">您的血量已归零，战斗失败！</p>
            
            <div style="background: rgba(0, 0, 0, 0.3); padding: 15px; border-radius: 8px; margin: 20px 0;">
                <h3 style="color: #f39c12; margin-bottom: 10px;">战斗统计</h3>
                <p style="margin: 5px 0;">最高连击: ${gameStats.maxCombo}</p>
                <p style="margin: 5px 0;">最终血量: ${gameStats.finalHealth}/${gameStats.maxHealth}</p>
            </div>
            
            <div style="margin-top: 25px;">
                <button id="back-to-level-select-btn" style="
                    background: #3498db;
                    color: white;
                    border: none;
                    padding: 15px 30px;
                    border-radius: 5px;
                    font-size: 1.2em;
                    cursor: pointer;
                    transition: background 0.3s;
                " onmouseover="this.style.background='#2980b9'" onmouseout="this.style.background='#3498db'">
                    返回关卡选择
                </button>
            </div>
        `;

        popup.appendChild(content);
        document.body.appendChild(popup);

        // 绑定按钮事件
        document.getElementById('back-to-level-select-btn').addEventListener('click', () => {
            this.backToLevelSelect();
        });
    }


    /**
     * 返回关卡选择页
     */
    backToLevelSelect() {
        // 移除失败弹窗
        const popup = document.getElementById('game-over-popup');
        if (popup) {
            popup.remove();
        }

        // 重置游戏状态
        this.resetGame();
        
        // 返回关卡选择页
        const event = new CustomEvent('backToLevelSelect');
        document.dispatchEvent(event);
    }

    /**
     * 重置游戏状态
     */
    resetGame() {
        // 重置血量
        this.playerHealth = 30;
        this.playerMaxHealth = 30;
        
        // 重置分数和连击
        this.score = 0;
        this.combo = 0;
        this.maxCombo = 0;
        
        // 停止所有系统
        this.stopTimer();
        this.stopCountdown();
        this.isActive = false;
        
        // 重置投射物系统
        const projectileSystem = window.gameModules?.projectileSystem;
        if (projectileSystem) {
            projectileSystem.isActive = true;
            projectileSystem.clearPendingDamage();
        }
        
        console.log('游戏状态已重置');
    }

    /**
     * 处理战斗胜利奖励（友军增加）
     */
    handleVictoryRewards() {
        // 在战斗胜利弹窗中显示解救的友军统计
        this.showRescueSummary();
    }

    /**
     * 显示解救友军总结
     */
    showRescueSummary() {
        // 获取当前关卡的解救统计
        const rescueStats = this.getRescueStats();
        
        if (rescueStats.total > 0) {
            // 更新村庄堡垒弹窗中的友军数量
            if (window.villageFortressPopup) {
                window.villageFortressPopup.addRescuedAllies(rescueStats);
            }
            
            // 在胜利弹窗中显示解救信息
            this.updateVictoryMessage(rescueStats);
        }
        
        // 获取当前关卡的损失统计
        const lossStats = this.getLossStats();
        
        if (lossStats.total > 0) {
            // 在胜利弹窗中显示损失信息
            this.updateVictoryMessageWithLoss(lossStats);
        }
    }

    /**
     * 获取解救统计
     */
    getRescueStats() {
        // 从localStorage获取当前关卡的解救统计
        const levelId = window.gameModules?.gameManager?.gameState?.currentLevel || '1';
        const rescueKey = `rescue_stats_${levelId}`;
        const rescueStats = JSON.parse(localStorage.getItem(rescueKey) || '{"archer": 0, "villager": 0, "knight": 0, "total": 0}');
        
        return rescueStats;
    }

    /**
     * 获取损失统计
     */
    getLossStats() {
        // 从localStorage获取当前关卡的损失统计
        const levelId = window.gameModules?.gameManager?.gameState?.currentLevel || '1';
        const lossKey = `loss_stats_${levelId}`;
        const lossStats = JSON.parse(localStorage.getItem(lossKey) || '{"archer": 0, "villager": 0, "knight": 0, "total": 0}');
        
        return lossStats;
    }

    /**
     * 更新胜利弹窗消息
     */
    updateVictoryMessage(rescueStats) {
        const rescueMessage = this.formatRescueMessage(rescueStats);
        
        // 触发自定义事件，通知胜利弹窗更新消息
        const event = new CustomEvent('updateVictoryMessage', {
            detail: { rescueMessage: rescueMessage }
        });
        document.dispatchEvent(event);
    }

    /**
     * 更新胜利弹窗消息（包含损失信息）
     */
    updateVictoryMessageWithLoss(lossStats) {
        const lossMessage = this.formatLossMessage(lossStats);
        
        // 触发自定义事件，通知胜利弹窗更新消息
        const event = new CustomEvent('updateVictoryMessage', {
            detail: { lossMessage: lossMessage }
        });
        document.dispatchEvent(event);
    }

    /**
     * 格式化解救消息
     */
    formatRescueMessage(rescueStats) {
        const allyNames = {
            'archer': '弓手',
            'villager': '村民',
            'knight': '骑士'
        };
        
        let rescueMessage = '';
        if (rescueStats.total > 0) {
            rescueMessage = '\n\n解救友军：\n';
            if (rescueStats.villager > 0) {
                rescueMessage += `${allyNames.villager}ｘ${rescueStats.villager}\n`;
            }
            if (rescueStats.archer > 0) {
                rescueMessage += `${allyNames.archer}ｘ${rescueStats.archer}\n`;
            }
            if (rescueStats.knight > 0) {
                rescueMessage += `${allyNames.knight}ｘ${rescueStats.knight}\n`;
            }
        }
        
        return rescueMessage;
    }

    /**
     * 格式化损失消息
     */
    formatLossMessage(lossStats) {
        const allyNames = {
            'archer': '弓手',
            'villager': '村民',
            'knight': '骑士'
        };
        
        let lossMessage = '';
        if (lossStats.total > 0) {
            lossMessage = '\n\n损失友军：\n';
            if (lossStats.villager > 0) {
                lossMessage += `${allyNames.villager}ｘ${lossStats.villager}\n`;
            }
            if (lossStats.archer > 0) {
                lossMessage += `${allyNames.archer}ｘ${lossStats.archer}\n`;
            }
            if (lossStats.knight > 0) {
                lossMessage += `${allyNames.knight}ｘ${lossStats.knight}\n`;
            }
        }
        
        return lossMessage;
    }

    /**
     * 显示获得友军的通知
     */
    showAllyGainedNotification(allyType) {
        const allyNames = {
            'archer': '弓手',
            'villager': '村民', 
            'knight': '骑士'
        };
        
        const allyName = allyNames[allyType] || allyType;
        
        // 创建通知元素
        const notification = document.createElement('div');
        notification.className = 'ally-gained-notification';
        notification.textContent = `获得友军：${allyName}`;
        
        // 设置样式
        notification.style.cssText = `
            position: fixed;
            top: 50%;
            left: 50%;
            transform: translate(-50%, -50%);
            background: linear-gradient(135deg, #32CD32, #228B22);
            color: white;
            padding: 15px 30px;
            border-radius: 25px;
            font-size: 1.2em;
            font-weight: bold;
            z-index: 3000;
            box-shadow: 0 4px 15px rgba(0, 0, 0, 0.3);
            animation: allyGainedFloat 3s ease-out forwards;
        `;
        
        // 添加到页面
        document.body.appendChild(notification);
        
        // 3秒后移除
        setTimeout(() => {
            if (notification.parentNode) {
                notification.parentNode.removeChild(notification);
            }
        }, 3000);
    }
    
    /**
     * 播放敌人死亡动画
     */
    playEnemyDeathAnimation() {
        if (!this.enemyElement) return;
        
        // 设置敌人为受击状态
        this.setEnemyState('hit');
        
        // 播放受击动画，然后开始透明度渐变消失
        setTimeout(() => {
            if (this.enemyElement) {
                this.startEnemyFadeOut();
            }
        }, 600); // 受击动画持续时间（与CSS动画时间一致）
    }
    
    /**
     * 敌人死亡透明度渐变消失动画
     */
    startEnemyFadeOut() {
        if (!this.enemyElement) return;
        
        let opacity = 1;
        const fadeSpeed = 0.1; // 透明度降低速度（从0.05增加到0.1）
        const fadeInterval = 30; // 更新间隔（毫秒）（从50ms减少到30ms）
        
        console.log('敌人开始透明度渐变消失');
        
        const fadeOut = () => {
            opacity -= fadeSpeed;
            
            if (opacity <= 0) {
                // 动画结束，隐藏敌人
                this.enemyElement.style.display = 'none';
                this.enemyElement.style.opacity = '1'; // 重置透明度
                this.enemyElement.style.transform = '';
                console.log('敌人透明度渐变消失完成');
                return;
            }
            
            // 应用透明度
            this.enemyElement.style.opacity = opacity;
            
            // 继续动画
            setTimeout(fadeOut, fadeInterval);
        };
        
        fadeOut();
    }
    
    
    /**
     * 重生敌人
     */
    respawnEnemy() {
        if (this.isRespawning || this.respawnCount <= 0) return;
        
        this.isRespawning = true;
        this.respawnCount--;
        
        console.log(`开始重生敌人，剩余重生次数: ${this.respawnCount}`);
        
        // 选择随机敌人类型
        this.applyRandomEnemyType();
        
        // 显示-1特效
        this.showMinusOneEffect();
        
        // 更新重生次数显示
        this.updateRespawnCount();
        
        // 重置倒计时（在重生动画之前）
        this.resetCountdown();
        
        // 从未知处开始重生动画
        this.startRespawnAnimation();
        
        // 立即启动新的倒计时
        this.startCountdown();
        
        // 检查是否还有重生次数
        if (this.respawnCount <= 0) {
            // 没有重生次数了，隐藏未知处
            this.hideUnknownSpawn();
        }
    }
    
    /**
     * 开始重生动画
     */
    startRespawnAnimation() {
        if (!this.unknownSpawnElement || !this.enemyElement) return;
        
        // 直接显示敌人，不播放动画
        this.enemyElement.style.display = 'flex';
        this.enemyElement.classList.remove('dying');
        
        // 重置敌人血量为当前配置的血量
        this.updateEnemyHealth(this.enemyConfig.health, this.enemyConfig.health);
        
        // 应用累积的伤害
        const projectileSystem = window.gameModules?.projectileSystem;
        if (projectileSystem) {
            projectileSystem.applyPendingDamage();
        }
        
        this.isRespawning = false;
        console.log('敌人重生完成');
    }
    
    /**
     * 更新重生次数显示
     */
    updateRespawnCount() {
        if (this.respawnCountElement) {
            this.respawnCountElement.textContent = `x${this.respawnCount}`;
            console.log(`重生次数显示已更新: x${this.respawnCount}`);
        } else {
            console.warn('respawnCountElement 未找到，尝试重新初始化');
            this.initRespawnElements();
            if (this.respawnCountElement) {
                this.respawnCountElement.textContent = `x${this.respawnCount}`;
                console.log(`重生次数显示已更新（重新初始化后）: x${this.respawnCount}`);
            } else {
                console.error('无法找到 respawnCountElement');
            }
        }
    }
    
    /**
     * 显示-1特效
     */
    showMinusOneEffect() {
        if (!this.respawnCountElement) return;
        
        // 创建-1特效元素
        const minusOneElement = document.createElement('div');
        minusOneElement.className = 'minus-one-effect';
        minusOneElement.textContent = '-1';
        
        // 设置初始位置（在计数器上方）
        const rect = this.respawnCountElement.getBoundingClientRect();
        minusOneElement.style.position = 'absolute';
        minusOneElement.style.left = `${rect.left + rect.width / 2}px`;
        minusOneElement.style.top = `${rect.top - 30}px`;
        minusOneElement.style.transform = 'translateX(-50%)';
        
        // 添加到页面
        document.body.appendChild(minusOneElement);
        
        // 动画结束后移除元素
        setTimeout(() => {
            if (document.body.contains(minusOneElement)) {
                document.body.removeChild(minusOneElement);
            }
        }, 2000); // 2秒后移除
    }
    
    /**
     * 隐藏未知处
     */
    hideUnknownSpawn() {
        if (this.unknownSpawnElement) {
            this.unknownSpawnElement.style.display = 'none';
            console.log('未知处已隐藏，重生次数用尽');
        }
    }
    
    /**
     * 显示未知处
     */
    showUnknownSpawn() {
        if (this.unknownSpawnElement) {
            this.unknownSpawnElement.style.display = 'flex';
        }
    }
    
    /**
     * 重置重生系统
     */
    resetRespawnSystem() {
        this.respawnCount = this.maxRespawnCount;
        this.isRespawning = false;
        this.updateRespawnCount();
        this.showUnknownSpawn();
        console.log('重生系统已重置');
    }
    
    /**
     * 开始倒计时
     */
    startCountdown() {
        // 如果游戏暂停，不启动倒计时
        if (this.isPaused) {
            console.log('游戏已暂停，不启动倒计时');
            return;
        }
        
        if (this.isCountdownActive) return;
        
        this.isCountdownActive = true;
        this.countdownTimeRemaining = this.enemyConfig.countdownDuration;
        this.countdownDuration = this.enemyConfig.countdownDuration;
        
        // 重置倒计时进度条
        if (this.countdownProgressElement) {
            // 确保进度条完全重置
            this.countdownProgressElement.style.transform = 'scaleX(1)';
            this.countdownProgressElement.classList.remove('shrinking');
            
            // 设置动态动画时长
            this.countdownProgressElement.style.animationDuration = `${this.countdownDuration}s`;
            
            // 强制重绘，然后添加动画类
            this.countdownProgressElement.offsetHeight;
            this.countdownProgressElement.classList.add('shrinking');
        }
        
        // 开始倒计时
        this.countdownInterval = setInterval(() => {
            this.countdownTimeRemaining -= 0.1;
            
            if (this.countdownTimeRemaining <= 0) {
                this.handleCountdownExpired();
            }
        }, 100);
        
        console.log(`倒计时开始: ${this.countdownDuration}秒`);
    }
    
    /**
     * 停止倒计时
     */
    stopCountdown() {
        if (this.countdownInterval) {
            clearInterval(this.countdownInterval);
            this.countdownInterval = null;
        }
        this.isCountdownActive = false;
        
        if (this.countdownProgressElement) {
            this.countdownProgressElement.classList.remove('shrinking');
        }
        
        console.log('倒计时已停止');
    }
    
    /**
     * 重置倒计时
     */
    resetCountdown() {
        // 停止当前倒计时
        this.stopCountdown();
        
        // 重置倒计时时间
        this.countdownTimeRemaining = this.enemyConfig.countdownDuration;
        this.countdownDuration = this.enemyConfig.countdownDuration;
        
        // 重置倒计时进度条
        if (this.countdownProgressElement) {
            // 强制重置进度条到初始状态
            this.countdownProgressElement.style.transform = 'scaleX(1)';
            this.countdownProgressElement.classList.remove('shrinking');
            // 清除动画时长，让startCountdown重新设置
            this.countdownProgressElement.style.animationDuration = '';
            // 强制重绘，确保进度条立即重置
            this.countdownProgressElement.offsetHeight;
        }
        
        console.log(`倒计时已重置为 ${this.countdownDuration} 秒`);
    }
    
    /**
     * 处理倒计时到期
     */
    handleCountdownExpired() {
        this.stopCountdown();
        this.combo = 0; // 敌人倒计时结束时重置连击
        
        // 播放敌人攻击动画
        this.playEnemyAttackAnimation();
        
        // 扣除玩家血量
        this.damagePlayer(this.enemyConfig.damage);
        
        // 播放受击特效和抖动
        this.playPlayerHitEffects();
        
        // 重新开始倒计时
        setTimeout(() => {
            this.startCountdown();
        }, 1000);
        
        console.log(`倒计时结束，玩家受到 ${this.enemyConfig.damage} 点伤害`);
    }
    
    /**
     * 播放敌人攻击动画
     */
    playEnemyAttackAnimation() {
        this.setEnemyState('attacking');
    }
    
    /**
     * 播放玩家受击特效
     */
    playPlayerHitEffects() {
        // 设置玩家受击状态
        this.setPlayerState('hit');
        
        // 播放受击动画
        this.playHitAnimation('player');
        
        // 设置友军受击状态
        this.setAllyState('hit');
        
        // 玩家血条抖动（只抖动玩家血条，不是所有血条）
        const playerHealthBar = document.querySelector('.player-health-bar');
        if (playerHealthBar) {
            playerHealthBar.classList.add('shake');
            setTimeout(() => {
                playerHealthBar.classList.remove('shake');
            }, 500);
        }
        
        // 序列键位抖动
        const keysContainer = document.getElementById('input-keys-container');
        if (keysContainer) {
            keysContainer.classList.add('shake');
            setTimeout(() => {
                keysContainer.classList.remove('shake');
            }, 500);
        }
    }
    
    /**
     * 设置敌人配置（为未来敌人种类和关卡变化预留）
     * @param {Object} config - 敌人配置
     */
    setEnemyConfig(config) {
        this.enemyConfig = { ...this.enemyConfig, ...config };
        
        // 清理解救统计（新关卡开始时）
        this.clearRescueStats();
        
        // 清空损失统计（新关卡开始时）
        this.clearLossStats();
        
        // 重置玩家血量为满血
        this.playerHealth = 30;
        this.playerMaxHealth = 30;
        
        // 应用友军加成到玩家血量
        this.applyTeamBonusesToPlayerHealth();
        
        // 清空投射物系统的累积伤害
        const projectileSystem = window.gameModules?.projectileSystem;
        if (projectileSystem) {
            projectileSystem.clearPendingDamage();
        }
        
        // 处理重生次数范围
        if (config.respawnRange) {
            const { min, max } = config.respawnRange;
            // 生成随机重生次数（包含min和max）
            this.maxRespawnCount = Math.floor(Math.random() * (max - min + 1)) + min;
            this.respawnCount = this.maxRespawnCount;
            console.log(`随机生成重生次数: ${this.respawnCount} (范围: ${min}-${max})`);
            
            // 延迟更新重生次数显示，确保元素已准备好
            setTimeout(() => {
                this.updateRespawnCount();
            }, 100);
        }
        
        // 处理敌人类型概率选择
        if (config.enemyTypes) {
            this.enemyTypePool = config.enemyTypes;
            this.lastEnemyMustBe = config.lastEnemyMustBe || null;
            this.firstEnemyMustBe = config.firstEnemyMustBe || null;
            this.firstEnemyTypes = config.firstEnemyTypes || null;
            this.isFirstEnemy = true; // 标记为第一个敌人
            console.log(`敌人类型池已设置:`, this.enemyTypePool);
            console.log(`第一个敌人设置:`, this.firstEnemyMustBe || this.firstEnemyTypes);
        }
        
        // 如果是第一个敌人，立即应用类型
        if (this.isFirstEnemy) {
            this.applyRandomEnemyType();
        }
        
        // 根据敌人类型更新血量和攻击力
        const enemyHealth = this.getEnemyHealthByType(this.enemyConfig.type);
        const enemyDamage = this.getEnemyDamageByType(this.enemyConfig.type);
        this.enemyConfig.health = enemyHealth;
        this.enemyConfig.damage = enemyDamage;
        
        // 更新敌人血量（同时设置当前血量和最大血量）
        this.updateEnemyHealth(this.enemyConfig.health, this.enemyConfig.health);
        
        // 更新敌人外观
        this.updateEnemyAppearance();
        
        // 更新碰撞检测尺寸
        this.updateEnemyCollisionSize();
        
        // 显示未知处（新关卡开始时）
        this.showUnknownSpawn();
        
        // 更新友军显示状态
        this.updateAllAllyDisplay();
        
        console.log('敌人配置已更新:', this.enemyConfig);
    }

    /**
     * 更新所有友军显示状态
     */
    updateAllAllyDisplay() {
        const allyCounts = this.getCurrentAllyCounts();
        const allyTypes = ['archer', 'villager', 'knight'];
        
        allyTypes.forEach(allyType => {
            this.updateAllyCount(allyType, allyCounts[allyType]);
        });
    }
    
    /**
     * 更新敌人外观
     */
    updateEnemyAppearance() {
        if (this.enemyElement) {
            // 移除所有敌人类型类
            this.enemyElement.classList.remove('enemy-one', 'enemy-two', 'enemy-three', 'enemy-four');
            
            // 添加当前敌人类型类
            this.enemyElement.classList.add(this.enemyConfig.type);
            
            // 更新敌人标签
            const enemyLabels = {
                'enemy-one': '敌人一',
                'enemy-two': '敌人二', 
                'enemy-three': '敌人三',
                'enemy-four': '敌人四'
            };
            
            const labelElement = this.enemyElement.querySelector('.character-label');
            if (labelElement) {
                labelElement.textContent = enemyLabels[this.enemyConfig.type] || '敌人';
            }
        }
    }
    
    /**
     * 更新敌人碰撞检测尺寸
     */
    updateEnemyCollisionSize() {
        const collisionSystem = window.gameModules?.collisionSystem;
        if (collisionSystem) {
            collisionSystem.updateEnemyCollisionByType(this.enemyConfig.type);
        }
    }
    
    /**
     * 获取敌人配置
     * @returns {Object} 当前敌人配置
     */
    getEnemyConfig() {
        return this.enemyConfig;
    }

    /**
     * 根据敌人类型获取血量
     * @param {string} enemyType - 敌人类型
     * @returns {number} 敌人血量
     */
    getEnemyHealthByType(enemyType) {
        return this.enemyHealthConfig[enemyType] || 10; // 默认10血
    }

    /**
     * 根据敌人类型获取攻击力
     * @param {string} enemyType - 敌人类型
     * @returns {number} 敌人攻击力
     */
    getEnemyDamageByType(enemyType) {
        return this.enemyDamageConfig[enemyType] || 10; // 默认10攻击力
    }
    
    /**
     * 随机选择敌人类型
     * @returns {string} 选择的敌人类型
     */
    selectRandomEnemyType() {
        // 如果没有敌人类型池，返回默认类型
        if (!this.enemyTypePool || this.enemyTypePool.length === 0) {
            return this.enemyConfig.type;
        }
        
        // 检查是否是第一个敌人
        if (this.isFirstEnemy) {
            if (this.firstEnemyMustBe) {
                console.log(`第一个敌人，强制选择: ${this.firstEnemyMustBe}`);
                this.isFirstEnemy = false; // 重置标记
                return this.firstEnemyMustBe;
            } else if (this.firstEnemyTypes && this.firstEnemyTypes.length > 0) {
                const randomIndex = Math.floor(Math.random() * this.firstEnemyTypes.length);
                const selectedType = this.firstEnemyTypes[randomIndex];
                console.log(`第一个敌人，随机选择: ${selectedType}`);
                this.isFirstEnemy = false; // 重置标记
                return selectedType;
            }
        }
        
        // 检查是否是最后一个敌人
        if (this.respawnCount === 0 && this.lastEnemyMustBe) {
            console.log(`最后一个敌人，强制选择: ${this.lastEnemyMustBe}`);
            return this.lastEnemyMustBe;
        }
        
        // 生成随机数
        const random = Math.random();
        let cumulativeProbability = 0;
        
        // 根据概率选择敌人类型
        for (const enemyType of this.enemyTypePool) {
            cumulativeProbability += enemyType.probability;
            if (random <= cumulativeProbability) {
                console.log(`随机选择敌人类型: ${enemyType.type} (概率: ${enemyType.probability})`);
                return enemyType.type;
            }
        }
        
        // 如果所有概率都不匹配，返回最后一个类型
        return this.enemyTypePool[this.enemyTypePool.length - 1].type;
    }
    
    /**
     * 应用随机敌人类型
     */
    applyRandomEnemyType() {
        const selectedType = this.selectRandomEnemyType();
        
        // 更新敌人配置
        this.enemyConfig.type = selectedType;
        
        // 根据敌人类型更新血量和攻击力
        const enemyHealth = this.getEnemyHealthByType(selectedType);
        const enemyDamage = this.getEnemyDamageByType(selectedType);
        this.enemyConfig.health = enemyHealth;
        this.enemyConfig.damage = enemyDamage;
        
        // 更新敌人血量（同时设置当前血量和最大血量）
        this.updateEnemyHealth(enemyHealth, enemyHealth);
        
        // 更新敌人外观
        this.updateEnemyAppearance();
        
        // 更新碰撞检测尺寸
        this.updateEnemyCollisionSize();
        
        console.log(`已应用随机敌人类型: ${selectedType}，血量: ${enemyHealth}，攻击力: ${enemyDamage}`);
    }
    
    /**
     * 设置敌人状态
     * @param {string} state - 敌人状态 (idle, hit, attacking)
     */
    setEnemyState(state) {
        if (!this.enemyElement) return;
        
        // 移除所有状态类
        this.enemyElement.classList.remove('hit', 'attacking');
        
        // 设置新状态
        if (state === 'hit') {
            this.enemyElement.classList.add('hit');
            this.enemyState = 'hit';
            // 受击状态自动回到待机
            setTimeout(() => {
                this.setEnemyState('idle');
            }, 600);
        } else if (state === 'attacking') {
            this.enemyElement.classList.add('attacking');
            this.enemyState = 'attacking';
            // 攻击状态自动回到待机
            setTimeout(() => {
                this.setEnemyState('idle');
            }, 1000);
        } else {
            this.enemyState = 'idle';
        }
        
        console.log(`敌人状态已设置为: ${state}`);
    }
    
    /**
     * 获取敌人状态
     * @returns {string} 当前敌人状态
     */
    getEnemyState() {
        return this.enemyState;
    }
    
    /**
     * 播放玩家攻击动画
     */
    playPlayerAttackAnimation() {
        this.setPlayerState('attacking');
    }
    
    /**
     * 设置玩家状态
     * @param {string} state - 玩家状态 ('idle', 'hit', 'attacking')
     */
    setPlayerState(state) {
        if (!this.playerElement) {
            console.warn('玩家元素未找到，无法设置状态');
            return;
        }
        
        console.log(`尝试设置玩家状态为: ${state}`);
        console.log('当前玩家元素:', this.playerElement);
        console.log('当前玩家元素类名:', this.playerElement.className);
        
        // 移除所有状态类
        this.playerElement.classList.remove('hit', 'attacking');
        
        // 设置新状态
        if (state === 'hit') {
            // 先停止待机动画
            this.playerElement.style.animation = 'none';
            // 强制重绘
            this.playerElement.offsetHeight;
            
            this.playerElement.classList.add('hit');
            this.playerState = 'hit';
            console.log('玩家受击状态已设置，类名:', this.playerElement.className);
            // 受击状态自动回到待机
            setTimeout(() => {
                this.setPlayerState('idle');
            }, 600);
        } else if (state === 'attacking') {
            // 先停止待机动画
            this.playerElement.style.animation = 'none';
            // 强制重绘
            this.playerElement.offsetHeight;
            
            this.playerElement.classList.add('attacking');
            this.playerState = 'attacking';
            console.log('玩家攻击状态已设置，类名:', this.playerElement.className);
            // 攻击状态自动回到待机
            setTimeout(() => {
                this.setPlayerState('idle');
            }, 800);
        } else {
            // 恢复待机动画
            this.playerElement.style.animation = '';
            this.playerState = 'idle';
            console.log('玩家回到待机状态，类名:', this.playerElement.className);
        }
        
        console.log(`玩家状态已设置为: ${state}`);
    }
    
    /**
     * 获取玩家状态
     * @returns {string} 当前玩家状态
     */
    getPlayerState() {
        return this.playerState;
    }
    
    /**
     * 设置友军状态
     * @param {string} state - 友军状态 ('idle', 'hit', 'attacking')
     */
    setAllyState(state) {
        // 友一（弓箭手）
        const allyOne = document.getElementById('ally-one');
        if (allyOne) {
            allyOne.classList.remove('hit', 'attacking');
            if (state === 'hit' || state === 'attacking') {
                allyOne.classList.add(state);
                // 自动回到待机状态
                setTimeout(() => {
                    allyOne.classList.remove('hit', 'attacking');
                }, state === 'hit' ? 600 : 800);
            }
        }
        
        // 友二（村民）
        const allyTwo = document.getElementById('ally-two');
        if (allyTwo) {
            allyTwo.classList.remove('hit', 'attacking');
            if (state === 'hit' || state === 'attacking') {
                allyTwo.classList.add(state);
                // 自动回到待机状态
                setTimeout(() => {
                    allyTwo.classList.remove('hit', 'attacking');
                }, state === 'hit' ? 600 : 800);
            }
        }
        
        // 友三（骑士）
        const allyThree = document.getElementById('ally-three');
        if (allyThree) {
            allyThree.classList.remove('hit', 'attacking');
            if (state === 'hit' || state === 'attacking') {
                allyThree.classList.add(state);
                // 自动回到待机状态
                setTimeout(() => {
                    allyThree.classList.remove('hit', 'attacking');
                }, state === 'hit' ? 600 : 800);
            }
        }
    }
    
    /**
     * 显示血条坐标信息（用于手动调整）
     */
    showHealthBarCoordinates() {
        const playerHealthBar = document.querySelector('.player-health-bar');
        const enemyHealthBar = document.querySelector('.enemy-health-bar');
        
        if (playerHealthBar) {
            const playerRect = playerHealthBar.getBoundingClientRect();
            console.log('=== 玩家血条坐标信息 ===');
            console.log('CSS位置:', {
                position: window.getComputedStyle(playerHealthBar).position,
                top: window.getComputedStyle(playerHealthBar).top,
                left: window.getComputedStyle(playerHealthBar).left,
                right: window.getComputedStyle(playerHealthBar).right,
                transform: window.getComputedStyle(playerHealthBar).transform
            });
            console.log('实际位置:', {
                x: playerRect.left,
                y: playerRect.top,
                width: playerRect.width,
                height: playerRect.height
            });
        }
        
        if (enemyHealthBar) {
            const enemyRect = enemyHealthBar.getBoundingClientRect();
            console.log('=== 敌人血条坐标信息 ===');
            console.log('CSS位置:', {
                position: window.getComputedStyle(enemyHealthBar).position,
                top: window.getComputedStyle(enemyHealthBar).top,
                left: window.getComputedStyle(enemyHealthBar).left,
                right: window.getComputedStyle(enemyHealthBar).right,
                transform: window.getComputedStyle(enemyHealthBar).transform
            });
            console.log('实际位置:', {
                x: enemyRect.left,
                y: enemyRect.top,
                width: enemyRect.width,
                height: enemyRect.height
            });
        }
        
        // 在页面上显示坐标信息
        this.displayCoordinatesOnPage();
    }
    
    /**
     * 在页面上显示坐标信息
     */
    displayCoordinatesOnPage() {
        // 移除之前的坐标显示
        const existingDisplay = document.getElementById('coordinate-display');
        if (existingDisplay) {
            existingDisplay.remove();
        }
        
        const playerHealthBar = document.querySelector('.player-health-bar');
        const enemyHealthBar = document.querySelector('.enemy-health-bar');
        
        const display = document.createElement('div');
        display.id = 'coordinate-display';
        display.style.position = 'fixed';
        display.style.top = '10px';
        display.style.left = '10px';
        display.style.background = 'rgba(0, 0, 0, 0.8)';
        display.style.color = 'white';
        display.style.padding = '10px';
        display.style.borderRadius = '5px';
        display.style.fontFamily = 'monospace';
        display.style.fontSize = '12px';
        display.style.zIndex = '9999';
        display.style.maxWidth = '300px';
        
        let content = '<h3>血条坐标信息</h3>';
        
        if (playerHealthBar) {
            const playerRect = playerHealthBar.getBoundingClientRect();
            const playerStyle = window.getComputedStyle(playerHealthBar);
            content += '<h4>玩家血条:</h4>';
            content += `位置: ${playerStyle.position}<br>`;
            content += `Top: ${playerStyle.top}<br>`;
            content += `Left: ${playerStyle.left}<br>`;
            content += `Right: ${playerStyle.right}<br>`;
            content += `Transform: ${playerStyle.transform}<br>`;
            content += `实际X: ${Math.round(playerRect.left)}px<br>`;
            content += `实际Y: ${Math.round(playerRect.top)}px<br>`;
            content += `宽度: ${Math.round(playerRect.width)}px<br>`;
            content += `高度: ${Math.round(playerRect.height)}px<br><br>`;
        }
        
        if (enemyHealthBar) {
            const enemyRect = enemyHealthBar.getBoundingClientRect();
            const enemyStyle = window.getComputedStyle(enemyHealthBar);
            content += '<h4>敌人血条:</h4>';
            content += `位置: ${enemyStyle.position}<br>`;
            content += `Top: ${enemyStyle.top}<br>`;
            content += `Left: ${enemyStyle.left}<br>`;
            content += `Right: ${enemyStyle.right}<br>`;
            content += `Transform: ${enemyStyle.transform}<br>`;
            content += `实际X: ${Math.round(enemyRect.left)}px<br>`;
            content += `实际Y: ${Math.round(enemyRect.top)}px<br>`;
            content += `宽度: ${Math.round(enemyRect.width)}px<br>`;
            content += `高度: ${Math.round(enemyRect.height)}px<br><br>`;
        }
        
        content += '<button onclick="this.parentElement.remove()">关闭</button>';
        display.innerHTML = content;
        
        document.body.appendChild(display);
    }
}

// 导出输入系统类
if (typeof module !== 'undefined' && module.exports) {
    module.exports = InputSystem;
}
