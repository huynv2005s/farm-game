// ==========================================================================
// FARM RPG - CLIENT APP CONTROLLER & UI BINDINGS
// ==========================================================================

let gameInstance = null;
window.currentUser = null;
window.currentHotbarSlot = 1;
let selectedGender = 'male';

// Hotbar definition
const HOTBAR_CONFIG = [
  { slot: 1, label: 'Cuốc đất', icon: '⛏️', key: '1' },
  { slot: 2, label: 'Bình tưới', icon: '💧', key: '2' },
  { slot: 3, label: 'Lúa mì', icon: '🌾', key: '3', seed: 'seed_wheat' },
  { slot: 4, label: 'Cà rốt', icon: '🥕', key: '4', seed: 'seed_carrot' },
  { slot: 5, label: 'Dâu tây', icon: '🍓', key: '5', seed: 'seed_strawberry' },
  { slot: 6, label: 'Thu hoạch', icon: '🧺', key: '6' }
];

document.addEventListener('DOMContentLoaded', () => {
  // 1. Initialize Canvas Sprite Previews in Character Selection
  if (window.initCharacterPreviews) {
    window.initCharacterPreviews();
  }

  // 2. Setup Auth Tabs (Login vs Register)
  const tabLogin = document.getElementById('tab-login');
  const tabRegister = document.getElementById('tab-register');
  const formRegisterSection = document.getElementById('register-extra-fields');
  const btnSubmitAuth = document.getElementById('btn-submit-auth');
  const authTitle = document.getElementById('auth-title');
  const authSubtitle = document.getElementById('auth-subtitle');
  let isRegisterMode = true;

  tabLogin.addEventListener('click', () => {
    isRegisterMode = false;
    tabLogin.classList.add('active');
    tabRegister.classList.remove('active');
    formRegisterSection.style.display = 'none';
    authTitle.innerText = 'Chào Mừng Trở Lại';
    authSubtitle.innerText = 'Đăng nhập để tiếp tục chăm sóc trang trại và thu hoạch nông sản';
    btnSubmitAuth.innerText = 'Đăng Nhập Vào Game';
  });

  tabRegister.addEventListener('click', () => {
    isRegisterMode = true;
    tabRegister.classList.add('active');
    tabLogin.classList.remove('active');
    formRegisterSection.style.display = 'flex';
    authTitle.innerText = 'Đăng Ký & Chọn Nhân Vật';
    authSubtitle.innerText = 'Chọn giới tính nhân vật và đặt tên cho người nông dân của bạn';
    btnSubmitAuth.innerText = 'Bắt Đầu Cuộc Sống Nông Trại';
  });

  // 3. Setup Character Selection Cards
  const maleCard = document.getElementById('char-card-male');
  const femaleCard = document.getElementById('char-card-female');

  maleCard.addEventListener('click', () => {
    selectedGender = 'male';
    maleCard.classList.add('selected');
    femaleCard.classList.remove('selected');
  });

  femaleCard.addEventListener('click', () => {
    selectedGender = 'female';
    femaleCard.classList.add('selected');
    maleCard.classList.remove('selected');
  });

  // 4. Handle Auth Form Submission
  const authForm = document.getElementById('auth-form');
  const authError = document.getElementById('auth-error');

  authForm.addEventListener('submit', async (e) => {
    e.preventDefault();
    authError.innerText = '';

    const username = document.getElementById('input-username').value.trim();
    const password = document.getElementById('input-password').value;
    const charName = document.getElementById('input-char-name')?.value.trim() || username;

    try {
      btnSubmitAuth.disabled = true;
      btnSubmitAuth.innerText = 'Đang xử lý...';

      let result;
      if (isRegisterMode) {
        result = await window.API.register(username, password, selectedGender, charName);
        window.showToast(`Chào mừng ${result.user.character_name} đến với trang trại!`, 'success');
      } else {
        result = await window.API.login(username, password);
        window.showToast(`Chào mừng trở lại, ${result.user.character_name}!`, 'success');
      }

      window.currentUser = result.user;
      startGame(result.user);
    } catch (err) {
      authError.innerText = err.message;
    } finally {
      btnSubmitAuth.disabled = false;
      btnSubmitAuth.innerText = isRegisterMode ? 'Bắt Đầu Cuộc Sống Nông Trại' : 'Đăng Nhập Vào Game';
    }
  });

  // 5. Setup Hotbar Click Events
  document.querySelectorAll('.hotbar-slot').forEach(slotEl => {
    slotEl.addEventListener('click', () => {
      const slotNum = parseInt(slotEl.getAttribute('data-slot'));
      window.setActiveHotbarSlot(slotNum);
    });
  });

  // 6. Setup Modal Events (Inventory, Logout)
  document.getElementById('btn-inventory')?.addEventListener('click', () => {
    openInventoryModal();
  });
  document.getElementById('modal-close-btn')?.addEventListener('click', () => {
    closeInventoryModal();
  });
  document.getElementById('btn-logout')?.addEventListener('click', () => {
    window.API.logout();
  });

  // 7. Setup Farm Layout Edit Mode Events
  document.getElementById('btn-toggle-edit')?.addEventListener('click', () => {
    window.toggleFarmEditMode();
  });
  document.getElementById('btn-save-layout')?.addEventListener('click', () => {
    window.saveFarmLayoutAction();
  });
  document.getElementById('btn-reset-layout')?.addEventListener('click', () => {
    window.resetFarmLayoutAction();
  });
  document.getElementById('btn-cancel-edit')?.addEventListener('click', () => {
    window.exitFarmEditMode();
  });

  // Keydown shortcuts: Edit Mode [B], Mobile Controls [M]
  window.addEventListener('keydown', (e) => {
    if (['INPUT', 'TEXTAREA'].includes(document.activeElement?.tagName)) return;
    if (e.key === 'b' || e.key === 'B') {
      window.toggleFarmEditMode();
    }
    if (e.key === 'm' || e.key === 'M') {
      window.toggleMobileControls();
    }
  });

  // Check if existing token
  checkExistingSession();
});

async function checkExistingSession() {
  if (!window.API.token) return;

  try {
    const user = await window.API.getProfile();
    window.currentUser = user;
    startGame(user);
    window.showToast(`Chào mừng trở lại, ${user.character_name}!`, 'success');
  } catch (err) {
    window.API.logout();
  }
}

function startGame(user) {
  document.getElementById('auth-overlay').style.display = 'none';
  document.getElementById('game-hud').style.display = 'flex';

  updatePlayerAvatar(user.gender);
  initMobileControls();

  if (gameInstance) {
    gameInstance.destroy(true);
  }

  const config = {
    type: Phaser.AUTO,
    parent: 'game-container',
    width: window.innerWidth,
    height: window.innerHeight,
    physics: {
      default: 'arcade',
      arcade: {
        gravity: { y: 0 },
        debug: false
      }
    },
    scene: [window.FarmScene]
  };

  gameInstance = new Phaser.Game(config);

  window.addEventListener('resize', () => {
    if (gameInstance) {
      gameInstance.scale.resize(window.innerWidth, window.innerHeight);
    }
  });
}

function updatePlayerAvatar(gender) {
  const avatarCanvas = document.getElementById('player-avatar-canvas');
  if (!avatarCanvas) return;
  const ctx = avatarCanvas.getContext('2d');
  const img = new Image();
  img.src = gender === 'female' ? '/assets/sprites/farmer_female_grid.png' : '/assets/sprites/farmer_male_grid.png';
  img.onload = () => {
    avatarCanvas.width = 48;
    avatarCanvas.height = 48;
    ctx.imageSmoothingEnabled = false;
    // Draw face/bust from frame 0
    ctx.drawImage(img, 36, 12, 56, 56, 0, 0, 48, 48);
  };
}

window.setActiveHotbarSlot = function(slotNumber) {
  window.currentHotbarSlot = slotNumber;
  document.querySelectorAll('.hotbar-slot').forEach(el => {
    const s = parseInt(el.getAttribute('data-slot'));
    if (s === slotNumber) el.classList.add('active');
    else el.classList.remove('active');
  });

  const cfg = HOTBAR_CONFIG.find(c => c.slot === slotNumber);
  if (cfg) {
    window.showToast(`Đã chọn: ${cfg.icon} ${cfg.label}`, 'success');

    // Update Mobile Action Button Icon
    const mobileIcon = document.getElementById('mobile-action-icon');
    if (mobileIcon) {
      mobileIcon.innerText = cfg.icon;
    }
  }
};

window.updateHUD = function(farmState) {
  const user = farmState.user;
  if (!user) return;

  document.getElementById('hud-player-name').innerText = user.character_name;
  document.getElementById('hud-player-level').innerText = `Lv.${user.level}`;
  document.getElementById('hud-player-gold').innerText = `${user.gold} G`;

  const energyPercent = Math.max(0, Math.min(100, (user.energy / user.max_energy) * 100));
  const fillEl = document.getElementById('hud-energy-fill');
  if (fillEl) fillEl.style.width = `${energyPercent}%`;
  document.getElementById('hud-energy-text').innerText = `${user.energy}/${user.max_energy} ⚡`;

  // Update Inventory counts on hotbar slots
  const inv = farmState.inventory || [];
  const wheatCount = inv.find(i => i.item_id === 'seed_wheat')?.quantity || 0;
  const carrotCount = inv.find(i => i.item_id === 'seed_carrot')?.quantity || 0;
  const strawCount = inv.find(i => i.item_id === 'seed_strawberry')?.quantity || 0;

  const wEl = document.getElementById('count-slot-3');
  const cEl = document.getElementById('count-slot-4');
  const sEl = document.getElementById('count-slot-5');
  if (wEl) wEl.innerText = wheatCount;
  if (cEl) cEl.innerText = carrotCount;
  if (sEl) sEl.innerText = strawCount;
};

window.updateActionPrompt = function(plotObj) {
  const promptEl = document.getElementById('action-prompt');
  if (!promptEl) return;

  const data = plotObj.data;
  const slot = window.currentHotbarSlot || 1;
  let text = '';

  if (!data || !data.crop_id) {
    if (slot === 1) text = '[Space / Click / Thao tác] Cuốc đất';
    else if (slot === 2) text = '[Space / Click / Thao tác] Tưới ẩm ô đất';
    else if (slot >= 3 && slot <= 5) {
      const cfg = HOTBAR_CONFIG.find(c => c.slot === slot);
      text = `[Space / Click / Thao tác] Gieo hạt ${cfg.label}`;
    } else {
      text = '[Space / Click / Thao tác] Chọn công cụ hoặc hạt giống';
    }
  } else if (data.status === 'HARVESTABLE') {
    text = `✨ [Space / Click / Thao tác] Thu hoạch ${data.cropName}!`;
  } else {
    text = `🌱 ${data.cropName} (Đang lớn ${data.progressPercent}%)`;
    if (!data.is_watered) text += ' - Cần tưới nước! 💧';
  }

  promptEl.innerHTML = `<span class="key-tag">Thao Tác</span> ${text}`;
  promptEl.classList.add('visible');

  // Highlight Mobile Action button
  const mobileActionBtn = document.getElementById('btn-mobile-action');
  if (mobileActionBtn) {
    mobileActionBtn.style.boxShadow = '0 0 25px rgba(251, 191, 36, 0.95), 0 10px 25px rgba(16, 185, 129, 0.6)';
    mobileActionBtn.style.transform = 'scale(1.08)';
  }
};

window.hideActionPrompt = function() {
  const promptEl = document.getElementById('action-prompt');
  if (promptEl) promptEl.classList.remove('visible');

  const mobileActionBtn = document.getElementById('btn-mobile-action');
  if (mobileActionBtn) {
    mobileActionBtn.style.boxShadow = '';
    mobileActionBtn.style.transform = '';
  }
};

async function openInventoryModal() {
  const modal = document.getElementById('inventory-modal');
  const grid = document.getElementById('inventory-grid');
  if (!modal || !grid) return;

  grid.innerHTML = '<p style="color:#94a3b8; grid-column:span 4; text-align:center;">Đang tải túi đồ...</p>';
  modal.style.display = 'flex';

  try {
    const state = await window.API.getFarmState();
    grid.innerHTML = '';
    const items = state.inventory || [];

    if (items.length === 0) {
      grid.innerHTML = '<p style="color:#94a3b8; grid-column:span 4; text-align:center; padding: 20px;">Túi đồ hiện đang trống</p>';
      return;
    }

    const itemIcons = {
      seed_wheat: { icon: '🌾', name: 'Hạt Lúa Mì' },
      seed_radish: { icon: '🌱', name: 'Hạt Củ Cải' },
      seed_carrot: { icon: '🥕', name: 'Hạt Cà Rốt' },
      seed_strawberry: { icon: '🍓', name: 'Hạt Dâu Tây' },
      crop_wheat: { icon: '🌾', name: 'Bó Lúa Mì' },
      crop_radish: { icon: '🥗', name: 'Củ Cải Đỏ' },
      crop_carrot: { icon: '🥕', name: 'Cà Rốt Tươi' },
      crop_strawberry: { icon: '🍓', name: 'Dâu Tây Chín' },
      tool_hoe: { icon: '⛏️', name: 'Cuốc Đất' },
      tool_can: { icon: '💧', name: 'Bình Tưới' }
    };

    items.forEach(item => {
      const def = itemIcons[item.item_id] || { icon: '📦', name: item.item_id };
      const slotEl = document.createElement('div');
      slotEl.className = 'inv-slot';
      slotEl.innerHTML = `
        <span class="inv-slot-qty">x${item.quantity}</span>
        <div class="inv-slot-icon">${def.icon}</div>
        <div class="inv-slot-name">${def.name}</div>
      `;
      grid.appendChild(slotEl);
    });
  } catch (err) {
    grid.innerHTML = `<p style="color:#f87171; grid-column:span 4; text-align:center;">Lỗi: ${err.message}</p>`;
  }
}

function closeInventoryModal() {
  const modal = document.getElementById('inventory-modal');
  if (modal) modal.style.display = 'none';
}

window.showToast = function(message, type = 'info') {
  const container = document.getElementById('toast-container');
  if (!container) return;

  const toast = document.createElement('div');
  toast.className = `toast ${type}`;
  toast.innerText = message;
  container.appendChild(toast);

  setTimeout(() => {
    toast.style.opacity = '0';
    toast.style.transform = 'translateX(40px)';
    setTimeout(() => toast.remove(), 300);
  }, 3200);
};

// ==========================================================================
// Farm Arrangement / Edit Mode Controller Functions
// ==========================================================================
window.toggleFarmEditMode = function() {
  if (!window.activeFarmScene) return;
  if (window.activeFarmScene.isEditMode) {
    window.exitFarmEditMode();
  } else {
    window.enterFarmEditMode();
  }
};

window.enterFarmEditMode = function() {
  if (!window.activeFarmScene) return;
  window.activeFarmScene.enableEditMode();

  const banner = document.getElementById('edit-mode-banner');
  if (banner) banner.style.display = 'flex';

  const btn = document.getElementById('btn-toggle-edit');
  if (btn) {
    btn.classList.add('active');
    btn.style.boxShadow = '0 0 15px rgba(251, 191, 36, 0.7)';
    btn.style.borderColor = '#fbbf24';
  }

  window.showToast('🛠️ Đã bật Chế độ Sắp xếp! Kéo thả nhà cửa, chuồng trại, ao cá, vườn rau...', 'info');
};

window.exitFarmEditMode = function() {
  if (!window.activeFarmScene) return;
  window.activeFarmScene.disableEditMode();

  const banner = document.getElementById('edit-mode-banner');
  if (banner) banner.style.display = 'none';

  const btn = document.getElementById('btn-toggle-edit');
  if (btn) {
    btn.classList.remove('active');
    btn.style.boxShadow = '';
    btn.style.borderColor = '';
  }

  window.showToast('🔒 Đã thoát Chế độ Sắp xếp', 'info');
};

window.saveFarmLayoutAction = async function() {
  if (!window.activeFarmScene) return;
  const btn = document.getElementById('btn-save-layout');
  try {
    if (btn) {
      btn.disabled = true;
      btn.innerText = 'Đang lưu...';
    }
    await window.activeFarmScene.saveCurrentLayout();
    window.showToast('💾 Đã lưu bố cục trang trại thành công!', 'success');
    window.exitFarmEditMode();
  } catch (err) {
    window.showToast(`Lỗi lưu bố cục: ${err.message}`, 'error');
  } finally {
    if (btn) {
      btn.disabled = false;
      btn.innerText = '💾 Lưu Bố Cục';
    }
  }
};

window.resetFarmLayoutAction = async function() {
  if (!window.activeFarmScene) return;
  const btn = document.getElementById('btn-reset-layout');
  try {
    if (btn) {
      btn.disabled = true;
      btn.innerText = 'Đang đặt lại...';
    }
    await window.activeFarmScene.resetDefaultLayout();
    window.showToast('↺ Đã khôi phục bố cục trang trại mặc định!', 'success');
    window.exitFarmEditMode();
  } catch (err) {
    window.showToast(`Lỗi đặt lại bố cục: ${err.message}`, 'error');
  } finally {
    if (btn) {
      btn.disabled = false;
      btn.innerText = '↺ Mặc Định';
    }
  }
};

// ==========================================================================
// Mobile Touch Controller & Virtual D-Pad System
// ==========================================================================
window.mobileInputState = {
  up: false,
  down: false,
  left: false,
  right: false,
  sprint: false
};

window.toggleMobileControls = function() {
  const container = document.getElementById('mobile-controls');
  const btnToggle = document.getElementById('btn-toggle-mobile');
  if (!container) return;

  const isVisible = container.classList.toggle('visible');
  if (btnToggle) {
    btnToggle.classList.toggle('active', isVisible);
    if (isVisible) {
      btnToggle.style.borderColor = '#38d39f';
      btnToggle.style.boxShadow = '0 0 14px rgba(56, 211, 159, 0.6)';
    } else {
      btnToggle.style.borderColor = '';
      btnToggle.style.boxShadow = '';
    }
  }
  window.showToast(isVisible ? '🎮 Đã bật Phím Ảo Mobile' : '🔒 Đã ẩn Phím Ảo Mobile', 'info');
};

function initMobileControls() {
  const container = document.getElementById('mobile-controls');
  const dpad = document.getElementById('virtual-dpad');
  const btnAction = document.getElementById('btn-mobile-action');
  const btnSprint = document.getElementById('btn-mobile-sprint');
  const btnToggle = document.getElementById('btn-toggle-mobile');

  if (!container) return;

  // Auto-detect mobile screen (<= 900px) or touch device
  const isTouchDevice = ('ontouchstart' in window) || (navigator.maxTouchPoints > 0) || window.innerWidth <= 900;
  if (isTouchDevice) {
    container.classList.add('visible');
    if (btnToggle) {
      btnToggle.classList.add('active');
      btnToggle.style.borderColor = '#38d39f';
    }
  }

  // Toggle button in HUD
  btnToggle?.addEventListener('click', () => {
    window.toggleMobileControls();
  });

  // Action button: triggers tool use / interaction
  btnAction?.addEventListener('pointerdown', (e) => {
    e.preventDefault();
    btnAction.classList.add('pressed');
    if (window.activeFarmScene) {
      window.activeFarmScene.handleInteractionKey();
    }
  });

  const releaseAction = () => btnAction?.classList.remove('pressed');
  btnAction?.addEventListener('pointerup', releaseAction);
  btnAction?.addEventListener('pointercancel', releaseAction);
  btnAction?.addEventListener('pointerleave', releaseAction);

  // Sprint button: toggle sprint on / off
  btnSprint?.addEventListener('pointerdown', (e) => {
    e.preventDefault();
    window.mobileInputState.sprint = !window.mobileInputState.sprint;
    if (window.mobileInputState.sprint) {
      btnSprint.classList.add('active');
      window.showToast('🏃 Bật Chế độ Chạy Nhanh', 'info');
    } else {
      btnSprint.classList.remove('active');
      window.showToast('🚶 Chế độ Đi Thường', 'info');
    }
  });

  // Virtual D-Pad Touch & Pointer Handling (Supports 8-directional fluid dragging)
  if (dpad) {
    let isTouchingDpad = false;

    const handleDpadPointer = (clientX, clientY, isDown) => {
      if (!isDown) {
        window.mobileInputState.up = false;
        window.mobileInputState.down = false;
        window.mobileInputState.left = false;
        window.mobileInputState.right = false;
        document.querySelectorAll('.dpad-btn').forEach(b => b.classList.remove('pressed'));
        return;
      }

      const rect = dpad.getBoundingClientRect();
      const centerX = rect.left + rect.width / 2;
      const centerY = rect.top + rect.height / 2;
      const dx = clientX - centerX;
      const dy = clientY - centerY;
      const dist = Math.hypot(dx, dy);

      // Deadzone threshold (10px)
      if (dist < 10) {
        window.mobileInputState.up = false;
        window.mobileInputState.down = false;
        window.mobileInputState.left = false;
        window.mobileInputState.right = false;
        document.querySelectorAll('.dpad-btn').forEach(b => b.classList.remove('pressed'));
        return;
      }

      // Calculate directional angle in degrees (-180 to +180)
      const angle = Math.atan2(dy, dx) * (180 / Math.PI);

      let u = false, d = false, l = false, r = false;

      // 8-Directional sectors
      if (angle >= -157.5 && angle <= -22.5) u = true;
      if (angle >= 22.5 && angle <= 157.5) d = true;
      if (Math.abs(angle) >= 112.5) l = true;
      if (Math.abs(angle) <= 67.5) r = true;

      window.mobileInputState.up = u;
      window.mobileInputState.down = d;
      window.mobileInputState.left = l;
      window.mobileInputState.right = r;

      document.getElementById('dpad-up')?.classList.toggle('pressed', u);
      document.getElementById('dpad-down')?.classList.toggle('pressed', d);
      document.getElementById('dpad-left')?.classList.toggle('pressed', l);
      document.getElementById('dpad-right')?.classList.toggle('pressed', r);
    };

    dpad.addEventListener('pointerdown', (e) => {
      e.preventDefault();
      isTouchingDpad = true;
      try { dpad.setPointerCapture(e.pointerId); } catch (_) {}
      handleDpadPointer(e.clientX, e.clientY, true);
    });

    dpad.addEventListener('pointermove', (e) => {
      if (!isTouchingDpad) return;
      e.preventDefault();
      handleDpadPointer(e.clientX, e.clientY, true);
    });

    const stopDpad = (e) => {
      if (!isTouchingDpad) return;
      isTouchingDpad = false;
      try { dpad.releasePointerCapture(e.pointerId); } catch (_) {}
      handleDpadPointer(0, 0, false);
    };

    dpad.addEventListener('pointerup', stopDpad);
    dpad.addEventListener('pointercancel', stopDpad);
    dpad.addEventListener('pointerleave', stopDpad);
  }
}


