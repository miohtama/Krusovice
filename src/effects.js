
var krusovice = krusovice || {};


krusovice.effects = {};

krusovice.effects.LinearMove = function() {
		
}

krusovice.effects.LinearMove.prototype = {
	
	getDefaults : function(animation) {
	
		defaults = {};
		
		if(animation == "in") {
			this.positions = [] 
		}
		
		return defaults;
	}
}




