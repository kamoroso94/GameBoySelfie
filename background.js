chrome.app.runtime.onLaunched.addListener(function() {
	chrome.app.window.create("index.html", {
		frame: {
			color: "#948F9E"
		},
		innerBounds: {
			width: 640,
			height: 576
		},
		resizable: false
	});
});