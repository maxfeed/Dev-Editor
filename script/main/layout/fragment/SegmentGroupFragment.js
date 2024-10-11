const SegmentGroupFragment = function() {
	HorizontalScrollFragment.apply(this, arguments);
};

SegmentGroupFragment.prototype = new HorizontalScrollFragment;
SegmentGroupFragment.prototype.TYPE = "SegmentGroupFragment";

SegmentGroupFragment.prototype.resetContainer = function() {
	HorizontalScrollFragment.prototype.resetContainer.apply(this, arguments);
	this.getContainer().setLayoutParams(new android.view.ViewGroup.LayoutParams
		($.ViewGroup.LayoutParams.MATCH_PARENT, $.ViewGroup.LayoutParams.WRAP_CONTENT));
	this.getContainerScroll().setLayoutParams(new android.widget.FrameLayout.LayoutParams
		($.ViewGroup.LayoutParams.MATCH_PARENT, $.ViewGroup.LayoutParams.WRAP_CONTENT));
	this.getContainerScroll().setFillViewport(true);
	this.getContainerLayout().setLayoutParams(new android.widget.FrameLayout.LayoutParams
		($.ViewGroup.LayoutParams.MATCH_PARENT, $.ViewGroup.LayoutParams.WRAP_CONTENT));
};

SegmentGroupFragment.prototype.addViewDirectly = function(view, params) {
	if (params == null) {
		params = new android.widget.LinearLayout.LayoutParams
			($.ViewGroup.LayoutParams.MATCH_PARENT, $.ViewGroup.LayoutParams.WRAP_CONTENT);
		params.weight = 1;
	}
	HorizontalScrollFragment.prototype.addViewDirectly.call(this, view, params);
};

SegmentGroupFragment.parseJson = function(instanceOrJson, json, preferredFragment) {
	if (!(instanceOrJson instanceof SegmentGroupFragment)) {
		json = instanceOrJson;
		instanceOrJson = new SegmentGroupFragment();
	}
	return HorizontalScrollFragment.parseJson.call(this, instanceOrJson, json, preferredFragment !== undefined ? preferredFragment : "button");
};

registerFragmentJson("segment_group", SegmentGroupFragment);
registerFragmentJson("segmentGroup", SegmentGroupFragment);