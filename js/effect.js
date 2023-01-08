"use strict";

(function(){

	class EffectHelper{
		constructor(){
		}
		createEffect(params){
			const e=new Effect();
			e.loadFromProperties(params).then(()=>{
				SceneManager.append(e);
			});
		}
	}
	window.EffectHelper=new EffectHelper();

	class Effect extends SpriteAnimation{
		constructor(){
			super();
		}
		loadFromProperties(params){
			return super.loadFromProperties(params).then(()=>{
				this.startAnimation=params.startanimation??="idle";
				this.angle=params.angle??=0;
				this.registerEventlistener("end_of_animation",this.onAnimationEnd.bind(this));
				this.done=false;
				this.layer=9;
			});
		}
		isDone(){
			return this.done;
		}
		onRender(ctx){
			if(this.isDone()){return;}
			const p=this.calculateWorldCoordinates();
			const hW=this.getWidth()/2;
			const hH=this.getHeight()/2;
			ctx.save();
				const tx=p.x+hW;
				const ty=p.y+hH;
				ctx.translate(tx,ty);
					ctx.rotate(this.angle);//*Math.PI/180);
				ctx.translate(-tx,-ty);
				super.onRender(ctx);
			ctx.restore();
		}
		onUpdate(time){
			if(this.isDone()){return;}
			super.onUpdate(time);
		}
		onAnimationEnd(){
			SceneManager.removeItem(this);
			//this.Unload();
			this.done=true;
		}
	}
	window.Effect=Effect;
})();