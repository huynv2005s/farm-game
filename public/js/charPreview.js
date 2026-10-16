// ==========================================================================
// CHARACTER PREVIEW ANIMATOR (Canvas 2D Sprite Animator for Auth Screen)
// ==========================================================================

class CharacterPreview {
  constructor(canvasId, spriteSrc) {
    this.canvas = document.getElementById(canvasId);
    if (!this.canvas) return;
    this.ctx = this.canvas.getContext('2d');
    this.img = new Image();
    this.img.src = spriteSrc;
    this.frameIndex = 0;
    this.totalFrames = 4; // Row 0 has 4 idle frames
    this.frameWidth = 128;
    this.frameHeight = 128;
    this.fps = 4;
    this.lastFrameTime = 0;
    this.isRunning = false;

    this.img.onload = () => {
      this.canvas.width = this.frameWidth;
      this.canvas.height = this.frameHeight;
      this.isRunning = true;
      requestAnimationFrame((t) => this.render(t));
    };
  }

  render(timestamp) {
    if (!this.isRunning) return;

    if (timestamp - this.lastFrameTime > 1000 / this.fps) {
      this.lastFrameTime = timestamp;
      this.frameIndex = (this.frameIndex + 1) % this.totalFrames;

      this.ctx.clearRect(0, 0, this.canvas.width, this.canvas.height);
      this.ctx.imageSmoothingEnabled = false;

      // Draw the sprite frame from Row 0 (Idle)
      const sx = this.frameIndex * this.frameWidth;
      const sy = 0; // Row 0
      this.ctx.drawImage(
        this.img,
        sx, sy, this.frameWidth, this.frameHeight,
        0, 0, this.canvas.width, this.canvas.height
      );
    }

    requestAnimationFrame((t) => this.render(t));
  }
}

// Global initialization helper
window.initCharacterPreviews = function() {
  new CharacterPreview('preview-canvas-male', '/assets/sprites/farmer_male_grid.png');
  new CharacterPreview('preview-canvas-female', '/assets/sprites/farmer_female_grid.png');
};
