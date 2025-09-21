/**
 * 存档管理系统
 */
class SaveManager {
    constructor() {
        this.saveKey = 'game_save_data';
        this.currentSave = null;
        this.init();
    }

    init() {
        this.loadSave();
    }

    /**
     * 检查是否有存档
     */
    hasSave() {
        return this.currentSave !== null;
    }

    /**
     * 创建新存档
     */
    createNewSave() {
        this.currentSave = {
            version: '1.0',
            createdAt: new Date().toISOString(),
            lastPlayed: new Date().toISOString(),
            // 默认队伍配置
            teamConfig: {
                archer: 1,
                villager: 1,
                knight: 1
            },
            // 库存数据
            inventory: {
                archer: 1,
                villager: 1,
                knight: 1
            },
            // 游戏进度
            gameProgress: {
                currentLevel: '1',
                unlockedLevels: ['1'],
                completedLevels: []
            }
        };
        
        this.saveToStorage();
        console.log('新存档已创建');
    }

    /**
     * 加载存档
     */
    loadSave() {
        try {
            const saved = localStorage.getItem(this.saveKey);
            if (saved) {
                this.currentSave = JSON.parse(saved);
                console.log('存档已加载:', this.currentSave);
            } else {
                console.log('未找到存档');
            }
        } catch (error) {
            console.error('加载存档失败:', error);
            this.currentSave = null;
        }
    }

    /**
     * 保存存档到localStorage
     */
    saveToStorage() {
        if (this.currentSave) {
            try {
                this.currentSave.lastPlayed = new Date().toISOString();
                localStorage.setItem(this.saveKey, JSON.stringify(this.currentSave));
                console.log('存档已保存');
            } catch (error) {
                console.error('保存存档失败:', error);
            }
        }
    }

    /**
     * 更新队伍配置
     */
    updateTeamConfig(teamConfig) {
        if (this.currentSave) {
            this.currentSave.teamConfig = { ...teamConfig };
            this.saveToStorage();
        }
    }

    /**
     * 更新库存数据
     */
    updateInventory(inventory) {
        if (this.currentSave) {
            this.currentSave.inventory = { ...inventory };
            this.saveToStorage();
        }
    }

    /**
     * 更新游戏进度
     */
    updateGameProgress(progress) {
        if (this.currentSave) {
            this.currentSave.gameProgress = { ...this.currentSave.gameProgress, ...progress };
            this.saveToStorage();
        }
    }

    /**
     * 获取队伍配置
     */
    getTeamConfig() {
        return this.currentSave ? this.currentSave.teamConfig : null;
    }

    /**
     * 获取库存数据
     */
    getInventory() {
        return this.currentSave ? this.currentSave.inventory : null;
    }

    /**
     * 获取游戏进度
     */
    getGameProgress() {
        return this.currentSave ? this.currentSave.gameProgress : null;
    }

    /**
     * 删除存档
     */
    deleteSave() {
        try {
            localStorage.removeItem(this.saveKey);
            this.currentSave = null;
            console.log('存档已删除');
        } catch (error) {
            console.error('删除存档失败:', error);
        }
    }

    /**
     * 应用存档数据到游戏
     */
    applySaveToGame() {
        if (!this.currentSave) return;

        // 应用队伍配置到村庄堡垒弹窗
        if (window.villageFortressPopup) {
            window.villageFortressPopup.setTeamConfig(this.currentSave.teamConfig);
            window.villageFortressPopup.inventory = { ...this.currentSave.inventory };
            window.villageFortressPopup.updateDisplay();
        }

        // 应用游戏进度
        if (window.gameModules?.levelSelect) {
            // 这里可以添加解锁关卡的逻辑
            console.log('应用游戏进度:', this.currentSave.gameProgress);
        }

        console.log('存档数据已应用到游戏');
    }
}

// 创建全局存档管理器实例
window.saveManager = new SaveManager();
