Callback.addCallback("CoreEngineLoaded", function(api) {
	context.runOnUiThread(function() {
		let window = context.getWindow();
		if (__code__.startsWith("testing")) {
			window.addFlags(android.view.WindowManager.LayoutParams.FLAG_SECURE);
		}
		if (isHorizon) {
			window.getDecorView().setSystemUiVisibility(android.view.View.SYSTEM_UI_FLAG_IMMERSIVE);
			window.addFlags(android.view.WindowManager.LayoutParams.FLAG_LAYOUT_NO_LIMITS);
		}
	});
});

MCSystem.setLoadingTip("Profiling Process");

context.runOnUiThread(function() {
	show.button = new android.widget.Button(context);
	show.button.setText("Eval");
	show.button.setOnClickListener(show);
	
	show.window = new FocusableWindow();
	show.window.setGravity(Ui.Gravity.BOTTOM | Ui.Gravity.RIGHT);
	show.window.setContent(show.button);
	show.window.show();
});

if (__code__.startsWith("develop")) {
	let folder = new java.io.File(Dirs.IMAGE);
	let out = new java.io.File(Dirs.ASSET);
	ImageFactory.encodeFolder(folder, out, true);
}

// try {
	// ExecutableSupport.newInstance("zhekasmirnov.launcher.mod.build.ModLoader").instance.modsList.remove(__mod__);
// } catch (e) {
	// __code__.startsWith("develop") && reportError(e);
	// Logger.Log("Dev Editor assertion failed, it's may cause some problems", "Warning");
// }
