/**
 * 村庄堡垒队伍编辑弹窗管理
 */
class VillageFortressPopup {
    constructor() {
        this.popup = null;
        this.closeBtn = null;
        this.saveBtn = null;
        this.teamCounts = {
            archer: 1,
            villager: 1,
            knight: 1
        };
        this.originalCounts = { ...this.teamCounts };
        // 库存系统：玩家拥有的友军总数
        this.inventory = {
            archer: 1,    // 默认拥有1个弓手
            villager: 1,  // 默认拥有1个村民
            knight: 1     // 默认拥有1个骑士
        };
        this.init();
    }

    init() {
        this.popup = document.getElementById('village-fortress-popup');
        this.closeBtn = document.getElementById('close-village-fortress-btn');
        this.saveBtn = document.getElementById('save-team-btn');
        
        if (!this.popup || !this.closeBtn || !this.saveBtn) {
            console.error('村庄堡垒弹窗元素未找到');
            return;
        }

        // 加载库存
        this.loadInventory();
        
        this.setupEventListeners();
        this.updateDisplay();
    }

    setupEventListeners() {
        // 关闭按钮
        this.closeBtn.addEventListener('click', () => {
            this.closePopup();
        });

        // 保存按钮
        this.saveBtn.addEventListener('click', () => {
            this.saveTeam();
        });

        // 增加/减少按钮
        const decreaseBtns = document.querySelectorAll('.decrease-btn');
        const increaseBtns = document.querySelectorAll('.increase-btn');

        decreaseBtns.forEach(btn => {
            btn.addEventListener('click', (e) => {
                const member = e.target.getAttribute('data-member');
                this.decreaseCount(member);
            });
        });

        increaseBtns.forEach(btn => {
            btn.addEventListener('click', (e) => {
                const member = e.target.getAttribute('data-member');
                this.increaseCount(member);
            });
        });

        // 点击弹窗背景关闭
        this.popup.addEventListener('click', (e) => {
            if (e.target === this.popup) {
                this.closePopup();
            }
        });
    }

    showPopup() {
        if (!this.popup) {
            console.error('popup元素未找到');
            return;
        }
        
        // 从存档系统加载最新的队伍和库存数据
        this.loadTeamFromSave();
        
        this.popup.style.display = 'flex';
        document.body.style.overflow = 'hidden';
    }

    closePopup() {
        if (!this.popup) return;
        
        this.popup.style.display = 'none';
        document.body.style.overflow = '';
    }

    increaseCount(member) {
        // 检查库存是否足够
        if (this.teamCounts[member] < this.inventory[member]) {
            this.teamCounts[member]++;
            this.updateDisplay();
        } else {
            console.log(`库存不足，无法增加${member}`);
        }
    }

    decreaseCount(member) {
        if (this.teamCounts[member] > 0) { // 限制最小数量为0
            this.teamCounts[member]--;
            this.updateDisplay();
        }
    }

    updateDisplay() {
        // 更新各个角色的计数显示
        document.getElementById('archer-count').textContent = this.teamCounts.archer;
        document.getElementById('villager-count').textContent = this.teamCounts.villager;
        document.getElementById('knight-count').textContent = this.teamCounts.knight;

        // 更新库存显示
        document.getElementById('archer-inventory').textContent = this.inventory.archer;
        document.getElementById('villager-inventory').textContent = this.inventory.villager;
        document.getElementById('knight-inventory').textContent = this.inventory.knight;

        // 更新总人数
        const totalCount = this.teamCounts.archer + this.teamCounts.villager + this.teamCounts.knight;
        document.getElementById('total-team-count').textContent = totalCount;

        // 更新增加按钮的可用性
        this.updateButtonStates();

        // 更新游戏中的友军计数器
        this.updateGameCounters();
    }

    updateButtonStates() {
        // 更新增加按钮的可用性
        const increaseBtns = document.querySelectorAll('.increase-btn');
        increaseBtns.forEach(btn => {
            const member = btn.getAttribute('data-member');
            const hasInventory = this.teamCounts[member] < this.inventory[member];
            const canIncrease = hasInventory;
            
            btn.disabled = !canIncrease;
            btn.style.opacity = canIncrease ? '1' : '0.5';
            
            // 添加提示文本
            if (!hasInventory) {
                btn.title = '库存不足';
            } else {
                btn.title = '';
            }
        });
    }

    updateGameCounters() {
        // 更新游戏界面中的友军计数器
        const allyCountElement = document.getElementById('ally-count');
        const allyTwoCountElement = document.getElementById('ally-two-count');
        const allyThreeCountElement = document.getElementById('ally-three-count');

        if (allyCountElement) {
            allyCountElement.textContent = `x${this.teamCounts.archer}`;
        }
        if (allyTwoCountElement) {
            allyTwoCountElement.textContent = `x${this.teamCounts.villager}`;
        }
        if (allyThreeCountElement) {
            allyThreeCountElement.textContent = `x${this.teamCounts.knight}`;
        }
    }

    saveTeam() {
        // 保存队伍配置
        this.originalCounts = { ...this.teamCounts };
        
        // 更新游戏中的友军计数器
        this.updateGameCounters();
        
        // 同步到存档系统
        if (window.saveManager) {
            window.saveManager.updateTeamConfig(this.teamCounts);
            window.saveManager.updateInventory(this.inventory);
        }
        
        // 更新游戏中的友军显示
        if (window.gameModules?.inputSystem) {
            window.gameModules.inputSystem.updateAllAllyDisplay();
        }
        
        // 触发自定义事件，通知其他模块队伍已更新
        const event = new CustomEvent('teamUpdated', {
            detail: {
                archer: this.teamCounts.archer,
                villager: this.teamCounts.villager,
                knight: this.teamCounts.knight
            }
        });
        document.dispatchEvent(event);
        
        console.log('队伍配置已保存:', this.teamCounts);
        
        // 关闭弹窗
        this.closePopup();
    }

    // 获取当前队伍配置
    getTeamConfig() {
        return { ...this.teamCounts };
    }

    // 设置队伍配置（用于从外部更新）
    setTeamConfig(config) {
        this.teamCounts = { ...config };
        this.originalCounts = { ...config };
        this.updateDisplay();
    }

    // 添加友军（战斗胜利后调用）
    addAlly(type) {
        // 直接添加到库存，不设限制
        this.inventory[type]++;
        this.teamCounts[type]++;
        this.originalCounts[type]++;
        
        // 同步到存档系统
        if (window.saveManager) {
            window.saveManager.updateInventory(this.inventory);
        }
        
        this.updateDisplay();
        console.log(`添加了一个${type}到库存，当前库存: ${this.inventory[type]}，队伍数量: ${this.teamCounts[type]}`);
    }

    // 批量添加解救的友军（战斗胜利后调用）
    addRescuedAllies(rescueStats) {
        console.log('批量添加解救的友军到库存:', rescueStats);
        
        // 添加解救的友军到库存中，不设限制
        this.inventory.archer += rescueStats.archer;
        this.inventory.villager += rescueStats.villager;
        this.inventory.knight += rescueStats.knight;
        
        // 同步到存档系统
        if (window.saveManager) {
            window.saveManager.updateInventory(this.inventory);
        }
        
        // 更新显示
        this.updateDisplay();
        
        console.log('解救友军添加到库存完成，当前库存:', this.inventory);
    }

    // 保存库存到localStorage
    saveInventory() {
        try {
            localStorage.setItem('villageFortress_inventory', JSON.stringify(this.inventory));
            console.log('库存已保存到localStorage');
        } catch (error) {
            console.error('保存库存失败:', error);
        }
    }

    // 从存档系统加载库存
    loadInventory() {
        try {
            if (window.saveManager) {
                const savedInventory = window.saveManager.getInventory();
                if (savedInventory) {
                    this.inventory = { ...savedInventory };
                    console.log('库存已从存档系统加载:', this.inventory);
                } else {
                    console.log('未找到存档，使用默认库存');
                }
            } else {
                // 备用方案：从localStorage加载
                const saved = localStorage.getItem('villageFortress_inventory');
                if (saved) {
                    this.inventory = JSON.parse(saved);
                    console.log('库存已从localStorage加载:', this.inventory);
                } else {
                    console.log('未找到保存的库存，使用默认值');
                }
            }
        } catch (error) {
            console.error('加载库存失败:', error);
        }
    }

    // 从存档系统加载队伍和库存数据
    loadTeamFromSave() {
        try {
            if (window.saveManager) {
                const savedTeamConfig = window.saveManager.getTeamConfig();
                const savedInventory = window.saveManager.getInventory();
                
                if (savedTeamConfig) {
                    this.teamCounts = { ...savedTeamConfig };
                    this.originalCounts = { ...savedTeamConfig };
                    console.log('队伍配置已从存档加载:', this.teamCounts);
                }
                
                if (savedInventory) {
                    this.inventory = { ...savedInventory };
                    console.log('库存已从存档加载:', this.inventory);
                }
                
                // 确保库存数量不小于队伍数量（但不会因为队伍数量为0而将库存设为0）
                Object.keys(this.teamCounts).forEach(allyType => {
                    if (this.teamCounts[allyType] > 0 && this.inventory[allyType] < this.teamCounts[allyType]) {
                        this.inventory[allyType] = this.teamCounts[allyType];
                    }
                });
                
                this.updateDisplay();
            } else {
                console.log('存档系统不可用，使用默认数据');
                this.updateDisplay();
            }
        } catch (error) {
            console.error('从存档加载数据失败:', error);
            this.updateDisplay();
        }
    }
}

// 等待DOM加载完成后创建实例
document.addEventListener('DOMContentLoaded', function() {
    window.villageFortressPopup = new VillageFortressPopup();
});
