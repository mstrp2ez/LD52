"use strict";


(function(){
	
	
	class GameState{
		constructor(){
			this.inMenu=false;
			this.numSouls=0;
			this.paused=false;
		}
		isPaused(){
			return this.inMenu;
		}
		setPaused(paused){
			this.paused=paused;
		}
		getSouls(){
			return this.numSouls;
		}
		setSouls(num){
			this.numSouls=num;
		}
		setInMenu(val){
			this.inMenu=val;
		}
		isInMenu(){
			return this.inMenu;
		}
	}
	window.GameState=new GameState();
	
})();