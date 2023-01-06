"use strict";

(function(){
	
	class Scene{
		constructor(canvas){
			this.name="";
			this.sceneSrc=null;
			this.assetsLoading=0;
			this.sceneProperties={};
			this.monsterClasses=[];
			this.lastSceneProps={};
			window.currentScene=this;
			this.GUI=null;
			this.canvas=canvas;
			//this.loadScene('assets/scenes/scene0.json');
		}
		getGUI(){
			return this.GUI;
		}
		async loadScene(src){
			this.lastSceneProps=this.sceneProperties;
			this.sceneSrc=src;
			this.Unload();
			
			const path=src;
			const response=await fetch(path);
			const json=await response.json();
			return this.onLoad(json);
		}
		async onLoad(json,callback){
			this.GUI=new GUI();
			return this.GUI.Load(json.gui).then(() => {this.onGUILoad(json)});
		}
		onGUILoad(json){
			this.parseSceneProperties(json.properties);
			let sceneItems=json.items;
			this.parseScene(sceneItems,SceneManager,true).then(()=>{
				SceneManager.postLoad();
				
/* 				const anchor=SceneManager.getItemById("CameraAnchor");
				window.Camera.setTarget(anchor); */

				window.requestAnimationFrame(this.run.bind(this));
			});
			//return new Promise(()=>{});
		}
		parseScene(json,parent,isRoot){
			let promises=[];
			try{
				for(let i=0;i<json.length;i++){
					let item=json[i];
					let type=item.type;
					console.log("Loading: "+type);
					let newItem=new window[type]();
					const ret=newItem.loadFromProperties(item);
					if(ret!==undefined){
						promises.push(ret);
					}
					parent.append(newItem,false);
					promises=promises.concat(this.parseChild(item,newItem,false));

				}
			}catch(e){
				console.log(e);
			}
			if(isRoot){
				return Promise.all(promises);
			}else{
				return promises;
			}
		}
		parseChild(item,newItem){
			if(item.hasOwnProperty("children")){
				return this.parseScene(item.children,newItem);
			}
			return [];
		}
		
		run(time){
			let cnvs=this.canvas;
			let ctx=cnvs.getContext();
			cnvs.clearScreen();
			
			
			SceneManager.onRender(ctx);
			SceneManager.onUpdate(time);
			
			if(this.GUI){
				this.GUI.onUpdate(time);
				this.GUI.onRender(ctx);
			}
			
			//let frontBufferCtx=cnvs.getFrontBufferContext();
			//frontBufferCtx.drawImage(cnvs.getCanvas(),0,0);
			
			window.requestAnimationFrame(this.run.bind(this));
		}
		init(){
		}
		Unload(){
			SceneManager.Unload();
			if(this.GUI){
				this.GUI.Unload();
				this.GUI=null;
			}
		}
		getSceneProperty(key){
			let p=this.sceneProperties;
			return p.hasOwnProperty(key)?p[key]:undefined;
		}
		getLastSceneProperty(key){
			let p=this.lastSceneProps;
			return p.hasOwnProperty(key)?p[key]:undefined;	
		}
		parseSceneProperties(properties){this.sceneProperties=properties;}
	}	
	window.Scene=Scene;
	
})();