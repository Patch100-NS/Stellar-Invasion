'use strict';

class Player {
  //Konstruktor Plaer klase imace pristup main game instanci, kako bi imao pristup dimenzijama igrice(canvasa)
  constructor(game) {
    this.game = game; //ovim game konvertujemo u jedan od propertija Player-a. Ne kreiramo novu game instancu vec samo iz Player klase pokazujemo na main game object- Time Player ima pristup svim potrebnim podacima Game klase

    //Postavljamo dimenzije i koordinate playera
    this.width = 100;
    this.height = 100;
    this.x = this.game.width * 0.5 - this.width * 0.5; //centriramo
    this.y = this.game.height - this.height; //postavljamo na dno

    this.speed = 10; //px/animation frame

    this.lives = 3;

    this.playerImage = document.getElementById('rocket');
  }

  //Draw player metod

  draw(context) {
    // context.fillRect(this.x, this.y, this.width, this.height);
    if (!this.game.gameOver) {
      context.drawImage(
        this.playerImage,
        165,
        0,
        150,
        200,
        this.x,
        this.y,
        this.width + 20,
        this.height
      );
    }
  }
  update() {
    //Ubacujemo horizontalno kretanje na osnovu pritisnutih tastera koji se nalaze u game.keys
    if (!this.game.gameOver && this.game.keys.indexOf('ArrowRight') > -1)
      this.x += this.speed;
    if (!this.game.gameOver && this.game.keys.indexOf('ArrowLeft') > -1)
      this.x -= this.speed;

    //Horizontalne granice
    if (this.x < -this.width * 0.5) {
      this.x = -this.width * 0.5;
    } else if (this.x > this.game.width - this.width * 0.5) {
      this.x = this.game.width - this.width * 0.5;
    }
  }

  shoot() {
    const projectile = this.game.getProjectile(); //metod game objekta
    //kako bismo izbegli error kod izvrsavamo samo ako uspemo naci projektil (ako imamo slobodan projektil)
    if (projectile) projectile.start(this.x + this.width * 0.5, this.y); //start metodi zadajemo koordinate koje su iste koordinatama playera
  }

  restart() {
    this.x = this.game.width * 0.5 - this.width * 0.5;
    this.y = this.game.height - this.height;
    this.lives = 3;
  }
}

class Projectile {
  //Koristimo Object pool creational design pattern (sema kreiranja objekata koja nudu bolju upotrebljivost i sistematizaciju koda ). Odredjeni broj objekata stalno re-usamo iz pool-a i na taj nacin stedimo memoriju - povoljno je za automatic memory allocation i garbage collection processes koji se dasavaju ukoliko stvaramo i brisemo mnogo js objekata
  constructor() {
    this.height = 50;
    this.width = 4;
    this.x = 0;
    this.y = 0;
    this.speed = 20;
    this.free = true; // true znaci da je instanca u pool-u i da moze biti koristena, trenutno je ne koristimo i nije vidljiva. Free = outside the pool
  }
  //Projektile crtamo i updatujemo samo su van pula = !free
  draw(context) {
    if (!this.free) {
      context.save();
      context.fillStyle = 'yellowgreen';
      context.fillRect(this.x, this.y, this.width, this.height);
      context.restore();
    }
  }

  update() {
    if (!this.free) {
      this.y -= this.speed;
      if (this.y < -this.height) this.reset(); //vracamo objekat u pool ako ceo izadje iz canvasa
    }
  }

  start(x, y) {
    //x i y odnose se na koordinate igraca i te koordinate cemo zadati i projektilu
    this.x = x - this.width * 0.5; // po x osi pomeramo u levo za sirinu projektila kako bi uvek bio u centru
    this.y = y;
    this.free = false; //projektil se trenutno koristi i nije u pool-u
  }

  reset() {
    this.free = true; //projektil se vise ne koristi i vraca se u pool
  }
}

class Enemy {
  constructor(game, positionX, positionY) {
    this.game = game; //kao i Player klasa ima pristup game objektu
    this.width = this.game.enemySize;
    this.height = this.game.enemySize;
    this.x = 0; //apsolutne koordinate - 0 su pocetne vrednosti
    this.y = 0;
    this.positionX = positionX; //relativne pozicije u odnosu na gornji levi ugao Wave-a
    this.positionY = positionY;
    this.markedForDelition = false; //ukoliko je Enemy pogodjen projektilom postace true

    this.destroyed = false;

    // this.enemyExplosion = document.getElementById('explosion');
    this.enemyExplosion = document.getElementById('explosion1');

    this.explosionMaxFrames = 6;
    this.explosionFrameX = 0;
  }

  draw(context) {
    // context.strokeRect(this.x, this.y, this.width, this.height); //crtamo neprijatelja kao pravougaonik
    // !this.destroyed
    //   ? context.drawImage(this.image, this.x, this.y, this.width, this.height)
    //   : context.drawImage(
    //       this.enemyExplosion,
    //       this.x - 30,
    //       this.y - 30,
    //       this.width + 60,
    //       this.height + 60
    //     );

    if (!this.destroyed) {
      context.drawImage(this.image, this.x, this.y, this.width, this.height);
      context.save();

      if (this.maxLives === 1) context.fillStyle = this.healthColor;
      //za enemy koji ima samo jedan zivot da bude zelen
      else if (this.lives < 2) {
        context.fillStyle = 'red';
      } else {
        context.fillStyle = this.healthColor;
      }

      context.fillRect(
        this.x + 5,
        this.y + this.height,
        Math.floor(this.lives * (this.width / this.maxLives)) - 10,
        3
      );
      context.restore();
    } else {
      context.drawImage(
        this.enemyExplosion,
        this.x - 30,
        this.y - 30,
        this.width + 60,
        this.height + 60
      );
    }
  }

  // drawExplosion(context) {
  //   if (this.game.spriteUpdate) {
  //     this.explosionFrameX++;
  //     context.drawImage(
  //       this.enemyExplosion,
  //       this.explosionFrameX * 100,
  //       0,
  //       100,
  //       100,
  //       this.x,
  //       this.y,
  //       this.width,
  //       this.height
  //     );
  //   }
  // }

  //Metod za uptade pozicije pojedinacnog neprijatelja - metod prima x i y koordinate citavog wavea i na osnovu toga odredjuje relativnu poziciju svakog pojedinacnog neprijatelja
  update(x, y) {
    this.x = x + this.positionX;
    this.y = y + this.positionY;

    //U ovom momentu radimo collision check izmedju projektila i enemija - upiredjujemo pozicije enemija i svakog ispaljenog projektila
    this.game.projectilesPool.forEach(projectile => {
      //this u checkCollisionu upucuje na Enemy klasu
      if (
        !projectile.free &&
        this.game.checkColision(this, projectile) &&
        this.y > 0
      ) {
        this.lives--;

        if (this.lives < 1) {
          this.destroyed = true;
          setTimeout(() => {
            this.markedForDelition = true;
          }, 120);
        }

        projectile.reset();
        //Scoring
        if (!this.game.gameOver && this.destroyed)
          this.game.score += this.maxLives;
      }
    });

    //Player-enemy check colision
    if (
      this.game.checkColision(this, this.game.player) &&
      !this.game.gameOver
    ) {
      this.markedForDelition = true;

      if (!this.game.gameOver && this.game.score > 1) {
        this.game.score--;
      }
      this.game.player.lives--;
      if (this.game.player.lives < 1) {
        this.game.gameOver = true;
      }
    }
    //Lose condition
    if (this.y + this.height > this.game.height) {
      this.game.gameOver = true;
      this.markedForDelition = true; //? unistavamo neprijatelja koji dotoakne dno stranice
    }

    if (this.game.gameOver) {
      this.game.score > this.game.highScore
        ? (this.game.highScore = this.game.score)
        : this.game.highScore;
    }
  }
}

//Pravimo child/sub classe klase za Enemy

class Alpha extends Enemy {
  //Constructor sub klase sadrzace iste parametre kao i parent klasa, a pozivanje superclass metoda koji je zapravo pozivanje constructora super classe
  constructor(game, positionX, positionY) {
    super(game, positionX, positionY);
    this.image = document.getElementById('alpha');
    this.healthColor = 'green';
    this.lives = 1;
    this.maxLives = 1;
  }
}

class Beta extends Enemy {
  //Constructor sub klase sadrzace iste parametre kao i parent klasa, a pozivanje superclass metoda koji je zapravo pozivanje constructora super classe
  constructor(game, positionX, positionY) {
    super(game, positionX, positionY);
    this.image = document.getElementById('beta');
    this.healthColor = 'yellow';
    this.lives = 2;
    this.maxLives = 2;
  }
}
class Gamma extends Enemy {
  //Constructor sub klase sadrzace iste parametre kao i parent klasa, a pozivanje superclass metoda koji je zapravo pozivanje constructora super classe
  constructor(game, positionX, positionY) {
    super(game, positionX, positionY);
    this.image = document.getElementById('gamma');
    this.healthColor = 'blue';
    this.lives = 3;
    this.maxLives = 3;
  }
}
class Delta extends Enemy {
  //Constructor sub klase sadrzace iste parametre kao i parent klasa, a pozivanje superclass metoda koji je zapravo pozivanje constructora super classe
  constructor(game, positionX, positionY) {
    super(game, positionX, positionY);
    this.image = document.getElementById('delta');
    this.healthColor = 'purple';
    this.lives = 4;
    this.maxLives = 4;
  }
}

//Poenta je da imamo spolju Wave klasu koja ce sadrzati sve neprijatelje - objekat u odnosu na cije koordinate ce Enemy objkti biti organizovani u grid

class Wave {
  constructor(game) {
    this.game = game; //takodje mu treba pristup main game objektu
    this.width = this.game.columns * this.game.enemySize;
    this.height = this.game.rows * this.game.enemySize;
    this.x = this.game.width * 0.5 - this.width * 0.5; //koordinate predstavljaju girnji levi ugao citavog wavea
    this.y = -this.height;
    this.speedX = Math.random() < 0.5 ? 0.1 : -0.1; //3???
    this.speedY = 0;
    this.enemies = [];
    this.create(); //Pozivamo ovaj metod odmah u kontruktoru, tako da je odmah popunjavamo enemies arr
    this.newWaveTrigger = false; // pokazuje nam da li je novi wave trigerovan ili ne
  }

  render(context) {
    //Efekat da uleti u ekran
    if (this.y < 0) this.y += 0.1; //5??

    //crta Wave kao pravougaonik
    this.speedY = 0;
    // context.strokeRect(this.x, this.y, this.width, this.height); //opciono
    if (this.x < 0 || this.x > this.game.width - this.width) {
      this.speedX *= -1; //dobijamo bouncing efekat kada wave dodirne ivice igre
      this.speedY += this.game.enemySize; //Kada dodirne ivicu spusta se dole za visinu jednog reda u gridu
    }
    //updatujemo poziciju po frameu
    this.x += this.speedX;
    this.y += this.speedY;

    //renderujemo neprijatelje unutar grida
    this.enemies.forEach(enemy => {
      enemy.update(this.x, this.y);
      enemy.draw(context);
    });
    //Nakon checkColision renderujemo samo one enemije u gridu koji nisu markedForDelition. Prakticno enemies array dajemo vrednos novog filtriranog arraya gde su samo enemisi koji nisu pogodjeni
    this.enemies = this.enemies.filter(enemy => !enemy.markedForDelition);
  }

  //Metod koji kreira grid Enemisa
  create() {
    for (let y = 0; y < this.game.rows; y++) {
      for (let x = 0; x < this.game.columns; x++) {
        let enemyX = x * this.game.enemySize;
        let enemyY = y * this.game.enemySize;
        let enemyNum = Math.floor(Math.random() * 4) + 1;
        if (enemyNum === 1)
          this.enemies.push(new Alpha(this.game, enemyX, enemyY));
        if (enemyNum === 2)
          this.enemies.push(new Beta(this.game, enemyX, enemyY));
        if (enemyNum === 3)
          this.enemies.push(new Gamma(this.game, enemyX, enemyY));
        if (enemyNum === 4)
          this.enemies.push(new Delta(this.game, enemyX, enemyY));
      }
    }
  }
}

class Game {
  //Konstruktor Game klase imace pristup canvas varijabli i sirina i visina canvasa bice pretvoreni u Game properties
  constructor(canvas) {
    this.canvas = canvas;
    this.width = this.canvas.width;
    this.height = this.canvas.height;
    this.keys = []; //sadrzi stisnute tastere
    this.heartImage = document.getElementById('heart');

    //U kontruktoru odmah pravimo novu instancu Player klase i postavljamo je kao property za Game. Konstruktor Playera trazi game i zato upisujemo this i usmeravamo sve na Game klasu
    this.player = new Player(this);

    ////PROJECTILES////
    //Kreiramo projectile pool
    this.projectilesPool = [];
    this.numOfProjectiles = 10;
    //Odmah u Game constructoru pozivamo createProjectilePool metod i punimo procejtilesPool arr
    this.createProjectiles();

    //Fired flag - kako bismo imali samo jednu mogucnost pucanja po frejmu1
    this.fired = false;

    ////ENEMIES////
    this.columns = 2; //kolone neprijatelja po waveu
    this.rows = 2; //redovi
    this.enemySize = 80; //px - velicina jednog neprijatelja u gridu

    this.waves = [];
    this.waves.push(new Wave(this)); //Kao i slucaju Player i Projectila, zadajemo this keyword konstruktoru koji ima pristup game objektu
    this.waveCount = 1;

    ////GAME SCORE AND TEXT////
    this.score = 0;
    this.highScore = 0;
    this.gameOver = false;

    ////SPRITE UPDATE using delta time////
    this.spriteUpdate = false;
    this.spriteTimer = 0;
    this.spriteInterval = 800;

    //Dodavanje tastera u Game.keys kada je taster stisnut //U konstruktoru cemo odmah postaviti i event listenere - zapamti da se prilikom kreiranja nove instance izvrsava sav kod u kontruktoru
    window.addEventListener('keydown', e => {
      // console.log(e.key);
      if (this.keys.indexOf(e.key) === -1) this.keys.push(e.key); //indexOf je arr metod koji vraca prvi index odredjenog elementa, ukoliko elementa nema vraca -1

      /*this keyword u this.keys.push ukazuje na window objekat a ne na Game.keys properti. Imamo dva resenja, ili da bindujemo this keyword ili da korsitimo arrow callback fju event listenera koja nema svoj this keyword nego nasledjuje this keyword od parent scope-a tj od Game klase, sto nam i treba */

      //Triggerujemo shot
      if (e.key === ' ' && !this.fired && !this.gameOver) this.player.shoot();
      this.fired = true; //ovo nam omogucuje samo jedno pucanje po stisnutom dugmetu (' ' se odnosi na space)
      //Trigerujemo restart
      if (e.key === 'r' && this.gameOver) this.restart();
    });
    //Brisanje tastera iz Game.keys kada je taster pusten
    window.addEventListener('keyup', e => {
      this.fired = false; //ovo nam omogucuje novo pucanje po stisnutom dugmetu
      const index = this.keys.indexOf(e.key);
      if (index > -1) this.keys.splice(index, 1); //Ako odredjeni taster postoji u arr(ako mu je index veci od -1) onda obrisi 1 element pocevsi upravo od index-a tog tastera
    });
  }

  //Renderujemo igricu prakticno
  render(context, deltaTime) {
    // console.log(deltaTime);//Test
    //SPRITE TIMING LOGIC:
    if (this.spriteTimer > this.spriteInterval) {
      this.spriteUpdate = true; //bice true u jednom frejmu i tada ce omoguciti promenu u sprite sheetu
      this.spriteTimer = 0; //odmah ce trigerovati else block u sledecem frejmu
    } else {
      this.spriteUpdate = false;
      this.spriteTimer += deltaTime;
    }

    // if (this.spriteUpdate) console.log('next frame');

    //Ovo je prakticno unutar loopa i stalno ide kroz pool u kom su projektili i proverava da li je neki trigerovan i ako jeste oni prolaze check i bivaju updatovani i renderovani

    //PROJECTILE
    this.projectilesPool.forEach(projectile => {
      projectile.update();
      projectile.draw(context);

      //ENEMY/WAVE
      this.waves.forEach(wave => {
        wave.render(context);
        //Dodajemo novi level ako broj enemija i enemies arr trenutnog wavea bude manji od 1
        if (wave.enemies.length < 1 && !wave.newWaveTrigger && !this.gameOver) {
          wave.newWaveTrigger = true; //prakticno zabranjujemo kreiranje novih wejvova - ovo je samo kocnica koja zabranjuje da se u navedenom frejmu naglo mnoze novi wave-si. Odmah kako je kreiran novi Wave imace newWaveTrigger kao false
          this.newWave();
          this.waveCount++;
          // this.player.lives++;
        }
        //GAME TEXT - posto prvo izvrsavamo ovaj metod text ce biti ispisan ispod neprijatelja
        this.drawStatusText(context);
      });
    });
    //PLAYER
    this.player.draw(context);
    this.player.update();
  }

  //Metod za kreiranje Projectile pool-a, tacnije punjenje projectiles pool arraya - na ovaj nacin stedimo memoriju - time sto ih koristimo nanovo uesto da ih pravimo nanovo smanjujemo uticaj garbage collection processa
  createProjectiles() {
    for (let i = 0; i < this.numOfProjectiles; i++) {
      this.projectilesPool.push(new Projectile());
    }
  }
  // Metod koji izvlaci slobodni projektil iz pool-a
  getProjectile() {
    for (let i = 0; i < this.projectilesPool.length; i++) {
      if (this.projectilesPool[i].free) return this.projectilesPool[i]; //Return keyword sprecava dalju egzekuciju for loopa cim nadjemo projektil koji ima free properti
    }
  }

  //Collision detector - za bilo koja dva pravougaonika koji su u 2d prostoru, gde su a i b rectangle-ovi

  checkColision(a, b) {
    return (
      a.x < b.x + b.width &&
      a.x + a.width > b.x &&
      a.y < b.y + b.height &&
      a.y + a.height > b.y
    );
  } //na ovaj nacin metod uvek vraca true ili false

  //Metod za status text
  drawStatusText(context) {
    context.save(); //Sprema i cuva snovne canvas propertije kao sto su font i sl -  na ovaj nacin na pocetku svakog animation frejma ucutavamo osnovne propertije koji su u game contructoru
    //Posto smo izmdju context save i context restore mozemo se igrati sa senkom
    context.shaddowOffsetX = 2;
    context.shaddowOffsetY = 2;
    context.shaddowColor = 'black';
    // context.shaddowBlur//optional

    //RENDERING LIVES
    for (let i = 0; i < this.player.lives; i++) {
      context.drawImage(this.heartImage, 180 + 30 * i, 90, 40, 40);
    }
    context.fillText('Score: ' + this.score, 20, 40);
    context.fillText('Wave: ' + this.waveCount, 20, 80);
    context.fillText('Lives: ', 20, 120);
    if (this.gameOver) {
      context.textAlign = 'center';
      context.font = '60px "Press Start 2P';
      context.fillText('GAME OVER', this.width * 0.5, this.height * 0.5);
      context.font = '15px "Press Start 2P';
      context.fillText(
        'Press R to restart',
        this.width * 0.5,
        this.height * 0.5 + 30
      );
      context.fillText(
        'High score: ' + this.highScore,
        this.width * 0.5,
        this.height * 0.5 + 60
      );
    }
    context.restore(); //Vraca canvas propertije na saved stanje prakticno u kombinaciji sa context.save() pravimo loop
  }

  //Hendlujemo new waves - primer level logica - povecavamo broj kolona i redova i ubacujemo novi wave u waves arr
  newWave() {
    //zelimo da u 50% slucajeva dodaje nove kolone a u ostalih 50% slucajeva nove redove
    //U dodatnim uslovima pazamo da neprijatelji ne zauzmu veliki deo igrice

    if (Math.random() < 0.5 && this.rows * this.enemySize < this.height * 0.6) {
      this.rows++;
    } else if (this.columns * this.enemySize < this.width * 0.8) {
      this.columns++;
    }

    this.waves.push(new Wave(this));
  }

  restart() {
    this.player.restart();
    this.columns = 2;
    this.rows = 2;

    this.waves = [];
    this.waves.push(new Wave(this));
    this.waveCount = 1;

    this.score = 0;
    this.gameOver = false;
  }
}

//Zelimo da sve krene nakon ucitavanja stranice - ucitavanje igrice

window.addEventListener('load', function () {
  const canvas = document.getElementById('canvas1'); //canvas element
  const ctx = canvas.getContext('2d'); //contex za canvass el
  //Dimenzije canvasa postavljamo ovde, da to odradimo u css-u promenili bismo samo dimenzije elementa, a na ovaj nacim istovremeno menjamo i dimanzije elementa i povrsine za crtanje
  canvas.height = 800;
  canvas.width = 600;
  ctx.fillStyle = 'white'; //postavlja boju svega nacrtanog na canvasu
  ctx.strokeStyle = 'white'; //global
  ctx.lineWidth = 5; //px - global
  ctx.font = '25px "Press Start 2P"';

  //Kreiramo novu istancu Game objekta koja prima canvas kao argument
  const game = new Game(canvas);

  //Treba nam animation loop

  //delta time je vreme izmdju trenutnog frejma i poslednjeg frejma. Animate fju generise timestamp prilikom svakog frejma. Prilikom ovog racunjanja requestAnimationFrame se prilagodjava refresh rate-u screena
  let lastTime = 0;
  function animate(timeStamp) {
    let deltaTime = timeStamp - lastTime;
    lastTime = timeStamp;
    ctx.clearRect(0, 0, canvas.width, canvas.height);
    game.render(ctx, deltaTime); //ctx kao context se kasnije prenosi i na player.draw(context)
    window.requestAnimationFrame(animate); //kreiramo loop unutar kog u svakom frejmu brisemo i renderujemo
  }

  animate(0); //pokrecemo loop. Pokrecemo sa 0 kako bismo dobili 0 a ne NaN kao prvi animation timeStamp
});
