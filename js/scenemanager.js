"use strict";

(function(){

	class SceneItem{
		constructor(){
			this.position=new Vec2(0,0);
			/* this.velocity=new Vec2(0,0); */
			this.w=0;
			this.h=0;
			this.layer=0;
			this.serializable=true;
			this.children=[];
			this.parent=null;
			this.id="";
			this.tags=[];
			this.loaded=false;
			this.noDraw=true;
			this.selected=false;
			this.eventBroadCaster=new EventBroadcaster(this);
			this.name="";
		}
		loadFromProperties(params){
			return new Promise(()=>{
				const x=params.x??=0;
				const y=params.y??=0;
				this.position=new Vec2(x,y);
				
				this.w=params.w??=0;
				this.h=params.h??=0;
				this.layer=params.layer??=0;
				this.tags=params.tags??=this.tags;
				this.id=params.id??=this.id;
				this.noDraw=params.nodraw??=this.noDraw;
				this.name=params.name??=this.name;
				this.serializable=params.serializable??=this.serializable;
			});
		}
		append(child){
			if(child.id.length>0){
				if(this.getChildById(child.id)!==null){
					console.log(`Attempted to append child ${child.id} with conflicting id`);
					return;
				}
			}
			this.children.push(child);
			this.children.sort(function(a,b){
				return a.layer-b.layer;
			});
			child.parent=this;
		}
		removeChild(c){
			let idx=this.children.indexOf(c)
			if(idx!=-1){
				this.children.splice(idx,1);
			}
		}
		onRender(ctx,gui){
			if(!this.noDraw){
				var wc=this.calculateWorldCoordinates();
				ctx.fillStyle="#fff";
				ctx.fillRect(wc.x,wc.y,this.w,this.h);
			}
			if(this.isSelected()){
				this.drawSelectionBox(ctx);
			}

			for(var i=0;i<this.children.length;i++){
				this.children[i].onRender(ctx,gui);
			}
		}
		drawSelectionBox(ctx){
			ctx.beginPath();
			ctx.strokeStyle='#ff0';
			ctx.moveTo(this.x,this.y);
			ctx.lineTo(this.x+this.w,this.y);
			ctx.lineTo(this.x+this.w,this.y+this.h);
			ctx.lineTo(this.x,this.y+this.h);
			ctx.stroke();
		}
		toggleSelected(){
			this.setSelected(!this.selected);
		}
		setSelected(selected){
			this.selected=selected;
			this.eventBroadCaster.fireEvent('selected');
			for(let i=0;i<this.children.length;i++){
				this.children[i].setSelected(this.selected);
			}
		}
		isSelected(){
			return this.selected;
		}
		postLoad(){
			this.children.forEach(x => x.postLoad());
		}
		Unload(){
			this.children.forEach(x=>x.Unload());
		}
		/* getItemsByTypes(type){
			let ret=[];
			this.children.forEach(x => {
				types.forEach(type => {
					if(x instanceof type){
						ret.push(x);
					}
					ret=ret.concat(x.getItemsByTypes(types));
				});
			});
			return ret;
		} */
		onKeydown(event){
			this.children.forEach(item => {
				if(item.onKeydown){
					item.onKeydown(event);
				}
			});
		}
		onKeyup(event){
			this.children.forEach(item => {
				if(item.onKeyup){
					item.onKeyup(event);
				}
			});
		}
		
		/*
			Return false from overloaded versions to stop "propagation"
		*/
		onClick(event){
			let ret=true;
			this.children.forEach(x => {
				if(!x.onClick(event)){
					ret=false;
				}
			});
			return ret;
		}
		getChildById(id){
			for(let i=0;i<this.children.length;i++){
				if(this.children[i].id==id){return this.children[i];}
			}
			return null;
		}
		registerEntitySelect(callback){
			this.eventBroadCaster.registerEventListener('selected',callback);
		}
		Serialize(obj,exempt){
			if(exempt.indexOf(this.id)!==-1){return null;}
			if(!this.serializable){return null;}
			obj.x=this.x;
			obj.y=this.y;
			obj.w=this.w;
			obj.h=this.h;
			obj.layer=parseInt(this.layer);
			obj.id=this.id;
			obj.tags=this.tags.slice();
			obj.noDraw=this.noDraw;
			obj.type=this.constructor.name;
			obj.name=this.name;
			
			if(this.children.length>0){
				obj.children=[];
				for(let i=0;i<this.children.length;i++){
					let ret=this.children[i].Serialize({},exempt);
					if(ret){
						obj.children.push(ret);
					}
				}
			}
			return obj;
		}
		getWidth(){
			return this.w;
		}
		getHeight(){
			return this.h;
		}
		Copy(){
			let obj=this.Serialize({},[]);
			let no=new window[this.constructor.name]();
			no.loadFromProperties(obj);
			return no;
		}
		setLayer(layer){
			this.layer=layer;
		}
		getId(){
			return this.id;
		}
		onUpdate(time){
			//this.position.addV(this.velocity);
			
			for(var i=0;i<this.children.length;i++){
				this.children[i].onUpdate(time);
			}
		}
		addTag(tag){
			if(this.tags.indexOf(tag)==-1){
				this.tags.push(tag);
			}
		}
		removeTag(tag){
			let idx=this.tags.indexOf(tag);
			if(idx!==-1){
				this.tags.splice(idx,1);
			}
		}
		containsTag(tag){
			for(let i=0;i<this.tags.length;i++){
				if(this.tags[i]==tag){
					return true;
				}
			}
			return false;
		}
		containsAnyTags(tag){
			for(let i=0;i<this.tags.length;i++){
				for(let j=0;j<tags.length;j++){
					if(this.tags[i]==tags[j]){
						return true;
					}
				}
			}
			return false;
		}
		calculateCoordinates(){
			return this.calculateWorldCoordinates();
		}
		getPosition(){
			return this.position;
		}
		calculateWorldCoordinates(){
			const pos=this.getPosition();
			if(this.parent!==null){
				const p=this.parent;
				const pwc=p.calculateWorldCoordinates();
				return {'x':pos.x+pwc.x,'y':pos.y+pwc.y};
			}
			return {'x':pos.x,'y':pos.y};
		}
		getItemsByTypes(types){
			let ret=[];
			this.children.forEach(x => {
				types.forEach(type => {
					if(x instanceof type){
						ret.push(x);
					}
					ret=ret.concat(x.getItemsByTypes(types));
				});
			});
			return ret;
		}
		getItemById(id){
			if(this.id==id){
				return this;
			}
			for(let i=0;i<this.children.length;i++){
				const ret=this.children[i].getItemById(id);
				if(ret!==null){
					return ret;
				}
			}
			return null;
		}
	}
	window.SceneItem=SceneItem;
	
	class Interactable extends SceneItem{
		constructor(params){
			super(params);
		}
		loadFromProperties(params){
			super.loadFromProperties(params);
		}
		interact(caller){
		}
		proximity(caller){
		}
	}
	window.Interactable=Interactable;
	
	window.globalNuMSAT=0;
	
	class SceneManager{
		constructor(){
			this.tickTime=16;
			this.lastUpdate=0;
			this.items=[];
			this.numSprites=0;
			this.spritesLoaded=0;
			this.zoom=1;
			this.mouseState={x:0,y:0,mbd:false};
			
			
		}
		onDocumentKeydown(event){
			this.items.forEach(x => {
				if(x.onKeydown){
					x.onKeydown(event);
				}
			});
			let captureInput=window.currentScene.getSceneProperty("captureinput");//??=false;
			captureInput??=false;
			if(captureInput){
				event.preventDefault();
				return false;
			}
		}
		onDocumentKeyup(event){
			this.items.forEach(x => {
				if(x.onKeyup){
					x.onKeyup(event);
				}
			});
			let captureInput=window.currentScene.getSceneProperty("captureinput");//??=false;
			captureInput??=false;
			if(captureInput){
				event.preventDefault();
				return false;
			}
		}
		onCanvasClick(event){
			const gui=window.currentScene.getGUI();
			const noPrevent=gui.onClick(event);
			
			if(noPrevent){
				for(let i=this.items.length-1;i>=0;i--){
					const item=this.items[i];
					if(item.onClick){
						if(!item.onClick(event)){
							break;
						}
					}
				}
			}
		}
		onCanvasMousedown(event){
			const gui=window.currentScene.getGUI();
			const noPrevent=gui.onMousedown(event);
			this.sort();
			if(noPrevent){
				const ox=event.offsetX;
				const oy=event.offsetY;
				this.mouseState={x:ox,origin:{x:ox,y:oy},y:oy,mbd:true};
				
				this.items.forEach(x => {
					if(x.onMousedown){
						x.onMousedown(event);
					}
				});
			}
			
		}
		onCanvasMouseup(event){
			const gui=window.currentScene.getGUI();
			const noPrevent=gui.onMouseup(event);
			
			if(noPrevent){
				this.mouseState=Object.assign(this.mouseState,{mbd:false});
				
				for(let i=0;i<this.items.length;i++){
					const item=this.items[i];
					if(item.onMouseup){
						if(item.onMouseup(event)==false){
							break;
						}
					}
				}
			}
		}
		onCanvasMousemove(event){
			const gui=window.currentScene.getGUI();
			const noPrevent=gui.onMousemove(event);
			
			if(noPrevent){
				if(this.mouseState.mbd){
					this.mouseState=Object.assign(this.mouseState,{x:event.offsetX,y:event.offsetY});
					event.preventDefault();
					return false;
				}
				this.items.forEach(x => {
					if(x.onMousemove){
						x.onMousemove(event);
					}
				});
			}
		}
		onScroll(event){
			
		}
		zoomView(amount){
			this.zoom-=amount;
			if(this.zoom<0.3){
				this.zoom=0.3;
			}
			if(this.zoom>1.0){
				this.zoom=1.0;
			}
			
		}
		postLoad(){
			document.addEventListener('wheel',this.onScroll.bind(this),{passive:false});
			const canvas=window.canvas.getCanvas();
			canvas.addEventListener('mousedown',this.onCanvasMousedown.bind(this));
			canvas.addEventListener('mouseup',this.onCanvasMouseup.bind(this));
			canvas.addEventListener('mousemove',this.onCanvasMousemove.bind(this));
			canvas.addEventListener('click',this.onCanvasClick.bind(this));
			document.addEventListener('keydown',this.onDocumentKeydown.bind(this));
			document.addEventListener('keyup',this.onDocumentKeyup.bind(this));
			
			const target=window.currentScene.getSceneProperty("cameraTarget");
			if(target!==undefined){
				const c=window.Camera;
				c.setTarget(this.getItemById(target));
			}
			
			for(let i=0;i<this.items.length;i++){
				this.items[i].postLoad();
			}
		}
		removeItem(item){
			let removed=this.items.splice(this.items.indexOf(item),1);
			
			return item;
		}
		getByLayer(layer){
			return this.items.filter(x => x.layer==layer);
		}
		getAllItems(){
			return this.items;
		}
		getHighestLayer(){
			let maxL=0;
			for(let i=0;i<this.items.length;i++){
				maxL=this.items[i].layer>maxL?this.items[i].layer:maxL;
			}
			return maxL;
		}
		getNonEmptyLayer(excempt){
			if(excempt===undefined){excempt=[];}
			let nonEmpty=[];
			for(let i=0;i<this.items.length;i++){
				let item=this.items[i];
				if(nonEmpty.indexOf(item.layer)==-1&&excempt.indexOf(item.layer)==-1){
					nonEmpty.push(item.layer);
				}
			}
			return nonEmpty;
		}
		getNonEmptyLayerByType(type){
			let nonEmpty=[];
			for(let i=0;i<this.items.length;i++){
				let item=this.items[i];
				if(item instanceof type&&nonEmpty.indexOf(item.layer)==-1){
					nonEmpty.push(item.layer);
				}
			}
			return nonEmpty;
		}
		removeLayer(layer){
			let rem=this.getByLayer(layer);
			for(let i=0;i<rem.length;i++){
				this.removeItem(rem[i]);
			}
		}
		getSelectedEntities(){
			return this.items.filter(e => e.isSelected());
		}
		getItemsByTypes(types){
			let ret=[];
			this.items.forEach(x => {
				types.forEach(type => {
					if(x instanceof type){
						ret.push(x);
					}
					ret=ret.concat(x.getItemsByTypes(types));
				})
			});
			return ret;
		}
		getItemsByTags(tags){
			let ret=[];
			for(let i=0;i<this.items.length;i++){
				let item=this.items[i];
				if(item.containsAnyTags(tags)){
					ret.push(item);
				}
			}
			return ret;
		}
		removeItem(item){
			const idx=this.items.indexOf(item);
			if(idx!=-1){
				this.items.splice(idx,1);
			}
		}
		updateMousedrag(){
			if(this.mouseState.mbd){
				const c=window.Camera;
				let origin=c.getOrigin();
				
				let delta={x:(this.mouseState.origin.x-this.mouseState.x)/10,y:(this.mouseState.origin.y-this.mouseState.y)/10};
				delta.x*=c.scale;
				delta.y*=c.scale;
				origin={x:origin.x+delta.x,y:origin.y+delta.y};
				
				c.setOrigin(origin);
			}
		}
		append(item,redraw){
			this.items.push(item);
			this.sort();
		}
		onRender(ctx){
			let c=window.Camera;
			c.preRender(ctx);
			for(var i=0;i<this.items.length;i++){
				let item=this.items[i];
				ctx.save();
					item.onRender(ctx);
				ctx.restore();
			}
			c.postRender(ctx);
		}
		onUpdate(time){
			if(time-this.lastUpdate>this.tickTime){
				globalNuMSAT=0;
				this.items.forEach(x => x.onUpdate(time));
				this.lastUpdate=time;
			}
			this.updateMousedrag();
			
			window.Camera.onUpdate(time);
		}
		getItemsByType(type){
			let ret=[];
			for(let i=0;i<this.items.length;i++){
				if(this.items[i] instanceof type){
					ret.push(this.items[i]);
				}
			}
			return ret;
		}
		isInViewport(item){
			var canvas=window.canvas.getCanvas();
			let c=window.Camera;
			let x=item.x;
			let y=item.y;
			let halfW=canvas.width/1.5;
			let halfH=canvas.height/1.5;
			if(x>c.centerx-halfW&&x<c.centerx+halfW){
				if(y>=c.centery-halfH&&y<c.centery+halfH){
					return true;
				}
			}
			return false;
		}
		getItemById(id){
			for(let i=0;i<this.items.length;i++){
				const ret=this.items[i].getItemById(id);
				if(ret!==null){
					return ret;
				}
			}
			return null;
		}
		sort(){
			this.items.sort(function(a,b){
				var al=a.layer;
				var bl=b.layer;
				if(al<bl){
					return -1;
				}
				if(al>bl){
					return 1;
				}
				return 0;
			});
		}
		Unload(){
			for(let i=0;i<this.items.length;i++){
				if(this.items[i].Unload){
					this.items[i].Unload();
				}
				this.items[i]=null;
			}
			this.items.length=0;
		}
		exportScene(includeGUI,exempt){
			let obj={'items':[]};
			for(let i=0;i<this.items.length;i++){
				let ret=this.items[i].Serialize({},exempt);
				if(ret){
					obj.items.push(ret);
				}
			}
			return obj;
		}
		exportSceneByTags(tags){
			let items=this.getItemsByTags(tags);
			let obj={'items':[]};
			for(let i=0;i<items.length;i++){
				let ret=items[i].Serialize({},[]);
				if(ret){
					obj.items.push(ret);
				}
			}
			return obj;
		}
	}
	window.SceneManager=new SceneManager();
	
	class Camera{
		constructor(params){
			/* this.centerx=0;
			this.centery=0; */
			this.origin={x:0,y:0};
			this.scale=1;
			this.target=null;
		}
		screenSpaceToWorldSpace(point){
			let c=window.canvas.getCanvas();
			return {x:(point.x - this.origin.x) / this.scale,y:(point.y - this.origin.y) / this.scale};
		}
		translate(ctx){
			let c=window.canvas.getCanvas();
			ctx.translate(Math.floor(-this.origin.x+(c.width/2)),Math.floor(-this.origin.y+(c.height/2)));
		}
		zoomAt(x,y,zoom){
			this.scale-=zoom;
			if(this.scale<0.3){this.scale=0.3;return;}
			if(this.scale>1.0){this.scale=1.0;return;}
			this.origin.x = x - (x - this.origin.x) * this.scale;
			this.origin.y = y - (y - this.origin.y) * this.scale;
		}
		preRender(ctx){
			ctx.setTransform(this.scale,0,0,this.scale,this.origin.x,this.origin.y);
		}
		postRender(ctx){
			ctx.setTransform(1,0,0,1,0,0);
		}
		getOrigin(){
			return this.origin;
		}
		setOrigin(origin){
			this.origin=origin;
		}
		getZoomFactor(){
			return this.scale;
		}
		setTarget(target){
			this.target=target;
		}
		onUpdate(time){
			let c=window.canvas.getCanvas();
			if(!this.target){return;}
			const p=this.target.getPosition();
			this.origin.x=-(p.x-c.width/4);
			this.origin.y=-(p.y-c.height/4);
		}
	}
	window.Camera=new Camera();
	
})();