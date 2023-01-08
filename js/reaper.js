"use strict";


(function(){
	const PERK_SRC="assets/data/perks.json";
	class PerkData{
		constructor(){
			this.data=null;
			
		}
		getData(){
			if(this.data==null){
				return fetch(PERK_SRC).then(data => data.json()).then(data => {
					this.data=data;
					return this.data;
				});
			}else{
				return new Promise(resolve=>{
					resolve(this.data);
				});
			}
		}
	}
	window.PerkData=new PerkData();
	
	class Perk{
		constructor(parent){
			this.parent=parent;
		}
		loadFromProperties(params){
			this.id=params.name;
			this.level=params.level??=0;
			this.name=params.name??="Default perk";
			this.parsePerkData();

		}
		parsePerkData(){
			return this.data=window.PerkData.getData();
		}
		onRender(ctx){
		}
		onUpdate(time){
		}
		calculateDamage(){
			return 0;
		}
		upgradePerk(){
			//super.upgradePerk();
			this.level++;
			this.parsePerkData();
		}
		onKill(target){
			
		}
	}
	
	class Bone extends Sprite{
		constructor(parent){
			super(parent);
			this.loaded=false;
			this.life=1000;
		}
		loadFromProperties(params){
			super.loadFromProperties(params);
			
			this.target=params.target??=null;
			this.speed=params.speed??=10;
			this.damage=params.damage??=1;
		}
		isDead(){
			return this.life<=0;
		}
		onUpdate(time){
			super.onUpdate(time);
			if(this.target==null||this.isDead()){return;}
			const tP=this.target.calculateWorldCoordinates();
			const p=this.calculateWorldCoordinates();
			const p0=new Vec2(tP.x,tP.y);
			const p1=new Vec2(p.x,p.y);
			
			p0.subV(p1);
			p0.normalize();
			p0.multS(this.speed);
			
			this.position.addV(p0);
			
			if(distanceTo(tP,p)<50){
				this.target.onHarvest(this);
				this.life=0;
			}
			
			this.life--;
		}
		calculateDamage(){
			return this.damage;
		}
	}
	window.Bone=Bone;
	
	class BoneSpear extends Perk{
		constructor(parent){
			super(parent);
			this.loaded=false;
		}
		parsePerkData(){
			super.parsePerkData().then(data=>{
				this.data=data;
				this.numProjectiles=this.data[this.name].levels[this.level].numprojectiles;
				this.damage=this.data[this.name].levels[this.level].damage;
				this.src=this.data[this.name].levels[this.level].src;
				this.range=this.data[this.name].levels[this.level].range;
				this.spears=[];
				
				this.loaded=true;
			});
		}
		onAttack(targets){
			const inRange=targets.filter(target => {
				return distanceTo(target.getPosition(),this.parent.getPosition())<this.range;
			});
			for(let i=0;i<this.numProjectiles;i++){
				let spear=new Bone();
				spear.loadFromProperties({
					src:this.src,
					target:inRange[randomNumberBetween(0,inRange.length)],
					damage:this.damage
				});
				this.parent.append(spear);
				this.spears.push(spear);
			}
		}
		onUpdate(time){
			if(!this.loaded){return;}
			super.onUpdate(time);
			
			this.spears.filter(bone => bone.isDead()).forEach(bone => {
				this.parent.removeChild(bone);
				this.spears.splice(this.spears.indexOf(bone),1);
			});
			
		}
	}
	window.BoneSpear=BoneSpear;
	
	class SoulLeech extends Perk{
		constructor(parent){
			super(parent);
			this.loaded=false;
		}
		parsePerkData(){
			super.parsePerkData().then(data=>{
				this.data=data;
				this.lifegain=this.data[this.name].levels[this.level].lifegain;
				
				this.loaded=true;
			});
		}
		onAttack(targets){
			this.parent.gainHp(this.lifegain);
		}
		
	}
	window.SoulLeech=SoulLeech;
	
	class DeathAura extends Perk{
		constructor(parent){
			super(parent);
			this.lastDamageTick=0;
			this.loaded=false;
		}
		parsePerkData(){
			super.parsePerkData().then(data=>{
				this.data=data;
				this.range=this.data[this.name].levels[this.level].range;
				this.damage=this.data[this.name].levels[this.level].damage;
				this.damageInterval=this.data[this.name].levels[this.level].damageinterval;
				this.loaded=true;
			});
		}
		onRender(ctx){
			if(!this.loaded){return;}
			super.onRender(ctx);

			const p=this.parent.getPosition();
			const pW=this.parent.getWidth();
			const pH=this.parent.getHeight();
			
			const gradient = ctx.createRadialGradient(p.x+pW/2, p.y+pH/2, this.range, p.x, p.y, this.range/4);

			gradient.addColorStop(0, "#22203488");
			gradient.addColorStop(0.9, "#22203400");
			
			
			ctx.save();
				ctx.beginPath();
				ctx.fillStyle=gradient;
				ctx.arc(p.x+pW/2.5,p.y+pH/2.5,this.range,0,Math.PI*2);
				ctx.fill();
			ctx.restore();
		}
		onUpdate(time){
			
			if(time-this.lastDamageTick>this.damageInterval){
				const souls=SceneManager.getItemsByTypes([LostSoul]);
				const p=this.parent;
				const p0=p.getPosition().Copy();
				p0.x+=p.getWidth()/2.5;
				p0.y+=p.getHeight()/2.5;
				
				souls.forEach(soul => {
					if(distanceTo(soul.getPosition(),p0)<this.range){
						if(soul.onHarvest(this)){
							this.parent.onKill(soul);
						}
					}
				});
				this.lastDamageTick=time;
			}
		}
		calculateDamage(){
			return this.damage;
		}
	}
	window.DeathAura=DeathAura;
	
	class Reaper extends Actor{
		constructor(){
			super();
		}
		loadFromProperties(params){
			super.loadFromProperties(params);
			this.range=params.range??=40;
			this.hp=params.hp??=10;
			this.maxHP=this.hp;
			this.level=1;
			this.xp=0;
			this.nextLvlXp=this.level*1000;
			this.lastAttack=0;
			this.perks=[];
			this.combatText=[];
			
			this.storeMenu=null;
			
			this.weapon=params.weapon??={
				name:"Soul dagger",
				src:"assets/sprites/souldagger.png",
				damage:3,
				rangemod:1,
				maxtargets:1,
				attackspeed:1
			}
			this.weaponSprite=new Sprite();
			this.weaponSprite.loadFromProperties({
				src:this.weapon.src,
				x:20,
				y:20
			});
			window.currentScene.getGUI().addChild(this.weaponSprite);
		}
		postLoad(){
			super.postLoad();
			const gui=window.currentScene.getGUI();
			this.xpbar=gui.getWidgetById("xpbar");
			this.storeMenu=SceneManager.getItemById("CraftMenu");
			this.storeMenu.registerEventListener("onbuy",this.onGearCraft.bind(this));
		}
		onKeydown(event){
			if(GameState.isInMenu()){return;}
			super.onKeydown(event);
			if(event.which==32){
				const time=performance.now();
				if(time-this.lastAttack>1000/this.weapon.attackspeed){
					this.tryHarvest();
					this.lastAttack=time;
				}
			}
		}
		onUpdate(time){
			super.onUpdate(time);
			this.perks.forEach(perk => {
				perk.onUpdate(time);
			});
			this.xpbar.setWidth((this.xp/this.nextLvlXp)*800); //maxwidth or canvas.width
			const dead=this.combatText.filter(child => child.isDead());
			dead.forEach(d => {
				this.children.splice(this.children.indexOf(d),1);
				this.combatText.splice(this.combatText.indexOf(d),1);
			});
		}
		onRender(ctx){
			super.onRender(ctx);
			this.perks.forEach(perk => {
				perk.onRender(ctx);
			});
			ctx.save();
				const p=this.calculateWorldCoordinates();
				ctx.fillStyle='#393';
				ctx.fillRect(p.x,p.y-4,(this.hp/this.maxHP)*this.getWidth(),4);
			ctx.restore();
		}
		upgradePerk(perkid){
			const perk=this.perks.find(perk => perk.id==perkid);
			if(perk!==undefined){
				perk.upgradePerk();
			}else{
				const newPerk=new window[perkid](this);
				newPerk.loadFromProperties({
					level:0,
					name:perkid
				});
				this.perks.push(newPerk);
				
			}
		}
		onGearCraft(widget){
			const item=widget.retrieveLastItem();
			this.weapon=item;
			this.weaponSprite.load({src:this.weapon.src});
		}
		onHit(agent){
			if(this.hp<=0){return;}
			this.hp-=agent.calculateDamage();
			if(this.hp<=0){
				window.currentScene.queueScene("assets/scenes/gameover.json");
			}
		}
		calculateDamage(){
			return this.weapon.damage;
		}
		onKill(soul){
			this.perks.forEach(perk=>{
				perk.onKill(soul);
			});
			this.gainHp(soul.getMaxHp()/10);
			GameState.setSouls(GameState.getSouls()+1);
			this.xp+=soul.getXP();
			if(this.xp>=this.nextLvlXp){
				this.levelUp();
			}
		}
		gainHp(hp){
			this.hp+=hp;
			this.displayDamage(hp,"#3f3");
			if(this.hp>this.maxHP){this.hp=this.maxHP;}
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
		levelUp(){
			this.xp=0;
			this.level++;
			this.maxHP+=this.maxHP+this.level*10;
			this.hp=this.maxHP;
			this.nextLvlXp=this.level*1000;
			if(this.level%2==0){
				this.showPerkMenu();
			}
		}
		showPerkMenu(){
			const perkMenu=SceneManager.getItemById("PerkMenu");
			perkMenu.setVisible(true);
			GameState.setInMenu(true);
			perkMenu.registerEventListener("onleave",function(menu){
				perkMenu.setVisible(false);
				const selectedPerk=perkMenu.retrieveLastItem();
				if(selectedPerk!=null){
					this.upgradePerk(selectedPerk.id);
				}
			}.bind(this),true);
		}
		tryHarvest(){
			let souls=SceneManager.getItemsByTypes([LostSoul]);
			let inDistance=[];
			souls.forEach(soul => {
				if(soul.isDead()){return;}
				let distance=distanceTo(soul.getPosition(),this.getPosition());
				if(distance<this.range*this.weapon.rangemod){
					inDistance.push({d:distance,s:soul});
				}
			});
			inDistance.sort((a,b)=>{
				return a.d-b.d;
			});
			
			inDistance=inDistance.slice(0,this.weapon.maxtargets);
			if(inDistance.length>0){
				this.setAttackAnimation();
				let boneSpearPerk=this.perks.filter(x => x instanceof BoneSpear);
				boneSpearPerk.forEach(perk => {
					perk.onAttack(souls);
				});
				let soulLeech=this.perks.filter(x => x instanceof SoulLeech);
				soulLeech.forEach(perk => {
					perk.onAttack(souls);
				});
			}
			inDistance.forEach(item=>{
				const soul=item.s;
				this.createAttackEffect(soul);
				if(soul.onHarvest(this)){
					this.onKill(soul);
				}
			});
		}
		setAttackAnimation(){
			let animations=this.getItemsByTypes([SpriteAnimation]);//this.getChildById("playeranim");
			if(animations.length<=0){return;}
			const animation=animations[0];
			animation.setAnimation("attack");
			this.isAttacking=true;
			animation.registerEventlistener("end_of_animation",function(){
				animation.setAnimation("idle");
				this.isAttacking=false;
				return false;
			}.bind(this));
		}
		createAttackEffect(target){
			const p0=this.getPosition();
			const p1=target.getPosition();
			const hW0=this.getWidth()/2;
			const hH0=this.getHeight()/2;
			const hW1=target.getWidth()/2;
			const hH1=target.getHeight()/2;
			const angle=Math.atan2(p0.y+hH0-p1.y+hH1,p0.x+hW0-p1.x+hW1)+Math.PI;
			
			const dir=p0.Copy();
			dir.subV(p1);
			dir.normalize();
			dir.multS(-50*this.weapon.rangemod);
			EffectHelper.createEffect({
				animsrc:"assets/animations/attackflash.json",
				x:p0.x-32+dir.x,
				y:p0.y+dir.y,
				w:this.getWidth(),
				h:this.getHeight(),
				angle:angle
			});
		}
	}
	window.Reaper=Reaper;
	
	
})();