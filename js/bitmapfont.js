"use strict";

(function(){
	
	class BitmapfontGlyph{
		constructor(json,bitmap){
			this.ascii=json.ascii;
			this.key=json.key;
			this.start=json.start;
			this.dimension=json.dimension;
			this.bitmap=bitmap;
		}
		onRender(ctx,idxX,idxY){
			const outX=this.dimension.w*idxX;
			const outY=this.dimension.h*idxY;
			ctx.save();
				ctx.drawImage(this.bitmap.Image(),
					this.start.x,
					this.start.y,
					this.dimension.w,
					this.dimension.h,
					outX,
					outY,
					this.dimension.w,
					this.dimension.h);
			ctx.restore();
		}
	}
	
	class Bitmapfont{
		constructor(){
			this.font={
				
			};
			this.size=16;
			this.bitmap=null;
		}
		loadFont(font){
			return fetch(font).then(data => data.json()).then((json) => {
				this.bitmap=new Sprite();
				return this.bitmap.load({src:json.src}).then((sprite) => {
					this.parseGlyphs(json);
					this.bitmap=sprite;
					return this;
				});
			});
		}
		parseGlyphs(json){
			for(let idx in json.size){
			/* json.size.forEach((size)=>{ */
				const size=json.size[idx];
				if(!this.font.hasOwnProperty(size)){
					this.font[idx]=[];
					
				}
				size.glyphs.forEach((glyph) => {
					const newGlyph=new BitmapfontGlyph(glyph,this.bitmap);
					this.font[idx].push(newGlyph);
				});
			}
		}
		setSize(size){
			this.size=size;
		}
		getCharacterFromAscii(ascii){
			if(!this.font.hasOwnProperty(this.size)){return null;}
			
			return this.font[this.size].find((glyph) => glyph.ascii.indexOf(ascii)!=-1);
				
			
		}
		/* getCharacterFromKey(key){
			
		} */
	}
	window.Bitmapfont=Bitmapfont;
	
	class BitmapFontCache{
		constructor(){
			
			this.cache={};
		}
		getFont(font){
			if(this.cache.hasOwnProperty(font)){
				return new Promise(()=>{return this.cache[font];},{});
			}
			return this.loadFont(font).then((newFont)=>{;
				this.cache[font]=newFont;
				return newFont;
			});
		}
		loadFont(font){
			const newFont=new Bitmapfont();
			return newFont.loadFont(font);
			//return fetch(font).then(data => data.json());
		}
	}
	window.BitmapFontCache=new BitmapFontCache();
	
	class BitmapfontText extends SceneItem{
		constructor(){
			super();
			this.text="";
			this.font="default";
			this.bitmapfont=null;//new Bitmapfont();
			this.glyphs=[];
		}
		loadFromProperties(params){
			super.loadFromProperties(params);
			this.text=params.text??=this.text;
			this.font=params.font??=this.font;
			
			return window.BitmapFontCache.getFont(this.font).then((newBMF) => {
				this.bitmapfont=newBMF;
				this.setText(this.text);
			});
			
		}
		setText(text){
			this.text=text;
			this.glyphs=[];
			for(let i=0;i<this.text.length;i++){
				const ascii=this.text.charCodeAt(i);
				const glyph=this.bitmapfont.getCharacterFromAscii(ascii);
				if(glyph!=undefined){
					this.glyphs.push(glyph);
				}
			}
		}
		onRender(ctx){
			super.onRender(ctx);
			
			ctx.save();
			const pos=this.getPosition();
			ctx.translate(pos.x,pos.y);
			let idx=0;
			for(let i=0;i<this.glyphs.length;i++){
				const glyph=this.glyphs[i];
				glyph.onRender(ctx,idx++,0);
			}
			ctx.restore();
		}
		onUpdate(time){
			super.onUpdate(time);
		}
	}
	window.BitmapfontText=BitmapfontText;
	
	const BitmapText=function(text){
		const newText=new BitmapfontText();
		text.loadFromProperties({
			"text":text
		});
		return newText;
	}
	
	class SATCheckText extends BitmapfontText{
		constructor(){
			super();
			this.conversion=["zero","one","two","three","four","five","six","seven","eight","nine","more than ten"];
		}
		onUpdate(time){
			super.onUpdate(time);
			const idx=globalNuMSAT>=this.conversion.length?this.conversion.length-1:globalNuMSAT;
			
			this.setText(this.conversion[idx]);
		}
	}
	window.SATCheckText=SATCheckText;
	
	
})();