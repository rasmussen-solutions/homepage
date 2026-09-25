/* Lysboks til skærmbillederne på projektsiderne. */
(function () {
	"use strict";
	var lb = document.getElementById("cs-lb");
	if (!lb) return;
	var img = lb.querySelector("img");
	var close = lb.querySelector("button");
	var opener = null;

	function hide() {
		lb.hidden = true;
		if (opener) opener.focus();
	}

	Array.prototype.forEach.call(document.querySelectorAll(".cs-shot button"), function (b) {
		b.addEventListener("click", function () {
			var thumb = b.querySelector("img");
			img.src = thumb.src;
			img.alt = thumb.alt;
			opener = b;
			lb.hidden = false;
			close.focus();
		});
	});
	close.addEventListener("click", hide);
	lb.addEventListener("click", function (e) { if (e.target === lb) hide(); });
	document.addEventListener("keydown", function (e) { if (e.key === "Escape" && !lb.hidden) hide(); });
})();
