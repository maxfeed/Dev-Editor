/**
 * Attaches information messages to control menus.
 * Requires [[prepareAdditionalInformation]] call
 * to provide control sizes and limit count.
 * @param {MenuWindow} control menu to attach
 * @returns {boolean} can be attached more
 */
const attachAdditionalInformation = function(control) {
	let session = attachAdditionalInformation.session;
	if (session === undefined) throw null;
	return session.hasMore() && session.attachNext(control);
};

const attachWarningInformation = function(control) {
	if (warningMessage !== null) {
		control.addMessage("menuNetwork", translate(warningMessage), function(message) {
			control.removeElement(message), warningMessage = null;
		});
	}
};

const prepareAdditionalInformation = function(count, limit) {
	attachAdditionalInformation.session = new AdditionalMessageFactory.Session(count, limit);
};

const finishAttachAdditionalInformation = function() {
	let session = attachAdditionalInformation.session;
	if (session === undefined) return false;
	session.complete();
	delete attachAdditionalInformation.session;
	return true;
};

const registerAdditionalInformation = function() {
	if (AdditionalMessageFactory.getRegisteredCount() > 0) AdditionalMessageFactory.resetAll();
	AdditionalMessageFactory.register("inspectorType", translate("Modification still in development state, so something may not work properly."), .2);
	AdditionalMessageFactory.register("explorerExtensionProject", translate("Load or create your first editor, it'll appear here."), .75, function() {
		return ProjectProvider.getCount() == 0;
	});
	AdditionalMessageFactory.register("explorerExtensionScript", translate("Use scripts from your mods to import, simply find them in internal exporer."), .5, function() {
		return noImportedScripts;
	});
	AdditionalMessageFactory.registerClickable("menuBoard", translate("Have any suggestions to improve environment? Tell about it on our board in Trello!"), .2, function(message) {
		let intent = new android.content.Intent(android.content.Intent.ACTION_VIEW,
			android.net.Uri.parse("https://trello.com/b/wzYtpA3W/dev-editor"));
		getContext().startActivity(intent);
	});
	AdditionalMessageFactory.registerClickable("menuNetworkUser", translate("Want to follow modification updates? Checkout out VK community and starts to be part of it!"), .15, function(message) {
		let intent = new android.content.Intent(android.content.Intent.ACTION_VIEW,
			android.net.Uri.parse("https://vk.com/club168765348"));
		getContext().startActivity(intent);
	});
	AdditionalMessageFactory.registerClickable("menuNetworkSupport", translate("Enjoying development process? Let's discuss, donate and write any suggestions to our messages."), .1, function(message) {
		let intent = new android.content.Intent(android.content.Intent.ACTION_VIEW,
			android.net.Uri.parse("https://vk.com/donut/club168765348"));
		getContext().startActivity(intent);
	});
	AdditionalMessageFactory.registerClickable("menuNetworkConnect", translate("We're in search of developers for project. You may contribute and reshare our open source code."), .1, function(message) {
		let intent = new android.content.Intent(android.content.Intent.ACTION_VIEW,
			android.net.Uri.parse("https://github.com/nernar/dev-editor"));
		getContext().startActivity(intent);
	});
	AdditionalMessageFactory.registerClickable("renderDefineItem", translate("Do you want to see new abilities before it released? Join reopened testing team right now!"), .5, function(message) {
		let intent = new android.content.Intent(android.content.Intent.ACTION_VIEW,
			android.net.Uri.parse("https://vk.me/join/AJQ1d98l9x_XZG7T1qjlEBEf="));
		getContext().startActivity(intent);
	});
	AdditionalMessageFactory.registerClickable("menuBoardConfig", translate("Too much messages on screen? You may deny hint sequences and view only recents."), .25, function(message) {
		hintStackableDenied = !loadSetting("performance.hint_stackable", "boolean", false);
		showHint(translate("Option successfully changed"));
		let control = message.getWindow();
		control.removeElement(message);
		__config__.save();
	}, function() {
		return !hintStackableDenied;
	});
	AdditionalMessageFactory.registerClickable("menuBoardConfig", translate("Don't want to lost any information from messages? Try allow hints sequences."), .25, function(message) {
		hintStackableDenied = !loadSetting("performance.hint_stackable", "boolean", true);
		showHint(translate("Option successfully changed"));
		let control = message.getWindow();
		control.removeElement(message);
		__config__.save();
	}, function() {
		return hintStackableDenied;
	});
	AdditionalMessageFactory.registerClickable("explorerSelectionWhole", translate("Have troubles with interface scales? Try to reset it with default sizes."), .5, function(message) {
		uiScaler = loadSetting("interface.interface_scale", "number", 1., 1.);
		fontScale = loadSetting("interface.font_scale", "number", 1., 1.);
		showHint(translate("Option successfully changed"));
		let control = message.getWindow();
		control.removeElement(message);
		__config__.save();
	}, function() {
		return uiScaler != 1. || fontScale != 1.;
	});
};

/**
 * Used to import, load, replace or merge project
 * provider data. User may select any availabled
 * data or [[action]] willn't launched.
 * @param {Array} result selectable data
 * @param {function} action to do with data
 * @param {string} type project required type
 * @param {boolean} single is requires single selection
 */
const selectProjectData = function(result, action, type, single) {
	tryout(function() {
		if (!result || result.length == 0) return;
		let items = [],
			data = [],
			selected = [];
		result.forEach(function(element, index) {
			if (element && (type === undefined || element.type == type)) {
				items.push(element.define && element.define.id !== undefined ? element.define.id : "unknown");
				(!single) && selected.push(importAutoselect);
				data.push(element);
			}
		});
		if (items.length == 0) {
			showHint(translate("There's doesn't has any availabled data"));
			return;
		}
		if (items.length == 1) {
			action && action(single ? data[0] : data);
			return;
		}
		select(translate("Element selector"), items, function(selected, items) {
			let value = [];
			if (typeof selected == "object") {
				selected.forEach(function(element, index) {
					element && value.push(data[index]);
				});
			} else if (selected >= 0) {
				value.push(data[selected]);
			}
			action && action(value);
		}, !single, selected);
	});
};

const showModuleInfo = function(mod) {
	return tryout(function() {
		let builder = new android.app.AlertDialog.Builder(getContext(),
			android.R.style.Theme_DeviceDefault_Dialog);
		builder.setTitle(translate(mod.modName) + " " + translate(mod.version));
		builder.setMessage((mod.description && mod.description.length > 0 ? translate(mod.description) + "\n" : String()) +
			translate("Developer: %s", translate(mod.author || "Unknown")) + "\n" + translate("State: %s", translate(mod.result === true ?
				"ACTIVE" : mod.result === false ? "OUTDATED" : mod.result.lineNumber !== undefined ? "FAILED" : !mod.result ? "DISABLED" : "UNKNOWN")));
		builder.setNegativeButton(translate("Remove"), function() {
			confirm(translate("Warning!"), translate("Module will be uninstalled with all content inside, please notice that's you're data may be deleted.") + " " +
				translate("Do you want to continue?"),
				function() {
					if (mod.result === true) {
						showHint(translate("Restart game for better stability"));
					}
					eval(mod.modName.replace(/\W/, String()) + " = null;");
					// TODO: ExecuteableSupport.uninstall(mod.modName);
					PROJECT_TOOL.describe();
				});
		});
		builder.setPositiveButton(translate("OK"), null);
		builder.create().show();
		return true;
	}, false);
};

const confirm = function(title, message, action, button) {
	handle(function() {
		let builder = new android.app.AlertDialog.Builder(getContext(),
			android.R.style.Theme_DeviceDefault_Dialog);
		if (title !== undefined) builder.setTitle(title || translate("Confirmation"));
		if (message !== undefined) builder.setMessage(String(message));
		builder.setNegativeButton(translate("Cancel"), null);
		builder.setPositiveButton(button || translate("Yes"), action ? function() {
			tryout(action);
		} : null);
		builder.setCancelable(false);
		builder.create().show();
	});
};

const select = function(title, items, action, multiple, approved) {
	handle(function() {
		if (!Array.isArray(items)) MCSystem.throwException("ModdingTools: nothing to select inside select");
		let builder = new android.app.AlertDialog.Builder(getContext(),
			android.R.style.Theme_DeviceDefault_Dialog);
		if (title !== undefined) builder.setTitle(title || translate("Selection"));
		builder.setNegativeButton(translate("Cancel"), null);
		if (multiple) {
			if (approved === undefined) approved = [];
			builder.setMultiChoiceItems(items, approved, function(dialog, index, active) {
				tryout(function() {
					approved[index] = Boolean(active);
				});
			});
			builder.setNeutralButton(translate("All"), action ? function() {
				tryout(function() {
					for (let i = 0; i < approved.length; i++) {
						approved[i] = true;
					}
					action && action(approved, items);
				});
			} : null);
			builder.setPositiveButton(translate("Select"), action ? function() {
				tryout(function() {
					if (approved.indexOf(true) == -1) {
						select(title, items, action, multiple, approved);
					} else action && action(approved, items);
				});
			} : null);
		} else {
			builder.setItems(items, function(dialog, index) {
				tryout(function() {
					action && action(index, items[index]);
				});
			})
		}
		builder.setCancelable(false);
		builder.create().show();
	});
};

const selectFile = function(availabled, action, outside, directory) {
	handle(function() {
		let explorer = new ExplorerWindow();
		availabled && explorer.setFilter(availabled);
		let bar = explorer.addPath().setPath(directory || Dirs.PROJECT);
		bar.setOnOutsideListener(function(bar) {
			if (outside !== undefined) {
				outside && outside() !== false && explorer.hide();
			} else explorer.dismiss();
		});
		explorer.setOnSelectListener(function(popup, file) {
			explorer.dismiss();
			action && action(file);
		});
		explorer.show();
	});
};

const saveFile = function(name, availabled, action, outside, directory) {
	handle(function() {
		let explorer = new ExplorerWindow();
		availabled && explorer.setFilter(availabled);
		let bar = explorer.addPath().setPath(directory || Dirs.PROJECT);
		bar.setOnOutsideListener(function(bar) {
			if (outside !== undefined) {
				outside && outside() !== false && explorer.hide();
			} else explorer.dismiss();
		});
		let rename = explorer.addRename();
		availabled && rename.setAvailabledTypes(availabled);
		name && rename.setCurrentName(name);
		rename.setOnApproveListener(function(widget, file, last) {
			let approve = function() {
				explorer.dismiss();
				action && action(file, last);
			};
			if (file.exists()) {
				confirm(translate("File is exists"), translate("File is already created, that process will be rewrite it. Continue?"), function() {
					approve();
				});
			} else approve();
		});
		explorer.show();
	});
};
