"using strict";

// Create a show with two elements
var simpleElements = [
		{
			type : "image",
			id : "mikko-image-0",
			label : null,
			duration : 2.0,
			imageURL : "../../testdata/kakku.png"
		},

		{
			type : "text",
			id : 0,
			shape : "clear",
			texts : {
			     text : "long long long long long text"
			},
			duration : 2.0
		}
];


var simpleDesign = {

    timeline : simpleElements,

    background : {
        type : "plain",
        color : "#ffFFff"
    }

}
