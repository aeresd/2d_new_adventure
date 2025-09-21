/**
 * 音频管理模块
 * 负责处理背景音乐和音效的播放
 */
class AudioManager {
    constructor() {
        this.backgroundMusic = null;
        this.soundEffects = {};
        this.isMuted = false;
        this.backgroundVolume = 0.3; // 背景音乐音量
        this.effectVolume = 0.5; // 音效音量
        
        this.init();
    }

    /**
     * 初始化音频管理器
     */
    init() {
        this.loadBackgroundMusic();
        this.loadSoundEffects();
        this.bindEvents();
        console.log('音频管理器已初始化');
    }

    /**
     * 加载背景音乐
     */
    loadBackgroundMusic() {
        // 主界面和关卡选择背景音乐
        this.bgmMusic = new Audio('Sound/Bgm.mp3');
        this.bgmMusic.loop = true;
        this.bgmMusic.volume = this.backgroundVolume;
        
        // 战斗背景音乐
        this.battleMusic = new Audio('Sound/Battle_bgm.mp3');
        this.battleMusic.loop = true;
        this.battleMusic.volume = this.backgroundVolume;
    }

    /**
     * 加载音效
     */
    loadSoundEffects() {
        this.soundEffects = {
            fire: new Audio('Sound/fire.MP3'),
            enemyDie: new Audio('Sound/enemy_die.MP3'),
            playerHit: new Audio('Sound/player_hit.MP3')
        };

        // 设置音效音量
        Object.values(this.soundEffects).forEach(sound => {
            sound.volume = this.effectVolume;
        });
    }

    /**
     * 绑定事件监听器
     */
    bindEvents() {
        // 监听游戏状态变化
        document.addEventListener('gameStart', (event) => {
            this.handleGameStart(event.detail);
        });

        document.addEventListener('levelSceneShown', () => {
            this.playBattleMusic();
        });

        document.addEventListener('levelSceneHidden', () => {
            this.stopBattleMusic();
        });

        // 监听投射物击中事件
        document.addEventListener('projectileHit', () => {
            this.playSound('fire');
        });

        // 监听敌人死亡事件
        document.addEventListener('enemyDeath', () => {
            this.playSound('enemyDie');
        });

        // 监听玩家受伤事件
        document.addEventListener('playerHit', () => {
            this.playSound('playerHit');
        });
    }

    /**
     * 处理游戏开始事件
     * @param {Object} detail - 事件详情
     */
    handleGameStart(detail) {
        if (detail.from === 'mainMenu' || detail.from === 'levelSelect') {
            this.playBgmMusic();
        }
    }

    /**
     * 播放主界面背景音乐
     */
    playBgmMusic() {
        if (this.isMuted) return;
        
        this.stopBattleMusic();
        this.bgmMusic.currentTime = 0;
        this.bgmMusic.play().catch(error => {
            console.log('背景音乐播放失败:', error);
        });
        console.log('播放主界面背景音乐');
    }

    /**
     * 播放战斗背景音乐
     */
    playBattleMusic() {
        if (this.isMuted) return;
        
        this.stopBgmMusic();
        this.battleMusic.currentTime = 0;
        this.battleMusic.play().catch(error => {
            console.log('战斗音乐播放失败:', error);
        });
        console.log('播放战斗背景音乐');
    }

    /**
     * 停止主界面背景音乐
     */
    stopBgmMusic() {
        this.bgmMusic.pause();
        this.bgmMusic.currentTime = 0;
    }

    /**
     * 停止战斗背景音乐
     */
    stopBattleMusic() {
        this.battleMusic.pause();
        this.battleMusic.currentTime = 0;
    }

    /**
     * 播放音效
     * @param {string} soundName - 音效名称
     */
    playSound(soundName) {
        if (this.isMuted) return;
        
        const sound = this.soundEffects[soundName];
        if (sound) {
            sound.currentTime = 0;
            sound.play().catch(error => {
                console.log(`音效 ${soundName} 播放失败:`, error);
            });
            console.log(`播放音效: ${soundName}`);
        }
    }

    /**
     * 设置静音状态
     * @param {boolean} muted - 是否静音
     */
    setMuted(muted) {
        this.isMuted = muted;
        
        if (muted) {
            this.bgmMusic.pause();
            this.battleMusic.pause();
        } else {
            // 根据当前场景恢复播放
            const levelScene = document.getElementById('level-scene');
            if (levelScene && levelScene.classList.contains('active')) {
                this.playBattleMusic();
            } else {
                this.playBgmMusic();
            }
        }
        
        console.log('音频静音状态:', muted);
    }

    /**
     * 设置背景音乐音量
     * @param {number} volume - 音量 (0-1)
     */
    setBackgroundVolume(volume) {
        this.backgroundVolume = Math.max(0, Math.min(1, volume));
        this.bgmMusic.volume = this.backgroundVolume;
        this.battleMusic.volume = this.backgroundVolume;
    }

    /**
     * 设置音效音量
     * @param {number} volume - 音量 (0-1)
     */
    setEffectVolume(volume) {
        this.effectVolume = Math.max(0, Math.min(1, volume));
        Object.values(this.soundEffects).forEach(sound => {
            sound.volume = this.effectVolume;
        });
    }

    /**
     * 停止所有音频
     */
    stopAll() {
        this.stopBgmMusic();
        this.stopBattleMusic();
    }

    /**
     * 获取当前播放状态
     * @returns {Object} 播放状态信息
     */
    getStatus() {
        return {
            isMuted: this.isMuted,
            backgroundVolume: this.backgroundVolume,
            effectVolume: this.effectVolume,
            bgmPlaying: !this.bgmMusic.paused,
            battlePlaying: !this.battleMusic.paused
        };
    }
}

// 导出音频管理器类
if (typeof module !== 'undefined' && module.exports) {
    module.exports = AudioManager;
}
