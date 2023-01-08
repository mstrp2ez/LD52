"use strict";

(function(){
	
	class GameAudio extends SceneItem{
		constructor(){
			super();
			this.audio=null;
		}
		loadFromProperties(params){
			this.autoPlay=params.autoplay??=false;
			this.src=params.src;
			this.loop=params.loop??=false;
			this.load(this.src);
		}
		load(src){
			this.audio=new Audio(src);
			this.audio.addEventListener("canplaythrough", (event) => {
				if(this.autoPlay){
					this.audio.loop=this.loop;
					this.play();
				}
			});
		}
		play(){
			if(this.audio==null||this.audio.readyState!=4){return;}
			this.audio.play();
		}
		stop(){
			if(this.audio==null){return;}
			this.audio.stop();
		}
	}
	window.GameAudio=GameAudio;
	
})();