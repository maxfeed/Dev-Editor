const HintAlert = function() {
	let window = UniqueWindow.apply(this, arguments);
	window.setGravity(Interface.Gravity.LEFT | Interface.Gravity.BOTTOM);
	window.setWidth(Interface.Display.MATCH);
	window.setTouchable(false);

	let actor = new android.transition.Slide(Interface.Gravity.BOTTOM),
		interpolator = new android.view.animation.DecelerateInterpolator();
	actor.setInterpolator(interpolator);
	actor.setDuration(window.getTime() / 6);
	window.setEnterTransition(actor);

	actor = new android.transition.TransitionSet();
	let slide = new android.transition.Slide(Interface.Gravity.BOTTOM),
		fade = new android.transition.Fade(android.transition.Visibility.MODE_OUT);
	actor.addTransition(slide);
	actor.addTransition(fade);
	actor.setDuration(window.getTime() / 6);
	window.setExitTransition(actor);

	window.resetContent();
	window.clearStack();
	return window;
};

HintAlert.prototype = new UniqueWindow;
HintAlert.prototype.TYPE = "HintAlert";

HintAlert.prototype.maximumHieracly = 3;
HintAlert.prototype.autoReawait = true;
HintAlert.prototype.consoleMode = false;
HintAlert.prototype.stackable = true;
HintAlert.prototype.forever = false;
HintAlert.prototype.time = 3000;

HintAlert.prototype.resetContent = function() {
	let content = new android.widget.LinearLayout(context);
	content.setGravity(Interface.Gravity.LEFT | Interface.Gravity.BOTTOM);
	content.setOrientation(Interface.Orientate.VERTICAL);
	this.setContent(content);
};

HintAlert.prototype.attachMessage = function(hint, color, background) {
	if (this.canStackedMore()) {
		let layout = new android.widget.LinearLayout(context);
		layout.setPadding(Interface.getY(48), Interface.getY(16), Interface.getY(48), Interface.getY(16));
		background = tryout(function() {
			if (background !== undefined) {
				if (!(background instanceof Drawable)) {
					background = Drawable.parseJson.call(this, background);
				}
				return background;
			}
			return new BitmapDrawable("popup");
		});
		if (background) background.attachAsBackground(layout);
		layout.setOrientation(Interface.Orientate.VERTICAL);
		layout.setGravity(Interface.Gravity.CENTER);
		let content = this.getContainer(),
			params = new android.widget.LinearLayout.LayoutParams(Interface.Display.WRAP, Interface.Display.WRAP);
		layout.setVisibility(Interface.Visibility.GONE);
		content.addView(layout, params);

		let text = new android.widget.TextView(context);
		text.setTextSize(Interface.getFontSize(22));
		text.setText(hint !== undefined ? String(hint) : translate("Nothing"));
		Logger.Log("hint: " + text.getText(), "DEBUG");
		if (!this.inConsoleMode()) text.setGravity(Interface.Gravity.CENTER);
		text.setTextColor(color || Interface.Color.WHITE);
		typeface && text.setTypeface(typeface);
		text.setMinimumWidth(Interface.getY(405));
		layout.addView(text);

		let actor = new android.transition.TransitionSet();
		actor.setOrdering(android.transition.TransitionSet.ORDERING_TOGETHER);
		let bounds = new android.transition.ChangeBounds(),
			fade = new android.transition.Fade();
		actor.setInterpolator(new android.view.animation.OvershootInterpolator());
		actor.setDuration(this.getTime() / 8);
		actor.addTransition(bounds);
		actor.addTransition(fade);
		this.beginDelayedTransition(actor);
		layout.setVisibility(Interface.Visibility.VISIBLE);
		return layout;
	}
	return null;
};

HintAlert.prototype.getMaximumStackedLimit = function() {
	return this.maximumHieracly != 0 ? this.maximumHieracly : 1;
};

HintAlert.prototype.getStackedCount = function() {
	return this.getContainer().getChildCount();
};

HintAlert.prototype.toInfinityStack = function() {
	this.setMaximumStacked(-1);
};

HintAlert.prototype.setMaximumStacked = function(count) {
	if (count == -1 || count > 0) {
		this.maximumHieracly = count;
	}
};

HintAlert.prototype.canStackedMore = function() {
	let limit = this.getMaximumStackedLimit();
	if (limit == -1) {
		let height = this.getContainer().getHeight();
		if (Interface.Display.HEIGHT - height < Interface.getY(90)) {
			limit = 0;
		}
	}
	return limit == -1 || (this.getStackedCount() < limit);
};

HintAlert.prototype.inConsoleMode = function() {
	return this.consoleMode;
};

HintAlert.prototype.setConsoleMode = function(mode) {
	this.consoleMode = !!mode;
};

HintAlert.prototype.forceAddMessage = function(hint, color, force) {
	if (!this.inConsoleMode() && this.findStackedHint(hint)) {
		this.flashHint(hint, color);
	} else if (this.canStackedMore()) {
		this.attachMessage(hint, color);
	} else if ((!this.isPinned() && this.inConsoleMode()) || (!this.isPinned() && this.isStackable() && !this.alreadyHasHint(hint))) {
		this.addToStack(hint, color);
	} else if (!this.isStackable() || (this.isPinned() && this.inConsoleMode())) {
		this.removeFirstStacked();
		this.attachMessage(hint, color);
	}
	if (force || (this.hasAutoReawait() && force !== false &&
		(this.isStackable() ? !this.hasMoreStack() : true)))
			this.reawait();
};

HintAlert.prototype.addMessage = function(hint, color, force) {
	if (this.getStackedCount() > 0 && (this.inConsoleMode() && !this.isPinned())) {
		this.addToStack(hint, color);
		if (force) this.reawait();
	} else this.forceAddMessage(hint, color, force);
};

HintAlert.prototype.removeFirstStacked = function() {
	let content = this.getContainer();
	if (content.getChildCount() > 0) {
		let actor = new android.transition.Fade();
		actor.setDuration(this.time / 12);
		this.beginDelayedTransition(actor);
		content.removeViewAt(0);
	}
};

HintAlert.prototype.next = function(force) {
	if (!force) this.reawait();
	if (this.hasMoreStack()) {
		let message = this.stack.shift();
		if (!this.canStackedMore()) {
			this.removeFirstStacked();
		}
		this.forceAddMessage(message[0], message[1]);
		return true;
	} else {
		this.removeFirstStacked();
		return this.getStackedCount() > 0;
	}
	return false;
};

HintAlert.prototype.isPinned = function() {
	return this.forever;
};

HintAlert.prototype.pin = function() {
	this.forever = true;
};

HintAlert.prototype.unpin = function() {
	this.forever = false;
};

HintAlert.prototype.isStackable = function() {
	return this.stackable;
};

HintAlert.prototype.setStackable = function(enabled) {
	this.stackable = !!enabled;
};

HintAlert.prototype.addToStack = function(hint, color) {
	if (maximumHints == -1 || this.stack.length > maximumHints - 1) {
		this.stack.pop();
	}
	this.isStackable() && this.stack.push([String(hint), color]);
};

HintAlert.prototype.stackIndex = function(hint) {
	if (!this.isStackable()) return -1;
	for (let i = 0; i < this.stack.length; i++) {
		if (this.stack[i][0] == String(hint)) return i;
	}
	return -1;
};

HintAlert.prototype.findStackedHint = function(hint) {
	let content = this.getContainer();
	for (let i = 0; i < content.getChildCount(); i++) {
		let view = content.getChildAt(i);
		if (view !== null && view.getChildCount() > 0) {
			let text = view.getChildAt(0);
			if (text !== null && (i === hint || text.getText() == String(hint))) {
				return text;
			}
		}
	}
	return null;
};

HintAlert.prototype.hasMoreStack = function() {
	return this.isStackable() ? this.stack.length > 0 : false;
};

HintAlert.prototype.alreadyHasHint = function(hint) {
	let stacked = this.stackIndex(hint) != -1;
	return stacked || this.findStackedHint(hint) !== null;
};

HintAlert.prototype.clearStack = function() {
	this.stack = [];
};

HintAlert.prototype.hasAutoReawait = function() {
	return this.autoReawait;
};

HintAlert.prototype.setAutoReawait = function(enabled) {
	this.autoReawait = !!enabled;
};

HintAlert.prototype.flashHint = function(hint, color) {
	let view = this.findStackedHint(hint);
	if (view === null) return false;
	let actor = new android.transition.Fade();
	actor.setInterpolator(new android.view.animation.CycleInterpolator(1.3));
	actor.setDuration(this.time / 8);
	view.setVisibility(Interface.Visibility.INVISIBLE);
	this.beginDelayedTransition(actor);
	if (color !== undefined) view.setTextColor(color);
	view.setVisibility(Interface.Visibility.VISIBLE);
	Logger.Log("flash hint: " + hint, "DEBUG");
	this.reawait();
	return true;
};

HintAlert.prototype.getTime = function() {
	return this.time !== undefined ? this.time : 3000;
};

HintAlert.prototype.setTime = function(ms) {
	ms > 0 && (this.time = preround(ms, 0));
	this.isOpened() && this.reawait();
};

HintAlert.prototype.reawait = function() {
	this.action && this.action.setCurrentTick(0);
};

HintAlert.prototype.show = function() {
	let scope = this;
	if (!this.action) {
		this.action = handleAction(function(action) {
			handle(function() {
				if (scope.next(true)) {
					action.run();
					return;
				}
				// TODO: @hide not stopping action or not working
				// action.destroy();
				// delete scope.action;
				// scope.hide();
				scope.dismiss();
			});
		}, function() {
			if (scope.isPinned()) scope.reawait();
			return scope.action && scope.isAttached();
		}, this.getTime());
		this.action.setOnCancelListener(function() {
			scope.hasMoreStack() && scope.clearStack();
			scope.action.complete();
			scope.action.destroy();
			delete scope.action;
		});
		UniqueWindow.prototype.show.apply(this, arguments);
	} else this.reawait();
};

HintAlert.prototype.dismiss = function() {
	this.action && this.action.destroy();
	delete this.action;
	UniqueWindow.prototype.dismiss.apply(this, arguments);
};

/**
 * Some useful code; warnings and information.
 */
const showHint = function(hint, color, reawait) {
	if (showHint.launchStacked !== undefined) {
		showHint.launchStacked.push({
			hint: hint,
			color: color,
			reawait: reawait
		});
		return;
	}
	handle(function() {
		let window = UniqueHelper.getWindow(HintAlert.prototype.TYPE);
		if (window === null) {
			window = new HintAlert();
		}
		window.setStackable(!hintStackableDenied);
		if (reawait && !window.canStackedMore()) {
			window.removeFirstStacked();
		}
		window.addMessage(hint, color, reawait);
		if (!window.isOpened()) window.show();
	});
};

showHint.launchStacked = [];

showHint.unstackLaunch = function() {
	let stack = this.launchStacked;
	delete this.launchStacked;
	delete this.unstackLaunch;
	for (let i = 0; i < stack.length; i++) {
		showHint(stack[i].hint, stack[i].color, stack[i].reawait);
	}
};
