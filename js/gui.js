"use strict";

(function(){
	
	class Widget extends SceneItem{
		constructor(){
			super();
			this.eventBroadcaster=new EventBroadcaster(this);
		}
		loadFromProperties(params){
			super.loadFromProperties(params);
			this.layer=10;
			this.visible=params.visible??=true;
			this.src=params.src??=false;
			this.bgcolor=params.bgcolor??='#fff';
			this.nobg=params.nobg??=false;
			
			
			if(this.src){
				this.bgsprite=new Sprite();
				let promise=this.bgsprite.loadFromProperties({
					'src':this.src,
					'fit':true
				});
				this.append(this.bgsprite);
				return promise;
			}
		}
		onRender(ctx){
			super.onRender(ctx);
			if(!this.isVisible()){return;}
			if(this.bgsprite==null&&!this.nobg){
				const p=this.calculateWorldCoordinates();
				ctx.save();
					ctx.fillStyle=this.bgcolor;
					ctx.fillRect(p.x,p.y,this.w,this.h);
				ctx.restore();
			}
		}
		registerEventListener(event,callback,fireOnce){
			this.eventBroadcaster.registerEventListener(event,callback,fireOnce);
		}
		setVisible(visible){
			this.visible=visible;
		}
		toggleVisible(){
			this.visible=!this.visible;
		}
		isVisible(){
			return this.visible;
		}
		onKeydown(event){}
		onKeyup(event){}
		onMousemove(event){}
		onMousedown(event){}
		onMouseup(event){}
		onClick(event){}
		
	}
	window.Widget=Widget;
	
	class TextWidget extends Widget{
		constructor(){
			super();
		}
		loadFromProperties(params){
			super.loadFromProperties(params);
			this.textpadding=params.textpadding??={x:0,y:0};
			this.parseText(params.text);
		}
		parseText(text){
			this.text=text.split('\n');
		}
		onRender(ctx){
			if(!this.isVisible()){return;}
			super.onRender(ctx);
			const p=this.calculateWorldCoordinates();
			const padding=this.textpadding;
			ctx.save();
				ctx.font="bold 12px sans-serif";
				ctx.fillStyle='#eee';
				const step=12;
				for(let i=0;i<this.text.length;i++){
					ctx.fillText(this.text[i],p.x+padding.x,p.y+padding.y+step*i);
				}
			ctx.restore();
		}
	}
	window.TextWidget=TextWidget;
	class ProximityTextbox extends TextWidget{
		constructor(){
			super();
		}
		loadFromProperties(params){
			super.loadFromProperties(params);
			this.interactRange=params.interactrange??=200;
			
			
			this.activatorID=params.activator;
			this.activator=null;
		}
		onKeydown(event){  //refactor this
			super.onKeydown(event);
			if(!this.isVisible()){return;}
			if(event.which==69){
				GameState.setInMenu(true);
				const menu=SceneManager.getItemById("CraftMenu");
				menu.setVisible(true);
			}
			
		}
		postLoad(){
			this.activator=SceneManager.getItemById(this.activatorID);
		}
		onUpdate(time){
			super.onUpdate(time);
			if(this.activator==null){return;}
			this.setVisible(false);
			if(distanceTo(this.calculateWorldCoordinates(),this.activator.calculateWorldCoordinates())<this.interactRange){
				this.setVisible(true);
			}
		}

	}
	window.ProximityTextbox=ProximityTextbox;
	
	class Menu extends Widget{
		constructor(){
			super();
		}
		loadFromProperties(params){
			super.loadFromProperties(params);
			this.menuItems=params.menuitems;
			this.menuIdx=0;
			this.itemPadding=params.itempadding??={x:0,y:0};
			this.returnWidget=null;
			this.lastItem=null;
		}
		onRender(ctx){
			super.onRender(ctx);
			if(!this.isVisible()){return;}
			const p=this.calculateWorldCoordinates();
			const items=this.menuItems;
			const step=20;
			ctx.save();
			for(let i=0;i<items.length;i++){
				ctx.fillStyle='#eee';
				ctx.font="12px sans-serif";
				ctx.textBaseline='middle';
				if(i==this.menuIdx){
					ctx.font="bold 12px sans-serif";
					ctx.fillRect(p.x+this.w-10,p.y+(step*i)+this.itemPadding.y,5,5);
				}
				ctx.fillText(`${items[i].text} - [${items[i].cost} souls]`,p.x+this.itemPadding.x,p.y+(step*i)+this.itemPadding.y);
			}
			ctx.restore();
		}
		onKeydown(event){
			if(!GameState.isInMenu()||!this.isVisible()){return;}
			if(event.which==27){
				this.returnControl();
				this.setVisible(false);
			}				
			if(event.which==40){
				this.menuIdx++;
				if(this.menuIdx>=this.menuItems.length){
					this.menuIdx=0;
				}
			}
			if(event.which==38){
				this.menuIdx--;
				if(this.menuIdx<0){
					this.menuIdx=this.menuItems.length-1;
				}
			}
			if(event.which==13){
				this.attemptBuy(this.menuItems[this.menuIdx]); //refactor this
			}
		}
		returnControl(){
			if(this.returnWidget==null){
				GameState.setInMenu(false);
				this.eventBroadcaster.fireEvent("onleave");
			}
		}
		attemptBuy(item){
			const numSouls=GameState.getSouls();
			const cost=item.cost;
			if(numSouls>=cost){
				GameState.setSouls(numSouls-cost);
				this.lastItem=item;
				this.returnControl();
				this.setVisible(false);
				this.eventBroadcaster.fireEvent("onbuy");
			}else{
				
			}
		}
		retrieveLastItem(){
			const ret=this.lastItem;
			this.lastItem=null;
			return ret;
		}
		getSelectedItem(){
			return this.menuItems[this.menuIdx];
		}
	}
	window.Menu=Menu;
	
	class SoulCounter extends TextWidget{
		constructor(){
			super();
		}
		loadFromProperties(params){
			super.loadFromProperties(params);
			
		}
		onUpdate(time){
			super.onUpdate(time);
			this.text=[GameState.getSouls()];
		}
	}
	window.SoulCounter=SoulCounter;
	
	const DIALOG_PADDING=20;
	class DialogWidget extends Widget{
		constructor(){
			super();
		}
		loadFromProperties(params){
			super.loadFromProperties(params);
			this.text=params.text;
			this.fontSize=params.fontsize??=12;
			this.scrollSpeed=params.scrollspeed??=200;
			this.lastUpdate=0;
			this.fullPartIndex=0;
			this.textIndex=0;
			this.textParts=[];
			this.done=false;
			this.close=false;
			this.color=params.fontcolor??='#eee';
			this.lingerTime=params.lingertime??=3000;
			this.lingerUpdate=0;
			this.lingerDone=false;
			
			this.calculateTextParts();
		}
		reset(){
			this.done=false;
			this.fullPartIndex=0;
			this.textIndex=0;
		}
		isDone(){
			return this.done&&this.lingerDone;
		}
		shouldClose(){
			return this.close;
		}
		calculateTextParts(){
			let ctx=window.canvas.getContext();
			let parts=this.text.split(" ");
			let lineStr="";
			let rowLen=0;
			let rowLenMax=0;
			this.textParts=[];
			ctx.save();
				ctx.fillStyle=this.color;
				ctx.textBaseline='top';
				ctx.font=this.font;
				ctx.textAlign=this.align;
				for(let i=0;i<parts.length;i++){
					let w=ctx.measureText(parts[i]+" ").width;
					if(w+rowLen>this.w-DIALOG_PADDING){
						this.textParts.push(lineStr);
						rowLenMax=rowLenMax<rowLen?rowLen:rowLenMax;
						rowLen=0;
						lineStr="";
					}
					lineStr+=parts[i]+" ";
					rowLen+=w;
				}
				this.textParts.push(lineStr);
			ctx.restore();
			
			rowLenMax=rowLenMax==0?rowLen:rowLenMax;
			this.h=this.textParts.length*this.fontSize+(DIALOG_PADDING*2);
			this.w=rowLenMax+(DIALOG_PADDING*2);
		}
		onRender(ctx){
			super.onRender(ctx);
			if(!this.isVisible()){return;}
			const wc=this.calculateCoordinates();
			
			ctx.save();
				ctx.fillStyle=this.color;
				ctx.textBaseline='top';
				ctx.font=this.font;
				ctx.textAlign=this.align;
				let i=0;
				for(;i<this.fullPartIndex;i++){
					ctx.fillText(this.textParts[i],wc.x+DIALOG_PADDING,wc.y+(i*this.fontSize)+DIALOG_PADDING);
				}
				if(!this.done){
					ctx.fillText(this.textParts[this.fullPartIndex].substring(0,this.textIndex),wc.x+DIALOG_PADDING,wc.y+(i*this.fontSize)+DIALOG_PADDING);
				}
			ctx.restore();

			for(let i=0;i<this.children.length;i++){
				let child=this.children[i];
				child.onRender(ctx);
			}
		}
		
		onUpdate(time){
			super.onUpdate(time);
			if(!this.isVisible()){return;}
			let delta=time-this.lastUpdate;
			if(!this.done&&delta>this.scrollSpeed){
				this.textIndex++;
				if(this.textIndex>=this.textParts[this.fullPartIndex].length){
					this.textIndex=0;
					this.fullPartIndex++;
					if(this.fullPartIndex>=this.textParts.length){
						this.done=true;
						this.lingerUpdate=time;
						this.fullPartIndex=this.textParts.length;
					}
				}
				
				
				this.lastUpdate=time;
			}
			if(this.done&&!this.lingerDone){
				if(time-this.lingerUpdate>this.lingerTime){
					this.lingerDone=true;
				}
			}
		}
	}
	window.DialogWidget=DialogWidget;
	
	class DialogSequence extends SceneItem{
		constructor(){
			super();
		}
		loadFromProperties(params){
			super.loadFromProperties(params);
			this.done=false;
			this.active=params.active??=false;
		}
		getDialogs(){
			return this.getItemsByTypes([DialogWidget]);
		}
		getActiveDialog(){
			const dialogs=this.getDialogs();
			const active=dialogs.filter(dialog => dialog.isVisible());
			if(active.length>0){return active[0];}
			return null;
		}
		postLoad(){
			super.postLoad();
			const dialogs=this.getDialogs();
			dialogs.forEach(dialog => {
				dialog.setVisible(false);
			});
			if(this.active&&dialogs.length>0){
				this.setActive();
			}
		}
		setActive(){
			const dialogs=this.getDialogs();
			if(dialogs.length>0){
				dialogs[0].setVisible(true);
			}
			
		}
		nextDialog(active){
			const dialogs=this.getDialogs();
			let idx=dialogs.indexOf(active);
			active.reset();
			active.setVisible(false);
			idx++;
			if(idx>=dialogs.length){
				this.setDone(true);
				this.active=false;
				return;
			}
			dialogs[idx].setVisible(true);
		}
		setDone(val){
			this.done=val;
		}
		isDone(){
			return this.done;
		}
		onUpdate(time){
			super.onUpdate(time);
			if(this.isDone()){return;}
			const activeDialog=this.getActiveDialog();
			if(activeDialog!=null){
				if(activeDialog.isDone()){
					this.nextDialog(activeDialog);
				}
			}
		}
	}
	window.DialogSequence=DialogSequence;
	
	class GUI{
		constructor(params){
			const cnvs=window.canvas.getCanvas();
			this.children=[];
			if(params&&params.src!==undefined){
				this.Load(params.src);
			}
			//$(document).on(`keydown.guikeydown`,this.onKeydown.bind(this));
		}
		addChild(child){
			this.children.push(child);
		}
		onKeydown(event){
			/* return this.root.onKeydown(event); */
		}
		onMousemove(event){
			/* return this.root.onMousemove(event); */
		}
		onClick(event){
			/* return this.root.onClick(event); */
		}
		onMousedown(event){
			/* return this.root.onMousedown(event); */
		}
		onMouseup(event){
			/* return this.root.onMouseup(event); */
		}
		unFocusAll(){
			/* this.root.forceUnfocus(); */
		}
		isWidgetVisibleByName(name){
			/* let widget=this.getWidgetByName(name);
			return widget.isVisible(); */
		}
		appendToRoot(widget){
			/* this.getRoot().addChild(widget); */
		}
		removeFromRoot(widget){
			/* this.getRoot().removeChild(widget); */
		}
		getRoot(){
			/* return this.root; */
		}
	}
	GUI.prototype.getWidgetsByType=function(type){
		//return this.root.getWidgetsByType(type);
	}
	GUI.prototype.onRender=function(ctx){
		//this.root.onRender(ctx);
		this.children.forEach(item=>{
			item.onRender(ctx);
		});
	}
	GUI.prototype.onUpdate=function(time){
		//this.root.onUpdate(time);
		this.children.forEach(item=>{
			item.onUpdate(time);
		});
	}
	GUI.prototype.loadFromProperties=function(item){
		if(item.src!==undefined){
			this.Load(item.src);
		}
	}
	GUI.prototype.getWidgetById=function(id){
		return this.children.find(item => item.id==id);
	}
	GUI.prototype.Load=function(src,call){
		return fetch(src)
			.then(response => response.json())
			.then(data => { this.parseJSON(data,this)})
			.then(call);
	}
	GUI.prototype.parseJSON=function(data,parent){
		let widgets=data.widgets;
		for(let i=0;i<widgets.length;i++){
			let obj=widgets[i];
			let type=obj.type;
			
			let newWidget=new window[type](obj,parent);
			newWidget.loadFromProperties(obj);
			parent.addChild(newWidget);
			
			if(obj.widgets!==undefined){
				this.parseJSON(obj,newWidget);
			}
		}
	}
	
	GUI.prototype.Unload=function(){
		//this.root.Unload();
		this.children.forEach(item=>{
			item.Unload();
		});
		//$(document).off(`keydown.guikeydown`);
	}
	
	window.GUI=GUI;
	
})();