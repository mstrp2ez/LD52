"use strict";

(function(){
	
class Keymap{
	constructor(){
		this.keys=Array(256).fill(false);
	}
	setKey(key,state){
		this.keys[key]=state;
	}
	getKey(key){
		return this.keys[key];
	}
}	
	
class Actor extends SceneItem{
	constructor(){
		super();
		this.velocity=new Vec2(0,0);
		this.hspeed=0.2;
		this.vspeed=0.2;
		this.keymap=new Keymap();
		this.onGround=true;
		const globalF=window.currentScene.getSceneProperty("globalForce");
		this.globalForce=new Vec2(globalF.x,globalF.y);
	}
	loadFromProperties(params){
		super.loadFromProperties(params);
		
	}
	onKeydown(event){
		super.onKeydown(event);
		this.keymap.setKey(event.which,true);
	}
	onKeyup(event){
		super.onKeyup(event);
		this.keymap.setKey(event.which,false);
	}
	onUpdate(time){
		super.onUpdate(time);
		if(GameState.isPaused()){return;}
		this.velocity.addV(this.globalForce);

		if(this.keymap.getKey(37)){
			this.velocity.addV(new Vec2(-this.hspeed,0));
		}
		if(this.keymap.getKey(39)){
			this.velocity.addV(new Vec2(this.hspeed,0));
		}
		if(this.keymap.getKey(38)){
			this.velocity.addV(new Vec2(0,-this.vspeed));
			/* if(this.onGround){
				this.velocity.addV(new Vec2(0,-this.vspeed));
				this.onGround=false;
			} */
		}
		if(this.keymap.getKey(40)){
			this.velocity.addV(new Vec2(0,this.vspeed));
		}
		
		this.velocity.multS(this.onGround?0.89:0.98);
		
		this.calculateAnimation();
		this.position.addV(this.velocity);
	}
	
	calculateAnimation(){
		if(this.isAttacking==true){return;}
		const speed=this.velocity.length();
		let animations=this.getItemsByTypes([SpriteAnimation]);//this.getChildById("playeranim");
		if(animations.length<=0){return;}
		const animation=animations[0];
		if(speed<0.1){
			animation.setAnimation("idle");
		}else{
			const vy=this.velocity.y;
			const vx=this.velocity.x;
			
			if(Math.abs(vy)>Math.abs(vx)){
				if(vy>0){
					animation.setAnimation("walkdown");
				}else{
					animation.setAnimation("walkup");
				}
			}else{
				if(vx>0){
					animation.setAnimation("walkright");
				}else{
					animation.setAnimation("walkleft");
				}
			}
		}
	}
	onRender(ctx){
		super.onRender(ctx);
		
	}
	onCollision(mtds){
		//if(mtds.length<=0){this.onGround=false;}
		mtds.forEach((item) => {
			if(item.mtd==null){return;}
			item.own.separateObjects(item.own,item.other,item.mtd);
			const oppositeForce=item.mtd.Copy();
			oppositeForce.multS(-1);
			this.velocity.subV(oppositeForce);
			
			if(this.globalForce.dot(oppositeForce)>0){
				this.onGround=true;
			}
		});
	}
}	
window.Actor=Actor;

class BBShape extends SceneItem{
	constructor(){
		super();
		this.vertices=[];
		this.debugDraw=false;
	}
	loadFromProperties(params){
		super.loadFromProperties(params);
		
		this.static=params.static??=false;
	}
	onUpdate(time){
		super.onUpdate(time);
		
		const mtds=this.testCollision();
		//if(mtds.length>0){
		const actor=this.getActor();
		if(actor!=this){
			actor.onCollision(mtds);
		}else{
			mtds.forEach((item) => {
				this.separateObjects(item.own,item.other,item.mtd);
			});
		}
		//}
	}
	getVertices(){
		return this.vertices;
	}
	isStatic(){
		return this.static;
	}
	getActor(){
		if(this.parent==null){return this;}
		let p=this;
		while(p!=null){
			if(p instanceof Actor){
				return p;
			}
			p=p.parent;
		}
		return this;
	}
	testCollision(){
		//naive, tests all objects, even objects that may have already tested against this Object
		if(this.isStatic()){return [];}
		const objects=SceneManager.getItemsByTypes([BBShape]);
		let ret=[];
		for(let i=0;i<objects.length;i++){
			const other=objects[i];
			if(other==this){continue;}
			const mtd=this.tryObjectCollision(other);
			if(mtd!==false){
				ret.push(mtd);
			}
		}
		return ret;
	}
	separateObjects(obj0,obj1,mtd){
		if(!obj1.isStatic()){
			obj1.getActor().getPosition().addV(mtd);
		}
		mtd.multS(-1)
		if(!obj0.isStatic()){
			obj0.getActor().getPosition().addV(mtd);
		}
	}
	tryObjectCollision(other){
		const n0=this.calculateAxii();
		const n1=other.calculateAxii();
		const normals=n0.concat(n1);
		let minOverlap=null;
		let mtd=null;


		const v0=this.getVertices();
		const v1=other.getVertices();
		for(let i=0;i<normals.length;i++){
			let amin=null;
			let amax=null;
			let bmin=null;
			let bmax=null;
			let wc=this.calculateWorldCoordinates();
			for(let j=0;j<v0.length;j++){
				let v=v0[j].Copy().addV(wc);
				const dot=v.dot(normals[i]);
				if(amax==null||dot>amax){
					amax=dot;
				}
				if(amin==null||dot<amin){
					amin=dot;
				}
			}
			wc=other.calculateWorldCoordinates();
			for(let j=0;j<v1.length;j++){
				let v=v1[j].Copy().addV(wc);
				const dot=v.dot(normals[i]);
				if(bmax==null||dot>bmax){
					bmax=dot;
				}
				if(bmin==null||dot<bmin){
					bmin=dot;
				}
			}
			if((amin<=bmax&&amin>=bmin)||(bmin<=amax&&bmin>=amin)){
				const overlap=Math.min(amax,bmax)-Math.max(amin,bmin);
				if(minOverlap===null||overlap<minOverlap){
					minOverlap=overlap;
					mtd=normals[i].Copy();
					if(amax > bmax){
						mtd.multS(-1);
					}
					mtd.multS(minOverlap);
				}
				continue;
			}else{
				return false;
			}
		}
		return {other:other, own:this, "mtd":mtd};
	}
	calculateAxii(){
		const ret=[];
		const edges=this.calculateEdges();
		for(let i=0;i<edges.length;i++){
			const edge=edges[i];
			const normal=new Vec2(-edge.y,edge.x)
			normal.normalize();
			ret.push(normal);
		}
		return ret;
	}
	calculateEdges(/* verts,worldOffset */){
		const ret=[];
		const verts=this.vertices;
		let f=verts[verts.length-1];
		for(let i=0;i<verts.length;i++){
			const s=verts[i];
			ret.push(new Vec2((s.x-f.x),(s.y-f.y)));
			f=s;
		}
		return ret;
	}
	onRender(ctx){
		super.onRender(ctx);
		
		if(this.debugDraw){
			const verts=this.getVertices();
			const wc=this.calculateWorldCoordinates();
			ctx.save();
				ctx.strokeStyle='#333';
				ctx.translate(wc.x,wc.y);
				ctx.beginPath();
				//ctx.moveTo(wc.x,wc.y);
				for(let i=0;i<verts.length;i++){
					const v0=verts[i];
					ctx.lineTo(v0.x,v0.y);
				}
				ctx.closePath();
				ctx.stroke(); 
			ctx.restore();
		}
	}
}
window.BBShape=BBShape;

class BBRectangle extends BBShape{
	constructor(){
		super();
	}
	loadFromProperties(params){
		super.loadFromProperties(params);
	}
	buildPolygon(size){
		//const p=this.getPosition();//this.calculateWorldCoordinates();
		this.vertices.push(new Vec2(0,0));
		this.vertices.push(new Vec2(size.w,0));
		this.vertices.push(new Vec2(size.w,size.h));
		this.vertices.push(new Vec2(0,size.h));
	}
	postLoad(){
		if(this.parent!=null){
			this.buildPolygon({w:this.parent.getWidth(),h:this.parent.getHeight()});
		}else{
			this.buildPolygon({w:this.getWidth(),h:this.getHeight()});
		}
	}
	
}
window.BBRectangle=BBRectangle;

class BBPolygon extends BBShape{
	constructor(){
		super();
	}
	loadFromProperties(params){
		super.loadFromProperties(params);
		this.vertices=params.vertices??=[];
		//const p=this.getPosition();
		for(let i=0;i<this.vertices.length;i++){
			let vert=this.vertices[i];
			vert=new Vec2(vert.x,vert.y);
			this.vertices[i]=vert;
		}
	}
}
window.BBPolygon=BBPolygon;

class ElasticFollow extends SceneItem{
	constructor(){
		super();
	}
	loadFromProperties(params){
		super.loadFromProperties(params);
		this.target=params.target??=false;
		this.proximity=params.proximity??=1000;
		this.speed=params.speed??=3;
	}
	postLoad(){
		super.postLoad();
		if(this.target){
			this.target=SceneManager.getItemById(this.target);
		}
	}
	onUpdate(time){
		super.onUpdate(time);
		if(GameState.isPaused()){return;}
		this.followTarget();
	}
	followTarget(){
		if(this.target==false){return;}
		
		
		
		let velocity=new Vec2();
		let tmp0=this.calculateWorldCoordinates();
		let tmp1=this.target.calculateWorldCoordinates();
		if(distanceTo(tmp0,tmp1)>this.proximity){return;}
		
		const p0=new Vec2(tmp0.x,tmp0.y);
		const p1=new Vec2(tmp1.x,tmp1.y);
		
		let d=p1.Copy().subV(p0);
		if(d.length()<5){return;}
		d.normalize();
		d.multS(this.speed);
		this.position.addV(d);
	}
}
window.ElasticFollow=ElasticFollow;

class AnimationController extends SceneItem{
	constructor(){
		
		this.animationTarget=null;
		this.animation=null;
		this.valueTarget="";
		//this.
	}
	loadFromProperties(params){
		super.loadFromProperties(params);
		this.animationTarget=params.animationtarget??=this.animationTarget;
		
	}
	postLoad(){
		if(!this.parent){return;}
		const animations=this.parent.getItemsByType("SpriteAnimation");
		if(animations.length<=0){return;}
		this.animation=animations[0];
	}

	onUpdate(time){
		super.onUpdate(time);
		
		if(this.animation){
			
		}
	}
}
window.AnimationController=AnimationController;


	
})();