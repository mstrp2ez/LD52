"use strict";


(function(){
	const EPSILON=0.00000001;
	const floatEqual=function(a,b){
		return Math.abs(a-b)<EPSILON;
	}
	class Vec2{
		constructor(x,y){
			this.x=x??=0;
			this.y=y??=0;
		}
		addV(v){
			this.x+=v.x;
			this.y+=v.y;
			return this;
		}
		subV(v){
			this.x-=v.x;
			this.y-=v.y;
			return this;
		}
		multV(v){
			this.x*=v.x;
			this.y*=v.y;
			return this;
		}
		divV(v){
			this.x/=v.x;
			this.y/=v.y;
			return this;
		}
		addS(s){
			this.x+=s;
			this.y+=s;
			return this;
		}
		subS(s){
			this.x-=s;
			this.y-=s;
			return this;
		}
		multS(s){
			this.x*=s;
			this.y*=s;
			return this;
		}
		divS(s){
			if(s==0){throw("Division by zero");}
			this.x/=s;
			this.y/=s;
			return this;
		}
		set(x,y){
			this.x=x;
			this.y=y;
			return this;
		}
		length(){
			return Math.hypot(this.x,this.y);//Math.sqrt(this.x*this.x+this.y*this.y);
		}
		normalize(){
			const len=this.length();
			this.multS(1/len);
			return this;
		}
		dot(v){
			return this.x*v.x+this.y*v.y;
		}
		cross(v){
			return this.x*v.y-this.y*v.x;
		}
		sameDirection(v){
			const dot=this.Copy().normalize().dot(v.Copy().normalize());
			return floatEqual(dot,1);
		}
		angleBetween(v){
			let dot=this.dot(v);
			dot/=this.length()*v.length();
			
			return Math.acos(dot);
		}
		projectOnto(v){
			let tmp=v.Copy();
			const d=this.dot(tmp);
			const m=tmp.length();
			tmp.multS(d/(m*m));
			return tmp;
		}
		rotateAroundPoint(rad,p){
			const cosR=Math.cos(rad);
			const sinR=Math.sin(rad);
			const x=this.x;
			const y=this.y;
			
			this.x=((x-p.x)*cosR)-((p.y-y)*sinR);
			this.y=((p.y-y)*cosR)-((x-p.x)*sinR);
		}
		Copy(){
			return new Vec2(this.x,this.y);
		}
	}
	window.Vec2=Vec2;
	
	/* const t0=new Vec2(5,2);
	const t1=new Vec2(9,0);
	const proj=t0.projectOnto(t1);
	console.log(`X:${proj.x}-Y:${proj.y}`); */
})();