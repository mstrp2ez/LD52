"use strict";


(function(){
	
	class DamageText extends SceneItem{
		constructor(){
			super();
		}
		loadFromProperties(params){
			super.loadFromProperties(params);
			this.fontSize=params.fontSize??=12;
			this.fontColor=params.fontColor??='#eee';
			this.scrollSpeed=params.scrollSpeed??=2;
			this.life=params.life??=500;
			this.damage=params.damage??='???';
		}
		onUpdate(time){
			super.onUpdate(time);
			if(this.isDead()){return;}
			
			this.position.y-=this.scrollSpeed;
			this.life-=1;
		}
		onRender(ctx){
			super.onRender(ctx);
			if(this.isDead()){return;}
			
			const p=this.calculateWorldCoordinates();
			ctx.save();
				ctx.font=`bold ${this.fontSize}px sans-serif`;
				ctx.fillStyle=this.fontColor;
				ctx.globalAlpha=this.life/100;
				ctx.fillText(this.damage,p.x,p.y);
			ctx.restore();
		}
		isDead(){
			return this.life<=0;
		}
	}
	window.DamageText=DamageText;
	
})();