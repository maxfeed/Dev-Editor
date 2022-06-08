(function() {
	const launchModification = function(additionalScope) {
		if (this.isInstant !== undefined) {
			return;
		}
		if (additionalScope !== undefined) {
			__mod__.RunMod(additionalScope);
			return;
		}
		Launch();
	};
	
	try {
		ConfigureMultiplayer({
			isClientOnly: true
		});
	} catch (e) {
		launchModification({
			isOutdated: true
		});
		return;
	}
	
	launchModification();
})();
