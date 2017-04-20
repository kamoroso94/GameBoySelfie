"use strict";

class GBSelfie {
    constructor() {
    	this.localMediaStream = null;
    	this.video = null;
    	this.sound = null;
    	this.display = null;
    	this.canvas = null;
    	this.ctx = null;
    	this.draft = null;
    	this.draftCtx = null;
    	this.filterOutput = null;
    	this.shutter = null;
    	this.offsetX = 0;
    	this.offsetY = 0;
    	this.scale = 1;
    	this.colors = [
    		15, 56, 15,
    		48, 98, 48,
    		139, 172, 15,
    		155, 188, 15
    	];
    	this.thresholdMap4x4 = [
    		[1, 9, 3, 11],
    		[13, 5, 15, 7],
    		[4, 12, 2, 10],
    		[16, 8, 14, 6]
    	];
    }

	init() {
		const width = 160;
		const height = 144;

		this.initDisplay();

		this.sound = new Audio();
		this.sound.src = `audio/shutter.${this.sound.canPlayType("audio/mpeg") ? "mp3" : "ogg"}`;
		this.sound.preload = "auto";
		this.video = document.querySelector("video");
		this.canvas = document.getElementById("screen");
		this.ctx = this.canvas.getContext("2d");
		this.shutter = document.getElementById("shutter");
		this.draft = document.createElement("canvas");
		this.draft.width = width;
		this.draft.height = height;
		this.draft.style.display = "none";
		this.draftCtx = this.draft.getContext("2d");

		this.initVideo(width, height);
	}

	initDisplay() {
		this.display = new Game();

		this.display.addEventListener("draw", (event) => {
			const {dt} = event.detail;

			if(this.filterOutput) {
				this.ctx.putImageData(this.filterOutput, 0, 0);
				this.filterOutput = null;
			}
		});

		this.display.addEventListener("tick", (event) => {
			const {dt} = event.detail;

			this.draftCtx.drawImage(
				this.video,
				this.offsetX,
				this.offsetY,
				10 * this.scale + this.offsetX,
				9 * this.scale + this.offsetY,
				0,
				0,
				this.draft.width,
				this.draft.height
			);
			const input = this.draftCtx.getImageData(
				0,
				0,
				this.draft.width,
				this.draft.height
			);
			const output = this.draftCtx.createImageData(640, 576);

			// imageData
			const width = input.width;
			const height = input.height;
			const pixels = input.data;

			// filter
			for(let i = 0; i < pixels.length; i += 4) {
				const x = i / 4 % width;
				const y = Math.floor(i / 4 / width);
				const map = this.thresholdMap4x4[x % 4][y % 4];

				const gray = Math.floor(
					0.2126 * pixels[i + 0] +
					0.7152 * pixels[i + 1] +
					0.0722 * pixels[i + 2]
				);
				const oldPixel = gray + gray * map / 17;
				const newPixel = Math.max(0, Math.min(3, Math.floor(oldPixel * 3 / 255)));

				for(let k = 0; k < 4; k++) {
					for(let h = 0; h < 4; h++) {
						const j = 16 * x + 64 * width * y + 4 * h + 16 * width * k;
						output.data[j + 0] = this.colors[3 * newPixel + 0];
						output.data[j + 1] = this.colors[3 * newPixel + 1];
						output.data[j + 2] = this.colors[3 * newPixel + 2];
						output.data[j + 3] = 255;
					}
				}
			}
			this.filterOutput = output;
		});
	}

	initVideo(width, height) {
		if(navigator.mediaDevices) {
			navigator.mediaDevices.getUserMedia({
				video: {width, height, facingMode: "user"}
			}).then((stream) => this.load(stream)).catch((error) => {
				console.log(error);
				this.hideWebcam();
			});
		} else {
			console.log("getUserMedia() unsupported");
			this.hideWebcam();
		}
	}

	load(stream) {
		if("srcObject" in this.video) {
			this.video.srcObject = stream;
		} else {
			throw new Error("video.srcObject unsupported");
		}

		this.localMediaStream = stream;

		this.video.addEventListener("loadeddata", (event) => {
			document.body.appendChild(this.draft);

			this.orient();

			this.shutter.style.display = "block";
			this.shutter.addEventListener("click", (event) => {
				const timestamp = Date.now();

				this.display.pause();
				setTimeout(() => {
					this.display.resume();
				}, 500);
				this.sound.currentTime = 0;
				this.sound.play();
				this.href = this.canvas.toDataURL();
				this.download = `img${timestamp}`;
			});

            this.shutter.classList.add("active");
            this.display.resume();
		});
	}

	orient() {
		const w = this.video.videoWidth;
		const h = this.video.videoHeight;
		this.scale = Math.min(Math.floor(w / 10), Math.floor(h / 9));
		this.offsetX = Math.floor((w - 10 * this.scale) / 2);
		this.offsetY = Math.floor((h - 9 * this.scale) / 2);
	}

	hideWebcam() {
		this.video.parentNode.removeChild(this.video);
        this.canvas.style.backgroundImage = `url("images/error.png")`;
        this.shutter.classList.remove("active");
        this.display.pause();
	}
}

window.addEventListener("load", (event) => {
    const gbselfie = new GBSelfie();
    gbselfie.init();
});
