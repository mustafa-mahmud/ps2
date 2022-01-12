class Scene2 extends Phaser.Scene {
  constructor() {
    super('playGame');
  }

  create() {
    this.score = 0;

    //#info:: add background to tile sprite
    this.background = this.add.tileSprite(
      0,
      0,
      config.width,
      config.height,
      'background'
    );

    //#info:: set background origin
    this.background.setOrigin(0, 0);

    //#info:: add ship to sprite
    this.ship1 = this.add.sprite(
      config.width / 2 - 100,
      config.height / 2,
      'ship'
    );

    this.ship2 = this.add.sprite(config.width / 2, config.height / 2, 'ship2');

    this.ship3 = this.add.sprite(
      config.width / 2 + 100,
      config.height / 2,
      'ship3'
    );

    //#info:: animation play
    this.ship1.play('ship1_anim');
    this.ship2.play('ship2_anim');
    this.ship3.play('ship3_anim');

    //#info:: enable event on ship
    this.ship1.setInteractive();
    this.ship2.setInteractive();
    this.ship3.setInteractive();

    //#info:: add event on ship
    this.input.on('gameobjectdown', this.destroyShip, this);

    this.powerUps = this.physics.add.group();

    var maxObjects = 4;
    for (var i = 0; i <= maxObjects; i++) {
      var powerUp = this.physics.add.sprite(16, 16, 'power-up');
      this.powerUps.add(powerUp);
      powerUp.setRandomPosition(0, 0, game.config.width, game.config.height);

      if (Math.random() > 0.5) powerUp.play('red');
      else powerUp.play('gray');

      //#info:: give velocity
      powerUp.setVelocity(100, 100);

      //#info:: power-up will be in canvas
      powerUp.setCollideWorldBounds(true);

      //#info:: power-up will be bounce
      powerUp.setBounce(1);
    }

    this.player = this.physics.add.sprite(
      config.width / 2 - 8,
      config.height - 65,
      'player'
    );
    // this.player.setScale(2);
    this.player.play('thrust');

    //#info:: add keyboard event
    this.cursorKeys = this.input.keyboard.createCursorKeys();
    this.player.setCollideWorldBounds(true);
    this.spacebar = this.input.keyboard.addKey(
      Phaser.Input.Keyboard.KeyCodes.SPACE
    );
    this.projectiles = this.add.group();

    this.physics.add.collider(
      this.projectiles,
      this.powerUps,
      function (projectiles, powerUp) {
        projectiles.destroy();
      }
    );

    this.physics.add.overlap(
      this.player,
      this.powerUps,
      this.pickPowerUp,
      null,
      this
    );

    this.enemies = this.physics.add.group();
    this.enemies.add(this.ship1);
    this.enemies.add(this.ship2);
    this.enemies.add(this.ship3);

    this.physics.add.overlap(
      this.player,
      this.enemies,
      this.hurtPlayer,
      null,
      this
    );

    this.physics.add.overlap(
      this.projectiles,
      this.enemies,
      this.hitEnemy,
      null,
      this
    );

    this.scoreLabel = this.add.bitmapText(10, 5, 'pixelFont', 'SCORE ', 16);

    this.beamSound = this.sound.add('audio_beam');
    this.explosionSound = this.sound.add('audio_explosion');
    this.pickupSound = this.sound.add('audio_pickup');

		this.music = this.sound.add('music');

		var musicConfig = {
			mute: false,
			volume:1,
			rate: 1,
			detune:0,
			seek: 0,
			loop: false,
			delay:0
		}

		this.music.play(musicConfig);
  }

  zeroPad(number, size) {
    var stringNumber = String(number);

    while (stringNumber.length < (size || 2)) {
      stringNumber = '0' + stringNumber;
    }

    return stringNumber;
  }

  hitEnemy(projectile, enemy) {
    var explosion = new Explosion(this, enemy.x, enemy.y);
    projectile.destroy();
    this.resetShipPos(enemy);

    this.score += 10;

    var scoreFormated = this.zeroPad(this.score, 6);
    this.scoreLabel.text = 'SCORE ' + scoreFormated;

    this.explosionSound.play();
  }

  hurtPlayer(player, enemy) {
    this.resetShipPos(enemy);

    if (this.player.alpha < 1) return;

    var explosion = new Explosion(this, player.x, player.y);
    player.disableBody(true, true);

    this.time.addEvent({
      delay: 1000,
      callback: this.resetPlayer,
      callbackScope: this,
      loop: false,
    });
  }

  resetPlayer() {
    var x = config.width / 2 - 8;
    var y = config.height + 64;

    this.player.enableBody(true, x, y, true, true);
    this.player.alpha = 0.5;

    var tween = this.tweens.add({
      targets: this.player,
      y: config.height - 64,
      ease: 'Power1',
      duration: 1500,
      repeat: 0,
      onComplete: function () {
        this.player.alpha = 1;
      },
      callbackScope: this,
    });
  }

  pickPowerUp(player, powerUp) {
		powerUp.disableBody(true, true);
		
		this.pickupSound.play();
  }

  destroyShip(pointer, gameObject) {
    gameObject.setTexture('ship3');
    gameObject.play('explode');
  }

  moveShip(ship, speed) {
    //#info:: ship go to down
    ship.y += speed;

    //#info:: if ship reach bottom of canvas
    if (ship.y > config.height) this.resetShipPos(ship);
  }

  resetShipPos(ship) {
    //#info:: start from top
    ship.y = 0;

    //#info:: random x value
    var randomX = Phaser.Math.Between(0, config.width);
    ship.x = randomX;
  }

  update() {
    //#info:: background move to down
    this.background.tilePositionY -= 0.5;

    this.moveShip(this.ship1, 1);
    this.moveShip(this.ship2, 2);
    this.moveShip(this.ship3, 3);

    this.movePlayerManager();

    if (Phaser.Input.Keyboard.JustDown(this.spacebar)) {
      if (this.player.active) this.shootBeam();
    }

    for (var i = 0; i < this.projectiles.getChildren().length; i++) {
      var beam = this.projectiles.getChildren()[i];
      beam.update();
    }
  }

  shootBeam() {
    var beam = new Beam(this);
    this.beamSound.play();
  }

  movePlayerManager() {
    if (this.cursorKeys.left.isDown) {
      this.player.setVelocityX(-gameSettings.playerSpeed);
    } else if (this.cursorKeys.right.isDown) {
      this.player.setVelocityX(gameSettings.playerSpeed);
    }

    if (this.cursorKeys.up.isDown) {
      this.player.setVelocityY(-gameSettings.playerSpeed);
    } else if (this.cursorKeys.down.isDown) {
      this.player.setVelocityY(gameSettings.playerSpeed);
    }
  }
}
