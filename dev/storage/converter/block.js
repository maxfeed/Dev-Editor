var BlockConverter = new Function();
BlockConverter.prototype = new ScriptConverter();
BlockConverter.prototype.getType = function() {
	return "block";
};
BlockConverter.prototype.process = function(obj) {
	if (!obj || !(obj instanceof Object)) throw "BlockConverter can process only non-null Object instances";
	var result = this.result = new Array();
	if (obj.define) {
		var define = this.buildDefine(obj);
		define && result.push(define);
	}
	if (obj.renderer && obj.renderer.length > 0) {
		var renderer = this.buildRenderer(obj);
		renderer && result.push(renderer);
	}
	if (obj.collision && obj.collision.length > 0) {
		var collision = this.buildCollision(obj);
		collision && result.push(collision);
	}
	return this.getCurrentlyReaded();
};
BlockConverter.prototype.getAndAttachWorker = function() {
	if (!this.worker) this.worker = new BlockWorker();
	return this.worker;
};
BlockConverter.prototype.getIdentifier = function(obj) {
	if (!obj || !(obj instanceof Object)) return "unknown";
	return obj.id || obj.define ? obj.define.id :
		this.getAndAttachWorker().Define.getIdentificator();
};
BlockConverter.prototype.buildDefine = function(obj) {
	if (!obj || !(obj instanceof Object)) return null;
	var define = obj.define, result = new Array();
	if (!define) return null;
	result.push("IDRegistry.genBlockID(\"" + this.getIdentifier(obj) + "\");");
	result.push("Block.createBlock(\"" + this.getIdentifier(obj) + "\"");
	define.data && define.data.length > 0 && (result[result.length - 1] += ", " + define.data);
	define.special && (result[result.length - 1] += ", " + stringifyObjectUnsafe(define.special, true));
	result[result.length - 1] += ");";
	if (define.shape) {
		if (result.length > 0) result.push("");
		result.push("Block.setShape(BlockID." + this.getIdentifier(obj) + ", " + this.buildBox(obj.shape) + ");");
	}
	return result.length > 0 ? result.join("\n") : null;
};
BlockConverter.prototype.buildRenderer = function(obj) {
	if (!obj || !(obj instanceof Object)) return null;
	var renderer = obj.renderer, result = new Array();
	if (!renderer) return null;
	for (var i = 0; i < renderer.length; i++) {
		var model = renderer[i];
		if (!model) continue;
		if (i > 0) result.push("");
		result.push("let renderer = new ICRender.Model();");
		result.push("BlockRenderer.setStaticICRender(BlockID." + this.getIdentitifer(obj) + ", " +
			(i == 0 && renderer.length == 1 ? "-1" : i) + ", renderer);");
		result.push("let model = BlockRenderer.createModel();");
		var boxes = this.buildModel(model.boxes);
		boxes && result.push(boxes);
		result.push("renderer.addEntry(model);");
	}
	return result.length > 0 ? result.join("\n") : null;
};
BlockConverter.prototype.buildCollision = function(obj) {
	if (!obj || !(obj instanceof Object)) return null;
	var collision = obj.collision, result = new Array();
	if (!collision) return null;
	for (var i = 0; i < collision.length; i++) {
		var model = collision[i];
		if (!model) continue;
		if (i > 0) result.push("");
		result.push("let collision = new ICRender.CollisionShape();");
		result.push("BlockRenderer.setCustomCollisionShape(BlockID." + this.getIdentitifer(obj) + ", " +
			(i == 0 && collision.length == 1 ? "-1" : i) + ", collision);");
		result.push("let model = BlockRenderer.createModel();");
		var boxes = this.buildModel(model.boxes);
		boxes && result.push(boxes);
		result.push("collision.addEntry(model);");
	}
	return result.length > 0 ? result.join("\n") : null;
};
BlockConverter.prototype.buildModel = function(model) {
	if (!model || !(model instanceof Array)) return null;
	var result = new Array();
	for (var i = 0; i < model.length; i++) {
		var box = model[i];
		if (!box) continue;
		result.push("model.addBox(" + this.buildBox(box) + ");");
	}
	return result.length > 0 ? result.join("\n") : null;
};
BlockConverter.prototype.buildBox = function(box) {
	if (box.x || box.y || box.z) return MathUtils.mathDivider(box.x) + ", " + MathUtils.mathDivider(box.y) + ", " + MathUtils.mathDivider(box.z);
	if (box.texture) return MathUtils.mathDivider(box.x1) + ", " + MathUtils.mathDivider(box.y1) + ", " + MathUtils.mathDivider(box.z1) + ", " +
		MathUtils.mathDivider(box.x2) + ", " + MathUtils.mathDivider(box.y2) + ", " + MathUtils.mathDivider(box.z2) + ", " + stringifyObjectUnsafe(box.texture, true);
	return MathUtils.mathDivider(box.x1) + ", " + MathUtils.mathDivider(box.y1) + ", " + MathUtils.mathDivider(box.z1) + ", " +
		MathUtils.mathDivider(box.x2) + ", " + MathUtils.mathDivider(box.y2) + ", " + MathUtils.mathDivider(box.z2);
};