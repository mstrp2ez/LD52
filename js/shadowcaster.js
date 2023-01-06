"use strict";

(function(){
	
	class LightSource extends SceneItem{
		constructor(){
			super();
			this.rays=[];
			
			
		}
		loadFromProperties(params){
			super.loadFromProperties(params);
			
			const wc=this.calculateWorldCoordinates();
			const org=new Vec2(100,0);
			for(let i=0;i<4;i++){
				this.rays.push(new LineSegment(new Vec2(wc.x,wc.y),org.Copy()));
				org.rotateAroundPoint(Math.PI/2,new Vec2(0,0));
			}
		}
		onUpdate(time){
			super.onUpdate(time);
			
		}
		onRender(ctx){
			super.onRender(ctx);
			const p=this.calculateWorldCoordinates();
			ctx.save();
				ctx.beginPath();
				ctx.arc(p.x,p.y,10,0,Math.PI*2);
				ctx.stroke();
			
			this.rays.forEach((ray) => {
				/* ctx.beginPath();
					ctx.moveTo(p.x,p.y);
					ctx.lineTo(p.x+ray.x,p.y+ray.y);
					ctx.stroke(); */
					ray.onRender(ctx);
			});
			ctx.restore();			
		}
	}
	window.LightSource=LightSource;
	
	class LineSegment extends SceneItem{
		constructor(p,r){
			super();
			
			this.start=p??=null;//new Vec2(0,0);
			this.end=r??=null;//new Vec2(0,0);
			this.t=1;
			
		}
		loadFromProperties(params){
			super.loadFromProperties(params);
			const wc=this.calculateWorldCoordinates();
			this.start=new Vec2(wc.x,wc.y);
			this.end=new Vec2(params.end.x,params.end.y);
		}
		postLoad(){
			const lines=SceneManager.getItemsByTypes([LineSegment]);
			
			this.intersects(lines[1]);
		}
		onUpdate(time){
			super.onUpdate(time);
			
		}
		onRender(ctx){
			super.onRender(ctx);
			
			//const wc=this.calculateWorldCoordinates();
			ctx.save();
				const v=this.start.Copy().addV(this.end.Copy().multS(this.t));
				//const v1=this.start.Copy().addV(this.end.Copy().multS(this.t));
				ctx.beginPath();
					ctx.moveTo(this.start.x,this.start.y);
					ctx.lineTo(v.x,v.y);
					ctx.stroke();
			ctx.restore();
		}
		intersects(line){
			const cross=this.end.cross(line.end);
			const c0=line.start.Copy().subV(this.start).cross(this.end);
			if(cross==0&&c0==0){console.log("Collinear");return;}
			if(cross==0&&c0!=0){console.log("Parallel and non-intersecting");return;}
			if(cross!=0){
				const t=line.start.Copy().subV(this.start).cross(line.end)/(this.end.cross(line.end));
				console.log(t);
				this.t=t;
			}
		}
	}
	window.LineSegment=LineSegment;
	
	class Shadowcaster extends SceneItem{
		constructor(){
			super();
		}
		loadFromProperties(params){
			super.loadFromProperties(params);
			
		}
		onUpdate(time){
			super.onUpdate(time);
			
		}
		onRender(ctx){
			super.onRender(ctx);
			const lightSources=SceneManager.getItemsByTypes([LightSource]);
			const boundingBoxes=SceneManager.getItemsByTypes([BBShape]);
			
			const wc=this.calculateWorldCoordinates();
			lightSources.forEach((source) => {
				for(let i=0;i<boundingBoxes.length;i++){
					const verts=boundingBoxes[i].calculateEdges();
					
					
				}
			});
		}
	}
	
	window.Shadowcaster=Shadowcaster;
	
})();