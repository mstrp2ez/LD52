"use strict";


(function(){
	
	class SoulGenerator extends SceneItem{
		constructor(){
			super();
			this.lastUpdate=0;
			this.loaded=false;
		}
		loadFromProperties(params){
			super.loadFromProperties(params)
			this.spawnRate=params.spawnrate??=1000;
			this.levelRange=params.levelrange??={min:0,max:0};
			this.spawnMin=params.spawnmin??={x:0,y:0};
			this.spawnMax=params.spawnmax??={x:1,y:1};
			this.maxSpawn=params.maxspawn??=10;
			return fetch(params.src).then(data => data.json()).then(data => {
				this.data=data;
				this.loaded=true;
			});
		}
		onUpdate(time){
			super.onUpdate(time);
			if(!this.loaded||GameState.isPaused()){return;}
			if(time-this.lastUpdate>this.spawnRate){
				this.spawnSoul();
				this.lastUpdate=time;
			}
		}
		spawnSoul(){
			if(this.getItemsByTypes([LostSoul]).length>=this.maxSpawn){return;}
			const level=rand(this.levelRange.min,this.levelRange.max);
			const souls=this.data.levels[level];
			const numOptions=souls.length;
			const soulTemplate=souls[randomNumberBetween(0,numOptions)];
			
			soulTemplate.x=rand(this.spawnMin.x,this.spawnMax.x);
			soulTemplate.y=rand(this.spawnMin.y,this.spawnMax.y);
			
			const soul=new LostSoul();
			soul.loadFromProperties(soulTemplate);
			
			const soulAnimation=new SpriteAnimation();
			soulAnimation.loadFromProperties({
				animsrc:soulTemplate.animsrc
			}).then(()=>{
				soul.append(soulAnimation);
				soul.w=soulAnimation.getWidth();
				soul.h=soulAnimation.getHeight();
				
				const soulBB=new BBRectangle();
				soulBB.loadFromProperties({
					x:0,
					y:0
				});
				soul.append(soulBB);
				soul.postLoad();
				soulBB.postLoad();
				
				this.append(soul);
			});
		}
	}
	window.SoulGenerator=SoulGenerator;
	
	class LostSoul extends ElasticFollow{
		constructor(){
			super();
			
		}
		loadFromProperties(params){
			super.loadFromProperties(params);
			this.level=params.level;
			this.hp=params.hp??=10;
			this.maxHP=this.hp;
			this.combatText=[];
			this.fade=1000;
			this.speed=params.speed??=0.3;
			this.xp=params.xp??=10;
			this.numSouls=params.numsouls??=1;
			this.name=params.name??='Default soul';
			this.damage=params.damage??=1;
			this.range=params.range??=50;
			this.attackSpeed=params.attackspeed??=1;
			this.lastAttack=0;
			this.hitSound=new GameAudio();
			this.hitSound.loadFromProperties({src:"assets/audio/lostsoulhit.mp3"});
		}
		onHarvest(agent){
			if(this.isDead()){return false;}
			const dmg=agent.calculateDamage();
			this.hp-=dmg;
			this.displayDamage(dmg);
			this.hitSound.play();
			
			if(this.isDead()){
				this.removeChildren();
				this.displayDamage(`+${this.numSouls} soul`,'#9badb7');
				return true;
			}
			return false;
		}
		getXP(){
			return this.xp;
		}
		calculateDamage(){
			return this.damage;
		}
		removeChildren(){
			const children=this.getItemsByTypes([SpriteAnimation,BBRectangle]);
			children.forEach(anim => {
				this.removeChild(anim);
			});
		}
		displayDamage(dmg,color){
			color=color??='#f00';
			const dt=new DamageText();
			dt.loadFromProperties({
				fontSize:18,
				fontColor:color,
				scrollSpeed:0.5,
				life:100,
				damage:dmg
			});
			this.combatText.push(dt);
			this.append(dt);
		}
		onUpdate(time){
			super.onUpdate(time);
			if(GameState.isPaused()){return;}
			const dead=this.combatText.filter(child => child.isDead());
			dead.forEach(d => {
				this.children.splice(this.children.indexOf(d),1);
				this.combatText.splice(this.combatText.indexOf(d),1);
			});
			if(this.isDead()){
				if(this.combatText.length<=0){
					this.parent.removeChild(this);
					this.Unload();
				}
			}
			const player=SceneManager.getItemById("player");
			let p=player.calculateWorldCoordinates();
			let tP=this.calculateWorldCoordinates();
			p.x+=player.getWidth()/2;
			p.y+=player.getHeight()/2;
			tP.x+=this.getWidth()/2;
			tP.y+=this.getHeight()/2;
			if(distanceTo(tP,p)<this.range){
				if(time-this.lastAttack>this.attackSpeed*1000){
					this.attack(player);
					this.lastAttack=time;
				}
			}
		}
		onRender(ctx){
			super.onRender(ctx);
			if(this.isDead()){return;}
			ctx.save();
				const p=this.calculateWorldCoordinates();
				ctx.fillStyle='#eee';
				ctx.fillText(this.name,p.x,p.y-6);
				ctx.fillStyle='#393';
				ctx.fillRect(p.x,p.y-4,(this.hp/this.maxHP)*this.getWidth(),4);
			ctx.restore();
		}
		attack(target){
			if(this.isDead()){return;}
			const children=this.getItemsByTypes([SpriteAnimation]);
			if(children.length<=0){return;}
			const anim=children[0];
			anim.setAnimation("attack");
			anim.registerEventlistener("end_of_animation",()=>{
				anim.setAnimation("idle");
				return false;
			});
			target.onHit(this);
		}
		isDead(){
			return this.hp<=0;
		}
		getMaxHp(){
			return this.maxHP;
		}
		Unload(){
			this.children=null;
		}
	}
	
window.LostSoul=LostSoul;
	
})();