// ==========================================================================
// FARM RPG - PHASER 3 FARM SCENE
// Full Farm Map, Interactive Crops, Male/Female Player, Real-time Simulation
// Drag-and-Drop Farm Arrangement & Persistent Layout Customization
// ==========================================================================

class FarmScene extends Phaser.Scene {
  constructor() {
    super({ key: 'FarmScene' });
    this.plots = [];
    this.plotSprites = [];
    this.player = null;
    this.cursors = null;
    this.wasd = null;
    this.activeHotbarSlot = 1;
    this.nearestPlot = null;
    this.isBusyAction = false;
    this.lastStateSync = 0;

    // Custom Farm Layout & Edit Mode
    this.isEditMode = false;
    this.movableEntities = {};
    this.gardenX = 355;
    this.gardenY = 505;
    this.ripples = [];
  }

  preload() {
    // 1. Environment Assets
    this.load.image('ground_tile', '/assets/environment/ground_tile.png');
    this.load.image('bright_grass', '/assets/environment/bright_grass.png');
    this.load.image('farmhouse', '/assets/environment/farmhouse.png');
    this.load.image('barn', '/assets/environment/barn.png');
    this.load.image('silo', '/assets/environment/silo.png');
    this.load.image('fish_pond', '/assets/environment/fish_pond.png');
    this.load.image('water_well', '/assets/environment/water_well.png');
    this.load.image('windmill', '/assets/environment/windmill.png');
    this.load.image('shipping_bin', '/assets/environment/shipping_bin.png');
    this.load.image('chicken_coop', '/assets/environment/chicken_coop.png');
    this.load.image('tree_apple', '/assets/environment/tree_apple.png');
    this.load.image('tree_shade', '/assets/environment/tree_shade.png');
    this.load.image('bush_berry', '/assets/environment/bush_berry.png');
    this.load.image('hay_bale', '/assets/environment/hay_bale.png');
    this.load.image('fence_gate', '/assets/environment/fence_gate.png');
    this.load.image('soil_dry', '/assets/environment/soil_dry.png');
    this.load.image('soil_watered', '/assets/environment/soil_watered.png');
    this.load.image('stone_path', '/assets/environment/stone_path.png');
    this.load.image('signpost', '/assets/environment/signpost.png');

    // 2. Animal Assets (Avatar Farm Pets & Livestock)
    this.load.image('dog_sitting', '/assets/sprites/animals/guard_dog/dog_sitting.png');
    this.load.image('dog_barking', '/assets/sprites/animals/guard_dog/dog_barking.png');
    this.load.image('chicken_standing', '/assets/sprites/animals/chicken/adult_standing.png');
    this.load.image('chicken_chick', '/assets/sprites/animals/chicken/baby_chick.png');
    this.load.image('cow_standing', '/assets/sprites/animals/cow/adult_standing.png');
    this.load.image('duck_swimming', '/assets/sprites/animals/duck/duck_swimming.png');

    // 3. Farmer Spritesheets (768x640, 128x128 per frame)
    this.load.spritesheet('farmer_male', '/assets/sprites/farmer_male_grid.png', {
      frameWidth: 128,
      frameHeight: 128
    });
    this.load.spritesheet('farmer_female', '/assets/sprites/farmer_female_grid.png', {
      frameWidth: 128,
      frameHeight: 128
    });

    // 4. Crop Growth Stages
    const cropTypes = ['wheat', 'radish', 'carrot', 'strawberry', 'tomato'];
    cropTypes.forEach(crop => {
      this.load.image(`crop_${crop}_1`, `/assets/sprites/crops/${crop}/stage_1_sprout.png`);
      this.load.image(`crop_${crop}_2`, `/assets/sprites/crops/${crop}/stage_2_growing.png`);
      this.load.image(`crop_${crop}_3`, `/assets/sprites/crops/${crop}/stage_3_mature.png`);
    });
  }

  create() {
    window.activeFarmScene = this;
    this.createAnimations();
    this.buildMap();
    this.spawnPlayer();
    this.setupControls();
    this.setupCamera();
    this.initFarmPlots();

    // Register entities for custom layout arrangement & apply saved arrangement
    this.registerMovableEntities();
    this.loadAndApplyLayout();

    // Sync state immediately and periodically
    this.refreshFarmState();
    this.time.addEvent({
      delay: 3500,
      callback: () => this.refreshFarmState(),
      loop: true
    });
  }

  createAnimations() {
    ['male', 'female'].forEach(gender => {
      const keyPrefix = `farmer_${gender}`;

      // 1. Idle (Row 0: frames 0-3)
      this.anims.create({
        key: `${keyPrefix}_idle`,
        frames: this.anims.generateFrameNumbers(keyPrefix, { start: 0, end: 3 }),
        frameRate: 4,
        repeat: -1
      });

      // 2. Walk (Row 1: frames 6-11)
      this.anims.create({
        key: `${keyPrefix}_walk`,
        frames: this.anims.generateFrameNumbers(keyPrefix, { start: 6, end: 11 }),
        frameRate: 8,
        repeat: -1
      });

      // 3. Hoe (Row 2: frames 12-15)
      this.anims.create({
        key: `${keyPrefix}_hoe`,
        frames: this.anims.generateFrameNumbers(keyPrefix, { start: 12, end: 15 }),
        frameRate: 8,
        repeat: 0
      });

      // 4. Water (Row 3: frames 18-21)
      this.anims.create({
        key: `${keyPrefix}_water`,
        frames: this.anims.generateFrameNumbers(keyPrefix, { start: 18, end: 21 }),
        frameRate: 7,
        repeat: 0
      });

      // 5. Harvest (Row 4: frames 24-27)
      this.anims.create({
        key: `${keyPrefix}_harvest`,
        frames: this.anims.generateFrameNumbers(keyPrefix, { start: 24, end: 27 }),
        frameRate: 7,
        repeat: 0
      });
    });
  }

  buildMap() {
    const mapW = 1360;
    const mapH = 920;

    // 1. Vibrant Sunny Grass Meadow (Vân cỏ hoa dại nhỏ nhắn kiểu Avatar)
    const ground = this.add.tileSprite(mapW / 2, mapH / 2, mapW, mapH, 'bright_grass');
    ground.setTileScale(0.35, 0.35);
    ground.setDepth(-100);

    // Warm Sunbeam ambient overlay
    const sunGlow = this.add.rectangle(mapW / 2, mapH / 2, mapW, mapH, 0xfff9e0, 0.07);
    sunGlow.setDepth(999);
    sunGlow.setBlendMode(Phaser.BlendModes.ADD);

    // 2. Hàng rào gỗ trang trại Avatar bao quanh khép kín (Wooden Ranch Fence)
    this.createFarmFences(mapW, mapH);

    // 3. Hàng Cây Ăn Quả dọc theo tường rào (Cây táo, cây sồi bóng mát)
    for (let x = 80; x < mapW - 70; x += 105) {
      const isApple = Math.floor(x / 105) % 2 === 0;
      const tree = this.add.image(x, 65, isApple ? 'tree_apple' : 'tree_shade').setScale(0.42);
      tree.setDepth(tree.y);
    }
    for (let y = 140; y < mapH - 100; y += 115) {
      const leftTree = this.add.image(65, y, 'tree_apple').setScale(0.40);
      leftTree.setDepth(leftTree.y);
      const rightTree = this.add.image(mapW - 65, y, 'tree_shade').setScale(0.42);
      rightTree.setDepth(rightTree.y);
    }

    // 4. North-West: Ngôi Nhà Chính Nông Dân, Giếng Nước & Chó Canh Nhà
    this.farmhouse = this.add.image(300, 195, 'farmhouse').setScale(0.54);
    this.farmhouse.setDepth(this.farmhouse.y);

    this.shippingBin = this.add.image(435, 235, 'shipping_bin').setScale(0.26);
    this.shippingBin.setDepth(this.shippingBin.y);

    this.waterWell = this.add.image(175, 235, 'water_well').setScale(0.30);
    this.waterWell.setDepth(this.waterWell.y);

    // Chó Vàng nằm canh trước hiên nhà (nhỏ nhắn, trung thành)
    this.dogSprite = this.add.image(385, 285, 'dog_sitting').setScale(0.18);
    this.dogSprite.setDepth(this.dogSprite.y);

    // 5. North-East: Khu Chăn Nuôi Chuồng Bò, Chuồng Gà & Cối Xay Gió
    this.barn = this.add.image(740, 195, 'barn').setScale(0.48);
    this.barn.setDepth(this.barn.y);

    // Chú bò sữa đáng yêu đứng nhai cỏ (squash & stretch breathing)
    this.cow = this.add.image(765, 250, 'cow_standing').setScale(0.23);
    this.cow.setDepth(this.cow.y);
    this.tweens.add({
      targets: this.cow,
      scaleY: 0.215,
      duration: 1200,
      yoyo: true,
      repeat: -1,
      ease: 'Sine.easeInOut'
    });

    // Chuồng gà
    this.chickenCoop = this.add.image(950, 200, 'chicken_coop').setScale(0.38);
    this.chickenCoop.setDepth(this.chickenCoop.y);

    // Gà mẹ & Gà con mổ thóc trong sân chuồng
    this.chicken1 = this.add.image(930, 255, 'chicken_standing').setScale(0.15);
    this.chicken1.setDepth(this.chicken1.y);
    this.chick = this.add.image(975, 250, 'chicken_chick').setScale(0.13);
    this.chick.setDepth(this.chick.y);
    this.tweens.add({
      targets: [this.chicken1, this.chick],
      angle: { from: -4, to: 4 },
      duration: 650,
      yoyo: true,
      repeat: -1
    });

    // Cối xay gió
    this.windmill = this.add.image(1150, 190, 'windmill').setScale(0.50);
    this.windmill.setDepth(this.windmill.y);

    // Cuộn rơm khô
    this.hay1 = this.add.image(620, 235, 'hay_bale').setScale(0.22);
    this.hay1.setDepth(this.hay1.y);
    this.hay2 = this.add.image(865, 245, 'hay_bale').setScale(0.22);
    this.hay2.setDepth(this.hay2.y);

    // 6. South-East: Ao Cá Nông Trại (Fish Pond kiểu Avatar)
    this.fishPond = this.add.image(970, 560, 'fish_pond').setScale(0.62);
    this.fishPond.setDepth(this.fishPond.y - 30);

    // Chú vịt bơi lội tung tăng trong ao cá
    this.duck = this.add.image(950, 565, 'duck_swimming').setScale(0.16);
    this.duck.setDepth(this.fishPond.y - 20);
    this.tweens.add({
      targets: this.duck,
      angle: { from: -5, to: 5 },
      scaleY: 0.15,
      duration: 1800,
      yoyo: true,
      repeat: -1,
      ease: 'Sine.easeInOut'
    });

    // Vòng sóng nước lăn tăn
    this.ripples = [];
    for (let r = 0; r < 3; r++) {
      const rip = this.add.ellipse(970 + (r * 18 - 18), 570 + (r * 6 - 3), 22, 10);
      rip.setStrokeStyle(1.5, 0xffffff, 0.6);
      rip.setDepth(this.fishPond.y - 25);
      this.ripples.push(rip);
      this.tweens.add({
        targets: rip,
        scaleX: 1.6,
        scaleY: 1.6,
        alpha: 0,
        duration: 2200 + r * 350,
        repeat: -1,
        delay: r * 700
      });
    }

    // 7. Center: Khu Vườn Trồng Trọt Kiểu Avatar
    this.createGardenBed();

    // 8. Bụi cây quả mọng nhỏ trang trí
    this.bush1 = this.add.image(670, 470, 'bush_berry').setScale(0.22);
    this.bush1.setDepth(this.bush1.y);
    this.bush2 = this.add.image(1220, 500, 'bush_berry').setScale(0.22);
    this.bush2.setDepth(this.bush2.y);

    // 9. South Gate & Signpost (Cổng chính ra đường làng)
    const gate = this.add.image(600, mapH - 70, 'fence_gate').setScale(0.55);
    gate.setDepth(gate.y);

    const sign = this.add.image(530, mapH - 80, 'signpost').setScale(0.35);
    sign.setDepth(sign.y);

    // Stone paths kết nối các khu vực
    this.createStonePaths();

    // Hiệu ứng nắng & bướm bay
    this.createSunnyAtmosphere(mapW, mapH);
    this.createButterflies();
  }

  createFarmFences(mapW, mapH) {
    const fenceGraphics = this.add.graphics();
    fenceGraphics.setDepth(3);

    fenceGraphics.lineStyle(2.5, 0x824b22, 0.85);

    // Hàng rào ngang trên
    fenceGraphics.strokeLineShape(new Phaser.Geom.Line(60, 75, mapW - 60, 75));
    fenceGraphics.strokeLineShape(new Phaser.Geom.Line(60, 87, mapW - 60, 87));

    // Hàng rào dọc trái
    fenceGraphics.strokeLineShape(new Phaser.Geom.Line(60, 75, 60, mapH - 70));
    fenceGraphics.strokeLineShape(new Phaser.Geom.Line(72, 75, 72, mapH - 70));

    // Hàng rào dọc phải
    fenceGraphics.strokeLineShape(new Phaser.Geom.Line(mapW - 60, 75, mapW - 60, mapH - 70));
    fenceGraphics.strokeLineShape(new Phaser.Geom.Line(mapW - 72, 75, mapW - 72, mapH - 70));

    // Hàng rào dưới (chừa cổng chính ở giữa 540-660)
    fenceGraphics.strokeLineShape(new Phaser.Geom.Line(60, mapH - 70, 535, mapH - 70));
    fenceGraphics.strokeLineShape(new Phaser.Geom.Line(60, mapH - 82, 535, mapH - 82));

    fenceGraphics.strokeLineShape(new Phaser.Geom.Line(665, mapH - 70, mapW - 60, mapH - 70));
    fenceGraphics.strokeLineShape(new Phaser.Geom.Line(665, mapH - 82, mapW - 60, mapH - 82));

    // Cọc gỗ hàng rào
    fenceGraphics.fillStyle(0x5c3315, 0.95);
    for (let x = 60; x <= mapW - 60; x += 40) {
      fenceGraphics.fillRect(x - 3, 68, 6, 26);
      if (x < 540 || x > 660) {
        fenceGraphics.fillRect(x - 3, mapH - 88, 6, 24);
      }
    }
    for (let y = 75; y <= mapH - 70; y += 40) {
      fenceGraphics.fillRect(54, y - 3, 24, 6);
      fenceGraphics.fillRect(mapW - 78, y - 3, 24, 6);
    }
  }

  createGardenBed() {
    this.gardenBedGraphic = this.add.graphics();
    this.gardenBedGraphic.setDepth(2);

    // Luống đất nhỏ nhắn kiểu Avatar (4 cột x 4 hàng = 16 ô, startX=355, startY=505)
    this.gardenBedGraphic.fillStyle(0x5a3418, 0.55);
    this.gardenBedGraphic.fillRoundedRect(-35, -35, 265, 205, 14);

    this.gardenBedGraphic.lineStyle(3, 0x8a5028, 0.9);
    this.gardenBedGraphic.strokeRoundedRect(-35, -35, 265, 205, 14);
    this.gardenBedGraphic.setPosition(this.gardenX, this.gardenY);

    // Biển tên vườn rau Avatar
    this.gardenSign = this.add.text(this.gardenX + 97, this.gardenY - 47, '🌻 VƯỜN RAU AVATAR 🌻', {
      fontFamily: 'Outfit',
      fontSize: '11px',
      fontWeight: 'bold',
      color: '#fff3c4',
      backgroundColor: 'rgba(84, 46, 18, 0.95)',
      padding: { x: 8, y: 3 }
    }).setOrigin(0.5);
    this.gardenSign.setDepth(25);

    // Handle kéo thả toàn bộ vườn rau khi ở chế độ Edit
    this.gardenHandle = this.add.rectangle(this.gardenX + 97, this.gardenY + 67, 265, 205, 0x38d39f, 0);
    this.gardenHandle.setDepth(30);
    this.gardenHandle.setStrokeStyle(2, 0x38d39f, 0);
  }

  createSunnyAtmosphere(mapW, mapH) {
    for (let i = 0; i < 24; i++) {
      const px = Phaser.Math.Between(80, mapW - 80);
      const py = Phaser.Math.Between(80, mapH - 80);
      const dot = this.add.circle(px, py, Phaser.Math.Between(2, 3), 0xfffaaa, 0.7);
      dot.setDepth(900);

      this.tweens.add({
        targets: dot,
        x: px + Phaser.Math.Between(40, 120),
        y: py + Phaser.Math.Between(-20, 30),
        alpha: { from: 0.8, to: 0.15 },
        duration: Phaser.Math.Between(3500, 6500),
        yoyo: true,
        repeat: -1,
        ease: 'Sine.easeInOut',
        delay: Phaser.Math.Between(0, 2500)
      });
    }
  }

  createButterflies() {
    const colors = [0xfef08a, 0x93c5fd, 0xfca5a5, 0xa7f3d0];

    for (let b = 0; b < 5; b++) {
      const startX = 400 + b * 160;
      const startY = 380 + (b % 3) * 140;
      const color = colors[b % colors.length];

      const butterfly = this.add.container(startX, startY);
      butterfly.setDepth(800);

      const leftWing = this.add.ellipse(-3, 0, 5, 8, color, 0.95);
      const rightWing = this.add.ellipse(3, 0, 5, 8, color, 0.95);
      butterfly.add([leftWing, rightWing]);

      this.tweens.add({
        targets: [leftWing, rightWing],
        scaleX: 0.2,
        duration: 120,
        yoyo: true,
        repeat: -1,
        ease: 'Quad.easeInOut'
      });

      this.tweens.add({
        targets: butterfly,
        x: startX + Phaser.Math.Between(-90, 90),
        y: startY + Phaser.Math.Between(-50, 50),
        duration: Phaser.Math.Between(2800, 4500),
        yoyo: true,
        repeat: -1,
        ease: 'Sine.easeInOut'
      });
    }
  }

  createStonePaths() {
    const pathCoords = [
      [600, 810], [600, 770], [600, 730], [600, 690], [600, 650], [600, 610],
      [560, 570], [515, 470], [470, 470],
      [420, 390], [380, 350], [340, 310], [300, 270],
      [640, 570], [690, 570], [740, 570], [790, 570], [840, 570], [890, 570],
      [640, 330], [690, 300], [740, 270], [800, 270], [880, 270], [950, 270]
    ];

    pathCoords.forEach(([px, py]) => {
      const p = this.add.image(px, py, 'stone_path').setScale(0.14).setAlpha(0.85);
      p.setDepth(5);
    });
  }

  initFarmPlots() {
    // 16 Ô đất nhỏ gọn chuẩn tỉ lệ Avatar (46x33px mỗi ô, liền kề sát nhau)
    const stepX = 50;
    const stepY = 36;
    this.plotSprites = [];

    for (let i = 0; i < 16; i++) {
      const col = i % 4;
      const row = Math.floor(i / 4);
      const px = this.gardenX + col * stepX;
      const py = this.gardenY + row * stepY;

      // Base soil sprite (scale 0.22: ~46x33px)
      const soil = this.add.image(px, py, 'soil_dry').setScale(0.22);
      soil.setDepth(10);
      soil.setInteractive({ useHandCursor: true });

      // Crop sprite overlay (scale 0.23: nhỏ gọn vừa vặn luống đất)
      const crop = this.add.image(px, py - 4, 'crop_wheat_1').setScale(0.23);
      crop.setVisible(false);
      crop.setDepth(15);

      // Plot index label nhỏ gọn góc ô đất
      const label = this.add.text(px - 14, py - 12, `#${i + 1}`, {
        fontFamily: 'Outfit',
        fontSize: '8.5px',
        color: 'rgba(255,255,255,0.7)',
        backgroundColor: 'rgba(0,0,0,0.5)',
        padding: { x: 2, y: 1 }
      });
      label.setDepth(20);

      // Selection outline
      const highlight = this.add.graphics();
      highlight.lineStyle(2, 0x38d39f, 1);
      highlight.strokeRoundedRect(-23, -16, 46, 33, 4);
      highlight.setPosition(px, py);
      highlight.setVisible(false);
      highlight.setDepth(25);

      const plotObj = {
        index: i,
        x: px,
        y: py,
        soilSprite: soil,
        cropSprite: crop,
        label,
        highlight,
        data: null
      };

      soil.on('pointerdown', () => {
        if (this.isEditMode) return;
        this.handlePlotClick(i);
      });
      soil.on('pointerover', () => {
        if (this.isEditMode) return;
        highlight.setVisible(true);
      });
      soil.on('pointerout', () => {
        if (this.nearestPlot !== plotObj) highlight.setVisible(false);
      });

      this.plotSprites.push(plotObj);
    }
  }

  shiftGardenBed(newX, newY) {
    const dx = newX - this.gardenX;
    const dy = newY - this.gardenY;
    if (dx === 0 && dy === 0) return;

    this.gardenX = newX;
    this.gardenY = newY;

    if (this.gardenBedGraphic) {
      this.gardenBedGraphic.setPosition(newX, newY);
    }
    if (this.gardenSign) {
      this.gardenSign.setPosition(newX + 97, newY - 47);
    }
    if (this.gardenHandle) {
      this.gardenHandle.setPosition(newX + 97, newY + 67);
    }

    if (this.plotSprites) {
      this.plotSprites.forEach(plot => {
        plot.x += dx;
        plot.y += dy;
        plot.soilSprite.setPosition(plot.x, plot.y);
        plot.cropSprite.setPosition(plot.x, plot.y - 4);
        plot.label.setPosition(plot.x - 14, plot.y - 12);
        plot.highlight.setPosition(plot.x, plot.y);
      });
    }
  }

  registerMovableEntities() {
    this.movableEntities = {
      farmhouse: { obj: this.farmhouse, name: 'Nhà Chính', defaultX: 300, defaultY: 195 },
      shipping_bin: { obj: this.shippingBin, name: 'Thùng Giao Hàng', defaultX: 435, defaultY: 235 },
      water_well: { obj: this.waterWell, name: 'Giếng Nước', defaultX: 175, defaultY: 235 },
      dog: { obj: this.dogSprite, name: 'Chó Canh Nhà', defaultX: 385, defaultY: 285 },
      barn: {
        obj: this.barn,
        name: 'Chuồng Bò',
        defaultX: 740,
        defaultY: 195,
        onMove: (x, y) => {
          if (this.cow) {
            this.cow.setPosition(x + 25, y + 55);
            this.cow.setDepth(this.cow.y);
          }
        }
      },
      chicken_coop: {
        obj: this.chickenCoop,
        name: 'Chuồng Gà',
        defaultX: 950,
        defaultY: 200,
        onMove: (x, y) => {
          if (this.chicken1) {
            this.chicken1.setPosition(x - 20, y + 55);
            this.chicken1.setDepth(this.chicken1.y);
          }
          if (this.chick) {
            this.chick.setPosition(x + 25, y + 50);
            this.chick.setDepth(this.chick.y);
          }
        }
      },
      windmill: { obj: this.windmill, name: 'Cối Xay Gió', defaultX: 1150, defaultY: 190 },
      fish_pond: {
        obj: this.fishPond,
        name: 'Ao Cá',
        defaultX: 970,
        defaultY: 560,
        onMove: (x, y) => {
          if (this.duck) {
            this.duck.setPosition(x - 20, y + 5);
            this.duck.setDepth(y - 20);
          }
          if (this.ripples) {
            this.ripples.forEach((rip, r) => {
              rip.setPosition(x + (r * 18 - 18), y + (r * 6 + 10));
              rip.setDepth(y - 25);
            });
          }
        }
      },
      garden_bed: {
        obj: this.gardenHandle,
        name: 'Vườn Rau 16 Ô',
        defaultX: 355,
        defaultY: 505,
        isGarden: true,
        onMove: (x, y) => {
          this.shiftGardenBed(x, y);
        }
      },
      hay1: { obj: this.hay1, name: 'Cuộn Rơm 1', defaultX: 620, defaultY: 235 },
      hay2: { obj: this.hay2, name: 'Cuộn Rơm 2', defaultX: 865, defaultY: 245 },
      bush1: { obj: this.bush1, name: 'Bụi Cây 1', defaultX: 670, defaultY: 470 },
      bush2: { obj: this.bush2, name: 'Bụi Cây 2', defaultX: 1220, defaultY: 500 }
    };
  }

  enableEditMode() {
    this.isEditMode = true;
    this.player.setVelocity(0, 0);
    const animPrefix = `farmer_${this.player.gender}`;
    this.player.play(`${animPrefix}_idle`, true);

    if (this.nearestPlot) {
      this.nearestPlot.highlight.setVisible(false);
      this.nearestPlot = null;
    }
    window.hideActionPrompt();

    for (const [key, ent] of Object.entries(this.movableEntities)) {
      const obj = ent.obj;
      if (!obj) continue;
      obj.entityKey = key;
      obj.setInteractive({ draggable: true, useHandCursor: true });

      if (ent.isGarden) {
        this.gardenHandle.setFillStyle(0x38d39f, 0.18);
        this.gardenHandle.setStrokeStyle(2, 0x38d39f, 0.9);
      } else {
        this.tweens.add({
          targets: obj,
          alpha: { from: 1, to: 0.78 },
          duration: 650,
          yoyo: true,
          repeat: -1,
          ease: 'Sine.easeInOut'
        });
      }
    }
  }

  disableEditMode() {
    this.isEditMode = false;

    for (const [key, ent] of Object.entries(this.movableEntities)) {
      const obj = ent.obj;
      if (!obj) continue;
      this.tweens.killTweensOf(obj);
      obj.setAlpha(1);
      obj.clearTint();

      if (ent.isGarden) {
        this.gardenHandle.setFillStyle(0x38d39f, 0);
        this.gardenHandle.setStrokeStyle(2, 0x38d39f, 0);
        this.gardenHandle.disableInteractive();
      } else {
        obj.disableInteractive();
        if (obj === this.fishPond) obj.setDepth(obj.y - 30);
        else obj.setDepth(obj.y);
      }
    }
  }

  async loadAndApplyLayout() {
    try {
      const layout = await window.API.getLayout();
      if (layout) {
        this.applyLayout(layout);
      }
    } catch (err) {
      console.warn('Could not load farm layout:', err);
    }
  }

  applyLayout(layout) {
    if (!layout) return;

    for (const [key, ent] of Object.entries(this.movableEntities)) {
      const pos = layout[key];
      if (!pos) continue;

      if (ent.isGarden) {
        this.shiftGardenBed(pos.x, pos.y);
      } else if (ent.obj) {
        ent.obj.setPosition(pos.x, pos.y);
        if (ent.obj === this.fishPond) ent.obj.setDepth(pos.y - 30);
        else ent.obj.setDepth(pos.y);
        if (ent.onMove) ent.onMove(pos.x, pos.y);
      }
    }
  }

  async saveCurrentLayout() {
    const layout = {};
    for (const [key, ent] of Object.entries(this.movableEntities)) {
      if (ent.isGarden) {
        layout[key] = { x: Math.round(this.gardenX), y: Math.round(this.gardenY) };
      } else if (ent.obj) {
        layout[key] = { x: Math.round(ent.obj.x), y: Math.round(ent.obj.y) };
      }
    }
    const saved = await window.API.saveLayout(layout);
    return saved;
  }

  async resetDefaultLayout() {
    const defaultLayout = {};
    for (const [key, ent] of Object.entries(this.movableEntities)) {
      defaultLayout[key] = { x: ent.defaultX, y: ent.defaultY };
    }
    this.applyLayout(defaultLayout);
    await window.API.saveLayout(defaultLayout);
  }

  spawnPlayer() {
    const user = window.currentUser || { gender: 'male' };
    const gender = user.gender === 'female' ? 'female' : 'male';
    const textureKey = `farmer_${gender}`;

    // Nhân vật tỉ lệ chuẩn 0.95 (cao ~65px, đứng làm chủ trang trại)
    this.player = this.physics.add.sprite(520, 430, textureKey, 0);
    this.player.setScale(0.95);
    this.player.setCollideWorldBounds(true);
    this.player.body.setSize(40, 40);
    this.player.body.setOffset(44, 76);
    this.player.gender = gender;

    // Start idle animation
    this.player.play(`${textureKey}_idle`, true);
  }

  setupControls() {
    this.cursors = this.input.keyboard.createCursorKeys();
    this.wasd = {
      up: this.input.keyboard.addKey(Phaser.Input.Keyboard.KeyCodes.W),
      down: this.input.keyboard.addKey(Phaser.Input.Keyboard.KeyCodes.S),
      left: this.input.keyboard.addKey(Phaser.Input.Keyboard.KeyCodes.A),
      right: this.input.keyboard.addKey(Phaser.Input.Keyboard.KeyCodes.D),
      space: this.input.keyboard.addKey(Phaser.Input.Keyboard.KeyCodes.SPACE),
      interact: this.input.keyboard.addKey(Phaser.Input.Keyboard.KeyCodes.E),
      shift: this.input.keyboard.addKey(Phaser.Input.Keyboard.KeyCodes.SHIFT)
    };

    // Hotbar keys (1 - 6)
    [1, 2, 3, 4, 5, 6].forEach(num => {
      this.input.keyboard.on(`keydown-${num}`, () => {
        if (this.isEditMode) return;
        window.setActiveHotbarSlot(num);
      });
    });

    // Space / E to interact
    this.wasd.space.on('down', () => this.handleInteractionKey());
    this.wasd.interact.on('down', () => this.handleInteractionKey());

    // Drag-and-drop event handlers for Farm Edit Mode
    this.input.on('dragstart', (pointer, gameObject) => {
      if (!this.isEditMode) return;
      gameObject.setTint(0x86efac);
      gameObject.setDepth(9999);
      const ent = this.movableEntities[gameObject.entityKey];
      if (ent) {
        window.showToast(`Đang kéo: ${ent.name}`, 'info');
      }
    });

    this.input.on('drag', (pointer, gameObject, dragX, dragY) => {
      if (!this.isEditMode) return;
      const ent = this.movableEntities[gameObject.entityKey];
      if (!ent) return;

      if (ent.isGarden) {
        // Garden bed center offset is +97, +67 relative to gardenX, gardenY
        const targetX = Phaser.Math.Clamp(Math.round((dragX - 97) / 10) * 10, 80, 1050);
        const targetY = Phaser.Math.Clamp(Math.round((dragY - 67) / 10) * 10, 120, 680);
        this.shiftGardenBed(targetX, targetY);
      } else {
        const snapX = Phaser.Math.Clamp(Math.round(dragX / 10) * 10, 80, 1280);
        const snapY = Phaser.Math.Clamp(Math.round(dragY / 10) * 10, 120, 840);
        gameObject.setPosition(snapX, snapY);
        if (ent.onMove) ent.onMove(snapX, snapY);
      }
    });

    this.input.on('dragend', (pointer, gameObject) => {
      if (!this.isEditMode) return;
      gameObject.clearTint();
      const ent = this.movableEntities[gameObject.entityKey];
      if (!ent) return;

      if (ent.isGarden) {
        gameObject.setDepth(30);
      } else if (gameObject === this.fishPond) {
        gameObject.setDepth(gameObject.y - 30);
      } else {
        gameObject.setDepth(gameObject.y);
      }
    });
  }

  setupCamera() {
    this.cameras.main.setBounds(0, 0, 1360, 920);
    this.cameras.main.startFollow(this.player, true, 0.08, 0.08);
    this.cameras.main.setZoom(1.0);
  }

  update() {
    this.handleMovement();
    this.updateYDepth();
    this.detectNearestPlot();
  }

  handleMovement() {
    if (this.isBusyAction || this.isEditMode) {
      this.player.setVelocity(0, 0);
      return;
    }

    const m = window.mobileInputState || {};
    const isSprint = this.wasd.shift.isDown || m.sprint;
    const baseSpeed = isSprint ? 250 : 170;
    let vx = 0;
    let vy = 0;

    if (this.wasd.left.isDown || this.cursors.left.isDown || m.left) vx -= 1;
    if (this.wasd.right.isDown || this.cursors.right.isDown || m.right) vx += 1;
    if (this.wasd.up.isDown || this.cursors.up.isDown || m.up) vy -= 1;
    if (this.wasd.down.isDown || this.cursors.down.isDown || m.down) vy += 1;

    // Normalize diagonal speed
    if (vx !== 0 && vy !== 0) {
      vx *= 0.7071;
      vy *= 0.7071;
    }

    this.player.setVelocity(vx * baseSpeed, vy * baseSpeed);

    const isMoving = vx !== 0 || vy !== 0;
    const animPrefix = `farmer_${this.player.gender}`;

    if (isMoving) {
      if (vx < 0) this.player.setFlipX(true);
      else if (vx > 0) this.player.setFlipX(false);

      if (this.player.anims.currentAnim?.key !== `${animPrefix}_walk`) {
        this.player.play(`${animPrefix}_walk`, true);
      }
    } else {
      if (this.player.anims.currentAnim?.key !== `${animPrefix}_idle`) {
        this.player.play(`${animPrefix}_idle`, true);
      }
    }
  }

  updateYDepth() {
    this.player.setDepth(this.player.y + 40);
  }

  detectNearestPlot() {
    if (this.isEditMode) return;

    let closest = null;
    let minDist = 38;

    for (const plot of this.plotSprites) {
      const dist = Phaser.Math.Distance.Between(this.player.x, this.player.y, plot.x, plot.y);
      if (dist < minDist) {
        minDist = dist;
        closest = plot;
      }
    }

    if (this.nearestPlot && this.nearestPlot !== closest) {
      this.nearestPlot.highlight.setVisible(false);
    }

    this.nearestPlot = closest;

    if (this.nearestPlot) {
      this.nearestPlot.highlight.setVisible(true);
      window.updateActionPrompt(this.nearestPlot);
    } else {
      window.hideActionPrompt();
    }
  }

  handleInteractionKey() {
    if (this.isEditMode) return;
    if (this.nearestPlot && !this.isBusyAction) {
      this.executeActionOnPlot(this.nearestPlot.index);
    }
  }

  handlePlotClick(index) {
    if (this.isEditMode) return;
    if (!this.isBusyAction) {
      this.executeActionOnPlot(index);
    }
  }

  async executeActionOnPlot(plotIndex) {
    const plot = this.plotSprites[plotIndex];
    const data = plot.data;
    const slot = window.currentHotbarSlot || 1;
    const animPrefix = `farmer_${this.player.gender}`;

    try {
      this.isBusyAction = true;
      this.player.setVelocity(0, 0);

      // Slot 1: Cuốc đất
      if (slot === 1) {
        this.player.play(`${animPrefix}_hoe`);
        await this.waitForAnim();
        window.showToast('⛏️ Đất đã được cuốc xới tơi xốp!', 'success');
      }
      // Slot 2: Tưới nước
      else if (slot === 2) {
        this.player.play(`${animPrefix}_water`);
        await this.waitForAnim();
        await window.API.water(plotIndex);
        window.showToast('💧 Đã tưới nước cho ô đất!', 'success');
        await this.refreshFarmState();
      }
      // Slot 3: Gieo hạt Lúa Mì
      else if (slot === 3) {
        this.player.play(`${animPrefix}_hoe`);
        await this.waitForAnim();
        await window.API.plant(plotIndex, 'seed_wheat');
        window.showToast('🌾 Đã gieo hạt Lúa Mì!', 'success');
        await this.refreshFarmState();
      }
      // Slot 4: Gieo hạt Cà Rốt
      else if (slot === 4) {
        this.player.play(`${animPrefix}_hoe`);
        await this.waitForAnim();
        await window.API.plant(plotIndex, 'seed_carrot');
        window.showToast('🥕 Đã gieo hạt Cà Rốt!', 'success');
        await this.refreshFarmState();
      }
      // Slot 5: Gieo hạt Dâu Tây
      else if (slot === 5) {
        this.player.play(`${animPrefix}_hoe`);
        await this.waitForAnim();
        await window.API.plant(plotIndex, 'seed_strawberry');
        window.showToast('🍓 Đã gieo hạt Dâu Tây!', 'success');
        await this.refreshFarmState();
      }
      // Slot 6: Thu hoạch
      else if (slot === 6) {
        if (!data || data.status !== 'HARVESTABLE') {
          throw new Error('Cây chưa chín hoặc ô đất không có nông sản để thu hoạch!');
        }
        this.player.play(`${animPrefix}_harvest`);
        await this.waitForAnim();
        const res = await window.API.harvest(plotIndex);
        window.showToast(`✨ Thu hoạch thành công: +${res.harvested.yield} ${res.harvested.cropName} (+${res.harvested.expGained} EXP)!`, 'success');
        await this.refreshFarmState();
      }
    } catch (err) {
      window.showToast(err.message, 'error');
    } finally {
      this.isBusyAction = false;
      this.player.play(`${animPrefix}_idle`, true);
    }
  }

  waitForAnim() {
    return new Promise(resolve => {
      this.player.once(Phaser.Animations.Events.ANIMATION_COMPLETE, resolve);
    });
  }

  async refreshFarmState() {
    if (!window.API.token) return;

    try {
      const state = await window.API.getFarmState();
      window.updateHUD(state);

      state.plots.forEach(p => {
        const plotObj = this.plotSprites[p.plot_index];
        if (!plotObj) return;

        plotObj.data = p;

        // 1. Update Soil texture
        plotObj.soilSprite.setTexture(p.is_watered ? 'soil_watered' : 'soil_dry');

        // 2. Update Crop visual
        if (p.crop_id && p.status !== 'EMPTY') {
          plotObj.cropSprite.setVisible(true);

          const cropType = p.crop_id.replace('crop_', '');
          const stage = p.stage || 1;
          const textureKey = `crop_${cropType}_${stage}`;

          if (this.textures.exists(textureKey)) {
            plotObj.cropSprite.setTexture(textureKey);
          } else {
            plotObj.cropSprite.setTexture(`crop_wheat_${stage}`);
          }

          if (p.status === 'HARVESTABLE') {
            plotObj.label.setText(`✨Chín`);
            plotObj.label.setColor('#fbbf24');
          } else {
            plotObj.label.setText(`${p.progressPercent}%`);
            plotObj.label.setColor('#e2e8f0');
          }
        } else {
          plotObj.cropSprite.setVisible(false);
          plotObj.label.setText(`#${p.plot_index + 1}`);
          plotObj.label.setColor('rgba(255,255,255,0.6)');
        }
      });
    } catch (e) {
      console.warn('Sync farm state error:', e.message);
    }
  }
}

window.FarmScene = FarmScene;
