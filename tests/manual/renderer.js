
renderer = {
		
	init : function() {
		$("button[name=render]").click( function() {
			// Create sample show
			
			var timeliner = krusovice.Timeliner.createSimpleTimeliner(simpleElements, null);
			var plan = timeliner.createPlan();        
			
			var url = $("input[name=rendering-service-url]").val();
			
			// JSON payload send to the server
			var data = {
					plan : plan,
					email : "mikko@industrialwebandmagic.com"
			}
						
			var params = { json_data :JSON.stringify(data) };
			
			$.getJSON(url, params, function(data, textStatus, jqXHR) {
				var message = data.message;
				alert("Got response:" + message);
			});
			
		});
	}
		
};

document.addEventListener("DOMContentLoaded", function() {    
	// Dynamically load debug mode Krusovice
	krusovice.load(function() {
		renderer.init();
	}, true);
});
               