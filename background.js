chrome.app.runtime.onLaunched.addListener(function() {
	chrome.app.window.create("index.html", {
		id: "gbselfie",
		frame: {
			color: "#948f9e"
		},
		innerBounds: {
			width: 640,
			height: 576
		},
		icon: "icons/favicon-96.png",
		resizable: false
	});
});
