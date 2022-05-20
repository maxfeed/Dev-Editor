const monthToName = function(number) {
	let monthes = ["Jan", "Feb", "Mar", "Apr", "May", "Jun", "Jul", "Aug", "Sep", "Oct", "Nov", "Dec"];
	return translate(monthes[number < 0 ? 0 : number > 11 ? 11 : number]);
};

const stringifyObject = function(obj, identate, callback) {
	if (callback === undefined) {
		callback = {};
	}
	const recursiveStringify = function(obj, tabs) {
		if (callback.onUpdate) {
			callback.onUpdate();
		}
		return tryout(function() {
			if (obj === null) {
				return "null";
			}
			switch (typeof obj) {
				case "undefined":
					return "undefined";
				case "string":
					obj = new java.lang.String(obj);
					obj = obj.replaceAll("\"", "\\\\\"");
					obj = obj.replaceAll("\t", "\\\\t");
					obj = obj.replaceAll("\n", "\\\\n");
					return "\"" + obj + "\"";
				case "number":
					return String(preround(obj));
				case "boolean":
					return String(obj);
				case "object":
					if (Array.isArray(obj)) {
						let array = [],
							tabbed = false;
						for (let i = 0; i < obj.length; i++) {
							let result = recursiveStringify(obj[i], tabs);
							if (result && result.length > 0) {
								if (identate) {
									if (result.indexOf("\n") != -1 || result.length > 48) {
										if (!tabbed) {
											tabbed = true;
											tabs += "\t";
										}
										array.push(result + (i < obj.length ? "\n" + tabs : String()));
									} else if (i != 0) {
										array.push(" " + result);
									} else array.push(result);
								} else array.push(result);
							}
						}
						return "[" + array.join(",") + "]";
					} else {
						let array = [],
							tabbed = false,
							last, count = 0;
						for (let counted in obj) {
							last = counted;
							count++;
						}
						for (let item in obj) {
							let result = recursiveStringify(obj[item], tabs);
							if (result && result.length > 0) {
								if (identate) {
									if (result.indexOf("\n") != -1 || result.length > 8) {
										if (!tabbed) {
											tabbed = true;
											tabs += "\t";
										}
										array.push(item + ": " + result + (item != last ? "\n" + tabs : String()));
									} else if (item != 0) {
										array.push(" " + item + ": " + result);
									} else array.push(result);
								} else array.push("\"" + item + "\":" + result);
							}
						}
						let joined = array.join(",");
						return (identate ? tabbed ? "{\n" + tabs : "{ " : "{") + joined +
							(identate ? tabbed ? tabs.replace("\t", String()) + "\n}" : " }" : "}");
					}
					default:
						if (callback.onPassed) {
							callback.onPassed(obj, typeof obj);
						}
			}
		});
	};
	return recursiveStringify(obj, String());
};

const readFile = function(path, isBytes, action) {
	handleThread(function() {
		let file = new java.io.File(String(path));
		if (!file.exists()) return;
		let readed = isBytes ? Files.readBytes(file) : Files.read(file);
		if (typeof action == "function") action(readed);
	});
};

const exportProject = function(object, isAutosave, path, action) {
	return AsyncSnackSequence.access("internal.js", [path, object, 30,
		isAutosave ? translate("Autosaving") : translate("Exporting"),
		isAutosave ? translate("Autosaved") : translate("Exported")], action);
};

const compileData = function(text, type, additional) {
	if (type == "string") text = "\"" + text + "\"";
	let code = "(function() { return " + text + "; })();",
		scope = runAtScope(code, additional, "compile.js");
	return scope.error ? scope.error : !type ? scope.result :
		type == "string" ? String(scope.result) :
		type == "number" ? parseInt(scope.result) :
		type == "float" ? parseFloat(scope.result) :
		type == "object" ? scope.result : null;
};

const formatExceptionReport = function(error, upper) {
	let report = localizeError(error),
		point = report.charAt(report.length - 1);
	if (!/\.|\!|\?/.test(point)) report += ".";
	let char = report.charAt(0);
	if (upper) char = char.toUpperCase();
	else if (upper !== null) char = char.toLowerCase();
	if (error && typeof error == "object" && error.lineNumber !== undefined) {
		return char + report.substring(1) + " (#" + error.lineNumber + ")";
	}
	return char + report.substring(1);
};

const importProject = function(path, action) {
	readFile(path, true, function(bytes) {
		let result = decompileFromProduce(bytes),
			data = compileData(result, "object");
		if (data && !(data.lineNumber === undefined)) {
			handle(function() {
				action && (data.length !== undefined ?
					action(data) : action([data]));
			});
		} else {
			confirm(translate("Impossible open file"),
				translate("Looks like, project is damaged. Check project and following exception information:") +
				" " + (data ? formatExceptionReport(data) : translate("empty project.")) + "\n\n" +
				translate("Do you want to retry?"),
					function() {
						importProject(path, action);
					});
		}
	});
};

const importScript = function(path, action) {
	readFile(path, false, function(text) {
		let result = compileScript(text);
		if (result !== null) {
			action && handle(function() {
				action(result);
			});
		}
	});
};

const compileScript = function(text) {
	let code = "(function() { try { " + text + "\n\t} catch (e) {" +
		"\n\t\t__data__.error = e;\n\t}\n\treturn __data__;\n})();",
		scope = runAtScope(code, getScriptScope(), "import.js");
	if (noImportedScripts) {
		noImportedScripts = false;
		loadSetting("user_login.imported_script", "boolean", true);
		__config__.save();
	}
	if (scope.error) retraceOrReport(scope.error);
	else if (scope.result && scope.result.error) {
		retraceOrReport(scope.result.error);
	}
	return scope.result || null;
};

const getScriptScope = function() {
	let scope = {
		__data__: [],
		Callback: {
			addCallback: function(name, func) {
				try {
					func();
				} catch (e) {
					// Something may happened
				}
			}
		},
		BlockID: {},
		IDRegistry: {
			fromString: function(id) {
				return scope.BlockID[id] !== undefined ? scope.BlockID[id] : -1;
			},
			genBlockID: function(name) {
				let nid = scope.BlockID[name] = scope.__data__.length;
				scope.__data__[nid] = {
					type: "block",
					define: {
						id: name
					},
					renderer: [],
					collision: []
				};
				return nid;
			}
		},
		Block: {
			createBlock: function(id, data, special) {
				let nid = scope.IDRegistry.fromString(id);
				if (nid == -1) return;
				data && (scope.__data__[nid].define.data = stringifyObject(data, true));
				special && (scope.__data__[nid].define.special = stringifyObject(special, true));
			},
			createSpecialType: function(params) {
				return params;
			},
			setShape: function(id, x1, y1, z1, x2, y2, z2) {
				scope.__data__[id].define.shape = {
					x1: x1,
					y1: y1,
					z1: z1,
					x2: x2,
					y2: y2,
					z2: z2
				};
			},
			setBlockShape: function(id, pos1, pos2) {
				scope.__data__[id].define.shape = {
					x1: pos1.x,
					y1: pos1.y,
					z1: pos1.z,
					x2: pos2.x,
					y2: pos2.y,
					z2: pos2.z
				};
			}
		},
		ICRender: {
			Model: function() {
				this.renderer = [];
				this.addEntry = function(model) {
					model && this.renderer.push({
						boxes: model.boxes
					});
				};
			},
			CollisionShape: function() {
				this.shape = [];
				this.addEntry = function() {
					let entry = new scope.BlockRenderer.Collision();
					this.shape.push({
						boxes: entry.boxes
					});
					return entry;
				};
			}
		},
		BlockRenderer: {
			Model: function() {
				this.boxes = [];
				this.addBox = function(x1, y1, z1, x2, y2, z2, texture, data) {
					let index = this.boxes.push({
						x1: x1,
						y1: y1,
						z1: z1,
						x2: x2,
						y2: y2,
						z2: z2
					}) - 1;
					if (texture !== undefined) this.boxes[index].texture = texture;
					if (data !== undefined) this.boxes[index].texture = [[texture, data]];
				};
			},
			Collision: function() {
				this.boxes = [];
				this.addBox = function(x1, y1, z1, x2, y2, z2) {
					this.boxes.push({
						x1: x1,
						y1: y1,
						z1: z1,
						x2: x2,
						y2: y2,
						z2: z2
					});
				};
			},
			createModel: function() {
				return new this.Model();
			},
			setStaticICRender: function(id, meta, render) {
				if (!(id >= 0)) {
					scope.__data__.push({
						type: "block",
						define: {
							id: "invalidIdentifier"
						},
						renderer: render.renderer,
						collision: []
					});
				} else scope.__data__[id].renderer = render.renderer;
			},
			setCustomCollisionShape: function(id, meta, collision) {
				if (!(id >= 0)) {
					scope.__data__.push({
						type: "block",
						define: {
							id: "invalidIdentifier"
						},
						renderer: [],
						collision: collision.shape
					});
				} else scope.__data__[id].collision = collision.shape;
			},
			enableCoordMapping: function(id, meta, render) {
				this.setStaticICRender(id, meta, render);
			}
		},
		Transition: function(obj) {
			this.__data__ = (scope.__data__[scope.__data__.length] = {
				type: "transition",
				define: {
					starting: {}
				},
				animation: [{
					frames: []
				}]
			});
			this.__compareVectorPoint = function(index, request) {};
			this.addFrame = function(x, y, z, yaw, pitch, duration, interpolator) {
				let index = this.__data__.animation[0].frames.push({
					x: x,
					y: y,
					z: z,
					yaw: yaw,
					pitch: pitch,
					duration: duration || 1 / (this.__data__.define.fps || 60)
				}) - 1;
				if (typeof interpolator != "undefined")
					this.__data__.animation[0].frames[index].interpolator = interpolator;
			};
			this.addPoint = function(x, y, z, yaw, pitch) {};
			this.getRelativePoint = function() {};
			this.setPoint = function(x, y, z, yaw, pitch) {};
			this.setFramesPerSecond = function(limit) {
				this.__data__.define.fps = limit;
			};
			this.start = function() {};
			this.stop = function() {};
			this.isStarted = function() {};
			this.withFrom = function(x, y, z, yaw, pitch) {
				this.__data__.define.starting = {
					x: x,
					y: y,
					z: z,
					yaw: yaw,
					pitch: pitch
				};
			};
			this.withEntity = function(entity) {
				this.__data__.define.entity = entity;
			};
			this.withOnStartListener = function(listener) {};
			this.withOnFrameListener = function(listener) {};
			this.withOnFinishListener = function(listener) {};
			this.withFrames = function(frames) {
				for (let i = 0; i < frames.length; i++) {
					this.addFrame(frames[i].x, frames[i].y, frames[i].z,
						frames[i].yaw, frames[i].pitch,
						frames[i].duration, frames[i].vector);
				}
			};
			if (obj) {
				typeof obj == "object" && this.withFrames(obj);
				typeof obj == "number" && this.withEntity(obj);
			}
		}
	};
	scope.Transition.Interpolator = {
		LINEAR: 0,
		ACCELERATE: 1,
		DECELERATE: 2,
		ACCELERATE_DECELERATE: 3
	};
	return scope;
};

const Project = function(obj) {
	this.object = Array.isArray(obj) ? obj : [];
};

Project.prototype.getAll = function() {
	return this.object;
};

Project.prototype.getCount = function() {
	return this.getAll().length;
};

Project.prototype.currentId = -1;

Project.prototype.getCurrentlyId = function() {
	return this.currentId;
};

Project.prototype.setCurrentlyId = function(id) {
	this.currentId = Number(id);
};

Project.prototype.getCurrentObject = function() {
	let id = this.getCurrentlyId(),
		obj = this.getAll()[id];
	if (obj) return obj;
	delete this.worker;
	this.currentId = -1;
	return null;
};

Project.prototype.getCurrentType = function() {
	let object = this.getCurrentObject();
	return object ? object.type : null;
};

Project.prototype.getCurrentWorker = function() {
	return this.worker || null;
};

Project.prototype.switchToWorker = function(worker) {
	this.worker = worker;
	this.updateCurrentWorker();
};

Project.prototype.updateCurrentWorker = function() {
	let id = this.getCurrentlyId(),
		worker = this.getCurrentWorker();
	if (!worker || id < 0) return;
	this.getAll()[id] = worker.getProject();
};

Project.prototype.isOpened = false;

Project.prototype.callAutosave = function() {
	if (!autosave || this.isAutosaving) {
		this.updateCurrentWorker();
		return;
	}
	tryout.call(this, function() {
		let scope = this;
		this.isAutosaving = true;
		this.updateCurrentWorker();
		exportProject(autosaveProjectable ? this.getAll() : this.getCurrentObject(), true,
			Dirs.PROJECT_AUTOSAVE + this.getProjectTime() + ".dnp",
			function(result) {
				delete scope.isAutosaving;
			});
	}, function(e) {
		retraceOrReport(e);
		delete this.isAutosaving;
	});
};

Project.prototype.getProjectTime = function() {
	let time = new Date(this.time);
	if (!this.time) {
		return translate("Autosave %s", random(Number.MIN_SAFE_INTEGER, Number.MAX_SAFE_INTEGER));
	}
	return monthToName(time.getMonth()) + " " + time.getDate() + ", " + time.getFullYear() + " " +
		(time.getHours() >= 10 ? time.getHours() : "0" + time.getHours()) + "-" +
		(time.getMinutes() >= 10 ? time.getMinutes() : "0" + time.getMinutes()) + "-" +
		(time.getSeconds() >= 10 ? time.getSeconds() : "0" + time.getSeconds());
};

Project.prototype.getByType = function(type) {
	let obj = this.getAll(),
		values = [];
	for (let i = 0; i < this.getCount(); i++) {
		if (obj[i].type == type) {
			values.push(i);
		}
	}
	return values;
};

Project.prototype.getIdByObject = function(obj) {
	let content = this.getAll();
	return content.indexOf(obj);
};

const ProjectProvider = {};

ProjectProvider.getProject = function() {
	return this.opened || null;
};

ProjectProvider.getEditorById = function(index) {
	let project = this.getProject();
	if (!project) return null;
	let obj = project.getAll();
	return obj[index] || null;
};

ProjectProvider.isInitialized = function() {
	return this.getProject() !== null;
};

ProjectProvider.create = function() {
	let opened = this.opened = new Project();
	return (opened.time = Date.now(), opened);
};

ProjectProvider.addWorker = function(worker) {
	this.setupEditor(this.opened.object.push(worker.getProject()) - 1, worker);
	return worker;
};

ProjectProvider.isOpened = function() {
	let project = this.getProject();
	if (!project) return false;
	return project.isOpened;
};

ProjectProvider.getCount = function() {
	let project = this.getProject();
	if (!project) return 0;
	return project.getCount();
};

ProjectProvider.setOpenedState = function(state) {
	let project = this.getProject();
	if (!project) return;
	project.isOpened = !!state;
};

ProjectProvider.getCurrentType = function() {
	let project = this.getProject();
	if (!project || !project.isOpened) {
		return "none";
	}
	return project.getCurrentType();
};

ProjectProvider.initializeAutosave = function() {
	let scope = this,
		project = this.getProject();
	if (project.isAutosaving) return;
	if (!autosave || this.thread || autosavePeriod <= 0) {
		project.updateCurrentWorker();
		return;
	}
	this.thread = handleThread(function() {
		do {
			Interface.sleepMilliseconds(autosavePeriod * 1000);
			project.callAutosave();
			while (project.isAutosaving) {
				Interface.sleepMilliseconds(1);
			}
		} while (project.isOpened);
		delete scope.thread;
	});
};

ProjectProvider.indexOf = function(obj) {
	let project = this.getProject();
	if (!project) return -1;
	return project.getAll().indexOf(obj);
};

ProjectProvider.setupEditor = function(id, worker) {
	let project = this.getProject();
	if (!project) return;
	project.setCurrentlyId(id);
	project.switchToWorker(worker);
};
